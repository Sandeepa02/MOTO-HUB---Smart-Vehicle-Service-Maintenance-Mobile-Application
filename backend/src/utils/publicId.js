const crypto = require('crypto');

const generatePublicId = (prefix) => {
  const shortRand = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);
  return `${prefix}-${shortRand}`;
};

module.exports = generatePublicId;

