const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

  // Add bet limits at the top with other constants
  const BET_LIMITS = {
    USD: { min: 0.10, max: 1000 },
    LBP: { min: 10000, max: 100000000 }
  };

const PAYOUT_TABLE = {
  "royal_flush": 800,
  "straight_flush": 60,
  "four_of_a_kind": 22,
  "full_house": 9,
  "flush": 6,
  "straight": 4,
  "three_of_a_kind": 3,
  "two_pair": 2,
  "jacks_or_better": 1,
  "no_win": 0
};


const RANKS = [
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 11 },
  { rank: 'Q', value: 12 },
  { rank: 'K', value: 13 },
  { rank: 'A', value: 14 }
];

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const { rank, value } of RANKS) {
      deck.push({ suit, rank, value });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function drawCards(deck, count) {
  return deck.splice(0, count);
}

function evaluateHand(hand, bet) {
  const suits = hand.map(card => card.suit);
  const values = hand.map(card => card.value).sort((a, b) => a - b);
  const counts = {};

  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }

  const isFlush = suits.every(s => s === suits[0]);

  const isStraight = values.every((v, i, arr) =>
    i === 0 || v === arr[i - 1] + 1
  ) || (
    // Special case: Ace-low straight (A-2-3-4-5)
    values.toString() === '2,3,4,5,14'
  );

  const uniqueCounts = Object.values(counts).sort((a, b) => b - a); // e.g. [3,2] for full house

  const hasFour = uniqueCounts[0] === 4;
  const hasThree = uniqueCounts[0] === 3;
  const pairCount = uniqueCounts.filter(c => c === 2).length;

  const isRoyal = isFlush && values.toString() === '10,11,12,13,14';
  const isStraightFlush = isFlush && isStraight && !isRoyal;

  let result = 'no_win';
  let winningCards = [];

  if (isRoyal || isStraightFlush || isFlush || isStraight) {
    // All cards are winning for these hands
    winningCards = [0, 1, 2, 3, 4];
  } else if (hasFour) {
    // Find the four matching cards
    const fourValue = parseInt(Object.keys(counts).find(key => counts[key] === 4));
    winningCards = hand.map((card, index) => card.value === fourValue ? index : -1).filter(i => i !== -1);
  } else if (hasThree && pairCount === 1) {
    // Full house - all cards are winning
    winningCards = [0, 1, 2, 3, 4];
  } else if (hasThree) {
    // Find the three matching cards
    const threeValue = parseInt(Object.keys(counts).find(key => counts[key] === 3));
    winningCards = hand.map((card, index) => card.value === threeValue ? index : -1).filter(i => i !== -1);
  } else if (pairCount === 2) {
    // Find both pairs
    const pairValues = Object.keys(counts).filter(key => counts[key] === 2).map(v => parseInt(v));
    winningCards = hand.map((card, index) => pairValues.includes(card.value) ? index : -1).filter(i => i !== -1);
  } else if (pairCount === 1) {
    const pairValue = parseInt(Object.keys(counts).find(key => counts[key] === 2));
    if (pairValue >= 11 || pairValue === 14) {
      // Jacks or better - find the pair
      winningCards = hand.map((card, index) => card.value === pairValue ? index : -1).filter(i => i !== -1);
      result = 'jacks_or_better';
    }
  }

  if (isRoyal) result = 'royal_flush';
  else if (isStraightFlush) result = 'straight_flush';
  else if (hasFour) result = 'four_of_a_kind';
  else if (hasThree && pairCount === 1) result = 'full_house';
  else if (isFlush) result = 'flush';
  else if (isStraight) result = 'straight';
  else if (hasThree) result = 'three_of_a_kind';
  else if (pairCount === 2) result = 'two_pair';

  const multiplier = PAYOUT_TABLE[result] || 0;
  const win = bet * multiplier;

  return { result, multiplier, win, winningCards };
}

// start game route
router.post('/start', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { betAmount, currency } = req.body;

    // Validate bet amount
    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    // Validate currency
    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    // Validate against bet limits
    const bet = Number(betAmount);
    const limits = BET_LIMITS[currency];
    if (bet < limits.min || bet > limits.max) {
      return res.status(400).json({ 
        error: `Bet must be between ${limits.min} and ${limits.max} ${currency}` 
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Map balance field
    const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

    // Check if user has sufficient balance
    if (user[balanceField] < bet) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct bet
    user[balanceField] -= bet;
    await user.save();

    // Sync session balance
    req.session.user[balanceField] = user[balanceField];

    // Create and shuffle deck
    const deck = createDeck().sort(() => Math.random() - 0.5);

    // Deal initial 5-card hand
    const hand = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];

    // Store game session in req.session (overwrites any existing game)
    req.session.videopoker = {
      deck,
      hand,
      bet,
      currency
    };

    res.json({
      hand,
      bet,
      currency,
      balance: user[balanceField]
    });
  } catch (err) {
    console.error('Error starting Video Poker game:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});



router.post('/deal', async (req, res) => {
  try {
    // Check if there's an active game
    if (!req.session.videopoker) {
      return res.status(400).json({ error: 'No active game' });
    }

    const { holds } = req.body;
    
    // Validate holds array
    if (!Array.isArray(holds)) {
      return res.status(400).json({ error: 'Invalid holds data' });
    }

    // Validate each hold index
    if (!holds.every(index => 
      Number.isInteger(index) && 
      index >= 0 && 
      index < 5
    )) {
      return res.status(400).json({ error: 'Invalid card indices' });
    }

    // Check for duplicate indices
    if (new Set(holds).size !== holds.length) {
      return res.status(400).json({ error: 'Duplicate card indices not allowed' });
    }

    const { deck, hand, bet, currency } = req.session.videopoker;

    // Validate that held cards match the current hand
    for (const index of holds) {
      if (!hand[index]) {
        return res.status(400).json({ error: 'Invalid hold: card does not exist in current hand' });
      }
    }

    // Get user for balance update
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

    // Construct final hand: keep held cards, replace others with new cards from deck
    const finalHand = hand.map((card, index) => 
      holds.includes(index) ? card : deck.pop()
    );

    // Evaluate hand and calculate winnings
    const { result, multiplier, win, winningCards } = evaluateHand(finalHand, bet);

    // Update user's balance if they won
    if (win > 0) {
      user[balanceField] += win;
      await user.save();
      
      // Update session balance
      req.session.user[balanceField] = user[balanceField];
    }

    // 🔽 ADD HERE: before clearing session
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Video Poker',
      currency,
      betAmount: bet,
      payout: win,
    });
    
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Video Poker',
      currency,
      betAmount: bet,
      payout: win,
      timestamp: betRecord.createdAt,
    });
    

    // Clear game session
    delete req.session.videopoker;

    // Send response with results
    res.json({
      finalHand,
      result,
      win,
      multiplier,
      currency,
      balance: user[balanceField],
      winningCards
    });

  } catch (err) {
    console.error('Error in video poker deal:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
