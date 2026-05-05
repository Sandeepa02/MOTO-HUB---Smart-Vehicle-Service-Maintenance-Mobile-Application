const ServiceCenter = require('../models/ServiceCenter');
const asyncHandler = require('../utils/asyncHandler');
const {
  isValidDistrict,
  canonicalDistrict,
  normalizeDistrict
} = require('../constants/sriLankaDistricts');

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

const getServiceCenters = asyncHandler(async (req, res) => {
  const raw = req.query.district;
  const q = {};
  if (raw != null && String(raw).trim()) {
    const d = String(raw).trim();
    const esc = d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reExact = new RegExp(`^${esc}$`, 'i');
    const reSub = new RegExp(esc, 'i');
    q.$or = [
      { district: reExact },
      {
        $and: [{ $or: [{ district: '' }, { district: { $exists: false } }, { district: null }] }, { location: reSub }]
      }
    ];
  }

  const serviceCenters = await ServiceCenter.find(q).sort({ createdAt: -1 });
  res.status(200).json(serviceCenters);
});

const getServiceCenterById = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findById(req.params.id);
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center not found');
  }
  res.status(200).json(serviceCenter);
});

const getMyServiceCenter = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }
  res.status(200).json(serviceCenter);
});

const updateMyServiceCenter = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const fields = ['centerName', 'location', 'contactNumber', 'district'];
  fields.forEach((field) => {
    if (req.body[field] === undefined) {
      return;
    }
    if (field === 'district') {
      const d = normalizeDistrict(req.body[field]);
      if (!d) {
        serviceCenter.district = '';
      } else if (!isValidDistrict(d)) {
        res.status(400);
        throw new Error('Invalid district');
      } else {
        serviceCenter.district = canonicalDistrict(d);
      }
    } else {
      serviceCenter[field] = req.body[field];
    }
  });

  if (req.body.servicesOffered !== undefined) {
    serviceCenter.servicesOffered = parseServices(req.body.servicesOffered);
  }

  if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
    const coords = parseCoordinates(req.body.latitude, req.body.longitude);
    if (coords) {
      serviceCenter.coordinates = coords;
    }
  }

  if (req.file) {
    serviceCenter.image = `/uploads/${req.file.filename}`;
  }

  const updatedServiceCenter = await serviceCenter.save();
  res.status(200).json(updatedServiceCenter);
});

module.exports = {
  getServiceCenters,
  getServiceCenterById,
  getMyServiceCenter,
  updateMyServiceCenter
};
