const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

const coinflipPayouts = {
  1: 1.96,       // 2 x 0.98
  2: 3.92,       // 4 x 0.98
  3: 7.84,       // 8 x 0.98
  4: 15.68,      // 16 x 0.98
  5: 31.36,      // 32 x 0.98
  6: 62.72,      // 64 x 0.98
  7: 125.44,     // 128 x 0.98
  8: 250.88,     // 256 x 0.98
  9: 501.76,     // 512 x 0.98
  10: 1003.52    // 1024 x 0.98
};

// Helper Function for saving Flip bet history
async function saveFlipBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Flip',
      currency,
      betAmount,
      payout
    });

    return betRecord;
  } catch (err) {
    console.error('Error saving Flip bet history:', err);
    return null;
  }
}

// Route: Start Flip game (session only)
router.post('/start', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { betAmount, currency } = req.body;

    if (!betAmount || betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

    const user = await User.findById(userId);
    if (!user || user[balanceField] < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct bet
    user[balanceField] -= betAmount;
    await user.save();
    req.session.user[balanceField] = user[balanceField];

    // Initialize empty game state
    req.session.flipGame = {
      betAmount,
      currency,
      currentMultiplier: 1,
      flips: [],
      status: 'in_progress'
    };

    res.json({
      message: 'Flip game started',
      balance: user[balanceField]
    });
  } catch (err) {
    console.error('Flip start error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route: Make a flip (heads/tails)
router.post('/flip', async (req, res) => {
  try {
    const game = req.session.flipGame;

    if (!game || game.status !== 'in_progress') {
      return res.status(400).json({ error: 'No active game' });
    }

    const { choice } = req.body;

    if (!['heads', 'tails'].includes(choice)) {
      return res.status(400).json({ error: 'Invalid choice' });
    }

    // Generate random result (50/50 chance)
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = choice === result;

    if (won) {
      // Update multiplier for next flip
      const nextFlipNumber = game.flips.length + 2; // +2 because we're about to add this flip
      
      if (nextFlipNumber <= 10) {
        game.currentMultiplier = coinflipPayouts[nextFlipNumber - 1];
      }

      game.flips.push({
        choice,
        result,
        won: true,
        flipNumber: game.flips.length + 1
      });

      // Check if reached max win (10 flips)
      if (game.flips.length === 10) {
        game.status = 'max_win';
        const winAmount = +(game.betAmount * game.currentMultiplier).toFixed(2);
        const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

        const user = await User.findById(req.session.user.id);
        if (user) {
          user[balanceField] += winAmount;
          await user.save();
          req.session.user[balanceField] = user[balanceField];

          // Save bet history
          const betRecord = await saveFlipBetHistory({
            user,
            betAmount: game.betAmount,
            payout: winAmount,
            currency: game.currency
          });

          // Emit WebSocket event
          if (betRecord && req.app.get('wssBroadcast')) {
            req.app.get('wssBroadcast')({
              type: 'bet',
              username: user.username,
              game: 'Flip',
              currency: game.currency,
              betAmount: game.betAmount,
              payout: winAmount,
              timestamp: betRecord.createdAt
            });
          }
        }

        res.json({
          won: true,
          result,
          maxWin: true,
          winAmount,
          balance: user[balanceField],
          newBalance: user[balanceField],
          currency: game.currency,
          flips: game.flips,
          currentMultiplier: game.currentMultiplier
        });
      } else {
        res.json({
          won: true,
          result,
          flips: game.flips,
          currentMultiplier: game.currentMultiplier,
          nextMultiplier: coinflipPayouts[nextFlipNumber - 1]
        });
      }
    } else {
      game.flips.push({
        choice,
        result,
        won: false,
        flipNumber: game.flips.length + 1
      });

      game.status = 'lost';

      const user = await User.findById(req.session.user.id);
      if (user) {
        const betRecord = await saveFlipBetHistory({
          user,
          betAmount: game.betAmount,
          payout: 0,
          currency: game.currency
        });

        if (betRecord && req.app.get('wssBroadcast')) {
          req.app.get('wssBroadcast')({
            type: 'bet',
            username: user.username,
            game: 'Flip',
            currency: game.currency,
            betAmount: game.betAmount,
            payout: 0,
            timestamp: betRecord.createdAt
          });
        }
      }

      res.json({
        won: false,
        result,
        flips: game.flips
      });
    }
  } catch (err) {
    console.error('Flip error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route: Cash out early
router.post('/cashout', async (req, res) => {
  try {
    const game = req.session.flipGame;

    if (!game || game.status !== 'in_progress') {
      return res.status(400).json({ error: 'No active game to cash out' });
    }

    if (game.flips.length === 0) {
      return res.status(400).json({ error: 'No flips made yet' });
    }

    const winAmount = +(game.betAmount * game.currentMultiplier).toFixed(2);
    const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    user[balanceField] += winAmount;
    await user.save();
    req.session.user[balanceField] = user[balanceField];

    game.status = 'cashed_out';

    // Save bet history
    const betRecord = await saveFlipBetHistory({
      user,
      betAmount: game.betAmount,
      payout: winAmount,
      currency: game.currency
    });

    // Emit WebSocket event
    if (betRecord && req.app.get('wssBroadcast')) {
      req.app.get('wssBroadcast')({
        type: 'bet',
        username: user.username,
        game: 'Flip',
        currency: game.currency,
        betAmount: game.betAmount,
        payout: winAmount,
        timestamp: betRecord.createdAt
      });
    }

    res.json({
      win: true,
      winAmount,
      balance: user[balanceField],
      newBalance: user[balanceField],
      currency: game.currency,
      currentMultiplier: game.currentMultiplier,
      flips: game.flips
    });
  } catch (err) {
    console.error('Flip cashout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
