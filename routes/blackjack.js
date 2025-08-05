const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory'); // NEW

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Helper Function for saving Blackjack bet history
async function saveBlackjackBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Blackjack',
      currency,
      betAmount,
      payout
    });

    return betRecord; // ⬅️ return it!
  } catch (err) {
    console.error('Error saving Blackjack bet history:', err);
    return null; // Optional: return null so you can check for failure
  }
}


// Card definitions
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Game sessions storage - store active games in memory
// In production, this should be in a database
const gameSessionsMap = new Map();

/**
 * Create a new shuffled deck
 * @returns {Array} Shuffled deck of cards
 */
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return shuffleDeck(deck);
}

/**
 * Shuffle the deck using Fisher-Yates algorithm
 * @param {Array} deck - The deck to shuffle
 * @returns {Array} Shuffled deck
 */
function shuffleDeck(deck) {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

/**
 * Calculate the value of a hand
 * @param {Array} hand - Array of card objects
 * @returns {Number} Hand value
 */
function calculateHandValue(hand) {
  if (!hand || hand.length === 0) {
    return 0;
  }
  
  let value = 0;
  let aces = 0;
  
  // Sum up all non-ace cards
  for (const card of hand) {
    if (card.value === 'A') {
      aces++;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }
  
  // Add aces (1 or 11 each)
  for (let i = 0; i < aces; i++) {
    if (value + 11 <= 21) {
      value += 11;
    } else {
      value += 1;
    }
  }
  
  return value;
}

/**
 * Format currency value based on the currency type
 * @param {Number} value - The value to format
 * @param {String} currency - The currency type ('USD' or 'LBP')
 * @returns {Number} Formatted value
 */
function formatCurrency(value, currency) {
  if (currency === 'USD') {
    // Round to 2 decimal places for USD
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else {
    // Round to whole numbers for LBP
    return Math.round(value);
  }
}

/**
 * Start a new game - create a deck and deal initial cards
 * POST /blackjack/start
 */
router.post('/start', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { betAmount, currency } = req.body;
    
    // Validate bet amount and currency
    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    
    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has sufficient balance
    const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    const formattedBetAmount = formatCurrency(betAmount, currency);
    
    if (user[balanceField] < formattedBetAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Deduct bet amount from user's balance
    user[balanceField] = formatCurrency(user[balanceField] - formattedBetAmount, currency);
    
    // Save user with updated balance
    await user.save();
    
    // Update session balance
    req.session.user[balanceField] = user[balanceField];
    
    // Create a new deck
    const deck = createDeck();
    
    // Deal initial cards
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()]; // Both cards are stored on the backend
    
    // Calculate initial hand values
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);
    
    // Check for natural blackjack
    const playerHasBlackjack = playerValue === 21 && playerHand.length === 2;
    const dealerHasBlackjack = dealerValue === 21 && dealerHand.length === 2;
    
    // Create a new game session
    const gameSession = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      userId,
      deck,
      playerHand,
      dealerHand,
      betAmount: formattedBetAmount,
      currency,
      createdAt: Date.now(),
      playerHasBlackjack,
      dealerHasBlackjack
    };
    
    // Store the game session
    gameSessionsMap.set(gameSession.id, gameSession);
    
    // Return game state to the client
    // Only send the dealer's first card, the second one remains hidden
    return res.json({
      gameId: gameSession.id,
      playerHand: gameSession.playerHand,
      dealerHand: [gameSession.dealerHand[0]], // Only send the first dealer card
      playerValue,
      betAmount: formattedBetAmount,
      currency,
      newBalance: user[balanceField]
    });
  } catch (err) {
    console.error('Error starting blackjack game:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get current game state
 * GET /blackjack/game/:id
 */
router.get('/game/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    // Get the game session
    const gameSession = gameSessionsMap.get(id);
    
    // Check if game exists
    if (!gameSession) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if this is the user's game
    if (gameSession.userId !== userId) {
      return res.status(403).json({ error: 'Not your game' });
    }
    
    // Return game state
    return res.json({
      gameId: gameSession.id,
      playerHand: gameSession.playerHand,
      dealerHand: [gameSession.dealerHand[0]], // Only send the first dealer card
      playerValue: calculateHandValue(gameSession.playerHand),
      betAmount: gameSession.betAmount,
      currency: gameSession.currency
    });
  } catch (err) {
    console.error('Error getting game state:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Player action: hit (draw a card)
 * POST /blackjack/hit
 */
router.post('/hit', async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.session.user.id;
    
    // Get the game session
    const gameSession = gameSessionsMap.get(gameId);
    
    // Check if game exists
    if (!gameSession) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if this is the user's game
    if (gameSession.userId !== userId) {
      return res.status(403).json({ error: 'Not your game' });
    }
    
    // Check if this is a split game
    if (gameSession.playerHands) {
      // Handle hit for split hands
      // Get the current hand
      const currentHandIndex = gameSession.currentHandIndex;
      const currentHand = gameSession.playerHands[currentHandIndex];
      
      // Draw a card from the deck
      const card = gameSession.deck.pop();
      
      // Add the card to the current hand
      currentHand.push(card);
      
      // Update the reference to the active hand
      gameSession.playerHand = currentHand;
      
      // Check if player busts
      const handValue = calculateHandValue(currentHand);
      const busted = handValue > 21;
      
      // Mark hand as complete if busted or has 21
      if (busted || handValue === 21) {
        gameSession.splitComplete[currentHandIndex] = true;
      }
      
      // Return appropriate response based on split state
      return res.json({
        gameId: gameSession.id,
        playerHands: gameSession.playerHands,
        currentHandIndex: currentHandIndex,
        currentHand: currentHand,
        dealerHand: [gameSession.dealerHand[0]], // Still only send the first dealer card
        handValue: handValue,
        busted: busted,
        splitComplete: gameSession.splitComplete
      });
    } else {
      // Regular hit (non-split game)
      // Draw a card from the deck
      const card = gameSession.deck.pop();
    
      // Add the card to the player's hand
      gameSession.playerHand.push(card);
    
      // Check if player busts
      const playerValue = calculateHandValue(gameSession.playerHand);
      const busted = playerValue > 21;
    
      if (busted) {

        // Load user before saving history
        const user = await User.findById(userId);
        if (!user) {
        return res.status(404).json({ error: 'User not found' });
       }


        // Save bet history (Blackjack) for bust outcome
        const betRecord = await saveBlackjackBetHistory({
          user,
          betAmount: gameSession.betAmount,
          payout: 0, // Bust means no payout
          currency: gameSession.currency
        });
    
        // Broadcast to WebSocket for bust outcome
        if (betRecord && req.app.get('wssBroadcast')) {
          req.app.get('wssBroadcast')({
            type: 'bet',
            username: user.username,
            game: 'Blackjack',
            currency: gameSession.currency,
            betAmount: gameSession.betAmount,
            payout: 0,
            timestamp: betRecord.createdAt,
          });
        }
      }
    
      // Return updated game state
      return res.json({
        gameId: gameSession.id,
        playerHand: gameSession.playerHand,
        dealerHand: [gameSession.dealerHand[0]], // Still only send the first dealer card
        playerValue: playerValue,
        busted: busted
      });
    }
    
  } catch (err) {
    console.error('Error handling hit action:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Player action: stand
 * POST /blackjack/stand
 */
router.post('/stand', async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.session.user.id;
    
    // Get the game session
    const gameSession = gameSessionsMap.get(gameId);
    
    // Check if game exists
    if (!gameSession) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if this is the user's game
    if (gameSession.userId !== userId) {
      return res.status(403).json({ error: 'Not your game' });
    }
    
    // Check if this is a split game
    if (gameSession.playerHands) {
      // Handle stand for split hands
      // Get the current hand index
      const currentHandIndex = gameSession.currentHandIndex;
      
      // Mark this hand as complete
      gameSession.splitComplete[currentHandIndex] = true;
      
      // Check if all hands are complete
      const allHandsComplete = gameSession.splitComplete.every(complete => complete);
      
      if (!allHandsComplete) {
        // Move to the next hand
        let nextHandIndex = currentHandIndex + 1;
        
        // Skip hands that are already complete (e.g., blackjack)
        while (nextHandIndex < gameSession.playerHands.length && gameSession.splitComplete[nextHandIndex]) {
          nextHandIndex++;
        }
        
        // If we found a valid hand, update the current hand
        if (nextHandIndex < gameSession.playerHands.length) {
          gameSession.currentHandIndex = nextHandIndex;
          gameSession.playerHand = gameSession.playerHands[nextHandIndex];
          
          // Return updated game state for the next hand
          return res.json({
            gameId: gameSession.id,
            playerHands: gameSession.playerHands,
            currentHandIndex: nextHandIndex,
            currentHand: gameSession.playerHand,
            dealerHand: [gameSession.dealerHand[0]], // Still only show first dealer card
            handValue: calculateHandValue(gameSession.playerHand),
            allHandsComplete: false,
            splitComplete: gameSession.splitComplete
          });
        }
      }
      
      // If we get here, all hands are complete - dealer's turn
      // Dealer draws cards until they have 17 or more
      let dealerValue = calculateHandValue(gameSession.dealerHand);
      while (dealerValue < 17) {
        const card = gameSession.deck.pop();
        gameSession.dealerHand.push(card);
        dealerValue = calculateHandValue(gameSession.dealerHand);
      }
      
      // Determine results for each hand
      const results = [];
      const payouts = [];
      let totalPayout = 0;
      
      for (let i = 0; i < gameSession.playerHands.length; i++) {
        const playerHand = gameSession.playerHands[i];
        const playerValue = calculateHandValue(playerHand);
        // Check if this hand was doubled
        const isDoubled = gameSession.doubleBets && gameSession.doubleBets[i];
        
        let result;
        let payoutMultiplier = 0;
        
        // Check for blackjack (natural 21)
        const playerHasBlackjack = false;
        const dealerHasBlackjack = dealerValue === 21 && gameSession.dealerHand.length === 2;
        
        if (playerHasBlackjack && !dealerHasBlackjack) {
          // Player has blackjack, dealer doesn't - pays 3:2
          result = 'blackjack';
          payoutMultiplier = 2.5; // Original bet + 1.5x win
        } else if (dealerHasBlackjack && !playerHasBlackjack) {
          // Dealer has blackjack, player doesn't
          result = 'lose';
          payoutMultiplier = 0;
        } else if (playerHasBlackjack && dealerHasBlackjack) {
          // Both have blackjack - push
          result = 'push';
          payoutMultiplier = 1; // Return original bet
        } else if (playerValue > 21) {
          // Player busts
          result = 'lose';
          payoutMultiplier = 0;
        } else if (dealerValue > 21) {
          // Dealer busts, player wins
          result = 'win';
          payoutMultiplier = 2; // Original bet + 1x win
        } else if (playerValue > dealerValue) {
          // Player has higher value, player wins
          result = 'win';
          payoutMultiplier = 2; // Original bet + 1x win
        } else if (dealerValue > playerValue) {
          // Dealer has higher value, dealer wins
          result = 'lose';
          payoutMultiplier = 0;
        } else {
          // Equal values, it's a push
          result = 'push';
          payoutMultiplier = 1; // Return original bet
        }
        
        // Calculate payout for this hand - apply double if needed
        const betForHand = isDoubled ? (gameSession.betAmount * 2) : gameSession.betAmount;
        const handPayout = formatCurrency(betForHand * payoutMultiplier, gameSession.currency);
        totalPayout += handPayout;
        
        results.push(result);
        payouts.push(handPayout);
      }
      
// Load user before saving history
const user = await User.findById(userId);
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}

// Update user balance with total payout
if (totalPayout > 0) {
  const balanceField = gameSession.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
  user[balanceField] = formatCurrency(user[balanceField] + totalPayout, gameSession.currency);

  // Save user with updated balance
  await user.save();

  // Update session balance
  req.session.user[balanceField] = user[balanceField];
}

// Calculate total bet including doubles
let totalBet = 0;
for (let i = 0; i < gameSession.playerHands.length; i++) {
  const isDoubled = gameSession.doubleBets && gameSession.doubleBets[i];
  totalBet += isDoubled ? gameSession.betAmount * 2 : gameSession.betAmount;
}
gameSession.totalBet = totalBet; // assign it so it's available


// Save bet history (Blackjack)
const betRecord = await saveBlackjackBetHistory({
  user,
  betAmount: gameSession.totalBet, // includes splits/doubles
  payout: totalPayout,
  currency: gameSession.currency
});

// Emit to WebSocket (Blackjack)
if (betRecord && req.app.get('wssBroadcast')) {
  req.app.get('wssBroadcast')({
    type: 'bet',
    username: user.username,
    game: 'Blackjack',
    currency: gameSession.currency,
    betAmount: gameSession.totalBet,
    payout: totalPayout,
    timestamp: betRecord.createdAt,
  });
}

      
      // Return updated game state with results
      return res.json({
        gameId: gameSession.id,
        playerHands: gameSession.playerHands,
        dealerHand: gameSession.dealerHand, // Return full dealer hand now
        handValues: gameSession.playerHands.map(hand => calculateHandValue(hand)),
        dealerValue: dealerValue,
        results: results,
        payouts: payouts,
        totalPayout: totalPayout,
        doubleBets: gameSession.doubleBets || [],
        betAmount: gameSession.betAmount,
        currency: gameSession.currency,
        newBalance: req.session.user[gameSession.currency === 'USD' ? 'balanceUSD' : 'balanceLBP'],
        isSplit: true
      });
    } else {
      // Regular stand (non-split game)
      // Dealer draws cards until they have 17 or more
      let dealerValue = calculateHandValue(gameSession.dealerHand);
      while (dealerValue < 17) {
        const card = gameSession.deck.pop();
        gameSession.dealerHand.push(card);
        dealerValue = calculateHandValue(gameSession.dealerHand);
      }
      
      // Calculate player value
      const playerValue = calculateHandValue(gameSession.playerHand);
      
      // Determine the game result
      let result;
      let payoutMultiplier = 0;
      
      // Check for blackjack (natural 21)
      const playerHasBlackjack = playerValue === 21 && gameSession.playerHand.length === 2;
      const dealerHasBlackjack = dealerValue === 21 && gameSession.dealerHand.length === 2;
      
      if (playerHasBlackjack && !dealerHasBlackjack) {
        result = 'blackjack';
        payoutMultiplier = 2.5; // Original bet + 1.5x win
      } else if (dealerHasBlackjack && !playerHasBlackjack) {
        result = 'lose';
        payoutMultiplier = 0;
      } else if (playerHasBlackjack && dealerHasBlackjack) {
        result = 'push';
        payoutMultiplier = 1; // Return original bet
      } else if (playerValue > 21) {
        result = 'lose';
        payoutMultiplier = 0;
      } else if (dealerValue > 21) {
        result = 'win';
        payoutMultiplier = 2; // Original bet + 1x win
      } else if (playerValue > dealerValue) {
        result = 'win';
        payoutMultiplier = 2; // Original bet + 1x win
      } else if (dealerValue > playerValue) {
        result = 'lose';
        payoutMultiplier = 0;
      } else {
        result = 'push';
        payoutMultiplier = 1; // Return original bet
      }
      
      // Calculate payout
      const payoutValue = gameSession.betAmount * payoutMultiplier;
      const payout = formatCurrency(payoutValue, gameSession.currency);
    
      // Load user before updating balance and saving history
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update user balance if payout > 0
      if (payoutValue > 0) {
        const balanceField = gameSession.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
        user[balanceField] += payoutValue; // add raw number
        
        // Save user with updated balance
        await user.save();
        
        // Update session balance with formatted string
        req.session.user[balanceField] = formatCurrency(user[balanceField], gameSession.currency);
      }
    
      // Save bet history (Blackjack) for all outcomes
      const betRecord = await saveBlackjackBetHistory({
        user,
        betAmount: gameSession.betAmount,
        payout: payoutValue,
        currency: gameSession.currency
      });
    
      // Broadcast to WebSocket for all outcomes
      if (betRecord && req.app.get('wssBroadcast')) {
        req.app.get('wssBroadcast')({
          type: 'bet',
          username: user.username,
          game: 'Blackjack',
          currency: gameSession.currency,
          betAmount: gameSession.betAmount,
          payout: payoutValue,
          timestamp: betRecord.createdAt,
        });
      }
      
      // Return updated game state with result
      return res.json({
        gameId: gameSession.id,
        playerHand: gameSession.playerHand,
        dealerHand: gameSession.dealerHand, // Return full dealer hand now
        playerValue: playerValue,
        dealerValue: dealerValue,
        result: result,
        payout: payout,
        betAmount: gameSession.betAmount,
        currency: gameSession.currency,
        newBalance: req.session.user[gameSession.currency === 'USD' ? 'balanceUSD' : 'balanceLBP']
      });
    }
    
    
  } catch (err) {
    console.error('Error handling stand action:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Player action: double down
 * POST /blackjack/double
 */
router.post('/double', async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.session.user.id;
    
    // Get the game session
    const gameSession = gameSessionsMap.get(gameId);
    
    // Check if game exists
    if (!gameSession) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if this is the user's game
    if (gameSession.userId !== userId) {
      return res.status(403).json({ error: 'Not your game' });
    }
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if this is a split game
    if (gameSession.playerHands) {
      // Handle double down for split hands
      // Get the current hand
      const currentHandIndex = gameSession.currentHandIndex;
      const currentHand = gameSession.playerHands[currentHandIndex];
      
      // Check if player can double (only with 2 cards)
      if (currentHand.length !== 2) {
        return res.status(400).json({ error: 'Can only double down on initial two cards' });
      }
      
      // Check if user has sufficient balance for doubling
      const balanceField = gameSession.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      if (user[balanceField] < gameSession.betAmount) {
        return res.status(400).json({ error: 'Insufficient balance to double down' });
      }
      
      // Deduct additional bet amount from user's balance
      user[balanceField] = formatCurrency(user[balanceField] - gameSession.betAmount, gameSession.currency);
      
      // Save user with updated balance
      await user.save();
      
      // Update session balance
      req.session.user[balanceField] = user[balanceField];
      
      // Track the doubled bet for this hand
      if (!gameSession.doubleBets) {
        gameSession.doubleBets = [];
      }
      
      // Set double bet for the current hand (we'll use this later for payout calculations)
      gameSession.doubleBets[currentHandIndex] = true;
      
      // Draw one more card for the current hand
      const card = gameSession.deck.pop();
      currentHand.push(card);
      
      // Update the reference to the active hand
      gameSession.playerHand = currentHand;
      
      // Calculate hand value
      const handValue = calculateHandValue(currentHand);
      const busted = handValue > 21;
      
      // Mark hand as complete (no more actions after doubling)
      gameSession.splitComplete[currentHandIndex] = true;
      
      // Check if all hands are complete
      const allHandsComplete = gameSession.splitComplete.every(complete => complete);
      
      if (!allHandsComplete) {
        // Move to the next hand
        let nextHandIndex = currentHandIndex + 1;
        
        // Skip hands that are already complete (e.g., blackjack)
        while (nextHandIndex < gameSession.playerHands.length && gameSession.splitComplete[nextHandIndex]) {
          nextHandIndex++;
        }
        
        // If we found a valid hand, update the current hand
        if (nextHandIndex < gameSession.playerHands.length) {
          gameSession.currentHandIndex = nextHandIndex;
          gameSession.playerHand = gameSession.playerHands[nextHandIndex];
          
          // Return updated game state for the next hand
          return res.json({
            gameId: gameSession.id,
            playerHands: gameSession.playerHands,
            currentHandIndex: nextHandIndex,
            currentHand: gameSession.playerHand,
            dealerHand: [gameSession.dealerHand[0]], // Still only show first dealer card
            handValue: handValue,
            busted: busted,
            doubleBets: gameSession.doubleBets,
            allHandsComplete: false,
            splitComplete: gameSession.splitComplete,
            betAmount: gameSession.betAmount,
            currency: gameSession.currency,
            newBalance: user[balanceField]
          });
        }
      }
      // If all hands are complete, dealer plays out their hand and return final result
      // Dealer draws cards until they have 17 or more
      let dealerValue = calculateHandValue(gameSession.dealerHand);
      while (dealerValue < 17) {
        const dealerCard = gameSession.deck.pop();
        gameSession.dealerHand.push(dealerCard);
        dealerValue = calculateHandValue(gameSession.dealerHand);
      }
      // Determine results for each hand
      const results = [];
      const payouts = [];
      let totalPayout = 0;
      for (let i = 0; i < gameSession.playerHands.length; i++) {
        const playerHand = gameSession.playerHands[i];
        const playerValue = calculateHandValue(playerHand);
        const isDoubled = gameSession.doubleBets && gameSession.doubleBets[i];
        let result;
        let payoutMultiplier = 0;
        // Check for blackjack (natural 21)
        const playerHasBlackjack = playerValue === 21 && playerHand.length === 2;
        const dealerHasBlackjack = dealerValue === 21 && gameSession.dealerHand.length === 2;
        if (playerHasBlackjack && !dealerHasBlackjack) {
          result = 'blackjack';
          payoutMultiplier = 2.5;
        } else if (dealerHasBlackjack && !playerHasBlackjack) {
          result = 'lose';
          payoutMultiplier = 0;
        } else if (playerHasBlackjack && dealerHasBlackjack) {
          result = 'push';
          payoutMultiplier = 1;
        } else if (playerValue > 21) {
          result = 'lose';
          payoutMultiplier = 0;
        } else if (dealerValue > 21) {
          result = 'win';
          payoutMultiplier = 2;
        } else if (playerValue > dealerValue) {
          result = 'win';
          payoutMultiplier = 2;
        } else if (dealerValue > playerValue) {
          result = 'lose';
          payoutMultiplier = 0;
        } else {
          result = 'push';
          payoutMultiplier = 1;
        }
        const betForHand = isDoubled ? (gameSession.betAmount * 2) : gameSession.betAmount;
        const handPayout = formatCurrency(betForHand * payoutMultiplier / 2, gameSession.currency);
        totalPayout += handPayout;
        results.push(result);
        payouts.push(handPayout);
      }
      // Update user balance with total payout
      if (totalPayout > 0) {
        user[balanceField] = formatCurrency(user[balanceField] + totalPayout, gameSession.currency);
        await user.save();
        req.session.user[balanceField] = user[balanceField];
      }
      // Return final game state
      const lastHandIndex = gameSession.playerHands.length - 1;
      return res.json({
        gameId: gameSession.id,
        playerHands: gameSession.playerHands,
        dealerHand: gameSession.dealerHand,
        handValues: gameSession.playerHands.map(hand => calculateHandValue(hand)),
        dealerValue: dealerValue,
        results: results,
        payouts: payouts,
        totalPayout: totalPayout,
        doubleBets: gameSession.doubleBets,
        betAmount: gameSession.betAmount,
        currency: gameSession.currency,
        newBalance: user[balanceField],
        isSplit: true,
        currentHandIndex: lastHandIndex,
        currentHand: gameSession.playerHands[lastHandIndex],
        allHandsComplete: true
      });
    } else {
      // Regular double down (non-split game)
      // Check if player can double (only with 2 cards)
      if (gameSession.playerHand.length !== 2) {
        return res.status(400).json({ error: 'Can only double down on initial two cards' });
      }
      
      // Check if user has sufficient balance for doubling
      const balanceField = gameSession.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      if (user[balanceField] < gameSession.betAmount) {
        return res.status(400).json({ error: 'Insufficient balance to double down' });
      }
      
      // Deduct additional bet amount from user's balance
      user[balanceField] = formatCurrency(user[balanceField] - gameSession.betAmount, gameSession.currency);
      
      // Double the bet amount in the game session
      gameSession.betAmount = formatCurrency(gameSession.betAmount * 2, gameSession.currency);
      
      // Save user with updated balance
      await user.save();
      
      // Update session balance
      req.session.user[balanceField] = user[balanceField];
      
      // Draw one more card for the player
      const card = gameSession.deck.pop();
      gameSession.playerHand.push(card);
      
      // Calculate player's hand value
      const playerValue = calculateHandValue(gameSession.playerHand);
      const busted = playerValue > 21;
      
      // If player busts, end the game immediately
      if (busted) {
        const result = 'lose';
        const payoutMultiplier = 0;
        const payout = formatCurrency(gameSession.betAmount * payoutMultiplier, gameSession.currency);
      
        // Save bet history (Blackjack) for bust outcome
        const betRecord = await saveBlackjackBetHistory({
          user,
          betAmount: gameSession.betAmount,
          payout: payout,
          currency: gameSession.currency
        });
      
        // Broadcast to WebSocket for all outcomes
        if (betRecord && req.app.get('wssBroadcast')) {
          req.app.get('wssBroadcast')({
            type: 'bet',
            username: user.username,
            game: 'Blackjack',
            currency: gameSession.currency,
            betAmount: gameSession.betAmount,
            payout: payout,
            timestamp: betRecord.createdAt,
          });
        }
      
        return res.json({
          gameId: gameSession.id,
          playerHand: gameSession.playerHand,
          dealerHand: [gameSession.dealerHand[0]], // Still only show first dealer card
          playerValue: playerValue,
          busted: busted,
          result: result,
          payout: payout,
          betAmount: gameSession.betAmount,
          currency: gameSession.currency,
          newBalance: user[balanceField]
        });
      }
      
      
      // Dealer draws cards until they have 17 or more
      let dealerValue = calculateHandValue(gameSession.dealerHand);
      while (dealerValue < 17) {
        const dealerCard = gameSession.deck.pop();
        gameSession.dealerHand.push(dealerCard);
        dealerValue = calculateHandValue(gameSession.dealerHand);
      }
      
      // Determine the game result
      let result;
      let payoutMultiplier = 0;
      
      if (playerValue > 21) {
        // Player busts
        result = 'lose';
        payoutMultiplier = 0;
      } else if (dealerValue > 21) {
        // Dealer busts, player wins
        result = 'win';
        payoutMultiplier = 2; // Original bet + 1x win
      } else if (playerValue > dealerValue) {
        // Player has higher value, player wins
        result = 'win';
        payoutMultiplier = 2; // Original bet + 1x win
      } else if (dealerValue > playerValue) {
        // Dealer has higher value, dealer wins
        result = 'lose';
        payoutMultiplier = 0;
      } else {
        // Equal values, it's a push
        result = 'push';
        payoutMultiplier = 1; // Return original bet
      }
      
      // Calculate payout
      const payout = formatCurrency(gameSession.betAmount * payoutMultiplier, gameSession.currency);
      
      // Update user balance if there's a payout
      if (payout > 0) {
        user[balanceField] = formatCurrency(user[balanceField] + payout, gameSession.currency);
        
        // Save user with updated balance
        await user.save();
        
        // Update session balance
        req.session.user[balanceField] = user[balanceField];
      }

      // Save bet history (Blackjack) for all outcomes
  const betRecord = await saveBlackjackBetHistory({
    user,
    betAmount: gameSession.betAmount,
    payout: payout,
    currency: gameSession.currency
  });

  // Broadcast to WebSocket for all outcomes
  if (betRecord && req.app.get('wssBroadcast')) {
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Blackjack',
      currency: gameSession.currency,
      betAmount: gameSession.betAmount,
      payout: payout,
      timestamp: betRecord.createdAt,
    });
  }
      
      // Return updated game state with result
      return res.json({
        gameId: gameSession.id,
        playerHand: gameSession.playerHand,
        dealerHand: gameSession.dealerHand, // Return full dealer hand now
        playerValue: playerValue,
        dealerValue: dealerValue,
        result: result,
        payout: payout,
        betAmount: gameSession.betAmount,
        currency: gameSession.currency,
        newBalance: user[balanceField]
      });
    }
  } catch (err) {
    console.error('Error handling double down action:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Player action: split
 * POST /blackjack/split
 */
router.post('/split', async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.session.user.id;
    
    // Get the game session
    const gameSession = gameSessionsMap.get(gameId);
    
    // Check if game exists
    if (!gameSession) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if this is the user's game
    if (gameSession.userId !== userId) {
      return res.status(403).json({ error: 'Not your game' });
    }
    
    // Check if player can split (only with 2 cards of the same value)
    if (gameSession.playerHand.length !== 2) {
      return res.status(400).json({ error: 'Can only split on initial two cards' });
    }
    
    // Check if the cards have the same value
    const card1Value = gameSession.playerHand[0].value;
    const card2Value = gameSession.playerHand[1].value;
    
    // Convert face cards to their numerical value for comparison
    const getValue = (cardValue) => {
      if (['K', 'Q', 'J'].includes(cardValue)) return '10';
      return cardValue;
    };
    
    if (getValue(card1Value) !== getValue(card2Value)) {
      return res.status(400).json({ error: 'Can only split cards of the same value' });
    }
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has sufficient balance for splitting (needs another bet of the same amount)
    const balanceField = gameSession.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    if (user[balanceField] < gameSession.betAmount) {
      return res.status(400).json({ error: 'Insufficient balance to split' });
    }
    
    // Deduct additional bet amount from user's balance
    user[balanceField] = formatCurrency(user[balanceField] - gameSession.betAmount, gameSession.currency);
    
    // Save user with updated balance
    await user.save();
    
    // Update session balance
    req.session.user[balanceField] = user[balanceField];
    
    // Create two separate hands from the original hand
    const hand1 = [gameSession.playerHand[0]];
    const hand2 = [gameSession.playerHand[1]];
    
    // Draw one card for each hand
    hand1.push(gameSession.deck.pop());
    hand2.push(gameSession.deck.pop());
    
    // Store both hands in the game session
    gameSession.playerHands = [hand1, hand2];
    gameSession.currentHandIndex = 0; // Start with first hand
    gameSession.splitComplete = [false, false]; // Track if play is complete for each hand
    gameSession.doubleBets = [false, false]; // Track if hands have been doubled
    
    // Calculate values for both hands
    const hand1Value = calculateHandValue(hand1);
    const hand2Value = calculateHandValue(hand2);
    
    // Check for blackjack in each hand (automatic stand if found)
    if (hand1Value === 21) {
      gameSession.splitComplete[0] = true;
    }
    
    if (hand2Value === 21) {
      gameSession.splitComplete[1] = true;
    }
    
    // Create a reference to the active hand
    gameSession.playerHand = gameSession.playerHands[gameSession.currentHandIndex];
    
    // Return updated game state
    return res.json({
      gameId: gameSession.id,
      playerHands: gameSession.playerHands,
      currentHandIndex: gameSession.currentHandIndex,
      dealerHand: [gameSession.dealerHand[0]], // Still only show first dealer card
      hand1Value: hand1Value,
      hand2Value: hand2Value,
      betAmount: gameSession.betAmount,
      currency: gameSession.currency,
      newBalance: user[balanceField]
    });
  } catch (err) {
    console.error('Error handling split action:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
