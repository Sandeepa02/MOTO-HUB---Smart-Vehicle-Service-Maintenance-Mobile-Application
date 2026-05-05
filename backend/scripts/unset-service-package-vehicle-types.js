/**
 * One-time cleanup: removes legacy vehicleTypes from service package documents
 * and drops the vehicleTypes index if present. Run from backend folder:
 *   node scripts/unset-service-package-vehicle-types.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.db.collection('servicepackages');

  const unset = await col.updateMany({}, { $unset: { vehicleTypes: '' } });
  console.log('Unset vehicleTypes on', unset.modifiedCount, 'document(s)');

  try {
    await col.dropIndex('vehicleTypes_1');
    console.log('Dropped index vehicleTypes_1');
  } catch (e) {
    if (e.codeName === 'IndexNotFound' || e.code === 27) {
      console.log('No vehicleTypes_1 index to drop');
    } else {
      throw e;
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
