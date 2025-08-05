// routes/dicejs
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Diamonds type
const diamondsColor = ['red', 'green', 'dark_blue', 'light_blue', 'purple', 'yellow', 'pink' ];


// Payout table
diamondsPayoutTable = {
    "5": 50.00,     // five pair
    "4": 5.00,     // four of a kind
    "3-2": 4.00,     // three of a kind
    "3": 3.00,     // three of a kind
    "2-2": 2.00,   // two pairs
    "2": 1.10,     // one pair
  };

  // Helper to generate a spin result
function generateDiamondsResult() {
    const result = [];
    for (let i = 0; i < 5; i++) {
      const randomColor = diamondsColor[Math.floor(Math.random() * diamondsColor.length)];
      result.push(randomColor);
    }
    return result;
  }
  
  // Helper to evaluate the result
  function evaluateDiamondsWin(result) {
    const countMap = {};

    // Count occurrences of each color
    result.forEach(color => {
        countMap[color] = (countMap[color] || 0) + 1;
    });

    // Get counts and sort them in descending order
    const counts = Object.values(countMap).sort((a, b) => b - a);
    
    // Pad with zeros to always have 5 elements (makes pattern matching easier)
    while (counts.length < 5) counts.push(0);
    
    // Create the key for pattern matching
    const key = counts.filter(count => count > 1).join('-') || '1'; // Use '1' if no pairs found

    console.log('Win evaluation:', { // Debug log
        result,
        countMap,
        counts,
        key,
        multiplier: diamondsPayoutTable[key] || 0
    });

    return diamondsPayoutTable[key] || 0;
  }

  router.post('/play', async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { amount, currency } = req.body;
  
      // Validate currency
      if (!['USD', 'LBP'].includes(currency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }
  
      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Invalid bet amount' });
      }
  
      // Get user
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      if (user[balanceField] < parsedAmount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
  
      // Deduct the bet
      user[balanceField] -= parsedAmount;
  
      // Generate result using the helper function
      const result = generateDiamondsResult();
  
      // Evaluate win using the helper function
      const multiplier = evaluateDiamondsWin(result);
      const winAmount = parseFloat((parsedAmount * multiplier).toFixed(2));
  
      // Add win to balance
      if (winAmount > 0) {
        user[balanceField] += winAmount;
      }
  
      await user.save();
  
      // Sync session balances
      req.session.user.balanceUSD = user.balanceUSD;
      req.session.user.balanceLBP = user.balanceLBP;

       // ─── Save to Bet History ───────────────────────────────
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Diamonds',
      currency,
      betAmount: parsedAmount,
      payout: winAmount,
    });

    // ─── Broadcast to WebSocket clients ─────────────────────
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Diamonds',
      currency,
      betAmount: parsedAmount,
      payout: winAmount,
      timestamp: betRecord.createdAt,
    });
  
      return res.json({
        success: true,
        result,             // Array of 5 colors
        multiplier,         // Payout multiplier
        winAmount,          // Total won
        newBalanceUSD: user.balanceUSD,
        newBalanceLBP: user.balanceLBP
      });
  
    } catch (err) {
      console.error('Diamonds play error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });
  
  

module.exports = router;
