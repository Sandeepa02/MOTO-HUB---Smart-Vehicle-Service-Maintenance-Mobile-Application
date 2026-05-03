const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized, token missing');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    if (error?.name === 'TokenExpiredError') {
      throw new Error('Not authorized, token expired');
    }
    throw new Error('Not authorized, token invalid');
  }
});

const authorize = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Not authorized for this action');
    }

    next();
  });

const serviceCenterOnly = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (req.user.role !== 'service-center') {
    res.status(403);
    throw new Error('Only service centers can perform this action');
  }

  next();
});

module.exports = { protect, authorize, serviceCenterOnly };
