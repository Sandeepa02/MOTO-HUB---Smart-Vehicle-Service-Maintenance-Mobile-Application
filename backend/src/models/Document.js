const mongoose = require('mongoose');

const userDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    documentType: {
      type: String,
      enum: ['Driving License', 'Identity Card', 'Address Proof', 'Other'],
      required: true
    },
    documentName: { type: String, trim: true, default: '' },
    file: { type: String, required: true },
    expiryDate: { type: Date },
    issueDate: { type: Date },
    documentNumber: { type: String, trim: true, default: '' },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

userDocumentSchema.index({ userId: 1 });
userDocumentSchema.index({ userId: 1, documentType: 1 });
userDocumentSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('UserDocument', userDocumentSchema);
