const express = require('express');
const { addReview, getReviews, updateReview, deleteReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getReviews);
router.post('/', protect, authorize('user'), addReview);
router.route('/:id').put(protect, authorize('user'), updateReview).delete(protect, authorize('user'), deleteReview);

module.exports = router;
