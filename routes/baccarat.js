const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

const fullDeck = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const cardValues = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 0, J: 0, Q: 0, K: 0
};

function getShuffledShoe() {
  const shoe = [];
  for (let i = 0; i < 8 * 4; i++) {
    shoe.push(...fullDeck);
  }

  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }

  return shoe;
}

function playBaccarat(shoe) {
  const draw = () => shoe.shift();
  const player = [draw(), draw()];
  const banker = [draw(), draw()];

  const total = (hand) => hand.reduce((sum, c) => (sum + cardValues[c]) % 10, 0);

  let playerTotal = total(player);
  let bankerTotal = total(banker);

  let playerThird = null;
  if (playerTotal <= 5) {
    playerThird = draw();
    player.push(playerThird);
    playerTotal = total(player);
  }

  let bankerThird = null;
  const ptv = playerThird !== null ? cardValues[playerThird] : null;

  const bankerDraw = () => {
    if (playerThird === null) return bankerTotal <= 5;
    if (bankerTotal <= 2) return true;
    if (bankerTotal === 3 && ptv !== 8) return true;
    if (bankerTotal === 4 && [2, 3, 4, 5, 6, 7].includes(ptv)) return true;
    if (bankerTotal === 5 && [4, 5, 6, 7].includes(ptv)) return true;
    if (bankerTotal === 6 && [6, 7].includes(ptv)) return true;
    return false;
  };

  if (bankerDraw()) {
    bankerThird = draw();
    banker.push(bankerThird);
    bankerTotal = total(banker);
  }

  const outcome =
    playerTotal > bankerTotal ? 'player' :
    bankerTotal > playerTotal ? 'banker' : 'tie';

  return { outcome, player, banker };
}

router.post('/play', async (req, res) => {
  try {
    const { currency, betTypes } = req.body;

    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    // Validate betTypes is an object and has at least one bet
    if (!betTypes || typeof betTypes !== 'object' || Object.keys(betTypes).length === 0) {
      return res.status(400).json({ error: 'At least one bet is required' });
    }

    // Validate each bet type and amount that was sent
    const validTypes = ['player', 'banker', 'tie'];
    for (const [type, amount] of Object.entries(betTypes)) {
      // Check if this bet type is valid
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid bet type: ${type}` });
      }
      // Check if amount is valid
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: `Invalid amount for ${type}` });
      }
    }

    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const balanceKey = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    const totalBet = Object.values(betTypes).reduce((sum, a) => sum + a, 0);

    if (user[balanceKey] < totalBet) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct bet
    user[balanceKey] -= totalBet;

    const shoe = getShuffledShoe();
    const result = playBaccarat(shoe);

    let totalWin = 0;
    const winDetails = [];

    for (const [type, amount] of Object.entries(betTypes)) {
      if (type === result.outcome) {
        let payout = 0;
        if (type === 'player') payout = amount * 2;
        else if (type === 'banker') payout = amount * 1.95;
        else if (type === 'tie') payout = amount * 9;

        totalWin += payout;
        winDetails.push({ type, bet: amount, won: true, payout });
      } else {
        winDetails.push({ type, bet: amount, won: false, payout: 0 });
      }
    }

    user[balanceKey] += totalWin;
    await user.save();
    req.session.user[balanceKey] = user[balanceKey];

    // ─── Save to Bet History ───────────────────────────────
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Baccarat',
      currency,
      betAmount: totalBet,
      payout: totalWin,
    });

    // ─── Broadcast to WebSocket clients ─────────────────────
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Baccarat',
      currency,
      betAmount: totalBet,
      payout: totalWin,
      timestamp: betRecord.createdAt,
    });

    res.json({
      outcome: result.outcome,
      cards: {
        player: result.player,
        banker: result.banker
      },
      totalBet,
      totalWin,
      balance: user[balanceKey],
      winDetails
    });

  } catch (err) {
    console.error('Baccarat error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
