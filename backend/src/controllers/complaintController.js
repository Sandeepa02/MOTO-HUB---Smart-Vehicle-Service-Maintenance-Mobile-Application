const Complaint = require('../models/Complaint');
const Booking = require('../models/Booking');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const ServiceCenter = require('../models/ServiceCenter');
const asyncHandler = require('../utils/asyncHandler');

const populateComplaint = (query) =>
  query
    .populate('userId', 'name email')
    .populate('vehicleId', 'vehicleName vehicleNumber brand model')
    .populate('serviceCenterId', 'centerName location contactNumber')
    .populate('bookingId', 'serviceType bookingDate slotLabel status')
    .populate('maintenanceRecordId', 'serviceDate description cost');

const createComplaint = asyncHandler(async (req, res) => {
  const { maintenanceRecordId, issueType, description, priority } = req.body;

  if (!maintenanceRecordId || !issueType || !description) {
    res.status(400);
    throw new Error('Maintenance record, issue type, and description are required');
  }

  const maintenanceRecord = await MaintenanceRecord.findOne({
    _id: maintenanceRecordId,
    userId: req.user._id
  });

  if (!maintenanceRecord) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }

  const booking = await Booking.findById(maintenanceRecord.bookingId);
  if (!booking || booking.status !== 'Completed') {
    res.status(400);
    throw new Error('Complaint can only be filed for completed services');
  }

  const existingComplaint = await Complaint.findOne({
    maintenanceRecordId,
    userId: req.user._id,
    status: { $nin: ['Closed', 'Rejected'] }
  });

  if (existingComplaint) {
    res.status(400);
    throw new Error('You already have an active complaint for this service');
  }

  const complaint = await Complaint.create({
    bookingId: maintenanceRecord.bookingId,
    maintenanceRecordId,
    userId: req.user._id,
    serviceCenterId: maintenanceRecord.serviceCenterId,
    vehicleId: maintenanceRecord.vehicleId,
    issueType,
    description,
    priority: priority || 'Medium',
    images: req.files ? req.files.map((file) => `/uploads/${file.filename}`) : []
  });

  res.status(201).json(await populateComplaint(Complaint.findById(complaint._id)));
});

const getComplaints = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'service-center') {
    const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
    if (!serviceCenter) {
      res.status(404);
      throw new Error('Service center profile not found');
    }
    query.serviceCenterId = serviceCenter._id;
  } else {
    query.userId = req.user._id;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  const complaints = await populateComplaint(
    Complaint.find(query).sort({ createdAt: -1 })
  );

  res.status(200).json(complaints);
});

const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await populateComplaint(Complaint.findById(req.params.id));

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const isOwner = complaint.userId._id.toString() === req.user._id.toString();
  let isServiceCenter = false;

  if (req.user.role === 'service-center') {
    const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
    isServiceCenter =
      serviceCenter && complaint.serviceCenterId._id.toString() === serviceCenter._id.toString();
  }

  if (!isOwner && !isServiceCenter) {
    res.status(403);
    throw new Error('Not authorized to view this complaint');
  }

  res.status(200).json(complaint);
});

const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.status !== 'Open') {
    res.status(400);
    throw new Error('Only open complaints can be updated');
  }

  const allowedFields = ['issueType', 'description', 'priority'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      complaint[field] = req.body[field];
    }
  });

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => `/uploads/${file.filename}`);
    complaint.images = [...complaint.images, ...newImages];
  }

  const updatedComplaint = await complaint.save();
  res.status(200).json(await populateComplaint(Complaint.findById(updatedComplaint._id)));
});

const respondToComplaint = asyncHandler(async (req, res) => {
  const { response, resolutionType, resolutionNotes } = req.body;

  if (!response) {
    res.status(400);
    throw new Error('Response message is required');
  }

  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const complaint = await Complaint.findOne({
    _id: req.params.id,
    serviceCenterId: serviceCenter._id
  });

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.status === 'Closed' || complaint.status === 'Rejected') {
    res.status(400);
    throw new Error('Cannot respond to closed or rejected complaints');
  }

  complaint.response = response;
  complaint.respondedAt = new Date();
  complaint.status = 'In Review';

  if (resolutionType) {
    complaint.resolutionType = resolutionType;
  }

  if (resolutionNotes) {
    complaint.resolutionNotes = resolutionNotes;
  }

  const updatedComplaint = await complaint.save();
  res.status(200).json(await populateComplaint(Complaint.findById(updatedComplaint._id)));
});

const resolveComplaint = asyncHandler(async (req, res) => {
  const { resolutionType, resolutionNotes } = req.body;

  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const complaint = await Complaint.findOne({
    _id: req.params.id,
    serviceCenterId: serviceCenter._id
  });

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.status === 'Closed' || complaint.status === 'Rejected') {
    res.status(400);
    throw new Error('Complaint is already closed or rejected');
  }

  if (!complaint.response) {
    res.status(400);
    throw new Error('Please respond to the complaint before marking it as resolved');
  }

  complaint.status = 'Resolved';
  complaint.resolvedAt = new Date();

  if (resolutionType) {
    complaint.resolutionType = resolutionType;
  }

  if (resolutionNotes) {
    complaint.resolutionNotes = resolutionNotes;
  }

  const updatedComplaint = await complaint.save();
  res.status(200).json(await populateComplaint(Complaint.findById(updatedComplaint._id)));
});

const rejectComplaint = asyncHandler(async (req, res) => {
  const { response } = req.body;

  if (!response) {
    res.status(400);
    throw new Error('Reason for rejection is required');
  }

  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const complaint = await Complaint.findOne({
    _id: req.params.id,
    serviceCenterId: serviceCenter._id
  });

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.status === 'Closed' || complaint.status === 'Rejected') {
    res.status(400);
    throw new Error('Complaint is already closed or rejected');
  }

  complaint.status = 'Rejected';
  complaint.response = response;
  complaint.respondedAt = new Date();
  complaint.resolutionType = 'No Action';

  const updatedComplaint = await complaint.save();
  res.status(200).json(await populateComplaint(Complaint.findById(updatedComplaint._id)));
});

const closeComplaint = asyncHandler(async (req, res) => {
  const { userSatisfied } = req.body;

  const complaint = await Complaint.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.status !== 'Resolved' && complaint.status !== 'Rejected') {
    res.status(400);
    throw new Error('Only resolved or rejected complaints can be closed');
  }

  complaint.status = 'Closed';
  complaint.closedAt = new Date();
  complaint.userSatisfied = userSatisfied !== undefined ? userSatisfied : null;

  const updatedComplaint = await complaint.save();
  res.status(200).json(await populateComplaint(Complaint.findById(updatedComplaint._id)));
});

const getComplaintStats = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const stats = await Complaint.aggregate([
    { $match: { serviceCenterId: serviceCenter._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    open: 0,
    inReview: 0,
    resolved: 0,
    closed: 0,
    rejected: 0
  };

  stats.forEach((stat) => {
    result.total += stat.count;
    if (stat._id === 'Open') result.open = stat.count;
    if (stat._id === 'In Review') result.inReview = stat.count;
    if (stat._id === 'Resolved') result.resolved = stat.count;
    if (stat._id === 'Closed') result.closed = stat.count;
    if (stat._id === 'Rejected') result.rejected = stat.count;
  });

  res.status(200).json(result);
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  respondToComplaint,
  resolveComplaint,
  rejectComplaint,
  closeComplaint,
  getComplaintStats
};
