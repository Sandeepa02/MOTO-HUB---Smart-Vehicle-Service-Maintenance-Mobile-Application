const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const ServiceCenter = require('../models/ServiceCenter');
const ServiceCenterBranch = require('../models/ServiceCenterBranch');
const ServicePackage = require('../models/ServicePackage');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { createInvoice, getInvoiceByBooking, calculateCosts, TAX_RATE } = require('../services/invoiceService');
const {
  SLOT_LABELS,
  DEFAULT_SLOT_CAPACITY,
  MAX_BOOKINGS_PER_DAY,
  isValidSlotLabel,
  validateBookingDateString
} = require('../utils/bookingSlots');

const ACTIVE_STATUSES = ['Pending', 'Accepted'];

const resolveSlotCapacity = (serviceCenter, branchDoc) => {
  if (branchDoc && branchDoc.maxBookingsPerSlot != null) {
    return branchDoc.maxBookingsPerSlot;
  }
  return serviceCenter.maxBookingsPerSlot || DEFAULT_SLOT_CAPACITY;
};

const resolveSlotDurationHours = (serviceCenter, branchDoc) => {
  if (branchDoc && branchDoc.slotDurationHours != null) {
    return branchDoc.slotDurationHours;
  }
  return serviceCenter.slotDurationHours || 2;
};

const branchScopeMatcher = (branchId) =>
  branchId
    ? { branchId }
    : { $or: [{ branchId: null }, { branchId: { $exists: false } }] };

/** Pending + Accepted for same slot (same-day capacity), scoped per branch when applicable. */
const getActiveSlotBookingsCount = async ({ serviceCenterId, branchId, bookingDate, slotLabel, excludeBookingId }) => {
  const query = {
    serviceCenterId,
    bookingDate,
    slotLabel,
    status: { $in: ACTIVE_STATUSES },
    ...branchScopeMatcher(branchId || null)
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return Booking.countDocuments(query);
};

const getActiveDayBookingsCount = async ({ serviceCenterId, branchId, bookingDate, excludeBookingId }) => {
  const query = {
    serviceCenterId,
    bookingDate,
    status: { $in: ACTIVE_STATUSES },
    ...branchScopeMatcher(branchId || null)
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return Booking.countDocuments(query);
};

const populateBookingQuery = (query) =>
  query
    .populate('vehicleId', 'vehicleName vehicleNumber brand model')
    .populate('userId', 'name email')
    .populate('serviceCenterId', 'centerName location contactNumber')
    .populate('branchId', 'branchName location branchCode district')
    .populate('servicePackageId', 'serviceName price estimatedDuration discountPrice discountValidTill');

const validateBookingPayload = async ({
  userId,
  vehicleId,
  serviceCenterId,
  branchId: rawBranchId,
  bookingDate,
  slotLabel,
  excludeBookingId
}) => {
  const dateErr = validateBookingDateString(bookingDate);
  if (dateErr) {
    return { error: dateErr, branchDoc: null };
  }

  if (!vehicleId || !serviceCenterId || !slotLabel) {
    return { error: 'Vehicle, service center, booking date, and slot are required', branchDoc: null };
  }

  if (!isValidSlotLabel(slotLabel)) {
    return { error: `Slot must be one of: ${SLOT_LABELS.join(', ')}`, branchDoc: null };
  }

  const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });
  if (!vehicle) {
    return { error: 'Vehicle not found for this user', branchDoc: null };
  }

  const serviceCenter = await ServiceCenter.findById(serviceCenterId);
  if (!serviceCenter) {
    return { error: 'Service center not found', branchDoc: null };
  }

  const branchHint =
    rawBranchId != null && String(rawBranchId).trim() !== '' ? String(rawBranchId).trim() : null;

  const activeBranchCount = await ServiceCenterBranch.countDocuments({
    serviceCenterId: serviceCenter._id,
    isActive: true
  });

  let branchDoc = null;
  if (activeBranchCount > 0) {
    if (!branchHint || !mongoose.Types.ObjectId.isValid(branchHint)) {
      return { error: 'Please select an outlet branch for this service center', branchDoc: null };
    }
    branchDoc = await ServiceCenterBranch.findOne({
      _id: branchHint,
      serviceCenterId: serviceCenter._id,
      isActive: true
    });
    if (!branchDoc) {
      return { error: 'Invalid or inactive branch for this service center', branchDoc: null };
    }
  } else if (branchHint) {
    return { error: 'This service center does not use outlets; remove branch selection', branchDoc: null };
  }

  const scopeBranchId = branchDoc ? branchDoc._id : null;

  const slotCapacity = resolveSlotCapacity(serviceCenter, branchDoc);
  const activeOnSlot = await getActiveSlotBookingsCount({
    serviceCenterId,
    branchId: scopeBranchId,
    bookingDate,
    slotLabel,
    excludeBookingId
  });
  if (activeOnSlot >= slotCapacity) {
    return {
      error: `This time slot is full (maximum ${slotCapacity} booking(s) per slot). Choose another slot or date.`,
      branchDoc: null
    };
  }

  const dayTotal = await getActiveDayBookingsCount({
    serviceCenterId,
    branchId: scopeBranchId,
    bookingDate,
    excludeBookingId
  });
  if (dayTotal >= MAX_BOOKINGS_PER_DAY) {
    return {
      error: `This date is fully booked (${MAX_BOOKINGS_PER_DAY} bookings allowed per day at this outlet). Please choose another date.`,
      branchDoc: null
    };
  }

  return { error: null, branchDoc };
};

