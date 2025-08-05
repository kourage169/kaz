const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  balanceUSD: { type: Number, default: 0 },
  balanceLBP: { type: Number, default: 0 },
  superAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAgent' },
});

module.exports = mongoose.model('Agent', agentSchema);
