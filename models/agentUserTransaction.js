const mongoose = require('mongoose');

const agentUserTransactionSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  agentName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'withdraw'], required: true },
  currency: { type: String, enum: ['USD', 'LBP'], required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AgentUserTransaction', agentUserTransactionSchema);
