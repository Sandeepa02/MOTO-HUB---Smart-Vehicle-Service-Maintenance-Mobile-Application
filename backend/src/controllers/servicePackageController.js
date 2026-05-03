const ServicePackage = require('../models/ServicePackage');
const ServiceCenter = require('../models/ServiceCenter');
const asyncHandler = require('../utils/asyncHandler');

const getServicePackages = asyncHandler(async (req, res) => {
  const { serviceCenterId, category, vehicleType } = req.query;
  
  const query = {};
  if (serviceCenterId) {
    query.centerId = serviceCenterId;
  }
  if (category && category !== 'All') {
    query.category = category;
  }
  if (vehicleType) {
    query.vehicleTypes = vehicleType;
  }

  const packages = await ServicePackage.find(query)
    .populate('centerId', 'centerName location')
    .sort({ popularityScore: -1, serviceName: 1 });
  
  res.status(200).json(packages);
});

const getMyServicePackages = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const packages = await ServicePackage.find({ centerId: serviceCenter._id })
    .sort({ createdAt: -1 });
  
  res.status(200).json(packages);
});

const createServicePackage = asyncHandler(async (req, res) => {
  const { 
    serviceName, 
    includedServices, 
    price,
    category,
    estimatedDuration,
    vehicleTypes,
    discountPrice,
    discountValidTill,
    isCustomizable
  } = req.body;

  if (!serviceName || price === undefined) {
    res.status(400);
    throw new Error('Service name and price are required');
  }

  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const servicePackage = await ServicePackage.create({
    centerId: serviceCenter._id,
    serviceName,
    includedServices: includedServices || [],
    price,
    category: category || 'Basic',
    estimatedDuration: estimatedDuration || 1,
    vehicleTypes: vehicleTypes || [],
    discountPrice,
    discountValidTill,
    isCustomizable: isCustomizable || false
  });

  res.status(201).json(servicePackage);
});

const updateServicePackage = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const servicePackage = await ServicePackage.findOne({
    _id: req.params.id,
    centerId: serviceCenter._id
  });

  if (!servicePackage) {
    res.status(404);
    throw new Error('Service package not found');
  }

  const fields = [
    'serviceName', 
    'includedServices', 
    'price',
    'category',
    'estimatedDuration',
    'vehicleTypes',
    'discountPrice',
    'discountValidTill',
    'isCustomizable'
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      servicePackage[field] = req.body[field];
    }
  });

  const updatedPackage = await servicePackage.save();
  res.status(200).json(updatedPackage);
});

const deleteServicePackage = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const servicePackage = await ServicePackage.findOne({
    _id: req.params.id,
    centerId: serviceCenter._id
  });

  if (!servicePackage) {
    res.status(404);
    throw new Error('Service package not found');
  }

  await ServicePackage.deleteOne({ _id: servicePackage._id });
  res.status(200).json({ message: 'Service package deleted successfully' });
});

module.exports = {
  getServicePackages,
  getMyServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage
};
