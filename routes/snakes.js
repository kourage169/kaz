const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});


// Helper Function for saving Snakes bet history
async function saveSnakesBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Snakes',
      currency,
      betAmount,
      payout
    });

    return betRecord; // ⬅️ return it!
  } catch (err) {
    console.error('Error saving Snakes bet history:', err);
    return null;
  }
}


  // Add bet limits at the top with other constants
  const BET_LIMITS = {
    USD: { min: 0.10, max: 1000 },
    LBP: { min: 10000, max: 100000000 }
  };

  const snakesGameTables = {
    easy: {
      board: {
        1: { type: 'start' },
        2: { type: 'multiplier', value: 2 },
        3: { type: 'multiplier', value: 1.30 },
        4: { type: 'multiplier', value: 1.20 },
        5: { type: 'multiplier', value: 1.10 },
        6: { type: 'multiplier', value: 1.01 },
        7: { type: 'snake'  },
        8: { type: 'multiplier', value: 1.01 },
        9: { type: 'multiplier', value: 1.10 },
        10: { type: 'multiplier', value: 1.20 },
        11: { type: 'multiplier', value: 1.30 },
        12: { type: 'multiplier', value: 2  }
      }
    },
  
    medium: {
      board: {
        1: { type: 'start' },
        2: { type: 'multiplier', value: 4 },
        3: { type: 'multiplier', value: 2.50 },
        4: { type: 'multiplier', value: 1.40 },
        5: { type: 'multiplier', value: 1.11 },
        6: { type: 'snake' },
        7: { type: 'snake' },
        8: { type: 'snake' },
        9: { type: 'multiplier', value: 1.11},
        10: { type: 'multiplier', value: 1.40 },
        11: { type: 'multiplier', value: 2.50},
        12: { type: 'multiplier', value: 4.00 }
      }
    },
  
    hard: {
      board: {
        1: { type: 'start' },
        2: { type: 'multiplier', value: 7.50 },
        3: { type: 'multiplier', value: 3 },
        4: { type: 'multiplier', value: 1.38 },
        5: { type: 'snake' },
        6: { type: 'snake' },
        7: { type: 'snake' },
        8: { type: 'snake' },
        9: { type: 'snake' },
        10: { type: 'multiplier', value: 1.38 },
        11: { type: 'multiplier', value: 3 },
        12: { type: 'multiplier', value: 7.50 }
      }
    },
    expert: {
        board: {
          1: { type: 'start' },
          2: { type: 'multiplier', value: 10 },
          3: { type: 'multiplier', value: 4 },
          4: { type:  'snake' },
          5: { type: 'snake' },
          6: { type: 'snake' },
          7: { type: 'snake' },
          8: { type: 'snake' },
          9: { type: 'snake' },
          10: { type: 'snake' },
          11: { type: 'multiplier', value: 4 },
          12: { type: 'multiplier', value: 10 }
        }
      },
      master: {
        board: {
          1: { type: 'start' },
          2: { type: 'multiplier', value: 17.64 },
          3: { type: 'snake' },
          4: { type:  'snake' },
          5: { type: 'snake' },
          6: { type: 'snake' },
          7: { type: 'snake' },
          8: { type: 'snake' },
          9: { type: 'snake' },
          10: { type: 'snake' },
          11: { type: 'snake' },
          12: { type: 'multiplier', value: 17.64 }
        }
      }
  };

  // Helper to validate bet
function isValidBet(bet, currency) {
    if (!BET_LIMITS[currency]) return false;
    return bet >= BET_LIMITS[currency].min && bet <= BET_LIMITS[currency].max;
  }
   
 //roll dice function
 function rollDice() {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    return { total: die1 + die2, roll: [die1, die2] };
  }


  // POST /start
