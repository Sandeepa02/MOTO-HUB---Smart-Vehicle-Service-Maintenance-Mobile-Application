const express = require('express');
const {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleHealthScore,
  getVehicleServiceSummary,
  getVehicleDetails,
  uploadVehicleDocument,
  deleteVehicleDocument,
  regenerateQRCode,
  getExpiringVehicles
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').post(protect, upload.single('image'), addVehicle).get(protect, getVehicles);

router.get('/expiring', protect, getExpiringVehicles);

router
  .route('/:id')
  .get(protect, getVehicleById)
  .put(protect, upload.single('image'), updateVehicle)
  .delete(protect, deleteVehicle);

router.get('/:id/details', protect, getVehicleDetails);
router.get('/:id/health-score', protect, getVehicleHealthScore);
router.get('/:id/service-summary', protect, getVehicleServiceSummary);
router.post('/:id/qr-code', protect, regenerateQRCode);

router
  .route('/:id/documents')
  .post(protect, upload.single('document'), uploadVehicleDocument);

router.delete('/:id/documents/:docId', protect, deleteVehicleDocument);

module.exports = router;