const createBooking = asyncHandler(async (req, res) => {
  const { vehicleId, serviceCenterId, servicePackageId, serviceType, bookingDate, slotLabel, notes, branchId } = req.body;

  if (!serviceType) {
    res.status(400);
    throw new Error('Service type is required');
  }

  const { error: validationError, branchDoc } = await validateBookingPayload({
    userId: req.user._id,
    vehicleId,
    serviceCenterId,
    branchId,
    bookingDate,
    slotLabel,
    excludeBookingId: undefined
  });

  if (validationError) {
    res.status(validationError.includes('not found') ? 404 : 400);
    throw new Error(validationError);
  }

  let estimatedCost = 0;
  let taxAmount = 0;

  if (servicePackageId) {
    const servicePackage = await ServicePackage.findById(servicePackageId);
    if (servicePackage) {
      const isDiscountValid = servicePackage.discountPrice && 
        servicePackage.discountValidTill && 
        new Date(servicePackage.discountValidTill) > new Date();
      
      const basePrice = isDiscountValid ? servicePackage.discountPrice : servicePackage.price;
      const costs = calculateCosts(basePrice);
      estimatedCost = costs.baseAmount;
      taxAmount = costs.taxAmount;
    }
  }

  const bookingPayload = {
    userId: req.user._id,
    vehicleId,
    serviceCenterId,
    servicePackageId,
    serviceType,
    bookingDate,
    slotLabel,
    notes: notes || '',
    estimatedCost,
    taxAmount
  };

  if (branchDoc?._id) {
    bookingPayload.branchId = branchDoc._id;
  }

  const booking = await Booking.create(bookingPayload);

  await Notification.create({
    userId: req.user._id,
    bookingId: booking._id,
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    body: `Your ${serviceType} service has been booked for ${bookingDate} at ${slotLabel}.`,
    sentAt: new Date()
  });

  res.status(201).json(await populateBookingQuery(Booking.findById(booking._id)));
});

