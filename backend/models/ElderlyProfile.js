const mongoose = require('mongoose');

const ElderlyProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add the full name of the elderly person'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Please add the age']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  language: {
    type: String,
    default: 'English'
  },
  address: {
    type: String,
    trim: true
  },
  medicalConditions: {
    type: String,
    default: ''
  },
  bloodGroup: {
    type: String,
    trim: true
  },
  emergencyContacts: {
    type: [String],
    default: []
  },
  photo: {
    type: String,
    default: ''
  },
  relationship: {
    type: String,
    required: [true, 'Please specify relationship, e.g., Mother, Father']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add contact number']
  },
  preferredLanguage: {
    type: String,
    default: 'English'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ElderlyProfile', ElderlyProfileSchema);
