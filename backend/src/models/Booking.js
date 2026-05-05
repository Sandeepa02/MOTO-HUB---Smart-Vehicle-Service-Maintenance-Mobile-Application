const mongoose = require('mongoose');
const generatePublicId = require('../utils/publicId');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true
    },
    serviceCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCenter',
      required: true
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCenterBranch',
      default: null
    },
    servicePackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePackage'
    },
    serviceType: { type: String, required: true, trim: true },
    bookingDate: {
      type: Date,
      required: true
    },
    slotLabel: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    notes: { type: String, default: '' },
    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    
    // Cost tracking
    estimatedCost: { type: Number, default: 0 },
    finalCost: { type: Number },
    taxAmount: { type: Number, default: 0 },
    
    // Cancellation tracking
    cancellationReason: {
      type: String,
      enum: [
        'change_of_plans',
        'found_better_price',
        'vehicle_issue_resolved',
        'service_center_issue',
        'emergency',
        'rescheduling',
        'other'
      ]
    },
    cancellationNote: { type: String, maxLength: 500 },
    cancelledAt: { type: Date },
    cancelledBy: {
      type: String,
      enum: ['user', 'service_center']
    },
    
    // Reminder tracking
    reminderSentAt: { type: Date },
    
    // Invoice tracking
    invoiceNumber: { type: String },
    invoiceGeneratedAt: { type: Date }
  },
  { timestamps: true }
);

bookingSchema.index({ serviceCenterId: 1, bookingDate: 1, slotLabel: 1, status: 1 });
bookingSchema.index({ serviceCenterId: 1, branchId: 1, bookingDate: 1, slotLabel: 1, status: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ vehicleId: 1 });

bookingSchema.pre('validate', function setBookingId(next) {
  if (!this.bookingId) {
    this.bookingId = generatePublicId('BKG');
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