const getBookings = asyncHandler(async (req, res) => {
  const query = req.user.role === 'service-center'
    ? { serviceCenterId: req.query.serviceCenterId }
    : { userId: req.user._id };

  if (req.user.role === 'service-center') {
    const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
    if (!serviceCenter) {
      res.status(404);
      throw new Error('Service center profile not found');
    }
    query.serviceCenterId = serviceCenter._id;
  }

  const bookings = await populateBookingQuery(Booking.find(query).sort({ bookingDate: -1, slotLabel: 1 }));
  res.status(200).json(bookings);
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.status !== 'Pending') {
    res.status(400);
    throw new Error('Only pending bookings can be updated');
  }

  const nextVehicleId = req.body.vehicleId || booking.vehicleId;
  const nextServiceCenterId = req.body.serviceCenterId || booking.serviceCenterId;
  const nextBookingDate = req.body.bookingDate || booking.bookingDate;
  const nextSlotLabel = req.body.slotLabel || booking.slotLabel;

  const embeddedBranchRaw = booking.branchId;
  const embeddedBranch =
    embeddedBranchRaw && typeof embeddedBranchRaw === 'object' && embeddedBranchRaw._id
      ? embeddedBranchRaw._id
      : embeddedBranchRaw;
  const nextBranchForValidation =
    req.body.branchId !== undefined ? req.body.branchId : embeddedBranch;

  const { error: validationError, branchDoc } = await validateBookingPayload({
    userId: req.user._id,
    vehicleId: nextVehicleId,
    serviceCenterId: nextServiceCenterId,
    branchId: nextBranchForValidation,
    bookingDate: nextBookingDate,
    slotLabel: nextSlotLabel,
    excludeBookingId: booking._id
  });

  if (validationError) {
    res.status(validationError.includes('not found') ? 404 : 400);
    throw new Error(validationError);
  }

  const fields = ['vehicleId', 'serviceCenterId', 'serviceType', 'bookingDate', 'slotLabel', 'notes'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      booking[field] = req.body[field];
    }
  });

  booking.branchId = branchDoc ? branchDoc._id : null;

  const updatedBooking = await booking.save();
  res.status(200).json(await populateBookingQuery(Booking.findById(updatedBooking._id)));
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.status === 'Completed') {
    res.status(400);
    throw new Error('Completed bookings cannot be cancelled');
  }

  const { cancellationReason, cancellationNote } = req.body;

  booking.status = 'Cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = 'user';
  
  if (cancellationReason) {
    booking.cancellationReason = cancellationReason;
  }
  if (cancellationNote) {
    booking.cancellationNote = cancellationNote;
  }

  await booking.save();

  await Notification.create({
    userId: booking.userId,
    bookingId: booking._id,
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    body: `Your ${booking.serviceType} service scheduled for ${booking.bookingDate} has been cancelled.`,
    sentAt: new Date()
  });

  res.status(200).json({ 
    message: 'Booking cancelled successfully',
    booking: await populateBookingQuery(Booking.findById(booking._id))
  });
});

const acceptBooking = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const booking = await Booking.findOne({ _id: req.params.id, serviceCenterId: serviceCenter._id });
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.status !== 'Pending') {
    res.status(400);
    throw new Error('Only pending bookings can be accepted');
  }

  const othersOnSlot = await getActiveSlotBookingsCount({
    serviceCenterId: serviceCenter._id,
    branchId: booking.branchId || null,
    bookingDate: booking.bookingDate,
    slotLabel: booking.slotLabel,
    excludeBookingId: booking._id
  });

  let branchLean = null;
  if (booking.branchId) {
    branchLean = await ServiceCenterBranch.findById(booking.branchId).lean();
  }

  const slotCapacity = resolveSlotCapacity(serviceCenter, branchLean);
  if (othersOnSlot >= slotCapacity) {
    res.status(400);
    throw new Error(`This slot is full (maximum ${slotCapacity} active booking(s) per slot).`);
  }

  booking.status = 'Accepted';
  booking.acceptedAt = new Date();
  await booking.save();

  res.status(200).json(await populateBookingQuery(Booking.findById(booking._id)));
});

