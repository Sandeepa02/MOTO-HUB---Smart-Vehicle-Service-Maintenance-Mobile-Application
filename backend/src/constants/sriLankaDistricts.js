/** Sri Lanka — 25 administrative districts (alphabetical) */
const SRI_LANKA_DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya'
];

const normalizeDistrict = (s) => (typeof s === 'string' ? s.trim() : '');

const isValidDistrict = (s) => {
  const n = normalizeDistrict(s);
  if (!n) return false;
  return SRI_LANKA_DISTRICTS.some((d) => d.toLowerCase() === n.toLowerCase());
};

const canonicalDistrict = (s) => {
  const n = normalizeDistrict(s);
  return SRI_LANKA_DISTRICTS.find((d) => d.toLowerCase() === n.toLowerCase()) || '';
};

module.exports = {
  SRI_LANKA_DISTRICTS,
  normalizeDistrict,
  isValidDistrict,
  canonicalDistrict
};
