const bcrypt = require('bcrypt');
const User = require('../models/User');
const ServiceCenter = require('../models/ServiceCenter');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

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

const buildAuthResponse = async (user) => {
  const payload = {
    _id: user._id,
    publicId: user.publicId,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  };

  if (user.role === 'service-center') {
    payload.serviceCenterProfile = await ServiceCenter.findOne({ userId: user._id });
  }

  return payload;
};

const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role = 'user',
    centerName: rawCenterName,
    location: rawLocation,
    contactNumber: rawContactNumber,
    servicesOffered
  } = req.body;

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedPassword = typeof password === 'string' ? password : '';

  const centerName =
    typeof rawCenterName === 'string' && rawCenterName.trim()
      ? rawCenterName.trim()
      : trimmedName;
  const location = typeof rawLocation === 'string' ? rawLocation.trim() : '';
  const contactNumber = typeof rawContactNumber === 'string' ? rawContactNumber.trim() : '';

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  if (!['user', 'service-center'].includes(role)) {
    res.status(400);
    throw new Error('Role must be either user or service-center');
  }

  // If the app doesn't ask for a separate center name, default centerName to the account name.
  // For service-center registrations we only require location + contact number from the client.
  if (role === 'service-center' && (!location || !contactNumber)) {
    res.status(400);
    throw new Error('Location and contact number are required for service centers');
  }

  const existingUser = await User.findOne({ email: trimmedEmail.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: trimmedName,
    email: trimmedEmail.toLowerCase(),
    password: hashedPassword,
    role
  });

  if (role === 'service-center') {
    await ServiceCenter.create({
      userId: user._id,
      centerName,
      location,
      contactNumber,
      servicesOffered: parseServices(servicesOffered)
    });
  }

  res.status(201).json(await buildAuthResponse(user));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.status(200).json(await buildAuthResponse(user));
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.status(200).json(await buildAuthResponse(user));
});

module.exports = {
  registerUser,
  loginUser,
  getMe
};
