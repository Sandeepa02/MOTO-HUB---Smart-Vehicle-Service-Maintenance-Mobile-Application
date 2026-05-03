const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  docType: { type: String, enum: ['rc_book', 'insurance', 'puc', 'other'], required: true },
  url: { type: String, required: true },
  name: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vehicleName: { type: String, required: true, trim: true },
    vehicleNumber: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1900 },
    mileage: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    vehicleType: {
      type: String,
      enum: ['Motorcycle', 'Scooter', 'Sport Bike', 'Cruiser', 'Electric', 'Other'],
      default: 'Motorcycle'
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Electric', 'Hybrid'],
      default: 'Petrol'
    },
    engineCapacity: { type: Number, min: 0 },
    color: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },

    // Insurance tracking
    insuranceExpiry: { type: Date },
    insuranceProvider: { type: String, trim: true, default: '' },
    policyNumber: { type: String, trim: true, default: '' },

    // Registration/License expiry
    registrationExpiry: { type: Date },

    // Document attachments
    documents: [documentSchema],

    // QR Code for quick check-in
    qrCode: { type: String, default: '' }
  },
  { timestamps: true }
);

vehicleSchema.index({ userId: 1 });
vehicleSchema.index({ userId: 1, isActive: 1 });
vehicleSchema.index({ vehicleNumber: 1 });

vehicleSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.year;
});

vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);

