const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');
const ElderlyProfile = require('../models/ElderlyProfile');
const Notification = require('../models/Notification');
const EmergencyAlert = require('../models/EmergencyAlert');
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

// @desc    Get meals log history
// @route   GET /api/meals/elderly/:elderlyId
// @access  Private
router.get('/elderly/:elderlyId', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const meals = await Meal.find({ elderlyId: req.params.elderlyId }).sort({ date: -1 });
    res.status(200).json({ success: true, count: meals.length, data: meals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Log meal status for a specific date
// @route   POST /api/meals
// @access  Private
router.post('/', protect, verifyElderlyOwnership, async (req, res) => {
  try {
    const { elderlyId, date, breakfast, lunch, dinner } = req.body;

    if (!elderlyId || !date) {
      return res.status(400).json({ success: false, message: 'Missing elderlyId or date' });
    }

    let meal = await Meal.findOne({ elderlyId, date });

    if (meal) {
      if (breakfast) meal.breakfast = breakfast;
      if (lunch) meal.lunch = lunch;
      if (dinner) meal.dinner = dinner;
      await meal.save();
    } else {
      meal = await Meal.create({
        elderlyId,
        date,
        breakfast: breakfast || 'Pending',
        lunch: lunch || 'Pending',
        dinner: dinner || 'Pending'
      });
    }

    // Check for repetitive skipped meals in the last 7 days
    const profile = await ElderlyProfile.findById(elderlyId);
    const pastMeals = await Meal.find({ elderlyId }).sort({ date: -1 }).limit(7);

    let skippedCount = 0;
    pastMeals.forEach(m => {
      if (m.breakfast === 'Skipped') skippedCount++;
      if (m.lunch === 'Skipped') skippedCount++;
      if (m.dinner === 'Skipped') skippedCount++;
    });

    if (skippedCount >= 3) {
      // Create Alert
      await EmergencyAlert.create({
        elderlyId,
        alertType: 'Emergency',
        severity: 'Medium',
        description: `Nutritional Risk: ${profile.name} has skipped ${skippedCount} meals in the last week.`
      });

      // Create Family Notification
      await Notification.create({
        userId: profile.createdBy,
        title: 'Nutritional Warning: Skipped Meals',
        message: `${profile.name} has skipped ${skippedCount} meals in the last 7 days. Please check their food intake.`,
        type: 'Health Concern'
      });
    }

    res.status(200).json({ success: true, data: meal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
