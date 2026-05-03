const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');
const { calculateHealthScore, getServiceSummary } = require('../services/vehicleHealthService');
const { generateVehicleQRCode } = require('../services/qrCodeService');

const addVehicle = asyncHandler(async (req, res) => {
  const {
    vehicleName,
    vehicleNumber,
    brand,
    model,
    year,
    mileage,
    insuranceExpiry,
    insuranceProvider,
    policyNumber,
    registrationExpiry
  } = req.body;

  if (!vehicleName || !vehicleNumber || !brand || !model || !year || mileage === undefined) {
    res.status(400);
    throw new Error('All vehicle fields are required');
  }

  const yearNumber = Number(year);
  const mileageNumber = Number(mileage);

  if (!Number.isFinite(yearNumber) || yearNumber < 1900) {
    res.status(400);
    throw new Error('Year must be a valid number (>= 1900)');
  }

  if (!Number.isFinite(mileageNumber) || mileageNumber < 0) {
    res.status(400);
    throw new Error('Mileage must be a valid number (>= 0)');
  }

  const vehicleData = {
    userId: req.user._id,
    vehicleName,
    vehicleNumber,
    brand,
    model,
    year: yearNumber,
    mileage: mileageNumber,
    image: req.file ? `/uploads/${req.file.filename}` : ''
  };

  if (insuranceExpiry) vehicleData.insuranceExpiry = new Date(insuranceExpiry);
  if (insuranceProvider) vehicleData.insuranceProvider = insuranceProvider;
  if (policyNumber) vehicleData.policyNumber = policyNumber;
  if (registrationExpiry) vehicleData.registrationExpiry = new Date(registrationExpiry);

  const vehicle = await Vehicle.create(vehicleData);

  const qrCode = await generateVehicleQRCode(vehicle);
  vehicle.qrCode = qrCode;
  await vehicle.save();

  res.status(201).json(vehicle);
});

const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(vehicles);
});

const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  res.status(200).json(vehicle);
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const fields = [
    'vehicleName',
    'vehicleNumber',
    'brand',
    'model',
    'year',
    'mileage',
    'insuranceProvider',
    'policyNumber'
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) vehicle[field] = req.body[field];
  });

  if (req.body.year !== undefined) {
    const yearNumber = Number(req.body.year);
    if (!Number.isFinite(yearNumber) || yearNumber < 1900) {
      res.status(400);
      throw new Error('Year must be a valid number (>= 1900)');
    }
    vehicle.year = yearNumber;
  }

  if (req.body.mileage !== undefined) {
    const mileageNumber = Number(req.body.mileage);
    if (!Number.isFinite(mileageNumber) || mileageNumber < 0) {
      res.status(400);
      throw new Error('Mileage must be a valid number (>= 0)');
    }
    vehicle.mileage = mileageNumber;
  }

  if (req.body.insuranceExpiry) {
    vehicle.insuranceExpiry = new Date(req.body.insuranceExpiry);
  }

  if (req.body.registrationExpiry) {
    vehicle.registrationExpiry = new Date(req.body.registrationExpiry);
  }

  if (req.file) {
    vehicle.image = `/uploads/${req.file.filename}`;
  }

  const updatedVehicle = await vehicle.save();
  res.status(200).json(updatedVehicle);
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  res.status(200).json({ message: 'Vehicle deleted successfully' });
});

const getVehicleHealthScore = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const healthData = await calculateHealthScore(vehicle);
  res.status(200).json(healthData);
});

const getVehicleServiceSummary = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const summary = await getServiceSummary(vehicle._id);
  res.status(200).json(summary);
});

const getVehicleDetails = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const [healthData, serviceSummary] = await Promise.all([
    calculateHealthScore(vehicle),
    getServiceSummary(vehicle._id)
  ]);

  res.status(200).json({
    vehicle,
    healthScore: healthData,
    serviceSummary
  });
});

const uploadVehicleDocument = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No document file provided');
  }

  const docType = req.body.docType || 'other';
  const validTypes = ['rc_book', 'insurance', 'puc', 'other'];
  if (!validTypes.includes(docType)) {
    res.status(400);
    throw new Error('Invalid document type');
  }

  const document = {
    docType,
    url: `/uploads/${req.file.filename}`,
    name: req.body.name || req.file.originalname,
    uploadedAt: new Date()
  };

  vehicle.documents.push(document);
  await vehicle.save();

  res.status(201).json({
    message: 'Document uploaded successfully',
    document: vehicle.documents[vehicle.documents.length - 1]
  });
});

const deleteVehicleDocument = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const docIndex = vehicle.documents.findIndex((doc) => doc._id.toString() === req.params.docId);
  if (docIndex === -1) {
    res.status(404);
    throw new Error('Document not found');
  }

  vehicle.documents.splice(docIndex, 1);
  await vehicle.save();

  res.status(200).json({ message: 'Document deleted successfully' });
});

const regenerateQRCode = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const qrCode = await generateVehicleQRCode(vehicle);
  vehicle.qrCode = qrCode;
  await vehicle.save();

  res.status(200).json({ qrCode });
});

const getExpiringVehicles = asyncHandler(async (req, res) => {
  const daysAhead = parseInt(req.query.days, 10) || 30;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const vehicles = await Vehicle.find({
    userId: req.user._id,
    $or: [
      { insuranceExpiry: { $lte: futureDate, $gte: new Date() } },
      { registrationExpiry: { $lte: futureDate, $gte: new Date() } }
    ]
  });

  const expiringItems = [];
  vehicles.forEach((v) => {
    if (v.insuranceExpiry && v.insuranceExpiry <= futureDate) {
      const daysLeft = Math.ceil((v.insuranceExpiry - new Date()) / (1000 * 60 * 60 * 24));
      expiringItems.push({
        vehicleId: v._id,
        vehicleName: v.vehicleName,
        vehicleNumber: v.vehicleNumber,
        type: 'insurance',
        expiryDate: v.insuranceExpiry,
        daysLeft
      });
    }
    if (v.registrationExpiry && v.registrationExpiry <= futureDate) {
      const daysLeft = Math.ceil((v.registrationExpiry - new Date()) / (1000 * 60 * 60 * 24));
      expiringItems.push({
        vehicleId: v._id,
        vehicleName: v.vehicleName,
        vehicleNumber: v.vehicleNumber,
        type: 'registration',
        expiryDate: v.registrationExpiry,
        daysLeft
      });
    }
  });

  expiringItems.sort((a, b) => a.daysLeft - b.daysLeft);
  res.status(200).json(expiringItems);
});

module.exports = {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleHealthScore,
  getVehicleServiceSummary,
  getVehicleDetails,
  uploadVehicleDocument,
  deleteVehicleDocument,
  regenerateQRCode,
  getExpiringVehicles
};
