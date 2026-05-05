const mongoose = require('mongoose');
const ServiceCenter = require('../models/ServiceCenter');
const ServiceCenterBranch = require('../models/ServiceCenterBranch');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const {
  isValidDistrict,
  canonicalDistrict,
  normalizeDistrict
} = require('../constants/sriLankaDistricts');

const ACTIVE_STATUSES = ['Pending', 'Accepted'];

const parseServices = (servicesOffered) => {
  if (Array.isArray(servicesOffered)) {
    return servicesOffered.map((service) => String(service).trim()).filter(Boolean);
  }

  if (typeof servicesOffered === 'string') {
    return servicesOffered
      .split(',')
      .map((service) => service.trim())
      .filter(Boolean);
  }

  return [];
};

const parseCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { type: 'Point', coordinates: [lng, lat] };
  }
  return null;
};

async function getOwnedServiceCenter(req) {
  return ServiceCenter.findOne({ userId: req.user._id });
}

const parseOptionalPositiveInt = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? undefined : n;
};

const resolveBranchOwnership = async (req, res, branchId) => {
  if (!branchId || !mongoose.Types.ObjectId.isValid(String(branchId))) {
    res.status(404);
    throw new Error('Branch not found');
  }
  const serviceCenter = await getOwnedServiceCenter(req);
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const branch = await ServiceCenterBranch.findOne({ _id: branchId, serviceCenterId: serviceCenter._id });

  return { branch, serviceCenter };
};

const applyBranchWritableFields = (branch, reqBody, reqFile) => {
  if (reqBody.branchName !== undefined) {
    branch.branchName = String(reqBody.branchName || '').trim() || branch.branchName;
  }
  if (reqBody.location !== undefined) {
    branch.location = String(reqBody.location || '').trim() || branch.location;
  }

  if (reqBody.contactNumber !== undefined) {
    branch.contactNumber = String(reqBody.contactNumber || '').trim();
  }

  if (reqBody.description !== undefined) {
    branch.description = String(reqBody.description || '').trim().slice(0, 500);
  }

  if (reqBody.district !== undefined) {
    const d = normalizeDistrict(reqBody.district);
    if (!d) {
      branch.district = '';
    } else if (!isValidDistrict(d)) {
      const err = new Error('Invalid district');
      err.statusCode = 400;
      throw err;
    } else {
      branch.district = canonicalDistrict(d);
    }
  }

  if (reqBody.servicesOffered !== undefined) {
    branch.servicesOffered = parseServices(reqBody.servicesOffered);
  }

  if (reqBody.latitude !== undefined && reqBody.longitude !== undefined) {
    const coords = parseCoordinates(reqBody.latitude, reqBody.longitude);
    if (coords) {
      branch.coordinates = coords;
    }
  }

  const m = parseOptionalPositiveInt(reqBody.maxBookingsPerSlot);
  if (m !== undefined) {
    branch.maxBookingsPerSlot = m;
  }

  const s = parseOptionalPositiveInt(reqBody.slotDurationHours);
  if (s !== undefined) {
    branch.slotDurationHours = s;
  }

  if (reqBody.isActive !== undefined && reqBody.isActive !== null) {
    branch.isActive = reqBody.isActive === true || reqBody.isActive === 'true';
  }

  if (reqFile) {
    branch.image = `/uploads/${reqFile.filename}`;
  }
};

const listMyBranches = asyncHandler(async (req, res) => {
  const serviceCenter = await getOwnedServiceCenter(req);
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const q = { serviceCenterId: serviceCenter._id };
  if (req.query.activeOnly === 'true') {
    q.isActive = true;
  }

  const branches = await ServiceCenterBranch.find(q).sort({ createdAt: -1 });
  res.status(200).json(branches);
});

const createBranch = asyncHandler(async (req, res) => {
  const serviceCenter = await getOwnedServiceCenter(req);
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const { branchName, location, district: rawDistrict, contactNumber } = req.body;
  if (!branchName?.trim()) {
    res.status(400);
    throw new Error('Branch name is required');
  }
  if (!location?.trim()) {
    res.status(400);
    throw new Error('Location is required');
  }

  const districtRaw = normalizeDistrict(rawDistrict);
  if (!districtRaw || !isValidDistrict(districtRaw)) {
    res.status(400);
    throw new Error('A valid Sri Lankan district is required');
  }

  const branch = await ServiceCenterBranch.create({
    serviceCenterId: serviceCenter._id,
    branchName: branchName.trim(),
    location: location.trim(),
    district: canonicalDistrict(districtRaw),
    contactNumber: typeof contactNumber === 'string' ? contactNumber.trim() : '',
    servicesOffered: parseServices(req.body.servicesOffered)
  });

  if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
    const coords = parseCoordinates(req.body.latitude, req.body.longitude);
    if (coords) {
      branch.coordinates = coords;
    }
  }

  const m = parseOptionalPositiveInt(req.body.maxBookingsPerSlot);
  if (m !== undefined) {
    branch.maxBookingsPerSlot = m;
  }
  const s = parseOptionalPositiveInt(req.body.slotDurationHours);
  if (s !== undefined) {
    branch.slotDurationHours = s;
  }

  if (req.file) {
    branch.image = `/uploads/${req.file.filename}`;
  }

  await branch.save();
  res.status(201).json(branch);
});

const getMyBranchById = asyncHandler(async (req, res) => {
  const { branch, serviceCenter } = await resolveBranchOwnership(req, res, req.params.branchId);
  void serviceCenter;

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }
  res.status(200).json(branch);
});

const updateMyBranch = asyncHandler(async (req, res) => {
  const { branch, serviceCenter } = await resolveBranchOwnership(req, res, req.params.branchId);
  void serviceCenter;

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  const prevActive = branch.isActive !== false;

  try {
    applyBranchWritableFields(branch, req.body, req.file);
  } catch (e) {
    if (e.statusCode === 400) {
      res.status(400);
    }
    throw e;
  }

  if (prevActive && branch.isActive === false) {
    const openCount = await Booking.countDocuments({
      branchId: branch._id,
      status: { $in: ACTIVE_STATUSES }
    });

    if (openCount > 0) {
      res.status(400);
      throw new Error('Cannot deactivate an outlet while it has pending or accepted bookings.');
    }
  }

  const updated = await branch.save();
  res.status(200).json(updated);
});

const deleteMyBranch = asyncHandler(async (req, res) => {
  const { branch } = await resolveBranchOwnership(req, res, req.params.branchId);

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  const anyBooking = await Booking.exists({ branchId: branch._id });

  if (anyBooking) {
    res.status(400);
    throw new Error('Cannot delete an outlet linked to bookings. Deactivate instead.');
  }

  await ServiceCenterBranch.deleteOne({ _id: branch._id });
  res.status(200).json({ message: 'Branch deleted' });
});

const listPublicBranchesByCenterId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid service center id');
  }

  const branches = await ServiceCenterBranch.find({ serviceCenterId: id, isActive: true }).sort({
    branchName: 1
  });
  res.status(200).json(branches);
});

module.exports = {
  listMyBranches,
  createBranch,
  getMyBranchById,
  updateMyBranch,
  deleteMyBranch,
  listPublicBranchesByCenterId
};
