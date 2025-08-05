// models/BetHistory.js

const mongoose = require('mongoose');

const betHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: false, // Some users might not be created by agents
    index: true,
  },
  agentName: {
    type: String,
    required: false, // Optional, only exists for agent-created users
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  game: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    enum: ['USD', 'LBP'],
    required: true,
  },
  betAmount: {
    type: Number,
    required: true,
  },
  payout: {
    type: Number,
    required: true,
  }
}, { timestamps: true }); // This adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('BetHistory', betHistorySchema);
