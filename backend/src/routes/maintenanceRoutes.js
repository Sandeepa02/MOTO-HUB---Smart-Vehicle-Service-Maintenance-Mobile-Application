const express = require('express');
const {
  addRecord,
  getRecords,
  updateRecord,
  deleteRecord
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router
  .route('/')
  .post(protect, authorize('service-center'), upload.single('maintenanceImage'), addRecord)
  .get(protect, getRecords);

router
  .route('/:id')
  .put(protect, authorize('service-center'), upload.single('maintenanceImage'), updateRecord)
  .delete(protect, authorize('service-center'), deleteRecord);

module.exports = router;
