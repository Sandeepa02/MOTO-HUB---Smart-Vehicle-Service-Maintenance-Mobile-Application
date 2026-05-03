import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notifications';

export const addNotification = async (notification) => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const notifications = stored ? JSON.parse(stored) : [];

    const newNotification = {
      id: Date.now(),
      ...notification,
      time: new Date().toLocaleString('en-IN')
    };

    notifications.unshift(newNotification);

    const limitedNotifications = notifications.slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(limitedNotifications));

    return newNotification;
  } catch (error) {
    console.error('Failed to add notification:', error);
    return null;
  }
};

export const getNotifications = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
};

export const clearNotifications = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear notifications:', error);
    return false;
  }
};

export const checkExpiringDocuments = async (vehicles) => {
  const today = new Date();
  const notifications = [];

  for (const vehicle of vehicles) {
    if (vehicle.insuranceExpiry) {
      const expiryDate = new Date(vehicle.insuranceExpiry);
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      if (daysLeft > 0 && daysLeft <= 30) {
        const urgency = daysLeft <= 7 ? 'Urgent' : 'Reminder';
        await addNotification({
          title: `${urgency}: Insurance Expiring`,
          body: `${vehicle.vehicleName} (${vehicle.vehicleNumber}) insurance expires in ${daysLeft} days.`,
          type: 'insurance_expiry',
          vehicleId: vehicle._id
        });
        notifications.push({ type: 'insurance', vehicle, daysLeft });
      }
    }

    if (vehicle.registrationExpiry) {
      const expiryDate = new Date(vehicle.registrationExpiry);
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      if (daysLeft > 0 && daysLeft <= 30) {
        const urgency = daysLeft <= 7 ? 'Urgent' : 'Reminder';
        await addNotification({
          title: `${urgency}: Registration Expiring`,
          body: `${vehicle.vehicleName} (${vehicle.vehicleNumber}) registration expires in ${daysLeft} days.`,
          type: 'registration_expiry',
          vehicleId: vehicle._id
        });
        notifications.push({ type: 'registration', vehicle, daysLeft });
      }
    }
  }

  return notifications;
};

export default {
  addNotification,
  getNotifications,
  clearNotifications,
  checkExpiringDocuments
};
