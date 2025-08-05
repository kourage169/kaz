const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory'); // NEW

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});


// Helper Function for saving RPS bet history
async function saveRpsBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'RPS',
      currency,
      betAmount,
      payout
    });

    return betRecord; // ⬅️ return it!
  } catch (err) {
    console.error('Error saving RPS bet history:', err);
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


// Multiplier table
 const MULTIPLIERS = [
    1.96,     // 1 win
    3.92,     // 2 wins
    7.84,     // 3 wins
    15.68,    // 4 wins
    31.36,    // 5 wins
    62.72,    // 6 wins
    125.44,   // 7 wins
    250.88,   // 8 wins
    501.76    // 9 wins (max)
];

function getMultiplier(wins) {
    if (wins === 0) return 1.00; // base multiplier before any win
    return MULTIPLIERS[Math.min(wins - 1, MULTIPLIERS.length - 1)];
}
  
// POST /rps/start
router.post('/start', async (req, res) => {
    try {
      const { betAmount, currency } = req.body;
  
      // Validate currency
      if (!['USD', 'LBP'].includes(currency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }
  
      // Validate bet amount
      if (!isValidBet(betAmount, currency)) {
        return res.status(400).json({ error: 'Invalid bet amount for this currency' });
      }
  
      // Fetch user
      const user = await User.findById(req.session.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
  
      // Check balance
      if (user[balanceField] < betAmount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
  
      // Deduct bet
      user[balanceField] -= betAmount;
      await user.save();
      req.session.user[balanceField] = user[balanceField];
  
      // Initialize RPS game state in session
      req.session.rpsGame = {
        active: true,
        betAmount,
        currency,
        winCount: 0,
        tieCount: 0,
        gameOver: false
      };
  
      res.json({
        success: true,
        balance: user[balanceField],
        gameState: {
          currentMultiplier: 1.00,
          winCount: 0,
          maxWins: MULTIPLIERS.length,
          multipliers: MULTIPLIERS
        }
      });
  
    } catch (err) {
      console.error('Error in /rps/start:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

// POST /rps/bet
router.post('/bet', async (req, res) => {
    try {
      const { playerMove } = req.body;
      const game = req.session.rpsGame;
  
      if (!game || !game.active || game.gameOver) {
        return res.status(400).json({ error: 'No active game or game already over' });
      }
  
      const validMoves = ['rock', 'paper', 'scissors'];
      if (!validMoves.includes(playerMove)) {
        return res.status(400).json({ error: 'Invalid move' });
      }
  
          // Randomly choose server move
          const serverMove = validMoves[Math.floor(Math.random() * 3)];
  
      // Determine outcome
      let outcome;
      if (playerMove === serverMove) {
        outcome = 'tie';
        game.tieCount++;
      } else if (
        (playerMove === 'rock' && serverMove === 'scissors') ||
        (playerMove === 'paper' && serverMove === 'rock') ||
        (playerMove === 'scissors' && serverMove === 'paper')
      ) {
        outcome = 'win';
        game.winCount++;
  
        // Max win count reached - automatically apply win
        if (game.winCount >= MULTIPLIERS.length) {
          game.gameOver = true;
          
          // Auto-cashout logic when max wins reached
          const { betAmount, currency, winCount } = game;
          const multiplier = getMultiplier(winCount);
          const winAmount = +(betAmount * multiplier).toFixed(2);
          
          // Get user and update balance
          const user = await User.findById(req.session.user.id);
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
          
          const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
          user[balanceField] += winAmount;
          await user.save();
          
          // Update session balance
          req.session.user[balanceField] = user[balanceField];

          // Save bet history (auto win - using helper function)
const betRecord = await saveRpsBetHistory({
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
    game: 'RPS',
    currency: game.currency,
    betAmount: game.betAmount,
    payout: winAmount,
    timestamp: betRecord.createdAt,
  });
}     
          
          // End game session
          req.session.rpsGame = null;
          
          // Return win info along with regular bet response
          return res.json({
            success: true,
            outcome,
            serverMove,
            winCount: game.winCount,
            tieCount: game.tieCount,
            currentMultiplier: multiplier,
            gameOver: true,
            maxWinReached: true,
            autoWinApplied: true,
            winAmount,
            currency,
            balance: user[balanceField],
            message: `Congratulations! You've reached maximum wins and won ${multiplier.toFixed(2)}x your bet!`
          });
        }
  
      } else {
        outcome = 'lose';
        game.gameOver = true;
      
        // Fetch user to attach full context to the history
        const user = await User.findById(req.session.user.id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
      
// Save bet history (loss - using helper function)
const betRecord = await saveRpsBetHistory({
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
    game: 'RPS',
    currency: game.currency,
    betAmount: game.betAmount,
    payout: 0,
    timestamp: betRecord.createdAt,
  });
}

      
        // Clear game session
        req.session.rpsGame = null;
      }
      
  
      const currentMultiplier = getMultiplier(game.winCount);


      res.json({
        success: true,
        outcome,               // "win", "lose", or "tie"
        serverMove,            // Server's move for UI
        winCount: game.winCount,
        tieCount: game.tieCount,
        currentMultiplier,     // 1.00x (before any win), or increasing
        gameOver: game.gameOver
      });
  
    } catch (err) {
      console.error('Error in /rps/bet:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /cashout
router.post('/cashout', async (req, res) => {
    try {
      const game = req.session.rpsGame;
  
      if (!game || !game.active) {
        return res.status(400).json({ error: 'No active game to cash out' });
      }
      
      // Don't allow cashout if game is over for any reason
      if (game.gameOver) {
        return res.status(400).json({ error: 'Cannot cash out when game is over' });
      }
      
      // Check if player has at least 1 win
      if (game.winCount < 1) {
        return res.status(400).json({ error: 'Need at least 1 win to cash out' });
      }
  
      const { betAmount, currency, winCount } = game;
  
      // Get the multiplier for current wins (winCount)
      const multiplier = getMultiplier(winCount);
  
      // Calculate win amount, round to 2 decimals
      const winAmount = +(betAmount * multiplier).toFixed(2);
  
      const user = await User.findById(req.session.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
  
      // Add win amount to user balance
      user[balanceField] += winAmount;
      await user.save();
  
      // Update session balance
      req.session.user[balanceField] = user[balanceField];

      // Save bet history (cashout - using helper function)
const betRecord = await saveRpsBetHistory({
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
    game: 'RPS',
    currency: game.currency,
    betAmount: game.betAmount,
    payout: winAmount,
    timestamp: betRecord.createdAt,
  });
}

  
      // End game session
      req.session.rpsGame = null;
  
      res.json({
        success: true,
        winAmount,
        currency,  // Explicitly include the currency in the response
        balance: user[balanceField],
        message: `You cashed out with ${multiplier.toFixed(2)}x multiplier!`
      });
  
    } catch (err) {
      console.error('Error in /cashout:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
 
 module.exports = router;
