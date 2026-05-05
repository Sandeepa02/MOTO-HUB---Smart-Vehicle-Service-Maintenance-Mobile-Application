const express = require('express');
const {
  getServiceCenters,
  getServiceCenterById,
  getMyServiceCenter,
  updateMyServiceCenter
} = require('../controllers/serviceCenterController');
const {
  listMyBranches,
  createBranch,
  getMyBranchById,
  updateMyBranch,
  deleteMyBranch,
  listPublicBranchesByCenterId
} = require('../controllers/serviceCenterBranchController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getServiceCenters);

router.get('/me', protect, authorize('service-center'), getMyServiceCenter);
router.put('/me', protect, authorize('service-center'), upload.single('image'), updateMyServiceCenter);

router.get('/me/branches', protect, authorize('service-center'), listMyBranches);
router.post('/me/branches', protect, authorize('service-center'), upload.single('image'), createBranch);
router.get('/me/branches/:branchId', protect, authorize('service-center'), getMyBranchById);
router.put('/me/branches/:branchId', protect, authorize('service-center'), upload.single('image'), updateMyBranch);
router.delete('/me/branches/:branchId', protect, authorize('service-center'), deleteMyBranch);

router.get('/:id/branches', listPublicBranchesByCenterId);
router.get('/:id', getServiceCenterById);

module.exports = router;
