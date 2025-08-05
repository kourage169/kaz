const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

router.post('/flip', async (req, res) => {
  const { choice, bet, currency } = req.body;  // Assuming currency is passed in the request
  if (!['heads', 'tails'].includes(choice)) return res.status(400).json({ error: 'Invalid choice' });
  if (bet <= 0) return res.status(400).json({ error: 'Invalid bet' });

  // Ensure the currency is either USD or LBP
  if (!['USD', 'LBP'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency. Use USD or LBP' });
  }

  const user = await User.findById(req.session.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Check the corresponding balance based on the chosen currency
  const userBalance = currency === 'USD' ? user.balanceUSD : user.balanceLBP;

  // Check if the user has enough balance in the chosen currency
  if (userBalance < bet) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
  const win = outcome === choice;
  const payout = win ? bet * 2 : 0;

  // Update the corresponding balance based on the outcome
  if (win) {
    if (currency === 'USD') {
      user.balanceUSD += bet;
    } else {
      user.balanceLBP += bet;
    }
  } else {
    if (currency === 'USD') {
      user.balanceUSD -= bet;
    } else {
      user.balanceLBP -= bet;
    }
  }

  await user.save();

  // Update session balance
  req.session.user.balanceUSD = user.balanceUSD;
  req.session.user.balanceLBP = user.balanceLBP;

  res.json({ result: outcome, win, currency, newBalanceUSD: user.balanceUSD, newBalanceLBP: user.balanceLBP });

    // Save to DB
    try {
      const betRecord = await BetHistory.create({
        userId: user._id,
        agentId: user.agentId || null,
        agentName: user.agentName || null,
        username: user.username,
        game: 'Coinflip',
        currency,
        betAmount: bet,
        payout
      });
  
      // Broadcast to WebSocket
      if (req.app.get('wssBroadcast')) {
        req.app.get('wssBroadcast')({
          type: 'bet',
          username: user.username,
          game: 'Coinflip',
          currency,
          betAmount: bet,
          payout,
          timestamp: betRecord.createdAt,
        });
      }
    } catch (err) {
      console.error('Error saving Coinflip bet history:', err);
    }
});

module.exports = router;
