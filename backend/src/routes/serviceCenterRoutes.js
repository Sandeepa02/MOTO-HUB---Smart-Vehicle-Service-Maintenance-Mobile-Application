const express = require('express');
const {
  getServiceCenters,
  getServiceCenterById,
  getMyServiceCenter,
  updateMyServiceCenter,
  getNearbyServiceCenters
} = require('../controllers/serviceCenterController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getServiceCenters);
router.get('/nearby', getNearbyServiceCenters);
router.get('/me', protect, authorize('service-center'), getMyServiceCenter);
router.put('/me', protect, authorize('service-center'), upload.single('image'), updateMyServiceCenter);
router.get('/:id', getServiceCenterById);

module.exports = router;
