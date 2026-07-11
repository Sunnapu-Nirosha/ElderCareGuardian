const express = require('express');
const router = express.Router();
const MoodLog = require('../models/MoodLog');
const ElderlyProfile = require('../models/ElderlyProfile');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Ownership check helper
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

// @desc    Get mood logs for an elderly person
// @route   GET /api/moods/elderly/:elderlyId
// @access  Private
router.get('/elderly/:elderlyId', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const logs = await MoodLog.find({ elderlyId: req.params.elderlyId }).sort({ date: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Log daily mood
// @route   POST /api/moods
// @access  Private
router.post('/', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const { elderlyId, date, mood } = req.body;

    if (!elderlyId || !date || !mood) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // Map moods to scores: Happy=5, Neutral=3, Sad=2, Anxious=2, Lonely=1
    const moodScores = {
      Happy: 5,
      Neutral: 3,
      Sad: 2,
      Anxious: 2,
      Lonely: 1
    };

    const score = moodScores[mood] || 3;

    let moodLog = await MoodLog.findOne({ elderlyId, date });

    if (moodLog) {
      moodLog.mood = mood;
      moodLog.score = score;
      await moodLog.save();
    } else {
      moodLog = await MoodLog.create({
        elderlyId,
        date,
        mood,
        score
      });
    }

    // Proactively generate notifications for family if mood is concerning
    if (['Sad', 'Lonely', 'Anxious'].includes(mood)) {
      const profile = await ElderlyProfile.findById(elderlyId);
      await Notification.create({
        userId: profile.createdBy,
        title: 'Mood Concern Flagged',
        message: `${profile.name} has logged feeling ${mood} today. Consider checking in on them.`,
        type: 'Mood Concern'
      });
    }

    res.status(200).json({ success: true, data: moodLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get mood trends and statistics
// @route   GET /api/moods/elderly/:elderlyId/trends
// @access  Private
router.get('/elderly/:elderlyId/trends', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const logs = await MoodLog.find({ elderlyId: req.params.elderlyId }).sort({ date: 1 }).limit(30); // past 30 logs

    const counts = {
      Happy: 0,
      Neutral: 0,
      Sad: 0,
      Lonely: 0,
      Anxious: 0
    };

    let totalScore = 0;
    logs.forEach(l => {
      counts[l.mood]++;
      totalScore += l.score;
    });

    const averageScore = logs.length > 0 ? parseFloat((totalScore / logs.length).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: {
        averageScore,
        counts,
        history: logs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
