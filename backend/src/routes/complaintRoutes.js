const express = require('express');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  respondToComplaint,
  resolveComplaint,
  rejectComplaint,
  closeComplaint,
  getComplaintStats
} = require('../controllers/complaintController');
const { protect, serviceCenterOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getComplaints)
  .post(protect, upload.array('images', 5), createComplaint);

router.get('/stats', protect, serviceCenterOnly, getComplaintStats);

router.route('/:id')
  .get(protect, getComplaintById)
  .put(protect, upload.array('images', 5), updateComplaint);

router.put('/:id/respond', protect, serviceCenterOnly, respondToComplaint);
router.put('/:id/resolve', protect, serviceCenterOnly, resolveComplaint);
router.put('/:id/reject', protect, serviceCenterOnly, rejectComplaint);
router.put('/:id/close', protect, closeComplaint);

module.exports = router;
