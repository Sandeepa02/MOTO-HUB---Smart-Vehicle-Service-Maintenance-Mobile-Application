const Review = require('../models/Review');
const Booking = require('../models/Booking');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const asyncHandler = require('../utils/asyncHandler');

const addReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  if (!bookingId || !rating) {
    res.status(400);
    throw new Error('Completed booking and rating are required');
  }

  const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id }).populate('serviceCenterId', 'centerName');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.status !== 'Completed') {
    res.status(400);
    throw new Error('Feedback can only be added after maintenance is completed');
  }

  const maintenanceRecord = await MaintenanceRecord.findOne({ bookingId });
  if (!maintenanceRecord) {
    res.status(400);
    throw new Error('Maintenance record not found for this booking');
  }

  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) {
    res.status(400);
    throw new Error('Feedback already exists for this booking');
  }

  const review = await Review.create({
    bookingId,
    userId: req.user._id,
    serviceCenterId: booking.serviceCenterId._id,
    rating,
    comment: comment || ''
  });

  res.status(201).json(
    await Review.findById(review._id)
      .populate('userId', 'name')
      .populate('serviceCenterId', 'centerName')
      .populate('bookingId', 'serviceType bookingDate slotLabel')
  );
});

const getReviews = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.serviceCenterId) {
    query.serviceCenterId = req.query.serviceCenterId;
  }

  if (req.query.userOnly === 'true' && req.user) {
    query.userId = req.user._id;
  }

  const reviews = await Review.find(query)
    .populate('userId', 'name')
    .populate('serviceCenterId', 'centerName')
    .populate('bookingId', 'serviceType bookingDate slotLabel')
    .sort({ createdAt: -1 });

  res.status(200).json(reviews);
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (req.body.rating !== undefined) {
    review.rating = req.body.rating;
  }

  if (req.body.comment !== undefined) {
    review.comment = req.body.comment;
  }

  review.date = new Date();

  const updatedReview = await review.save();
  res.status(200).json(
    await Review.findById(updatedReview._id)
      .populate('userId', 'name')
      .populate('serviceCenterId', 'centerName')
      .populate('bookingId', 'serviceType bookingDate slotLabel')
  );
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  res.status(200).json({ message: 'Review deleted successfully' });
});

module.exports = {
  addReview,
  getReviews,
  updateReview,
  deleteReview
};
