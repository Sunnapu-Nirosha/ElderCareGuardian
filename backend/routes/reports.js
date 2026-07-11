const express = require('express');
const router = express.Router();
const ElderlyProfile = require('../models/ElderlyProfile');
const Medicine = require('../models/Medicine');
const WellnessCheck = require('../models/WellnessCheck');
const EmergencyAlert = require('../models/EmergencyAlert');
const MoodLog = require('../models/MoodLog');
const Meal = require('../models/Meal');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @desc    Get aggregated weekly health report for an elderly person
// @route   GET /api/reports/weekly/:elderlyId
// @access  Private
router.get('/weekly/:elderlyId', protect, async (req, res) => {
  try {
    const elderlyId = req.params.elderlyId;
    const profile = await ElderlyProfile.findById(elderlyId);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Elderly profile not found' });
    }

    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // 1. Medicine Compliance
    const medicines = await Medicine.find({ elderlyId });
    let totalMeds = 0;
    let takenMeds = 0;
    medicines.forEach(m => {
      totalMeds += m.history.length;
      takenMeds += m.history.filter(h => h.status === 'taken').length;
    });
    const medCompliance = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 100;

    // 2. Mood Summary
    const moodLogs = await MoodLog.find({ elderlyId }).sort({ date: -1 }).limit(7);
    let totalMoodScore = 0;
    const moodCounts = { Happy: 0, Neutral: 0, Sad: 0, Lonely: 0, Anxious: 0 };
    moodLogs.forEach(m => {
      moodCounts[m.mood]++;
      totalMoodScore += m.score;
    });
    const averageMoodScore = moodLogs.length > 0 ? parseFloat((totalMoodScore / moodLogs.length).toFixed(1)) : 5.0;

    // 3. Emergency Incidents
    const emergencies = await EmergencyAlert.find({ elderlyId }).sort({ createdAt: -1 });
    const emergencyCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    emergencies.forEach(e => {
      if (emergencyCounts[e.severity] !== undefined) {
        emergencyCounts[e.severity]++;
      }
    });

    // 4. Meal Tracking (Past 7 Days)
    const mealLogs = await Meal.find({ elderlyId }).sort({ date: -1 }).limit(7);
    let completedMeals = 0;
    let skippedMeals = 0;
    let pendingMeals = 0;
    mealLogs.forEach(m => {
      [m.breakfast, m.lunch, m.dinner].forEach(status => {
        if (status === 'Completed') completedMeals++;
        else if (status === 'Skipped') skippedMeals++;
        else pendingMeals++;
      });
    });

    // 5. Missed Contact Check (Missed Check-ins)
    const lastCheckin = await WellnessCheck.findOne({ elderlyId }).sort({ date: -1 });
    let hoursSinceLastCheckin = 999; // Default large number if no check-in
    let missedContactAlertLevel = 'None';

    if (lastCheckin) {
      const checkinDate = new Date(lastCheckin.createdAt || lastCheckin.date);
      const diffMs = Date.now() - checkinDate.getTime();
      hoursSinceLastCheckin = Math.floor(diffMs / (1000 * 60 * 60));

      if (hoursSinceLastCheckin >= 72) {
        missedContactAlertLevel = '72 Hours';
      } else if (hoursSinceLastCheckin >= 48) {
        missedContactAlertLevel = '48 Hours';
      } else if (hoursSinceLastCheckin >= 24) {
        missedContactAlertLevel = '24 Hours';
      }
    }

    // Generate alerts automatically if missed contact detected
    if (missedContactAlertLevel !== 'None') {
      const severity = missedContactAlertLevel === '72 Hours' ? 'Critical' : (missedContactAlertLevel === '48 Hours' ? 'High' : 'Medium');
      
      // Check if alert already active
      const activeAlert = await EmergencyAlert.findOne({
        elderlyId,
        alertType: 'Missed Contact',
        severity,
        status: 'Active'
      });

      if (!activeAlert) {
        await EmergencyAlert.create({
          elderlyId,
          alertType: 'Missed Contact',
          severity,
          description: `No wellness response received for ${missedContactAlertLevel}. Last checkin was ${hoursSinceLastCheckin} hours ago.`
        });

        await Notification.create({
          userId: profile.createdBy,
          title: `Missed Contact Warning: ${missedContactAlertLevel}`,
          message: `Warning: No response from ${profile.name} in the last ${missedContactAlertLevel}. Please contact them immediately.`,
          type: 'No Response'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        profile: {
          name: profile.name,
          age: profile.age,
          medicalConditions: profile.medicalConditions,
          bloodGroup: profile.bloodGroup,
          preferredLanguage: profile.preferredLanguage,
          emergencyContacts: profile.emergencyContacts
        },
        medication: {
          compliancePercentage: medCompliance,
          totalSchedulesLogged: totalMeds,
          takenCount: takenMeds
        },
        mood: {
          averageScore: averageMoodScore,
          moodDistribution: moodCounts,
          recentLogs: moodLogs
        },
        emergency: {
          totalCount: emergencies.length,
          severityDistribution: emergencyCounts,
          recentAlerts: emergencies.slice(0, 5)
        },
        meals: {
          completedCount: completedMeals,
          skippedCount: skippedMeals,
          pendingCount: pendingMeals
        },
        contactStatus: {
          hoursSinceLastCheckin,
          lastCheckinTime: lastCheckin ? lastCheckin.createdAt : null,
          missedContactAlertLevel
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
