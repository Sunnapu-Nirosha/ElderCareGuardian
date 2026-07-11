const express = require('express');
const router = express.Router();
const MedicalDocument = require('../models/MedicalDocument');
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// @desc    Upload a medical document (Base64)
// @route   POST /api/documents/upload
// @access  Private
router.post('/upload', protect, async (req, res) => {
  try {
    const { elderlyId, name, fileName, fileType, fileData } = req.body;

    if (!elderlyId || !name || !fileName || !fileType || !fileData) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Ensure directory exists
    const uploadDir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate a unique filename to prevent collisions
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Strip metadata from base64 if present
    const base64Data = fileData.replace(/^data:.*;base64,/, "");

    // Write file to disk
    fs.writeFileSync(filePath, base64Data, 'base64');

    // Create DB entry
    const document = await MedicalDocument.create({
      elderlyId,
      name,
      fileName: uniqueFileName,
      fileType
    });

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all documents for an elderly profile
// @route   GET /api/documents/elderly/:elderlyId
// @access  Private
router.get('/elderly/:elderlyId', protect, async (req, res) => {
  try {
    const documents = await MedicalDocument.find({ elderlyId: req.params.elderlyId }).sort({ uploadedAt: -1 });
    res.status(200).json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a medical document
// @route   DELETE /api/documents/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Remove from disk
    const filePath = path.join(__dirname, '../uploads/documents', document.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from database
    await document.deleteOne();

    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
