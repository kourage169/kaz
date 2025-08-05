// routes/wheel.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory'); // NEW

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// wheel multipliers and probabilities
const wheelMultipliers = {
  10: {
    easy:   [1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0],
    medium: [0,   1.9, 0,   1.5, 0,   2,   0,   1.5, 0,   3],
    hard:   [0,   0,   0,   0,   0,   0,   0,   0,   0,   9.9]
  },
  20: {
    easy:   [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [1.5, 0,   2,   0,   2, 0,   2,   0,   1.5, 0, 3,   0,   1.8, 0,   2,  0,   2,   0,   2,   0],
    hard:   [0,   0,   0,   0,   0, 0,   0,   0,   0,   0, 0,   0,   0,   0,   0, 0,   0,   0,   0,   19.8]
  },
  30: {
    easy: [
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0
    ],
    medium: [
      1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0,
      2,   0, 1.5, 0, 3, 0, 1.5, 0, 2, 0,
      2,   0, 1.7, 0, 4, 0, 1.5, 0, 2, 0
    ],
    hard: [
      ...Array(29).fill(0), 29.7
    ]
  },
  40: {
    easy: [
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0
    ],
    medium: [
      2, 0, 3, 0, 2, 0, 1.5, 0, 3, 0,
      1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0,
      1.5, 0, 2, 0, 2, 0, 1.6, 0, 2, 0,
      1.5, 0, 3, 0, 1.5, 0, 2, 0, 1.5, 0
    ],
    hard: [
      ...Array(39).fill(0), 39.6
    ]
  },
  50: {
    easy: [
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
      1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0
    ],
    medium: [
      1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0,
      2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0,
      2, 0, 1.7, 0, 4, 0, 1.5, 0, 2, 0,
      2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0,
      1.5, 0, 2.2, 0, 4.5, 0, 3, 0, 3.5, 0
    ],
    hard: [
      ...Array(49).fill(0), 49.5
    ]
  }
};

// ─── spin route ───────────────────────────────────────
router.post('/spin', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { amount, currency, segments, risk } = req.body;

    // Validate inputs
    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    const parsedSegments = parseInt(segments);
    const parsedAmount = parseFloat(amount);
    const riskLevel = risk?.toLowerCase();

    if (![10, 20, 30, 40, 50].includes(parsedSegments)) {
      return res.status(400).json({ error: 'Invalid segment count' });
    }
    if (!['easy', 'medium', 'hard'].includes(riskLevel)) {
      return res.status(400).json({ error: 'Invalid risk level' });
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    if (user[balanceField] < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const multipliers = wheelMultipliers[parsedSegments][riskLevel];
    const index = Math.floor(Math.random() * multipliers.length);
    const multiplier = multipliers[index];
    const winAmount = parseFloat((parsedAmount * multiplier).toFixed(2));

    user[balanceField] -= parsedAmount;
    user[balanceField] += winAmount;

    await user.save();

    req.session.user.balanceUSD = user.balanceUSD;
    req.session.user.balanceLBP = user.balanceLBP;

     // Save to bet history
     const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Wheel',
      currency,
      betAmount: parsedAmount,
      payout: winAmount,
    });

    
    // Emit to WebSocket clients (e.g. for live public feed)
    req.app.get('wssBroadcast')({
     type: 'bet',
     username: user.username,
     game: 'Wheel',
     currency,
     betAmount: parsedAmount,
     payout: winAmount,
     timestamp: betRecord.createdAt, // Use the Mongoose timestamp
    });


    res.json({
      success: true,
      index,
      multiplier,
      payout: winAmount,
      newBalanceUSD: user.balanceUSD,
      newBalanceLBP: user.balanceLBP
    });
  } catch (err) {
    console.error('Spin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
