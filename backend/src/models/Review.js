const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    serviceCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCenter',
      required: true
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

reviewSchema.index({ serviceCenterId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ serviceCenterId: 1, rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);
