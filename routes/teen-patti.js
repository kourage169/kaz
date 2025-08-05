const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

const MainBetPayout = {
    win: 1.92,     // For Player A or B
    tie: 0,        // Tie usually results in a push or loss depending on the rules — BC.Game usually treats it as a loss
  };

const PairPlusPayouts = [
    { hand: 'Three of a Kind (A)', multiplier: 50 },
    { hand: 'Three of a Kind', multiplier: 40 },
    { hand: 'Straight Flush', multiplier: 30 },
    { hand: 'Straight', multiplier: 6 },
    { hand: 'Flush', multiplier: 3 },
    { hand: 'Pair', multiplier: 2 },
  ];
  
  const SixCardBonusPayouts = [
    { hand: 'Royal Flush', multiplier: 1000 },
    { hand: 'Straight Flush', multiplier: 200 },
    { hand: 'Four of a Kind', multiplier: 100 },
    { hand: 'Full House', multiplier: 20 },
    { hand: 'Flush', multiplier: 15 },
    { hand: 'Straight', multiplier: 10 },
    { hand: 'Three of a Kind', multiplier: 7 },
  ];

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

// Hand evaluation functions
function evaluateHand(cards) {
  // Sort cards by value (descending)
  const sortedCards = [...cards].sort((a, b) => b.value - a.value);
  
  // Check for flush
  const isFlush = cards.every(card => card.suit === cards[0].suit);
  
  // Check for straight (5 consecutive cards)
  const values = sortedCards.map(card => card.value);
  const isStraight = values.every((value, index) => 
    index === 0 || value === values[index - 1] - 1
  );
  
  // Count card frequencies
  const frequency = {};
  values.forEach(value => {
    frequency[value] = (frequency[value] || 0) + 1;
  });
  
  const counts = Object.values(frequency).sort((a, b) => b - a);
  
  // Determine hand type
  if (isFlush && isStraight) {
    // Check for Royal Flush (A, K, Q, J, 10 of same suit)
    if (values[0] === 14 && values[1] === 13 && values[2] === 12 && values[3] === 11 && values[4] === 10) {
      return { type: 'Royal Flush', rank: 9 };
    }
    return { type: 'Straight Flush', rank: 8 };
  }
  
  if (counts[0] === 4) {
    return { type: 'Four of a Kind', rank: 7 };
  }
  
  if (counts[0] === 3 && counts[1] === 2) {
    return { type: 'Full House', rank: 6 };
  }
  
  if (isFlush) {
    return { type: 'Flush', rank: 5 };
  }
  
  if (isStraight) {
    return { type: 'Straight', rank: 4 };
  }
  
  if (counts[0] === 3) {
    return { type: 'Three of a Kind', rank: 3 };
  }
  
  if (counts[0] === 2 && counts[1] === 2) {
    return { type: 'Two Pair', rank: 2 };
  }
  
  if (counts[0] === 2) {
    return { type: 'Pair', rank: 1 };
  }
  
  return { type: 'High Card', rank: 0 };
}

// 3-card hand evaluator for Teen Patti
function evaluateThreeCardHand(cards) {
  if (cards.length !== 3) {
    throw new Error('evaluateThreeCardHand requires exactly 3 cards');
  }
  
  // Sort cards by value (descending)
  const sortedCards = [...cards].sort((a, b) => b.value - a.value);
  
  // Check for flush
  const isFlush = cards.every(card => card.suit === cards[0].suit);
  
  // Check for straight (3 consecutive cards)
  const values = sortedCards.map(card => card.value);
  const isStraight = (values[0] - values[1] === 1) && (values[1] - values[2] === 1);
  
  // Count card frequencies
  const frequency = {};
  values.forEach(value => {
    frequency[value] = (frequency[value] || 0) + 1;
  });
  
  const counts = Object.values(frequency).sort((a, b) => b - a);
  
  // Determine hand type for 3 cards
  if (isFlush && isStraight) {
    return { type: 'Straight Flush', rank: 5 };
  }
  
  if (counts[0] === 3) {
    return { type: 'Three of a Kind', rank: 4 };
  }
  
  if (isFlush) {
    return { type: 'Flush', rank: 3 };
  }
  
  if (isStraight) {
    return { type: 'Straight', rank: 2 };
  }
  
  if (counts[0] === 2) {
    return { type: 'Pair', rank: 1 };
  }
  
  return { type: 'High Card', rank: 0 };
}

// Function to evaluate best 5-card poker hand from 6 cards
function evaluateBestFiveCardHand(sixCards) {
  console.log('Evaluating 6 cards for best 5-card hand:', sixCards);
  
  // Generate all possible 5-card combinations from 6 cards
  const combinations = [];
  
  // Generate all 5-card combinations using nested loops
  for (let i = 0; i < sixCards.length - 4; i++) {
    for (let j = i + 1; j < sixCards.length - 3; j++) {
      for (let k = j + 1; k < sixCards.length - 2; k++) {
        for (let l = k + 1; l < sixCards.length - 1; l++) {
          for (let m = l + 1; m < sixCards.length; m++) {
            const fiveCardCombo = [
              sixCards[i], sixCards[j], sixCards[k], sixCards[l], sixCards[m]
            ];
            combinations.push(fiveCardCombo);
          }
        }
      }
    }
  }
  
  console.log('Generated', combinations.length, '5-card combinations');
  
  // Evaluate each 5-card combination and find the best one
  let bestHand = { type: 'High Card', rank: 0 };
  let bestCombo = null;
  
  for (let i = 0; i < combinations.length; i++) {
    const fiveCards = combinations[i];
    const hand = evaluateHand(fiveCards);
    console.log(`Combination ${i + 1}:`, fiveCards, '->', hand.type);
    
    if (hand.rank > bestHand.rank) {
      bestHand = hand;
      bestCombo = fiveCards;
      console.log('New best hand found:', hand.type, 'from cards:', bestCombo);
    }
  }
  
  console.log('Final best 5-card hand:', bestHand.type, 'from cards:', bestCombo);
  return bestHand;
}

