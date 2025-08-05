const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory'); // NEW

// Constants
const TOTAL_CARDS = 13;
const HOUSE_EDGE = 0.03;

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});


// Helper Function for saving HiLo bet history
async function saveHiloBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'HiLo',
      currency,
      betAmount,
      payout
    });

    return betRecord; // ⬅️ return it!
  } catch (err) {
    console.error('Error saving HiLo bet history:', err);
    return null; // Optional: return null so you can check for failure
  }
}


// Utils
const CARD_NAMES = {
  1: 'A', 2: '2', 3: '3', 4: '4',
  5: '5', 6: '6', 7: '7', 8: '8',
  9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
};

function getHiLoMultipliers(card) {
  const multipliers = {};

  // Special cases for Ace and King
  if (card === 1) { // Ace
    // Higher: must be strictly higher (2-K)
    const higherChance = (TOTAL_CARDS - 1) / TOTAL_CARDS;
    multipliers.higher = +( (1 / higherChance) * (1 - HOUSE_EDGE) ).toFixed(4);
    
    // Lower: must be equal (only Ace)
    const lowerChance = 1 / TOTAL_CARDS;
    multipliers.lower = +( (1 / lowerChance) * (1 - HOUSE_EDGE) ).toFixed(4);
  } 
  else if (card === TOTAL_CARDS) { // King
    // Higher: must be equal (only King)
    const higherChance = 1 / TOTAL_CARDS;
    multipliers.higher = +( (1 / higherChance) * (1 - HOUSE_EDGE) ).toFixed(4);
    
    // Lower: must be strictly lower (A-Q)
    const lowerChance = (TOTAL_CARDS - 1) / TOTAL_CARDS;
    multipliers.lower = +( (1 / lowerChance) * (1 - HOUSE_EDGE) ).toFixed(4);
  }
  else {
    // Normal cases (2 through Queen)
    const higherOrEqualCount = TOTAL_CARDS - card + 1;  // cards card through K
    const lowerOrEqualCount = card;                     // cards A through card
    
    const higherChance = higherOrEqualCount / TOTAL_CARDS;
    const lowerChance = lowerOrEqualCount / TOTAL_CARDS;
    
    multipliers.higher = +( (1 / higherChance) * (1 - HOUSE_EDGE) ).toFixed(4);
    multipliers.lower = +( (1 / lowerChance) * (1 - HOUSE_EDGE) ).toFixed(4);
  }

  return multipliers;
}

function getRandomCard() {
  return Math.floor(Math.random() * TOTAL_CARDS) + 1;
}

// Route: Create HiLo game (session only)
router.post('/create', async (req, res) => {
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
    req.session.hiloGame = {
      betAmount,
      currency,
      totalMultiplier: 1,
      steps: [],
      status: 'in_progress'
    };

    res.json({
      message: 'HiLo game started',
      balance: user[balanceField]
    });
  } catch (err) {
    console.error('HiLo create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route: guess high/low
router.post('/guess', async (req, res) => {
  try {
    const game = req.session.hiloGame;

    if (!game || game.status !== 'in_progress') {
      return res.status(400).json({ error: 'No active game' });
    }

    const { currentCard, guess } = req.body;

    if (!['higher', 'lower'].includes(guess)) {
      return res.status(400).json({ error: 'Invalid guess' });
    }

    if (!currentCard || currentCard < 1 || currentCard > TOTAL_CARDS) {
      return res.status(400).json({ error: 'Invalid card' });
    }

    const nextCard = getRandomCard();
    let won = false;

    // Special cases for Ace and King
    if (currentCard === 1) { // Ace
      if (guess === 'higher') {
        won = nextCard > currentCard; // Must be strictly higher
      } else {
        won = nextCard === currentCard; // Must be equal
      }
    } else if (currentCard === TOTAL_CARDS) { // King
      if (guess === 'higher') {
        won = nextCard === currentCard; // Must be equal
      } else {
        won = nextCard < currentCard; // Must be strictly lower
      }
    } else {
      // Normal cases (2 through Queen)
      if (guess === 'higher') {
        won = nextCard >= currentCard;  // Higher or equal
      } else {
        won = nextCard <= currentCard;  // Lower or equal
      }
    }

    const multipliers = getHiLoMultipliers(currentCard);
    const multiplier = multipliers[guess];

    if (won) {
      game.totalMultiplier *= multiplier;
      game.totalMultiplier = +game.totalMultiplier.toFixed(4);

      game.steps.push({
        guess,
        from: currentCard,
        to: nextCard,
        won: true,
        multiplier: +multiplier.toFixed(4),
        totalMultiplier: game.totalMultiplier
      });

      res.json({
        won: true,
        nextCard,
        nextCardName: CARD_NAMES[nextCard],
        multiplier,
        totalMultiplier: game.totalMultiplier,
        steps: game.steps,
        multipliers: getHiLoMultipliers(nextCard) // UI hint for next decision
      });
    } else {
      game.steps.push({
        guess,
        from: currentCard,
        to: nextCard,
        won: false
      });

      game.status = 'lost';

      const user = await User.findById(req.session.user.id);
if (user) {
  const betRecord = await saveHiloBetHistory({
    user,
    betAmount: game.betAmount,
    payout: 0,
    currency: game.currency
  });

  if (betRecord && req.app.get('wssBroadcast')) {
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'HiLo',
      currency: game.currency,
      betAmount: game.betAmount,
      payout: 0,
      timestamp: betRecord.createdAt
    });
  }
}


      res.json({
        won: false,
        nextCard,
        nextCardName: CARD_NAMES[nextCard],
        totalMultiplier: game.totalMultiplier,
        steps: game.steps
      });
    }
  } catch (err) {
    console.error('HiLo guess error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Route: Cash out
router.post('/cashout', async (req, res) => {
  try {
    const game = req.session.hiloGame;

    if (!game || game.status !== 'in_progress') {
      return res.status(400).json({ error: 'No active game to cash out' });
    }

    const winAmount = +(game.betAmount * game.totalMultiplier).toFixed(2);
    const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    user[balanceField] += winAmount;
    await user.save();
    req.session.user[balanceField] = user[balanceField];

    game.status = 'cashed_out';

    
    // ───── Save bet history ─────
    const betRecord = await saveHiloBetHistory({
      user,
      betAmount: game.betAmount,
      payout: winAmount,
      currency: game.currency
    });

    // ───── Emit WebSocket event ─────
    if (betRecord && req.app.get('wssBroadcast')) {
      req.app.get('wssBroadcast')({
        type: 'bet',
        username: user.username,
        game: 'HiLo',
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
      totalMultiplier: game.totalMultiplier,
      steps: game.steps
    });
  } catch (err) {
    console.error('HiLo cashout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;
