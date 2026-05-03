const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    type: {
      type: String,
      enum: [
        'booking_reminder',
        'booking_confirmed',
        'booking_accepted',
        'booking_completed',
        'booking_cancelled',
        'invoice_ready',
        'promotion'
      ],
      required: true
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    
    // Scheduling
    scheduledFor: { type: Date },
    sentAt: { type: Date },
    
    // Status
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ scheduledFor: 1, sentAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