router.post('/start', async (req, res) => {
    try {
      const { betAmount, currency, difficulty = 'easy' } = req.body;
  
      if (!['USD', 'LBP'].includes(currency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }
      if (!isValidBet(betAmount, currency)) {
        return res.status(400).json({ error: 'Invalid bet amount for this currency' });
      }
      if (!snakesGameTables[difficulty]) {
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
      
      // Update session balance
      req.session.user[balanceField] = user[balanceField];
  
      // Initialize snakes game session state
      req.session.snakesGame = {
        active: true,
        betAmount,
        currency,
        difficulty,
        position: 1,           // Start at tile 1 (the starting tile)
        multiplier: 1.0,       // Initial multiplier
        rolls: [],             // Empty roll history
        board: snakesGameTables[difficulty].board
      };
  
      res.json({
        success: true,
        balance: user[balanceField],
        currency: currency,
        gameState: req.session.snakesGame
      });
  
    } catch (err) {
      console.error('Error in /start:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  
// POST /roll
router.post('/roll', async (req, res) => {
    try {
      const game = req.session.snakesGame;
      if (!game || !game.active) {
        return res.status(400).json({ error: 'No active game or game is over' });
      }
  
      const { difficulty, betAmount, currency } = game;
      const board = snakesGameTables[difficulty].board;
  
      // Roll dice
      const { total, roll: [dice1, dice2] } = rollDice();
  
      // Calculate new position starting from current position
      let newPosition = total;
  
      // Cap position to max tile (12)
      if (newPosition > 12) newPosition = 12;
  
      const tile = board[newPosition];
      if (!tile) {
        return res.status(500).json({ error: 'Invalid tile position calculated' });
      }
  
      // If snake tile hit, game ends immediately with loss
      if (tile.type === 'snake') {
        game.active = false;


        // Fetch user to attach full context to the history
        const user = await User.findById(req.session.user.id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

// Save bet history (loss - using helper function)
const betRecord = await saveSnakesBetHistory({
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
    game: 'Snakes',
    currency: game.currency,
    betAmount: game.betAmount,
    payout: 0,
    timestamp: betRecord.createdAt,
  });
}        

        // Clear game session on game end
        delete req.session.snakesGame;
  
        return res.json({
          success: true,
          position: newPosition,
          multiplier: game.multiplier,
          isAlive: false,
          rolls: game.rolls,
          finalWin: 0,
          dice1,
          dice2
        });
      }
  
      // If multiplier tile, update multiplier
      if (tile.type === 'multiplier') {
        game.multiplier *= tile.value;
        game.multiplier = Math.round(game.multiplier * 100) / 100;
      }
  
      // Update position and store roll
      game.position = newPosition;
      game.rolls.push([dice1, dice2]);
  
      // If max rolls reached and player still alive => end game with win
      if (game.rolls.length >= 5 && game.active) {
        game.active = false;
  
        const finalWin = Math.round(betAmount * game.multiplier * 100) / 100;
        
        // Update user balance
        const user = await User.findById(req.session.user.id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
        user[balanceField] += finalWin;
        await user.save();
        
        // Update session balance
        req.session.user[balanceField] = user[balanceField];


        // Save bet history (auto win - using helper function)
const betRecord = await saveSnakesBetHistory({
  user,
  betAmount: game.betAmount,
  payout: finalWin,
  currency: game.currency
});

// Emit to WebSocket (auto win)
if (betRecord && req.app.get('wssBroadcast')) {
  req.app.get('wssBroadcast')({
    type: 'bet',
    username: user.username,
    game: 'Snakes',
    currency: game.currency,
    betAmount: game.betAmount,
    payout: finalWin,
    timestamp: betRecord.createdAt,
  });
}

  
        // Clear game session on game end
        delete req.session.snakesGame;
  
        return res.json({
          success: true,
          position: newPosition,
          multiplier: game.multiplier,
          isAlive: false,
          rolls: game.rolls,
          finalWin,
          balance: user[balanceField],
          currency: currency,
          dice1,
          dice2
        });
      }
  
      // Save game state and continue
      req.session.snakesGame = game;
  
      return res.json({
        success: true,
        position: newPosition,
        multiplier: game.multiplier,
        isAlive: true,
        rolls: game.rolls,
        dice1,
        dice2
      });
  
    } catch (err) {
      console.error('Error in /roll:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // POST /cashout
router.post('/cashout', async (req, res) => {
    try {
      const game = req.session.snakesGame;
      if (!game || !game.active) {
        return res.status(400).json({ error: 'No active game or game is over' });
      }
  
      // Calculate win amount
      const winAmount = Math.round(game.betAmount * game.multiplier * 100) / 100;
  
      // Update user balance
      const user = await User.findById(req.session.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      user[balanceField] += winAmount;
      await user.save();
  
      // Update session balance
      req.session.user[balanceField] = user[balanceField];

      // Save bet history (cashout - using helper function)
const betRecord = await saveSnakesBetHistory({
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
    game: 'Snakes',
    currency: game.currency,
    betAmount: game.betAmount,
    payout: winAmount,
    timestamp: betRecord.createdAt,
  });
}

  
      // Clear game session
      delete req.session.snakesGame;
  
      return res.json({
        success: true,
        winAmount,
        balance: user[balanceField],
        currency: game.currency
      });
  
    } catch (err) {
      console.error('Error in /cashout:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
  
module.exports = router;
