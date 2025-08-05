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

// Helper Function for saving Bars bet history
async function saveBarsBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Bars',
      currency,
      betAmount,
      payout
    });

    return betRecord;
  } catch (err) {
    console.error('Error saving Bars bet history:', err);
    return null;
  }
}

// Odds for each mode //
const barsConfig = {
  // Easy Mode //
  easy: {
    chances: [0.35, 0.35, 0.15, 0.08, 0.05, 0.02], // always 6 items
    multipliers: {
      1: [0.40, 0.60, 1.20, 1.50, 3.00, 9.00],
      2: [0.20, 0.30, 0.60, 0.75, 1.50, 4.50],
      3: [0.13, 0.20, 0.40, 0.50, 1.00, 3.00],
      4: [0.10, 0.15, 0.30, 0.38, 0.75, 2.25],
      5: [0.08, 0.12, 0.24, 0.30, 0.60, 1.80],
    }
  },

  // Medium Mode //
  medium: {
    chances: [0.35, 0.35, 0.15, 0.10, 0.03, 0.015, 0.005], // always 7 items
    multipliers: {
      1: [0.30, 0.60, 1.20, 1.40, 3.00, 6.00, 33.00],
      2: [0.15, 0.30, 0.60, 0.70, 1.50, 3.00, 16.50],
      3: [0.10, 0.20, 0.40, 0.47, 1.00, 2.00, 11.00],
      4: [0.08, 0.15, 0.30, 0.35, 0.75, 1.50, 8.25],
      5: [0.06, 0.12, 0.24, 0.28, 0.60, 1.20, 6.60],
    }
  },

  // Hard Mode //
  hard: {
    chances: [0.47, 0.31, 0.12, 0.06, 0.03, 0.008, 0.0018, 0.0002], // always 8 items
    multipliers: {
      1: [0.10, 0.30, 1.20, 2.40, 6.00, 12.00, 75.00, 705.00],
      2: [0.05, 0.15, 0.60, 1.20, 3.00, 6.00, 37.50, 352.50],
      3: [0.03, 0.10, 0.40, 0.80, 2.00, 4.00, 25.00, 235.00],
      4: [0.03, 0.08, 0.30, 0.60, 1.50, 3.00, 18.75, 176.25],
      5: [0.02, 0.06, 0.24, 0.48, 1.20, 2.40, 15.00, 141.00],
    }
  },

  // Expert Mode //
  expert: {
    chances: [0.50, 0.40, 0.06, 0.025, 0.01, 0.004, 0.0008, 0.00015, 0.00005], // sums ~1.0
    multipliers: {
      1: [0.00, 0.20, 1.50, 6.00, 9.00, 30.00, 150.00, 1200.00, 3000.00],
      2: [0.00, 0.10, 0.75, 3.00, 4.50, 15.00, 75.00, 600.00, 1500.00],
      3: [0.00, 0.07, 0.50, 2.00, 3.00, 10.00, 50.00, 400.00, 1000.00],
      4: [0.00, 0.05, 0.38, 1.50, 2.25, 7.50, 37.50, 300.00, 750.00],
      5: [0.00, 0.04, 0.30, 1.20, 1.80, 6.00, 30.00, 240.00, 600.00],
    }
  },
}

// Generate bars layout based on difficulty and selected bars
function generateBarsMultipliers(difficulty, selectedBars) {
  const config = barsConfig[difficulty];
  if (!config) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  const totalBars = 30; // 5x6 grid
  const allBarMultipliers = Array(totalBars).fill(0); // 0 = no win
  
  // Generate random numbers for each bar based on chances
  for (let i = 0; i < totalBars; i++) {
    const random = Math.random();
    let cumulative = 0;
    
    for (let j = 0; j < config.chances.length; j++) {
      cumulative += config.chances[j];
      if (random <= cumulative) {
        // Set the actual multiplier value instead of win level
        allBarMultipliers[i] = config.multipliers[selectedBars.length][j];
        break;
      }
    }
  }
  
  return allBarMultipliers;
}

// Calculate winnings based on selected bars and multipliers
function calculateWinnings(selectedBars, allBarMultipliers, betAmount) {
  let totalMultiplier = 0;
  let winningBars = [];
  
  // Check which selected bars are winners
  selectedBars.forEach(barKey => {
    const [row, col] = barKey.split(',').map(Number);
    const barIndex = row * 5 + col; // Convert to 1D index
    const multiplier = allBarMultipliers[barIndex];
    
    if (multiplier > 0) {
      totalMultiplier += multiplier;
      winningBars.push({
        position: barKey,
        multiplier: multiplier
      });
    }
  });
  
  const winAmount = parseFloat((betAmount * totalMultiplier).toFixed(2));
  
  return {
    winAmount,
    totalMultiplier: parseFloat(totalMultiplier.toFixed(2)),
    winningBars,
    allBarMultipliers
  };
}

// Play route
router.post('/play', async (req, res) => {
  const { betAmount, currency, difficulty, selectedBars } = req.body;
  
  // Validate inputs
  if (!['USD', 'LBP'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }
  
  if (!barsConfig[difficulty]) {
    return res.status(400).json({ error: 'Invalid difficulty' });
  }
  
  if (!Array.isArray(selectedBars) || selectedBars.length < 1 || selectedBars.length > 5) {
    return res.status(400).json({ error: 'Must select between 1 and 5 bars' });
  }
  
  if (betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  
  // Check user balance
  const user = await User.findById(req.session.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
  if (user[balanceField] < betAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Deduct bet
  user[balanceField] -= betAmount;
  await user.save();
  
  // Update session balance
  req.session.user[balanceField] = user[balanceField];
  
  // Generate layout and calculate results
  const layout = generateBarsMultipliers(difficulty, selectedBars);
  const { winAmount, totalMultiplier, winningBars, allBarMultipliers } = calculateWinnings(selectedBars, layout, betAmount);
  
  // Add winnings if any
  if (winAmount > 0) {
    user[balanceField] += winAmount;
    await user.save();
    req.session.user[balanceField] = user[balanceField];
  }
  
  // Save bet history
  const betRecord = await saveBarsBetHistory({
    user,
    betAmount,
    payout: winAmount,
    currency
  });
  
  // Broadcast if websocket is available
  if (betRecord && req.app.get('wssBroadcast')) {
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Bars',
      currency,
      betAmount,
      payout: winAmount,
      timestamp: betRecord.createdAt
    });
  }
  
  return res.json({
    success: true,
    winAmount,
    currency,
    totalMultiplier,
    winningBars,
    allBarMultipliers,
    newBalance: parseFloat(user[balanceField].toFixed(2))
  });
});

module.exports = router;
