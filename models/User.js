const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  balanceUSD: { type: Number, default: 0 },
  balanceLBP: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  agentName: { type: String, required: false }
});

module.exports = mongoose.model('User', userSchema);
