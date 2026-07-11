const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  elderlyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyProfile',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  breakfast: {
    type: String,
    enum: ['Completed', 'Skipped', 'Pending'],
    default: 'Pending'
  },
  lunch: {
    type: String,
    enum: ['Completed', 'Skipped', 'Pending'],
    default: 'Pending'
  },
  dinner: {
    type: String,
    enum: ['Completed', 'Skipped', 'Pending'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Unique entry per day per elderly
MealSchema.index({ elderlyId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Meal', MealSchema);
