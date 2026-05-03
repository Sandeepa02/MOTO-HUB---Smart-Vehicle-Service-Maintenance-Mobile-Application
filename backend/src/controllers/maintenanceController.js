const MaintenanceRecord = require('../models/MaintenanceRecord');
const Booking = require('../models/Booking');
const ServiceCenter = require('../models/ServiceCenter');
const asyncHandler = require('../utils/asyncHandler');

const basePopulate = (query) =>
  query
    .populate('vehicleId', 'vehicleName vehicleNumber brand model')
    .populate('serviceCenterId', 'centerName location')
    .populate('bookingId', 'serviceType bookingDate slotLabel status');

const addRecord = asyncHandler(async (req, res) => {
  const { bookingId, serviceDate, description, notes, cost, nextServiceDate } = req.body;

  if (!bookingId || !description || cost === undefined) {
    res.status(400);
    throw new Error('Booking, description, and cost are required');
  }

  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const booking = await Booking.findOne({ _id: bookingId, serviceCenterId: serviceCenter._id });
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.status !== 'Accepted') {
    res.status(400);
    throw new Error('Maintenance records can only be added for accepted bookings');
  }

  const existingRecord = await MaintenanceRecord.findOne({ bookingId });
  if (existingRecord) {
    res.status(400);
    throw new Error('Maintenance record already exists for this booking');
  }

  const record = await MaintenanceRecord.create({
    bookingId,
    userId: booking.userId,
    vehicleId: booking.vehicleId,
    serviceCenterId: booking.serviceCenterId,
    serviceDate: serviceDate || new Date(),
    description,
    notes: notes || '',
    cost,
    nextServiceDate: nextServiceDate || null,
    maintenanceImage: req.file ? `/uploads/${req.file.filename}` : ''
  });

  booking.status = 'Completed';
  booking.completedAt = new Date();
  await booking.save();

  res.status(201).json(await basePopulate(MaintenanceRecord.findById(record._id)));
});

const getRecords = asyncHandler(async (req, res) => {
  const query = req.user.role === 'service-center' ? {} : { userId: req.user._id };

  if (req.user.role === 'service-center') {
    const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
    if (!serviceCenter) {
      res.status(404);
      throw new Error('Service center profile not found');
    }
    query.serviceCenterId = serviceCenter._id;
  }

  const records = await basePopulate(MaintenanceRecord.find(query).sort({ serviceDate: -1 }));
  res.status(200).json(records);
});

const updateRecord = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const record = await MaintenanceRecord.findOne({ _id: req.params.id, serviceCenterId: serviceCenter._id });
  if (!record) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }

  const fields = ['serviceDate', 'description', 'notes', 'cost', 'nextServiceDate'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      record[field] = req.body[field];
    }
  });

  if (req.file) {
    record.maintenanceImage = `/uploads/${req.file.filename}`;
  }

  const updatedRecord = await record.save();
  res.status(200).json(await basePopulate(MaintenanceRecord.findById(updatedRecord._id)));
});

const deleteRecord = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const record = await MaintenanceRecord.findOne({ _id: req.params.id, serviceCenterId: serviceCenter._id });
  if (!record) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }

  await record.deleteOne();

  const booking = await Booking.findById(record.bookingId);
  if (booking && booking.status === 'Completed') {
    booking.status = 'Accepted';
    booking.completedAt = null;
    await booking.save();
  }

  res.status(200).json({ message: 'Maintenance record deleted successfully' });
});

module.exports = {
  addRecord,
  getRecords,
  updateRecord,
  deleteRecord
};
