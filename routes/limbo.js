// routes/limbo.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Win chance is 99 / multiplier
function getWinChance(multiplier) {
    if (multiplier < 1.01 || multiplier > 1000) throw new Error("Invalid multiplier");
    return 99 / multiplier;
}
  
// POST /games/limbo/play
router.post('/play', async (req, res) => {
    const { targetMultiplier, betAmount, currency } = req.body;
  
    if (!targetMultiplier || !betAmount || !currency) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    const parsedMultiplier = parseFloat(targetMultiplier);
    const parsedBet = parseFloat(betAmount);
  
    if (isNaN(parsedMultiplier) || isNaN(parsedBet) || parsedBet <= 0) {
      return res.status(400).json({ error: 'Invalid multiplier or bet amount' });
    }

    // Enforce min/max bet limits
  const limits = {
    USD: { min: 0.1, max: 100 },
    LBP: { min: 10000, max: 10000000 }
  };
  
  const limit = limits[currency];
  if (!limit) {
    return res.status(400).json({ error: 'Unsupported currency' });
  }
  
  const { min, max } = limit;
  if (parsedBet < min || parsedBet > max) {
    return res.status(400).json({ error: `Bet must be between ${min} and ${max} ${currency}` });
  }
  
    // Get user from DB
    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
  
    // Validate balance based on currency
    const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    if (!user[balanceField] || user[balanceField] < parsedBet) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
  
    // Calculate win chance and roll
    const winChance = getWinChance(parsedMultiplier);
    const roll = Math.random() * 100;
    const isWin = roll <= winChance;
  
    // Always deduct the bet amount first
    user[balanceField] -= parsedBet;
    
    // Determine payout
    let payout = 0;
    if (isWin) {
      // If win, add the full payout (bet × multiplier)
      payout = +(parsedBet * parsedMultiplier).toFixed(2);
      user[balanceField] += payout;
    }
  
    await user.save();
  
    // Update session balance
    req.session.user[balanceField] = user[balanceField];

      // Save to bet history
      const betRecord = await BetHistory.create({
        userId: user._id,
        agentId: user.agentId || null,
        agentName: user.agentName || null,
        username: user.username,
        game: 'Limbo',
        currency,
        betAmount: parsedBet,
        payout,
      });
  
      // Emit to WebSocket
      req.app.get('wssBroadcast')({
        type: 'bet',
        username: user.username,
        game: 'Limbo',
        currency,
        betAmount: parsedBet,
        payout,
        timestamp: betRecord.createdAt,
      });
  
    return res.json({
      win: isWin,
      targetMultiplier: parsedMultiplier,
      winChance: +winChance.toFixed(8),
      roll: +roll.toFixed(6),
      betAmount: parsedBet,
      payout,
      newBalance: user[balanceField]
    });
  });
  

module.exports = router;
