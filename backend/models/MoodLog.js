const mongoose = require('mongoose');

const MoodLogSchema = new mongoose.Schema({
  elderlyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyProfile',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  mood: {
    type: String,
    enum: ['Happy', 'Neutral', 'Sad', 'Lonely', 'Anxious'],
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// One mood log per day per elderly
MoodLogSchema.index({ elderlyId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MoodLog', MoodLogSchema);
