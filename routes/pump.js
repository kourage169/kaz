const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory'); // NEW

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Helper Function for saving Pump bet history
async function savePumpBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Pump',
      currency,
      betAmount,
      payout
    });

    return betRecord; // ⬅️ return it!
  } catch (err) {
    console.error('Error saving Pump bet history:', err);
    return null; // Optional: return null so you can check for failure
  }
}

const pumpTables = {
  easy: [
    { multiplier: 1.00, survival: 100.00 }, // starting multiplier always safe
    { multiplier: 1.02, survival: 96.00 },
    { multiplier: 1.07, survival: 92.00 },
    { multiplier: 1.11, survival: 88.00 },
    { multiplier: 1.17, survival: 84.00 },
    { multiplier: 1.24, survival: 80.00 },
    { multiplier: 1.32, survival: 76.00 },
    { multiplier: 1.41, survival: 72.00 },
    { multiplier: 1.51, survival: 68.00 },
    { multiplier: 1.62, survival: 64.00 },
    { multiplier: 1.74, survival: 60.00 },
    { multiplier: 1.87, survival: 56.00 },
    { multiplier: 2.01, survival: 52.00 },
    { multiplier: 2.16, survival: 48.00 },
    { multiplier: 2.32, survival: 44.00 },
    { multiplier: 2.49, survival: 40.00 },
    { multiplier: 2.67, survival: 36.00 },
    { multiplier: 2.86, survival: 32.00 },
    { multiplier: 3.06, survival: 28.00 },
    { multiplier: 3.27, survival: 24.00 },
    { multiplier: 3.49, survival: 20.00 },
    { multiplier: 3.72, survival: 16.00 },
    { multiplier: 3.96, survival: 12.00 },
    { multiplier: 4.21, survival: 8.00 },
    { multiplier: 24.50, survival: 4.00 }
  ],
  
    medium: [
        { multiplier: 1.00, survival: 100.00 }, // starting multiplier always safe
        { multiplier: 1.11, survival: 88.00 },
        { multiplier: 1.27, survival: 77.00 },
        { multiplier: 1.46, survival: 66.956522 },
        { multiplier: 1.69, survival: 57.826087 },
        { multiplier: 1.98, survival: 49.565217 },
        { multiplier: 2.33, survival: 42.130435 },
        { multiplier: 2.76, survival: 35.478261 },
        { multiplier: 3.31, survival: 29.565217 },
        { multiplier: 4.03, survival: 24.347826 },
        { multiplier: 4.95, survival: 19.782609 },
        { multiplier: 6.19, survival: 15.826087 },
        { multiplier: 7.88, survival: 12.434783 },
        { multiplier: 10.25, survival: 9.565217 },
        { multiplier: 13.66, survival: 7.173913 },
        { multiplier: 18.78, survival: 5.217391 },
        { multiplier: 26.83, survival: 3.652174 },
        { multiplier: 40.25, survival: 2.434783 },
        { multiplier: 64.40, survival: 1.521739 },
        { multiplier: 112.70, survival: 0.869565 },
        { multiplier: 225.40, survival: 0.434783 },
        { multiplier: 536.50, survival: 0.173913 },
        { multiplier: 1073.00, survival: 0.043478}
    ],
    hard: []
};

// Generate pump results based on difficulty
function generatePumpResults(difficulty) {
  const table = pumpTables[difficulty];
  if (!table) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  let popThreshold = table.length; // default: survives all steps
  for (let i = 1; i < table.length; i++) {
    const survivalChance = table[i].survival;
    const roll = Math.random() * 100;
    if (roll > survivalChance) {
      popThreshold = i;
      break;
    }
  }

  return {
    popThreshold,
    multipliers: table.map(entry => entry.multiplier)
  };
}


