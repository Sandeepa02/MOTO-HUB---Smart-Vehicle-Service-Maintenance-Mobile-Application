const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    maintenanceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRecord'
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
    issueType: {
      type: String,
      enum: [
        'Service Quality',
        'Overcharging',
        'Delay',
        'Vehicle Damage',
        'Unprofessional Behavior',
        'Incomplete Work',
        'Other'
      ],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['Open', 'In Review', 'Resolved', 'Closed', 'Rejected'],
      default: 'Open'
    },
    response: {
      type: String,
      default: ''
    },
    respondedAt: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolutionType: {
      type: String,
      enum: ['Refund', 'Re-service', 'Partial Refund', 'Compensation', 'Apology', 'No Action', null],
      default: null
    },
    resolutionNotes: {
      type: String,
      default: ''
    },
    userSatisfied: {
      type: Boolean,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

complaintSchema.index({ serviceCenterId: 1, status: 1 });
complaintSchema.index({ userId: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