function compareHands(playerCards, bankerCards) {
  const playerHand = evaluateThreeCardHand(playerCards);
  const bankerHand = evaluateThreeCardHand(bankerCards);
  
  if (playerHand.rank > bankerHand.rank) {
    return 'player';
  } else if (bankerHand.rank > playerHand.rank) {
    return 'banker';
  } else {
    // Same hand rank - compare cards in descending order
    const playerSorted = [...playerCards].sort((a, b) => b.value - a.value);
    const bankerSorted = [...bankerCards].sort((a, b) => b.value - a.value);
    
    // Compare each card in descending order
    for (let i = 0; i < 3; i++) {
      if (playerSorted[i].value > bankerSorted[i].value) {
        return 'player';
      } else if (bankerSorted[i].value > playerSorted[i].value) {
        return 'banker';
      }
    }
    
    // If all cards are equal, it's a tie
    return 'tie';
  }
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

    // Validate each bet type and amount
    const validTypes = ['player', 'banker', 'pairPlusPlayer', 'pairPlusBanker', 'sixCardBonus'];
    for (const [type, amount] of Object.entries(betTypes)) {
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid bet type: ${type}` });
      }
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

    // Play the game
    const deck = shuffle(createDeck());
    const playerCards = drawCards(deck, 3);
    const bankerCards = drawCards(deck, 3);
    
    const outcome = compareHands(playerCards, bankerCards);
    const playerHand = evaluateThreeCardHand(playerCards);
    const bankerHand = evaluateThreeCardHand(bankerCards);
    const allSixCards = [...playerCards, ...bankerCards];
    const sixCardHand = evaluateBestFiveCardHand(allSixCards);

    let totalWin = 0;
    const winDetails = [];

    // Calculate winnings for each bet type
    for (const [type, amount] of Object.entries(betTypes)) {
      let payout = 0;
      let multiplier = 0;
      
      if (type === 'player') {
        if (outcome === 'player') {
          payout = amount * MainBetPayout.win;
          multiplier = MainBetPayout.win;
        } else if (outcome === 'tie') {
          payout = amount * MainBetPayout.tie;
          multiplier = MainBetPayout.tie;
        }
      } else if (type === 'banker') {
        if (outcome === 'banker') {
          payout = amount * MainBetPayout.win;
          multiplier = MainBetPayout.win;
        } else if (outcome === 'tie') {
          payout = amount * MainBetPayout.tie;
          multiplier = MainBetPayout.tie;
        }
      } else if (type === 'pairPlusPlayer') {
        const pairPlusResult = PairPlusPayouts.find(p => p.hand === playerHand.type);
        if (pairPlusResult) {
          payout = amount * pairPlusResult.multiplier;
          multiplier = pairPlusResult.multiplier;
        }
      } else if (type === 'pairPlusBanker') {
        const pairPlusResult = PairPlusPayouts.find(p => p.hand === bankerHand.type);
        if (pairPlusResult) {
          payout = amount * pairPlusResult.multiplier;
          multiplier = pairPlusResult.multiplier;
        }
      } else if (type === 'sixCardBonus') {
        // Evaluate best 5-card poker hand from all 6 cards combined
        const allSixCards = [...playerCards, ...bankerCards];
        console.log('Six Card Bonus - All 6 cards:', allSixCards);
        const bestFiveCardHand = evaluateBestFiveCardHand(allSixCards);
        console.log('Six Card Bonus - Best 5-card hand:', bestFiveCardHand);
        const sixCardResult = SixCardBonusPayouts.find(p => p.hand === bestFiveCardHand.type);
        console.log('Six Card Bonus - Found payout result:', sixCardResult);
        if (sixCardResult) {
          payout = amount * sixCardResult.multiplier;
          multiplier = sixCardResult.multiplier;
          console.log('Six Card Bonus - Calculated payout:', payout, 'from bet:', amount, 'multiplier:', sixCardResult.multiplier);
        } else {
          console.log('Six Card Bonus - No payout found for hand type:', bestFiveCardHand.type);
        }
      }

      totalWin += payout;
      winDetails.push({ type, bet: amount, won: payout > 0, payout, multiplier });
    }

    // Calculate total multiplier
    let totalMultiplier = 0;
    const winningBets = winDetails.filter(detail => detail.won && detail.multiplier);
    
    if (winningBets.length === 1 && (winningBets[0].type === 'player' || winningBets[0].type === 'banker')) {
      // If only one winning bet and it's a main bet, show the full multiplier including the 1
      totalMultiplier = winningBets[0].multiplier;
    } else {
      // If multiple winning bets, sum all multipliers (main bets count full multiplier when combined with others)
      for (const detail of winningBets) {
        totalMultiplier += detail.multiplier;
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
      game: 'Teen Patti',
      currency,
      betAmount: totalBet,
      payout: totalWin,
    });

    // ─── Broadcast to WebSocket clients ─────────────────────
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Teen Patti',
      currency,
      betAmount: totalBet,
      payout: totalWin,
      timestamp: betRecord.createdAt,
    });

    res.json({
      outcome,
      cards: {
        player: playerCards,
        banker: bankerCards
      },
      hands: {
        player: playerHand.type,
        banker: bankerHand.type,
        sixCard: sixCardHand.type
      },
      totalBet,
      totalWin,
      totalMultiplier,
      newBalance: user[balanceKey],
      winDetails
    });

  } catch (err) {
    console.error('Teen Patti error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;