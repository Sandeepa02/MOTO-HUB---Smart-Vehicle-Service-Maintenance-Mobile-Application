const cron = require('node-cron');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

const checkExpiringDocuments = async () => {
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  try {
    const expiringVehicles = await Vehicle.find({
      $or: [
        { insuranceExpiry: { $gte: today, $lte: thirtyDaysFromNow } },
        { registrationExpiry: { $gte: today, $lte: thirtyDaysFromNow } }
      ]
    }).populate('userId', 'name email');

    const notifications = [];

    expiringVehicles.forEach((vehicle) => {
      if (vehicle.insuranceExpiry) {
        const daysLeft = Math.ceil((vehicle.insuranceExpiry - today) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30 && daysLeft > 0) {
          notifications.push({
            userId: vehicle.userId._id,
            userEmail: vehicle.userId.email,
            vehicleId: vehicle._id,
            vehicleName: vehicle.vehicleName,
            vehicleNumber: vehicle.vehicleNumber,
            type: 'insurance',
            daysLeft,
            expiryDate: vehicle.insuranceExpiry,
            urgency: daysLeft <= 7 ? 'high' : 'medium'
          });
        }
      }

      if (vehicle.registrationExpiry) {
        const daysLeft = Math.ceil((vehicle.registrationExpiry - today) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30 && daysLeft > 0) {
          notifications.push({
            userId: vehicle.userId._id,
            userEmail: vehicle.userId.email,
            vehicleId: vehicle._id,
            vehicleName: vehicle.vehicleName,
            vehicleNumber: vehicle.vehicleNumber,
            type: 'registration',
            daysLeft,
            expiryDate: vehicle.registrationExpiry,
            urgency: daysLeft <= 7 ? 'high' : 'medium'
          });
        }
      }
    });

    if (notifications.length > 0) {
      console.log(`[ExpiryJob] Found ${notifications.length} expiring documents:`);
      notifications.forEach((n) => {
        console.log(
          `  - ${n.vehicleName} (${n.vehicleNumber}): ${n.type} expires in ${n.daysLeft} days`
        );
      });
    }

    return notifications;
  } catch (error) {
    console.error('[ExpiryJob] Error checking expiring documents:', error.message);
    return [];
  }
};

const startExpiryNotificationJob = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[ExpiryJob] Running daily expiry check...');
    await checkExpiringDocuments();
  });

  console.log('[ExpiryJob] Expiry notification job scheduled (daily at 9:00 AM)');
};

module.exports = {
  startExpiryNotificationJob,
  checkExpiringDocuments
};
