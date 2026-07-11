const mongoose = require('mongoose');

const VoiceResponseSchema = new mongoose.Schema({
  elderlyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyProfile',
    required: true
  },
  audioFile: {
    type: String,
    default: '' // Placeholder for audio file URL
  },
  transcription: {
    type: String,
    required: true
  },
  intent: {
    type: String,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VoiceResponse', VoiceResponseSchema);
