const cron = require('node-cron');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeSlot = (slotLabel) => {
  return slotLabel || 'Scheduled time';
};

const checkUpcomingBookings = async () => {
  const tomorrowStr = getTomorrowDateString();

  try {
    const upcomingBookings = await Booking.find({
      bookingDate: tomorrowStr,
      status: { $in: ['Pending', 'Accepted'] },
      reminderSentAt: { $exists: false }
    })
      .populate('userId', 'name email')
      .populate('vehicleId', 'vehicleName vehicleNumber')
      .populate('serviceCenterId', 'centerName location contactNumber');

    const reminders = [];

    for (const booking of upcomingBookings) {
      const notification = await Notification.create({
        userId: booking.userId._id,
        bookingId: booking._id,
        type: 'booking_reminder',
        title: 'Booking Reminder',
        body: `Your ${booking.serviceType} service for ${booking.vehicleId?.vehicleName || 'your vehicle'} is scheduled tomorrow at ${formatTimeSlot(booking.slotLabel)}. Location: ${booking.serviceCenterId?.centerName || 'Service Center'}`,
        data: {
          bookingId: booking._id,
          bookingDate: booking.bookingDate,
          slotLabel: booking.slotLabel,
          serviceCenterName: booking.serviceCenterId?.centerName,
          serviceCenterLocation: booking.serviceCenterId?.location
        },
        sentAt: new Date()
      });

      booking.reminderSentAt = new Date();
      await booking.save();

      reminders.push({
        bookingId: booking._id,
        userId: booking.userId._id,
        userName: booking.userId.name,
        userEmail: booking.userId.email,
        vehicleName: booking.vehicleId?.vehicleName,
        serviceType: booking.serviceType,
        slotLabel: booking.slotLabel,
        serviceCenterName: booking.serviceCenterId?.centerName
      });
    }

    if (reminders.length > 0) {
      console.log(`[BookingReminder] Sent ${reminders.length} reminder(s):`);
      reminders.forEach((r) => {
        console.log(
          `  - ${r.userName}: ${r.serviceType} for ${r.vehicleName} at ${r.slotLabel}`
        );
      });
    }

    return reminders;
  } catch (error) {
    console.error('[BookingReminder] Error sending reminders:', error.message);
    return [];
  }
};

const startBookingReminderJob = () => {
  cron.schedule('0 18 * * *', async () => {
    console.log('[BookingReminder] Running daily booking reminder check...');
    await checkUpcomingBookings();
  });

  console.log('[BookingReminder] Booking reminder job scheduled (daily at 6:00 PM)');
};

module.exports = {
  startBookingReminderJob,
  checkUpcomingBookings
};
