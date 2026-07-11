const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  elderlyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyProfile',
    required: true
  },
  medicineName: {
    type: String,
    required: [true, 'Please add a medicine name'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Please add a dosage (e.g. 1 tablet)']
  },
  time: {
    type: String,
    required: [true, 'Please specify time (e.g., 08:00 AM)']
  },
  frequency: {
    type: String,
    default: 'Daily'
  },
  instructions: {
    type: String,
    default: 'Take with water'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  history: [
    {
      date: {
        type: String, // YYYY-MM-DD
        required: true
      },
      status: {
        type: String,
        enum: ['taken', 'missed'],
        required: true
      },
      markedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model('Medicine', MedicineSchema);