// Start route - deduct bet and generate results
router.post('/start', async (req, res) => {
  const { betAmount, difficulty, currency } = req.body;
  
  if (!['USD', 'LBP'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }
  
  if (!['easy', 'medium'].includes(difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty' });
  }
  
  if (betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  const user = await User.findById(req.session.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
  if (user[balanceField] < betAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Deduct the bet
  user[balanceField] -= betAmount;
  await user.save();
  
  // Update session balance
  req.session.user[balanceField] = user[balanceField];

  // Generate pump results
  const results = generatePumpResults(difficulty);

  req.session.pumpGame = {
    active: true,
    difficulty,
    popThreshold: results.popThreshold,
    multipliers: results.multipliers,
    currentPump: 1, // Start at 1 (first safe step)
    betAmount,
    currency
  };

  return res.json({ 
    success: true, 
    newBalance: user[balanceField],
    currency
  });
});

// Pump route - reveal result of each pump 
router.post('/pump', async (req, res) => {
  const game = req.session.pumpGame;

  if (!game || !game.active) {
    return res.status(400).json({ error: 'Invalid game state' });
  }

  game.currentPump++;
  
  // Check if balloon pops
  if (game.currentPump > game.popThreshold) {
    game.active = false;
    
    // Fetch user to attach full context to the history
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Save bet history (loss - using helper function)
    const betRecord = await savePumpBetHistory({
      user,
      betAmount: game.betAmount,
      payout: 0, // zero for loss
      currency: game.currency
    });

    // Emit to WebSocket (loss)
    if (betRecord && req.app.get('wssBroadcast')) {
      req.app.get('wssBroadcast')({
        type: 'bet',
        username: user.username,
        game: 'Pump',
        currency: game.currency,
        betAmount: game.betAmount,
        payout: 0,
        timestamp: betRecord.createdAt,
      });
    }
    
    return res.json({ 
      popped: true,
      pumpCount: game.currentPump - 1, // Subtract 1 to show actual pump count
      multiplier: game.multipliers[game.popThreshold - 1] // Use popThreshold - 1 for correct multiplier
    });
  }

  // Check if reached max multiplier (auto-win)
  if (game.currentPump === game.multipliers.length) {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const winAmount = parseFloat((game.betAmount * game.multipliers[game.currentPump - 1]).toFixed(2));
    const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    
    user[balanceField] += winAmount;
    await user.save();
    
    // Update session balance
    req.session.user[balanceField] = user[balanceField];
    game.active = false;

    // Save bet history (auto win - using helper function)
    const betRecord = await savePumpBetHistory({
      user,
      betAmount: game.betAmount,
      payout: winAmount,
      currency: game.currency
    });

    // Emit to WebSocket (auto win)
    if (betRecord && req.app.get('wssBroadcast')) {
      req.app.get('wssBroadcast')({
        type: 'bet',
        username: user.username,
        game: 'Pump',
        currency: game.currency,
        betAmount: game.betAmount,
        payout: winAmount,
        timestamp: betRecord.createdAt,
      });
    }

    return res.json({
      popped: false,
      pumpCount: game.currentPump - 1, // Subtract 1 to show actual pump count
      multiplier: game.multipliers[game.currentPump - 1],
      autoWin: true,
      winAmount,
      newBalance: user[balanceField],
      currency: game.currency
    });
  }

  return res.json({
    popped: false,
    pumpCount: game.currentPump - 1, // Subtract 1 to show actual pump count
    multiplier: game.multipliers[game.currentPump - 1]
  });
});

// Cashout route - end game early and cashout
router.post('/cashout', async (req, res) => {
  const game = req.session.pumpGame;

  if (!game || !game.active) {
    return res.status(400).json({ error: 'Invalid game state' });
  }

  const user = await User.findById(req.session.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const currentMultiplier = game.multipliers[game.currentPump - 1];
  const winAmount = parseFloat((game.betAmount * currentMultiplier).toFixed(2));
  const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

  user[balanceField] += winAmount;
  await user.save();
  
  // Update session balance
  req.session.user[balanceField] = user[balanceField];
  game.active = false;

  // Save bet history (cashout - using helper function)
  const betRecord = await savePumpBetHistory({
    user,
    betAmount: game.betAmount,
    payout: winAmount,
    currency: game.currency
  });

  // Emit to WebSocket (cashout)
  if (betRecord && req.app.get('wssBroadcast')) {
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Pump',
      currency: game.currency,
      betAmount: game.betAmount,
      payout: winAmount,
      timestamp: betRecord.createdAt,
    });
  }

  return res.json({
    success: true,
    winAmount,
    newBalance: user[balanceField],
    currency: game.currency,
    multiplier: currentMultiplier,
    pumpCount: game.currentPump - 1 // Subtract 1 to show actual pump count
  });
});

module.exports = router;