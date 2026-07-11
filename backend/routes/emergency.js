const express = require('express');
const router = express.Router();
const EmergencyAlert = require('../models/EmergencyAlert');
const ElderlyProfile = require('../models/ElderlyProfile');
const { protect } = require('../middleware/auth');

// @desc    Get all alerts for all elderly profiles managed by current user
// @route   GET /api/emergency/alerts
// @access  Private
router.get('/alerts', protect, async (req, res) => {
  try {
    let elderlyIds = [];

    if (req.user.role === 'admin') {
      const alerts = await EmergencyAlert.find().populate('elderlyId', 'name').sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: alerts.length, data: alerts });
    }

    const profiles = await ElderlyProfile.find({ createdBy: req.user.id });
    elderlyIds = profiles.map(p => p._id);

    const alerts = await EmergencyAlert.find({ elderlyId: { $in: elderlyIds } })
      .populate('elderlyId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get alerts for a specific elderly profile
// @route   GET /api/emergency/elderly/:elderlyId
// @access  Private
router.get('/elderly/:elderlyId', protect, async (req, res) => {
  try {
    const profile = await ElderlyProfile.findById(req.params.elderlyId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Elderly profile not found' });
    }

    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const alerts = await EmergencyAlert.find({ elderlyId: req.params.elderlyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Trigger a manual emergency alert
// @route   POST /api/emergency/alert
// @access  Private
router.post('/alert', protect, async (req, res) => {
  try {
    const { elderlyId, alertType, severity, description } = req.body;

    if (!elderlyId || !alertType || !severity) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const profile = await ElderlyProfile.findById(elderlyId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Elderly profile not found' });
    }

    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const alert = await EmergencyAlert.create({
      elderlyId,
      alertType,
      severity,
      description: description || 'Manual Emergency Triggered'
    });

    // Generate Notification
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: profile.createdBy,
      title: `Emergency: ${alertType}`,
      message: `Emergency Alert triggered for ${profile.name}: ${severity} severity. Description: ${alert.description}`,
      type: 'Emergency Detected'
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Resolve alert
// @route   PUT /api/emergency/alert/:id/resolve
// @access  Private
router.put('/alert/:id/resolve', protect, async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // Verify ownership
    const profile = await ElderlyProfile.findById(alert.elderlyId);
    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    alert.status = 'Resolved';
    await alert.save();

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
