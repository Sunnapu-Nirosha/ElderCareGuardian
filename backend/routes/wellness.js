const express = require('express');
const router = express.Router();
const WellnessCheck = require('../models/WellnessCheck');
const ElderlyProfile = require('../models/ElderlyProfile');
const EmergencyAlert = require('../models/EmergencyAlert');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Ownership check
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
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get wellness checks history for an elderly person
// @route   GET /api/wellness/elderly/:elderlyId
// @access  Private
router.get('/elderly/:elderlyId', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const checks = await WellnessCheck.find({ elderlyId: req.params.elderlyId }).sort({ date: -1 });
    res.status(200).json({ success: true, count: checks.length, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Log a daily wellness check-in
// @route   POST /api/wellness
// @access  Private
router.post('/', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const { elderlyId, date, response, healthStatus, remarks } = req.body;

    if (!elderlyId || !date || !response || !healthStatus) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if checkin already exists for this date
    let wellnessCheck = await WellnessCheck.findOne({ elderlyId, date });

    if (wellnessCheck) {
      wellnessCheck.response = response;
      wellnessCheck.healthStatus = healthStatus;
      wellnessCheck.remarks = remarks || '';
      await wellnessCheck.save();
    } else {
      wellnessCheck = await WellnessCheck.create({
        elderlyId,
        date,
        response,
        healthStatus,
        remarks: remarks || ''
      });
    }

    // Get elderly name for alerts/notifications
    const profile = await ElderlyProfile.findById(elderlyId);

    // If healthStatus indicates issues, generate Emergency Alerts and Notifications
    if (healthStatus === 'Needs Help' || healthStatus === 'Not Feeling Well') {
      const severity = healthStatus === 'Needs Help' ? 'High' : 'Medium';
      
      // 1. Create alert in DB
      await EmergencyAlert.create({
        elderlyId,
        alertType: 'Help',
        severity,
        description: `Daily Wellness Check indicates concerns: "${response}". Remarks: ${remarks || 'None'}`
      });

      // 2. Create family member notification
      await Notification.create({
        userId: profile.createdBy,
        title: `Health Concern: ${healthStatus}`,
        message: `${profile.name} reported feeling: "${healthStatus}" during check-in. Response: "${response}"`,
        type: 'Health Concern'
      });
    }

    res.status(200).json({ success: true, data: wellnessCheck });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get wellness checks statistics
// @route   GET /api/wellness/elderly/:elderlyId/statistics
// @access  Private
router.get('/elderly/:elderlyId/statistics', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const checks = await WellnessCheck.find({ elderlyId: req.params.elderlyId });
    
    const stats = {
      Good: 0,
      Normal: 0,
      'Not Feeling Well': 0,
      'Needs Help': 0
    };

    checks.forEach(c => {
      if (stats[c.healthStatus] !== undefined) {
        stats[c.healthStatus]++;
      }
    });

    const total = checks.length;

    res.status(200).json({
      success: true,
      data: {
        total,
        statusCounts: stats,
        percentages: {
          Good: total > 0 ? Math.round((stats.Good / total) * 100) : 0,
          Normal: total > 0 ? Math.round((stats.Normal / total) * 100) : 0,
          'Not Feeling Well': total > 0 ? Math.round((stats['Not Feeling Well'] / total) * 100) : 0,
          'Needs Help': total > 0 ? Math.round((stats['Needs Help'] / total) * 100) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
