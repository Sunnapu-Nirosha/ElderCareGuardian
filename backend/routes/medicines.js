const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const ElderlyProfile = require('../models/ElderlyProfile');
const { protect } = require('../middleware/auth');

// Middleware to verify user owns the elderly profile the medicine belongs to
const verifyElderlyOwnership = async (req, res, next) => {
  try {
    const elderlyId = req.params.elderlyId || req.body.elderlyId;
    if (!elderlyId) {
      return res.status(400).json({ success: false, message: 'Please provide elderlyId' });
    }

    const profile = await ElderlyProfile.findById(elderlyId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Elderly profile not found' });
    }

    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized for this elderly profile' });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all medicines for a specific elderly profile
// @route   GET /api/medicines/elderly/:elderlyId
// @access  Private
router.get('/elderly/:elderlyId', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const medicines = await Medicine.find({ elderlyId: req.params.elderlyId });
    res.status(200).json({ success: true, count: medicines.length, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single medicine details
// @route   GET /api/medicines/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check ownership
    const profile = await ElderlyProfile.findById(medicine.elderlyId);
    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to view this medicine' });
    }

    res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add new medicine
// @route   POST /api/medicines
// @access  Private
router.post('/', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check ownership
    const profile = await ElderlyProfile.findById(medicine.elderlyId);
    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this medicine' });
    }

    medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check ownership
    const profile = await ElderlyProfile.findById(medicine.elderlyId);
    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this medicine' });
    }

    await medicine.deleteOne();
    res.status(200).json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Log medicine compliance (taken / missed)
// @route   POST /api/medicines/:id/compliance
// @access  Private
router.post('/:id/compliance', protect, async (req, res) => {
  try {
    const { date, status } = req.body; // date format: YYYY-MM-DD, status: 'taken' or 'missed'

    if (!date || !status) {
      return res.status(400).json({ success: false, message: 'Please provide date and status' });
    }

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check ownership
    const profile = await ElderlyProfile.findById(medicine.elderlyId);
    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Check if compliance log already exists for this date, if so update it, otherwise push new one
    const existingIndex = medicine.history.findIndex(h => h.date === date);

    if (existingIndex > -1) {
      medicine.history[existingIndex].status = status;
      medicine.history[existingIndex].markedAt = new Date();
    } else {
      medicine.history.push({ date, status });
    }

    await medicine.save();

    // Generate notification if missed
    if (status === 'missed') {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: profile.createdBy,
        title: 'Medication Missed',
        message: `Elderly ${profile.name} missed taking their medicine "${medicine.medicineName}" scheduled at ${medicine.time}.`,
        type: 'Medicine Missed'
      });
    }

    res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get compliance report for elderly
// @route   GET /api/medicines/elderly/:elderlyId/compliance-report
// @access  Private
router.get('/elderly/:elderlyId/compliance-report', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const medicines = await Medicine.find({ elderlyId: req.params.elderlyId });

    let totalLogs = 0;
    let takenLogs = 0;
    const details = [];

    medicines.forEach(med => {
      const medTaken = med.history.filter(h => h.status === 'taken').length;
      const medTotal = med.history.length;
      totalLogs += medTotal;
      takenLogs += medTaken;

      details.push({
        medicineId: med._id,
        medicineName: med.medicineName,
        dosage: med.dosage,
        time: med.time,
        takenCount: medTaken,
        totalCount: medTotal,
        complianceRate: medTotal > 0 ? Math.round((medTaken / medTotal) * 100) : 100
      });
    });

    const overallRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        overallRate,
        totalLogs,
        takenLogs,
        missedLogs: totalLogs - takenLogs,
        details
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
