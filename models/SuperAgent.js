const mongoose = require('mongoose');

const superAgentSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  balanceUSD: { type: Number, default: 0 },
  balanceLBP: { type: Number, default: 0 }
});

module.exports = mongoose.model('SuperAgent', superAgentSchema);
