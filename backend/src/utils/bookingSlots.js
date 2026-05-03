const SLOT_LABELS = ['08:00', '10:00', '12:00', '14:00', '16:00'];
/** Max simultaneous Pending+Accepted bookings per slot (3rd user is blocked). */
const DEFAULT_SLOT_CAPACITY = 2;
/** Max Pending+Accepted bookings per calendar day per service center (11th is blocked). */
const MAX_BOOKINGS_PER_DAY = 10;

const isValidSlotLabel = (slotLabel) => SLOT_LABELS.includes(slotLabel);

function todayYyyyMmDd() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {string} bookingDate YYYY-MM-DD
 * @returns {string|null} Error message or null if valid
 */
function validateBookingDateString(bookingDate) {
  if (bookingDate == null || bookingDate === '') {
    return 'Booking date is required';
  }
  if (typeof bookingDate !== 'string') {
    return 'Invalid booking date';
  }
  const trimmed = bookingDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return 'Invalid booking date. Use YYYY-MM-DD.';
  }
  if (trimmed < todayYyyyMmDd()) {
    return 'Booking date cannot be in the past';
  }
  return null;
}

module.exports = {
  SLOT_LABELS,
  DEFAULT_SLOT_CAPACITY,
  MAX_BOOKINGS_PER_DAY,
  isValidSlotLabel,
  todayYyyyMmDd,
  validateBookingDateString
};
