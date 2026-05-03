const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
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
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true
    },
    maintenanceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRecord'
    },
    
    // Service details
    serviceName: { type: String, required: true },
    serviceDate: { type: Date, required: true },
    
    // Cost breakdown
    baseAmount: { type: Number, required: true },
    taxRate: { type: Number, default: 5 },
    taxAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    
    // Additional services if any
    additionalServices: [{
      name: { type: String },
      amount: { type: Number }
    }],
    
    // Status
    status: {
      type: String,
      enum: ['generated', 'sent', 'paid', 'cancelled'],
      default: 'generated'
    },
    
    // File info
    pdfPath: { type: String },
    
    notes: { type: String }
  },
  { timestamps: true }
);

invoiceSchema.index({ bookingId: 1 });
invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ serviceCenterId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
