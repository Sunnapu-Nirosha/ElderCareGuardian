const mongoose = require('mongoose');

const WellnessCheckSchema = new mongoose.Schema({
  elderlyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyProfile',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  response: {
    type: String,
    required: true
  },
  healthStatus: {
    type: String,
    enum: ['Good', 'Normal', 'Not Feeling Well', 'Needs Help'],
    default: 'Normal'
  },
  remarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid multiple checkins for the same elderly on the same day
WellnessCheckSchema.index({ elderlyId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WellnessCheck', WellnessCheckSchema);
