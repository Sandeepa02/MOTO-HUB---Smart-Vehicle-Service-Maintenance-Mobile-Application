const express = require('express');
const {
  uploadDocument,
  getDocuments,
  updateDocument,
  deleteDocument
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').post(protect, upload.single('file'), uploadDocument).get(protect, getDocuments);
router.route('/:id').put(protect, upload.single('file'), updateDocument).delete(protect, deleteDocument);

module.exports = router;

