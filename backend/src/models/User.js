const mongoose = require('mongoose');
const generatePublicId = require('../utils/publicId');

const userSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['user', 'service-center'],
      default: 'user',
      required: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    pushToken: {
      type: String,
      default: ''
    },
    lastLogin: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active'
    }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ phone: 1 }, { sparse: true });

userSchema.pre('validate', function setPublicId(next) {
  if (!this.publicId) {
    this.publicId = generatePublicId('USR');
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
