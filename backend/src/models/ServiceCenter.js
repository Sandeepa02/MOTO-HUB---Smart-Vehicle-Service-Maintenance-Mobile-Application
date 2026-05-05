const mongoose = require('mongoose');
const generatePublicId = require('../utils/publicId');

const serviceCenterSchema = new mongoose.Schema(
  {
    centerId: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    centerName: { type: String, required: true, trim: true },
    district: { type: String, trim: true, default: '' },
    location: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    servicesOffered: [{ type: String, trim: true }],
    image: { type: String, default: '' },
    maxBookingsPerSlot: { type: Number, default: 2, min: 1 },
    slotDurationHours: { type: Number, default: 2, min: 1 },
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
    operatingHours: {
      monday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      tuesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      wednesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      thursday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      friday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } },
      saturday: { open: { type: String, default: '09:00' }, close: { type: String, default: '14:00' }, isClosed: { type: Boolean, default: false } },
      sunday: { open: { type: String, default: '09:00' }, close: { type: String, default: '14:00' }, isClosed: { type: Boolean, default: true } }
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    description: { type: String, default: '', trim: true, maxLength: 500 }
  },
  { timestamps: true }
);

serviceCenterSchema.index({ coordinates: '2dsphere' });

serviceCenterSchema.pre('validate', function setCenterId(next) {
  if (!this.centerId) {
    this.centerId = generatePublicId('CTR');
  }
  next();
});

module.exports = mongoose.model('ServiceCenter', serviceCenterSchema);
