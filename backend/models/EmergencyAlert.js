const mongoose = require('mongoose');
const { sendEmailAlert } = require('../utils/mailer');

const EmergencyAlertSchema = new mongoose.Schema({
  elderlyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyProfile',
    required: true
  },
  alertType: {
    type: String,
    required: true,
    enum: ['Chest Pain', 'Dizziness', 'Help', 'Breathing Problem', 'Fever', 'Fall', 'Emergency', 'Missed Contact', 'Other']
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

EmergencyAlertSchema.post('save', async function(doc) {
  if (doc.severity === 'High' || doc.severity === 'Critical') {
    try {
      const ElderlyProfile = mongoose.model('ElderlyProfile');
      const profile = await ElderlyProfile.findById(doc.elderlyId);
      const elderName = profile ? profile.name : 'Senior';
      
      const subject = `⚠️ URGENT: ${doc.severity} Alert - ${doc.alertType} for ${elderName}`;
      const text = `An emergency alert has been logged for ${elderName}.\n\n` +
                   `Details:\n` +
                   `- Alert Type: ${doc.alertType}\n` +
                   `- Severity: ${doc.severity}\n` +
                   `- Description: ${doc.description}\n` +
                   `- Timestamp: ${new Date(doc.createdAt).toLocaleString()}\n\n` +
                   `Please check the AI ElderCare Guardian dashboard immediately.`;
                   
      await sendEmailAlert(subject, text);
    } catch (err) {
      console.error('Error in EmergencyAlert post-save email hook:', err);
    }
  }
});

module.exports = mongoose.model('EmergencyAlert', EmergencyAlertSchema);