const getAvailability = asyncHandler(async (req, res) => {
  const { serviceCenterId, bookingDate, branchId } = req.query;

  if (!serviceCenterId || !bookingDate) {
    res.status(400);
    throw new Error('Service center and booking date are required');
  }

  const branchHint = typeof branchId === 'string' && branchId.trim() ? branchId.trim() : '';

  const dateErr = validateBookingDateString(bookingDate);
  if (dateErr) {
    res.status(400);
    throw new Error(dateErr);
  }

  const serviceCenter = await ServiceCenter.findById(serviceCenterId);
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center not found');
  }

  const activeBranchCount = await ServiceCenterBranch.countDocuments({
    serviceCenterId: serviceCenter._id,
    isActive: true
  });

  let branchDoc = null;
  if (activeBranchCount > 0) {
    if (!branchHint || !mongoose.Types.ObjectId.isValid(branchHint)) {
      res.status(400);
      throw new Error('Branch is required for this service center');
    }
    branchDoc = await ServiceCenterBranch.findOne({
      _id: branchHint,
      serviceCenterId: serviceCenter._id,
      isActive: true
    });
    if (!branchDoc) {
      res.status(404);
      throw new Error('Branch not found');
    }
  } else if (branchHint) {
    res.status(400);
    throw new Error('This service center does not list outlets yet; omit branchId');
  }

  const scopeBranchId = branchDoc ? branchDoc._id : null;

  const activeBookings = await Booking.find({
    serviceCenterId,
    bookingDate,
    status: { $in: ACTIVE_STATUSES },
    ...branchScopeMatcher(scopeBranchId)
  }).select('slotLabel');

  const counts = activeBookings.reduce((acc, b) => {
    acc[b.slotLabel] = (acc[b.slotLabel] || 0) + 1;
    return acc;
  }, {});

  const slotCapacity = resolveSlotCapacity(serviceCenter, branchDoc);
  const bookingsOnDate = activeBookings.length;
  const slots = SLOT_LABELS.map((slotLabel) => ({
    slotLabel,
    activeCount: counts[slotLabel] || 0,
    remainingCapacity: Math.max(slotCapacity - (counts[slotLabel] || 0), 0),
    available: (counts[slotLabel] || 0) < slotCapacity
  }));

  res.status(200).json({
    bookingDate,
    serviceCenterId,
    branchId: branchDoc ? String(branchDoc._id) : null,
    slotDurationHours: resolveSlotDurationHours(serviceCenter, branchDoc),
    maxBookingsPerSlot: slotCapacity,
    maxBookingsPerDay: MAX_BOOKINGS_PER_DAY,
    bookingsOnDate,
    slots
  });
});

const generateInvoice = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'service-center') {
    res.status(403);
    throw new Error('Not authorized to access this invoice');
  }

  if (booking.status !== 'Completed') {
    res.status(400);
    throw new Error('Invoice can only be generated for completed bookings');
  }

  const invoice = await createInvoice(booking._id);

  await Notification.create({
    userId: booking.userId,
    bookingId: booking._id,
    type: 'invoice_ready',
    title: 'Invoice Ready',
    body: `Your invoice for ${booking.serviceType} service is ready to download.`,
    sentAt: new Date()
  });

  res.status(200).json({
    message: 'Invoice generated successfully',
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      downloadUrl: invoice.pdfPath
    }
  });
});

const getInvoice = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'service-center') {
    res.status(403);
    throw new Error('Not authorized to access this invoice');
  }

  const invoice = await getInvoiceByBooking(booking._id);
  
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found. Please generate it first.');
  }

  res.status(200).json(invoice);
});

const getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly } = req.query;
  
  const query = { userId: req.user._id };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('bookingId', 'serviceType bookingDate slotLabel status');

  const unreadCount = await Notification.countDocuments({ 
    userId: req.user._id, 
    isRead: false 
  });

  res.status(200).json({
    notifications,
    unreadCount
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json(notification);
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({ message: 'All notifications marked as read' });
});

const completeBooking = asyncHandler(async (req, res) => {
  const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
  if (!serviceCenter) {
    res.status(404);
    throw new Error('Service center profile not found');
  }

  const booking = await Booking.findOne({ 
    _id: req.params.id, 
    serviceCenterId: serviceCenter._id 
  });
  
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.status !== 'Accepted') {
    res.status(400);
    throw new Error('Only accepted bookings can be marked as completed');
  }

  const { finalCost, additionalNotes } = req.body;

  booking.status = 'Completed';
  booking.completedAt = new Date();
  
  if (finalCost !== undefined) {
    booking.finalCost = finalCost;
  }
  if (additionalNotes) {
    booking.notes = booking.notes ? `${booking.notes}\n\nService Notes: ${additionalNotes}` : `Service Notes: ${additionalNotes}`;
  }

  await booking.save();

  const invoice = await createInvoice(booking._id);

  await Notification.create({
    userId: booking.userId,
    bookingId: booking._id,
    type: 'booking_completed',
    title: 'Service Completed',
    body: `Your ${booking.serviceType} service has been completed. Invoice is ready for download.`,
    sentAt: new Date()
  });

  res.status(200).json({
    message: 'Booking marked as completed',
    booking: await populateBookingQuery(Booking.findById(booking._id)),
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      downloadUrl: invoice.pdfPath
    }
  });
});

module.exports = {
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
};
