const mongoose = require('mongoose');

const servicePackageSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCenter',
      required: true
    },
    serviceName: { type: String, required: true, trim: true },
    includedServices: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },

    category: {
      type: String,
      enum: ['Basic', 'Premium', 'Comprehensive'],
      default: 'Basic'
    },
    estimatedDuration: { type: Number, min: 0.5, default: 1 },
    discountPrice: { type: Number, min: 0 },
    discountValidTill: { type: Date },
    isCustomizable: { type: Boolean, default: false },
    popularityScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

servicePackageSchema.index({ centerId: 1 });
servicePackageSchema.index({ category: 1 });

module.exports = mongoose.model('ServicePackage', servicePackageSchema);
