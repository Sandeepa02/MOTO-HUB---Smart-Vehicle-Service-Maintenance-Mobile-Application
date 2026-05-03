const express = require('express');
const {
  getServicePackages,
  getMyServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage
} = require('../controllers/servicePackageController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getServicePackages);
router.get('/my', protect, authorize('service-center'), getMyServicePackages);
router.post('/', protect, authorize('service-center'), createServicePackage);
router.put('/:id', protect, authorize('service-center'), updateServicePackage);
router.delete('/:id', protect, authorize('service-center'), deleteServicePackage);

module.exports = router;
