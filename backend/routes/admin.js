const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ElderlyProfile = require('../models/ElderlyProfile');
const EmergencyAlert = require('../models/EmergencyAlert');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProfiles = await ElderlyProfile.countDocuments();
    const totalAlerts = await EmergencyAlert.countDocuments();
    const activeAlerts = await EmergencyAlert.countDocuments({ status: 'Active' });
    
    // Simple mock active users count
    const activeUsers = await User.countDocuments({ role: 'family' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProfiles,
        totalAlerts,
        activeAlerts,
        activeUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Can't delete self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Admin cannot delete themselves' });
    }

    // Remove user
    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
