const UserDocument = require('../models/Document');
const asyncHandler = require('../utils/asyncHandler');

const uploadDocument = asyncHandler(async (req, res) => {
  const { documentType, expiryDate, documentName, issueDate, documentNumber } = req.body;

  if (!documentType) {
    res.status(400);
    throw new Error('Document type is required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Document file is required');
  }

  const document = await UserDocument.create({
    userId: req.user._id,
    documentType,
    documentName: documentName || '',
    file: `/uploads/${req.file.filename}`,
    expiryDate: expiryDate || null,
    issueDate: issueDate || null,
    documentNumber: documentNumber || ''
  });

  res.status(201).json(document);
});

const getDocuments = asyncHandler(async (req, res) => {
  const documents = await UserDocument.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(documents);
});

const updateDocument = asyncHandler(async (req, res) => {
  const document = await UserDocument.findOne({ _id: req.params.id, userId: req.user._id });
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  if (req.body.documentType !== undefined) document.documentType = req.body.documentType;
  if (req.body.documentName !== undefined) document.documentName = req.body.documentName;
  if (req.body.expiryDate !== undefined) document.expiryDate = req.body.expiryDate;
  if (req.body.issueDate !== undefined) document.issueDate = req.body.issueDate;
  if (req.body.documentNumber !== undefined) document.documentNumber = req.body.documentNumber;
  if (req.file) document.file = `/uploads/${req.file.filename}`;

  const updatedDocument = await document.save();
  res.status(200).json(updatedDocument);
});

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await UserDocument.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  res.status(200).json({ message: 'Document deleted successfully' });
});

module.exports = {
  uploadDocument,
  getDocuments,
  updateDocument,
  deleteDocument
};
