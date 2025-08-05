const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory'); // NEW

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});



// Helper Function for saving Tower bet history
async function saveTowerBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Tower',
      currency,
      betAmount,
      payout
    });

    return betRecord; // ⬅️ return it!
  } catch (err) {
    console.error('Error saving Tower bet history:', err);
    return null; // Optional: return null so you can check for failure
  }
}


  // Add bet limits at the top with other constants
  const BET_LIMITS = {
    USD: { min: 0.10, max: 1000 },
    LBP: { min: 10000, max: 100000000 }
  };

  // Helper to validate bet amounts
  function isValidBet(bet, currency) {
  if (!BET_LIMITS[currency]) return false;
  return bet >= BET_LIMITS[currency].min && bet <= BET_LIMITS[currency].max;
 }

  const towerConfig = {
    easy: {
      columns: 4,
      bombsPerRow: 1,
      multipliers: [1.31, 1.75, 2.33, 3.11, 4.14, 5.52, 7.36, 9.81, 13.09]
    },
    medium: {
      columns: 3,
      bombsPerRow: 1,
      multipliers: [1.47, 2.08, 2.88, 3.98, 5.49, 7.58, 10.47, 14.46, 26.18]
    },
    hard: {
      columns: 2,
      bombsPerRow: 1,
      multipliers: [1.96, 2.77, 3.91, 5.53, 7.81, 11.02, 15.56, 21.98, 52.36]
    },
    expert: {
      columns: 3,
      bombsPerRow: 2,
      multipliers: [2.94, 4.16, 5.88, 8.31, 11.74, 16.58, 23.41, 33.06, 104.72]
    },
    master: {
      columns: 4,
      bombsPerRow: 3,
      multipliers: [3.92, 5.56, 7.86, 11.10, 15.68, 22.13, 31.23, 44.08, 209.44]
    }
  };

  // Function to get a randomized tower layout
  const getTowerLayout = (difficulty) => {
    const { columns, bombsPerRow, multipliers } = towerConfig[difficulty];
    const rows = 9;
    const layout = [];
  
    // Generate rows from bottom (index 0) to top
    for (let r = 0; r < rows; r++) {
      const row = {
        tiles: Array(columns).fill('diamond'),
        multiplier: multipliers[r] // Multiplier increases as we go up
      };
  
      // Randomly place bombs
      const bombIndices = [];
      while (bombIndices.length < bombsPerRow) {
        const idx = Math.floor(Math.random() * columns);
        if (!bombIndices.includes(idx)) bombIndices.push(idx);
      }
  
      for (const i of bombIndices) {
        row.tiles[i] = 'bomb';
      }
  
      // Add row to layout from bottom (index 0) to top
      // Use push instead of unshift to maintain visual order
      layout.push(row);
    }
  
    return layout;
  };
  

  // POST /tower/start
  router.post('/start', async (req, res) => {
    try {
      const { betAmount, currency, difficulty = 'easy' } = req.body;
  
      if (!['USD', 'LBP'].includes(currency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }
  
      if (!isValidBet(betAmount, currency)) {
        return res.status(400).json({ error: 'Invalid bet amount for this currency' });
      }
  
      if (!towerConfig[difficulty]) {
        return res.status(400).json({ error: 'Invalid difficulty' });
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
      req.session.user[balanceField] = user[balanceField];
  
      // Create randomized layout
      const layout = getTowerLayout(difficulty);
  
      // Save game state in session
      req.session.towerGame = {
        active: true,
        betAmount,
        currency,
        difficulty,
        currentStep: 0, // Start at bottom row (index 0)
        config: towerConfig[difficulty],
        layout,
        chosenPath: []
      };
  
      // Starting multiplier is 1.00 (before any steps)
      const startingMultiplier = 1.00;
  
      res.json({
        success: true,
        balance: user[balanceField],
        layoutPreview: layout.map(row => row.tiles.map(() => '?')), // hide bombs for frontend
        gameState: {
          currentStep: 0,
          multipliers: towerConfig[difficulty].multipliers,
          columns: towerConfig[difficulty].columns,
          currentMultiplier: startingMultiplier // Start at 1.00x
        }
      });
  
    } catch (err) {
      console.error('Error in /tower/start:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

// step route
router.post('/step', async (req, res) => {
  try {
    const { columnIndex, stepIndex } = req.body;

    const game = req.session.towerGame;
    if (!game || !game.active) {
      return res.status(400).json({ error: 'No active game found' });
    }

    const { layout, currentStep, config, chosenPath } = game;
    const { columns } = config;

    // Enforce valid move
    if (
      typeof columnIndex !== 'number' ||
      columnIndex < 0 || columnIndex >= columns ||
      typeof stepIndex !== 'number' ||
      stepIndex !== currentStep
    ) {
      return res.status(400).json({ error: 'Invalid move: wrong step or column index' });
    }

    // Already finished
    if (currentStep >= layout.length) {
      return res.status(400).json({ error: 'Game already completed' });
    }

    const currentRow = layout[currentStep];
    const tile = currentRow.tiles[columnIndex];

    // Bomb: end game and reveal layout
    if (tile === 'bomb') {

      // Fetch user from DB (needed for bet history)
const user = await User.findById(req.session.user.id);
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}

// Save bet history (loss)
const betRecord = await saveTowerBetHistory({
  user,
  betAmount: game.betAmount,
  payout: 0,
  currency: game.currency
});

// Emit to WebSocket (loss)
if (betRecord && req.app.get('wssBroadcast')) {
  req.app.get('wssBroadcast')({
    type: 'bet',
    username: user.username,
    game: 'Tower',
    currency: game.currency,
    betAmount: game.betAmount,
    payout: 0,
    timestamp: betRecord.createdAt,
  });
}       


      req.session.towerGame = null;

      return res.json({
        success: true,
        result: 'bomb',
        message: 'You hit a bomb! Game over.',
        gameOver: true,
        revealedLayout: layout.map(row => row.tiles),
        chosenColumn: columnIndex
      });
    }

    game.currentStep += 1;
    game.chosenPath.push(columnIndex);

    const gameOver = game.currentStep === layout.length;
    let currentMultiplier;
    let finalPayout = null;
    let updatedBalance;

    if (gameOver) {
      // Use the last row's multiplier for max win
      currentMultiplier = layout[layout.length - 1].multiplier;
      finalPayout = +(game.betAmount * currentMultiplier).toFixed(2);
      // Fetch user from DB (needed for bet history and balance update)
      const user = await User.findById(req.session.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      user[balanceField] += finalPayout;
      await user.save();
      req.session.user[balanceField] = user[balanceField];
      updatedBalance = user[balanceField];
      
      // Save bet history (auto win)
      const betRecord = await saveTowerBetHistory({
        user,
        betAmount: game.betAmount,
        payout: finalPayout,
        currency: game.currency
      });
      // Emit to WebSocket (auto win)
      if (betRecord && req.app.get('wssBroadcast')) {
        req.app.get('wssBroadcast')({
          type: 'bet',
          username: user.username,
          game: 'Tower',
          currency: game.currency,
          betAmount: game.betAmount,
          payout: finalPayout,
          timestamp: betRecord.createdAt,
        });
      }
      // Clear session
      req.session.towerGame = null;
    } else {
      // Use the current row's multiplier for a normal step
      currentMultiplier = currentRow.multiplier;
    }

    res.json({
      success: true,
      result: gameOver ? 'win' : 'safe',
      message: gameOver ? 'You completed the tower!' : 'Safe step!',
      step: game.currentStep,
      multiplier: currentMultiplier, // Always send the correct multiplier
      gameOver,
      chosenColumn: columnIndex,
      payout: gameOver ? finalPayout : null,
      balance: gameOver ? updatedBalance : undefined // Use the stored balance value
    });

  } catch (err) {
    console.error('Error in /tower/step:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

  
  // POST /cashout
  router.post('/cashout', async (req, res) => {
    try {
      const game = req.session.towerGame;
  
      if (!game || !game.active) {
        return res.status(400).json({ error: 'No active game to cash out' });
      }
  
      const { betAmount, currency, difficulty, currentStep, layout } = game;
      
      // Prevent cashout before taking any steps
      if (currentStep === 0) {
        return res.status(400).json({ error: 'Cannot cash out before taking at least one step' });
      }
      
      const config = towerConfig[difficulty];
      const multiplier = config.multipliers[currentStep - 1];
  
      const winAmount = +(betAmount * multiplier).toFixed(2);
  
      const user = await User.findById(req.session.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      user[balanceField] += winAmount;
      await user.save();
  
      req.session.user[balanceField] = user[balanceField];
  
    // Save bet history (cashout win)
const betRecord = await saveTowerBetHistory({
  user,
  betAmount: game.betAmount,
  payout: winAmount,
  currency: game.currency
});

// Emit to WebSocket (cashout win)
if (betRecord && req.app.get('wssBroadcast')) {
  req.app.get('wssBroadcast')({
    type: 'bet',
    username: user.username,
    game: 'Tower',
    currency: game.currency,
    betAmount: game.betAmount,
    payout: winAmount,
    timestamp: betRecord.createdAt,
  });
}   
  
      // End game session
      req.session.towerGame = null;
  
      // Respond with win + full board
      res.json({
        success: true,
        winAmount,
        balance: user[balanceField],
        revealedLayout: layout
      });
  
    } catch (err) {
      console.error('Error in /cashout:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

  module.exports = router;
