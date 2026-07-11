const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema({
  elderlyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ElderlyProfile', required: true },
  name: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalDocument', medicalDocumentSchema);
