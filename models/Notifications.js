const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  username: { type: String, default: null } // null = global
});

module.exports = mongoose.model('Notification', NotificationSchema);
