const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app');
const { startExpiryNotificationJob } = require('./jobs/expiryNotificationJob');
const { startBookingReminderJob } = require('./jobs/bookingReminderJob');

dotenv.config();
connectDB();

startExpiryNotificationJob();
startBookingReminderJob();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
