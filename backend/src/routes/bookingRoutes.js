const express = require('express');
const {
  createBooking,
  getBookings,
  updateBooking,
  cancelBooking,
  acceptBooking,
  completeBooking,
  getAvailability,
  generateInvoice,
  getInvoice,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/availability', protect, authorize('user'), getAvailability);

router.get('/notifications', protect, getNotifications);
router.patch('/notifications/read-all', protect, markAllNotificationsRead);
router.patch('/notifications/:id/read', protect, markNotificationRead);

router.patch('/:id/accept', protect, authorize('service-center'), acceptBooking);
router.patch('/:id/complete', protect, authorize('service-center'), completeBooking);

router.post('/:id/invoice', protect, generateInvoice);
router.get('/:id/invoice', protect, getInvoice);

router
  .route('/')
  .post(protect, authorize('user'), createBooking)
  .get(protect, getBookings);

router
  .route('/:id')
  .put(protect, authorize('user'), updateBooking)
  .delete(protect, cancelBooking);

module.exports = router;
