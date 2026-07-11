const express = require('express');
const router = express.Router();
const ElderlyProfile = require('../models/ElderlyProfile');
const { protect } = require('../middleware/auth');

// @desc    Get all elderly profiles
// @route   GET /api/profiles
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query;

    // Admins can see all profiles, family members can only see their own
    if (req.user.role === 'admin') {
      query = ElderlyProfile.find();
    } else {
      query = ElderlyProfile.find({ createdBy: req.user.id });
    }

    const profiles = await query;
    res.status(200).json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single elderly profile
// @route   GET /api/profiles/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const profile = await ElderlyProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Make sure user owns the profile (unless admin)
    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to access this profile' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new elderly profile
// @route   POST /api/profiles
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    // Add user to req.body.createdBy
    req.body.createdBy = req.user.id;

    // Split contacts if sent as string comma-separated
    if (req.body.emergencyContacts && typeof req.body.emergencyContacts === 'string') {
      req.body.emergencyContacts = req.body.emergencyContacts.split(',').map(c => c.trim()).filter(Boolean);
    }

    const profile = await ElderlyProfile.create(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Update elderly profile
// @route   PUT /api/profiles/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let profile = await ElderlyProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Make sure user owns the profile (unless admin)
    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this profile' });
    }

    // Split contacts if sent as string comma-separated
    if (req.body.emergencyContacts && typeof req.body.emergencyContacts === 'string') {
      req.body.emergencyContacts = req.body.emergencyContacts.split(',').map(c => c.trim()).filter(Boolean);
    }

    profile = await ElderlyProfile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Delete elderly profile
// @route   DELETE /api/profiles/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const profile = await ElderlyProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Make sure user owns the profile (unless admin)
    if (profile.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this profile' });
    }

    // Delete profile
    await profile.deleteOne();

    res.status(200).json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
