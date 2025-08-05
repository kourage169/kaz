// routes/cases.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// win chance
const rewardPools = {
  easy: [
    { color: 'gray',   multiplier: 0.1, chance: 41 },
    { color: 'lightBlue',   multiplier: 0.4, chance: 35 },
    { color: 'blue',   multiplier: 1.09, chance: 10 },
    { color: 'red',   multiplier: 2, chance: 7 },
    { color: 'green',  multiplier: 3, chance: 4 },
    { color: 'purple', multiplier: 10,   chance: 2 },
    { color: 'gold', multiplier: 23,  chance: 1 }
  ],
  medium: [
    { color: 'gray',   multiplier: 0, chance: 30 },
    { color: 'lightBlue',   multiplier: 0.2, chance: 27 },
    { color: 'lightBlue',   multiplier: 0.4, chance: 18 },
    { color: 'blue',   multiplier: 1.5, chance: 13 },
    { color: 'blue',   multiplier: 2, chance: 6 },
    { color: 'red',   multiplier: 3.5, chance: 3 },
    { color: 'red',   multiplier: 7.5, chance: 1.5 },
    { color: 'green',  multiplier: 10, chance: 0.85 },
    { color: 'green',  multiplier: 15, chance: 0.4 },
    { color: 'purple', multiplier: 41,   chance: 0.15 },
    { color: 'gold', multiplier: 115,  chance: 0.1 }
  ],
  hard: [
    { color: 'gray',   multiplier: 0, chance: 35 },
    { color: 'lightBlue',   multiplier: 0.2, chance: 25 },
    { color: 'lightBlue',   multiplier: 0.4, chance: 12 },
    { color: 'lightBlue',   multiplier: 0.8, chance: 10 },
    { color: 'blue',   multiplier: 1.5, chance: 10 },
    { color: 'blue',   multiplier: 3, chance: 5 },
    { color: 'blue',   multiplier: 8, chance: 2 },
    { color: 'red',   multiplier: 10, chance: 0.4 },
    { color: 'red',   multiplier: 15, chance: 0.3 },
    { color: 'green',  multiplier: 35, chance: 0.2 },
    { color: 'green',  multiplier: 50, chance: 0.04 },
    { color: 'purple', multiplier: 100,   chance: 0.03 },
    { color: 'purple', multiplier: 250,   chance: 0.015 },
    { color: 'gold', multiplier: 495,  chance: 0.01 },
    { color: 'gold', multiplier: 1000,  chance: 0.005 }
  ]
};

// Helper function to select a reward based on the difficulty and chances
function selectReward(difficulty) {
  const pool = rewardPools[difficulty] || rewardPools.medium;
  
  // Calculate total chance
  const totalChance = pool.reduce((sum, item) => sum + item.chance, 0);
  
  // Generate a random number between 0 and totalChance
  let random = Math.random() * totalChance;
  
  // Find the selected item
  for (const item of pool) {
    random -= item.chance;
    if (random <= 0) {
      return item;
    }
  }
  
  // Fallback to the last item (should rarely happen)
  return pool[pool.length - 1];
}

// Generate cases for the game
function generateCases(numCases, difficulty) {
  const cases = [];
  
  // Generate random cases for display
  for (let i = 0; i < numCases; i++) {
    // For display cases, randomly select from all possible colors
    const allColors = ['gray', 'lightBlue', 'blue', 'red', 'green', 'purple', 'gold'];
    const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
    
    cases.push({
      type: randomColor.toLowerCase().replace('lightblue', 'light_blue'), // Match frontend naming
      value: 0, // Default value, will be updated for winning case
      isWinner: false
    });
  }
  
  // Select the winning case and its reward
  const winningIndex = Math.floor(Math.random() * numCases);
  const reward = selectReward(difficulty);
  
  // Update the winning case
  cases[winningIndex] = {
    type: reward.color.toLowerCase().replace('lightblue', 'light_blue'), // Match frontend naming
    value: reward.multiplier,
    isWinner: true
  };
  
  return {
    cases,
    winningIndex
  };
}

// Route to play the game
router.post('/play', async (req, res) => {
  try {
    const { betAmount, currency, difficulty } = req.body;
    
    // Validate inputs
    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    
    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }
    
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty' });
    }
    
    // Get user
    const user = await User.findById(req.session.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has enough balance
    const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    if (user[balanceField] < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Generate game result
    const numCases = 60; // Total number of cases to generate
    const gameResult = generateCases(numCases, difficulty);
    
    // Calculate winnings
    const winningCase = gameResult.cases[gameResult.winningIndex];
    const winAmount = betAmount * winningCase.value;
    
    // Update user balance
    user[balanceField] -= betAmount;
    if (winAmount > 0) {
      user[balanceField] += winAmount;
    }
    
    await user.save();
    
    // Update session balance
    req.session.user[balanceField] = user[balanceField];

       // ─── Save to Bet History ───────────────────────────────
       const betRecord = await BetHistory.create({
        userId: user._id,
        agentId: user.agentId || null,
        agentName: user.agentName || null,
        username: user.username,
        game: 'Cases',
        currency,
        betAmount,
        payout: winAmount,
      });
  
      // ─── Broadcast to WebSocket clients ─────────────────────
      req.app.get('wssBroadcast')({
        type: 'bet',
        username: user.username,
        game: 'Cases',
        currency,
        betAmount,
        payout: winAmount,
        timestamp: betRecord.createdAt,
      });
    
    // Return result to client
    res.json({
      success: true,
      cases: gameResult.cases,
      winningIndex: gameResult.winningIndex,
      winAmount,
      newBalance: user[balanceField],
      currency
    });
    
  } catch (error) {
    console.error('Error in cases game:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
