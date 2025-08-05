const mongoose = require('mongoose');

const superAgentTransactionSchema = new mongoose.Schema({
  superAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAgent', required: true },
  superAgentName: { type: String, required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  agentName: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'withdraw'], required: true },
  currency: { type: String, enum: ['USD', 'LBP'], required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SuperAgentTransaction', superAgentTransactionSchema);
