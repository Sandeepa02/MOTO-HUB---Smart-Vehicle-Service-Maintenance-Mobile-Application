const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema(
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
    serviceDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },
    cost: { type: Number, required: true, min: 0 },
    nextServiceDate: { type: Date },
    maintenanceImage: { type: String, default: '' }
  },
  { timestamps: true }
);

maintenanceRecordSchema.index({ userId: 1 });
maintenanceRecordSchema.index({ vehicleId: 1 });
maintenanceRecordSchema.index({ serviceCenterId: 1 });
maintenanceRecordSchema.index({ nextServiceDate: 1 });
maintenanceRecordSchema.index({ serviceDate: -1 });

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
