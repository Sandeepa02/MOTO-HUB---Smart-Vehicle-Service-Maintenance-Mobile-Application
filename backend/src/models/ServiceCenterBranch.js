const mongoose = require('mongoose');
const generatePublicId = require('../utils/publicId');

const serviceCenterBranchSchema = new mongoose.Schema(
  {
    branchCode: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true
    },
    serviceCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCenter',
      required: true,
      index: true
    },
    branchName: { type: String, required: true, trim: true },
    district: { type: String, trim: true, default: '' },
    location: { type: String, required: true, trim: true },
    contactNumber: { type: String, trim: true, default: '' },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: undefined
      }
    },
    servicesOffered: [{ type: String, trim: true }],
    image: { type: String, default: '' },
    maxBookingsPerSlot: { type: Number, min: 1 },
    slotDurationHours: { type: Number, min: 1 },
    operatingHours: {
      monday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      tuesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      wednesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      thursday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      friday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      saturday: { open: { type: String, default: '09:00' }, close: { type: String, default: '14:00' }, isClosed: { type: Boolean, default: false } },
      sunday: { open: { type: String, default: '09:00' }, close: { type: String, default: '14:00' }, isClosed: { type: Boolean, default: true } }
    },
    description: { type: String, default: '', trim: true, maxLength: 500 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

serviceCenterBranchSchema.index({ coordinates: '2dsphere' });
serviceCenterBranchSchema.index({ serviceCenterId: 1, isActive: 1 });

serviceCenterBranchSchema.pre('validate', function setBranchCode(next) {
  if (!this.branchCode) {
    this.branchCode = generatePublicId('BRN');
  }
  next();
});

module.exports = mongoose.model('ServiceCenterBranch', serviceCenterBranchSchema);
