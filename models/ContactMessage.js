const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String }, // Optional
  inquiryType: { 
    type: String, 
    enum: ['Support', 'Affiliate', 'Feedback', 'Business'],
    default: 'Support'
  },
  subject: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
