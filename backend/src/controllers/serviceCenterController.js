const ServiceCenter = require('../models/ServiceCenter');
const asyncHandler = require('../utils/asyncHandler');

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

const getServiceCenters = asyncHandler(async (_req, res) => {
  const serviceCenters = await ServiceCenter.find().sort({ createdAt: -1 });
  res.status(200).json(serviceCenters);
});

const getNearbyServiceCenters = asyncHandler(async (req, res) => {
  const { latitude, longitude, maxDistance = 15000 } = req.query;

  if (!latitude || !longitude) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400);
    throw new Error('Invalid latitude or longitude');
  }

  const serviceCenters = await ServiceCenter.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        distanceField: 'distance',
        maxDistance: parseInt(maxDistance, 10),
        spherical: true
      }
    },
    {
      $addFields: {
        distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 1] }
      }
    }
  ]);

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

  const fields = ['centerName', 'location', 'contactNumber'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
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
  updateMyServiceCenter,
  getNearbyServiceCenters
};
