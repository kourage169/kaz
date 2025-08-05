const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Helper Function for saving Chicken bet history
async function saveChickenBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Chicken',
      currency,
      betAmount,
      payout
    });

    return betRecord; // ⬅️ return it!
  } catch (err) {
    console.error('Error saving Chicken bet history:', err);
    return null; // Optional: return null so you can check for failure
  }
}

// Add bet limits at the top with other constants
const BET_LIMITS = {
  USD: { min: 0.10, max: 1000 },
  LBP: { min: 10000, max: 100000000 }
};

// Helper to validate bet amounts
function isValidBet(amount, currency) {
  const minBet = currency === 'USD' ? 0.10 : 1000;
  const maxBet = currency === 'USD' ? 100 : 1000000;
  return amount >= minBet && amount <= maxBet;
}

const multiplierTable = {
  easy: {
    bombs: 1,
    startMultiplier: 1.0,
    maxMultiplier: 24.0,
    steps: [
      1.00, 1.15, 1.30, 1.50, 1.75,
      2.05, 2.40, 2.80, 3.25, 3.75,
      4.30, 5.00, 5.75, 6.60, 7.50,
      8.50, 9.75, 11.00, 12.50, 24.00
    ]
  },
  medium: {
    bombs: 3,
    startMultiplier: 1.09,
    maxMultiplier: 500.0,
    steps: [
      1.09, 1.30, 1.55, 1.85, 2.25,
      2.75, 3.40, 4.25, 5.50, 7.00,
      9.00, 12.00, 16.00, 22.00, 32.00,
      48.00, 75.00, 120.00, 200.00, 500.00
    ]
  },
  hard: {
    bombs: 5,
    startMultiplier: 1.20,
    maxMultiplier: 1000.0,
    steps: [
      1.20, 1.45, 1.75, 2.10, 2.55,
      3.10, 3.80, 4.70, 6.00, 8.00,
      10.50, 14.00, 19.00, 26.00, 36.00,
      52.00, 80.00, 150.00, 300.00, 1000.00
    ]
  }
};

const noBombChance = {
  easy: 100,    // 2%
  medium: 0.01,  // 1%
  hard: 0.001    // 0.1%
};

// Helper to get a random number
function generateGamePath(mode = 'medium') {
  const totalSteps = 20;

  const chance = noBombChance[mode] || 0;
  const hasBombs = Math.random() >= chance;

  const bombCount = hasBombs ? multiplierTable[mode].bombs : 0;
  const bombIndices = new Set();

  // Generate unique bomb positions
  while (bombIndices.size < bombCount) {
    const index = Math.floor(Math.random() * totalSteps);
    bombIndices.add(index);
  }

  const path = [];
  for (let i = 0; i < totalSteps; i++) {
    path.push({
      step: i,
      isBomb: bombIndices.has(i),
      multiplier: multiplierTable[mode].steps[i]
    });
  }

  return {
    mode,
    hasBombs,
    bombIndices: Array.from(bombIndices),
    path
  };
}

// Generate step results - determine which steps have bombs
function generateResults(difficulty) {
  const steps = 20; // Total steps in the game
  let bombs = [];
  
  // Place bombs based on difficulty
  const bombCount = {
    'easy': 1,
    'medium': 3,
    'hard': 5
  }[difficulty] || 3;
  
  // Generate unique bomb positions
  while (bombs.length < bombCount) {
    const position = Math.floor(Math.random() * steps) + 1; // Steps 1-20
    if (!bombs.includes(position)) {
      bombs.push(position);
    }
  }
  
  return { bombs };
}

// POST /chicken/start
router.post('/start', async (req, res) => {
  try {
    const { betAmount, currency, difficulty = 'medium' } = req.body;

    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    if (!isValidBet(betAmount, currency)) {
      return res.status(400).json({ error: 'Invalid bet amount for this currency' });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
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

    // Generate game path
    const gameData = generateGamePath(difficulty);
    
    // Check if the first step is a bomb
    const firstStepIsBomb = gameData.path[0].isBomb;
    
    // Get the current multiplier for step 1
    const currentMultiplier = multiplierTable[difficulty].steps[0];
    
    if (firstStepIsBomb) {
      // First step is a bomb - game over immediately
      
  // Save instant loss
  const betRecord = await saveChickenBetHistory({
    user,
    betAmount,
    payout: 0,
    currency
  });

  // Broadcast instant loss
  if (betRecord && req.app.get('wssBroadcast')) {
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Chicken',
      currency,
      betAmount,
      payout: 0,
      timestamp: betRecord.createdAt,
    });
  }

      return res.json({
        success: true,
        balance: user[balanceField],
        gameState: {
          currentStep: 1,
          difficulty,
          currentMultiplier: currentMultiplier,
          result: 'bomb',
          gameOver: true,
          message: 'You hit a bomb on your first step! Game over.'
        }
      });
    }

    // Save game state in session - start at step 1 instead of 0
    req.session.chickenGame = {
      active: true,
      betAmount,
      currency,
      difficulty,
      currentStep: 1, // Start at step 1 (first sewer)
      gameData
    };

    res.json({
      success: true,
      balance: user[balanceField],
      gameState: {
        currentStep: 1,
        difficulty,
        currentMultiplier: currentMultiplier,
        result: 'safe'
      }
    });

  } catch (err) {
    console.error('Error in /chicken/start:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /chicken/step - Handle step progression
router.post('/step', async (req, res) => {
  try {
    // Get the step number from the request
    const { step } = req.body;
    
    // Validate game exists
    const game = req.session.chickenGame;
    if (!game || !game.active) {
      return res.status(400).json({ error: 'No active game found' });
    }
    
    // Convert step to number and validate
    const requestedStep = parseInt(step);
    
    // Validate step is the next expected step
    if (isNaN(requestedStep) || requestedStep !== game.currentStep + 1) {
      return res.status(400).json({ 
        error: 'Invalid step. You must advance one step at a time.',
        currentStep: game.currentStep
      });
    }
    
    // Check if step is out of bounds
    if (requestedStep > 20) {
      return res.status(400).json({ error: 'Invalid step. Maximum step is 20.' });
    }
    
    // Check if the requested step is a bomb
    const stepIndex = requestedStep - 1; // Convert to 0-based for array access
    const isBomb = game.gameData.path[stepIndex].isBomb;
    
    // Get user and multiplier
    const user = await User.findById(req.session.user.id);
    const currentMultiplier = multiplierTable[game.difficulty].steps[stepIndex];
    
    // Handle bomb case
    if (isBomb) {
      // Game over - player loses
      req.session.chickenGame = null; // Clear game data

      
  // Save loss
  const betRecord = await saveChickenBetHistory({
    user,
    betAmount: game.betAmount,
    payout: 0,
    currency: game.currency
  });

  // Broadcast loss
  if (betRecord && req.app.get('wssBroadcast')) {
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Chicken',
      currency: game.currency,
      betAmount: game.betAmount,
      payout: 0,
      timestamp: betRecord.createdAt,
    });
  }
      
      return res.json({
        success: true,
        result: 'bomb',
        message: 'You hit a bomb! Game over.',
        gameOver: true,
        step: requestedStep,
        multiplier: currentMultiplier,
        balance: user[game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP']
      });
    }
    
    // Update game state
    game.currentStep = requestedStep;
    
    // Check if this is the final step (win condition)
    const isLastStep = requestedStep === 20;
    
    if (isLastStep) {
      // Player wins - calculate payout
      const winAmount = game.betAmount * currentMultiplier;
      const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      
      // Add winnings to user balance
      user[balanceField] += winAmount;
      await user.save();
      req.session.user[balanceField] = user[balanceField];
      
      // Clear game data
      req.session.chickenGame = null;

       // Save auto win
  const betRecord = await saveChickenBetHistory({
    user,
    betAmount: game.betAmount,
    payout: winAmount,
    currency: game.currency
  });

  // Broadcast auto win
  if (betRecord && req.app.get('wssBroadcast')) {
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Chicken',
      currency: game.currency,
      betAmount: game.betAmount,
      payout: winAmount,
      timestamp: betRecord.createdAt,
    });
  }

      
      return res.json({
        success: true,
        result: 'win',
        message: 'Congratulations! You reached the end safely!',
        gameOver: true,
        step: requestedStep,
        multiplier: currentMultiplier,
        winAmount: winAmount,
        balance: user[balanceField]
      });
    }
    
    // Safe step - continue game
    return res.json({
      success: true,
      result: 'safe',
      message: 'Safe step!',
      gameOver: false,
      step: requestedStep,
      multiplier: currentMultiplier
    });
    
  } catch (err) {
    console.error('Error in /chicken/step:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /chicken/cashout - Handle early cashout
router.post('/cashout', async (req, res) => {
  try {
    // Validate game exists
    const game = req.session.chickenGame;
    if (!game || !game.active) {
      return res.status(400).json({ error: 'No active game found' });
    }
    
    // Cannot cashout at step 0
    if (game.currentStep <= 0) {
      return res.status(400).json({ error: 'Cannot cashout before making at least one step' });
    }
    
    // Get current step info
    const stepIndex = game.currentStep - 1; // Convert to 0-based for array access
    const currentMultiplier = multiplierTable[game.difficulty].steps[stepIndex];
    
    // Calculate winnings
    const winAmount = game.betAmount * currentMultiplier;
    const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    
    // Get user and update balance
    const user = await User.findById(req.session.user.id);
    user[balanceField] += winAmount;
    await user.save();
    req.session.user[balanceField] = user[balanceField];
    
    // Prepare bombSteps array (1-based step numbers with bombs)
    const bombSteps = game.gameData.path
      .map((step, idx) => step.isBomb ? idx + 1 : null)
      .filter(x => x !== null);
    
    // Clear game state
    req.session.chickenGame = null;

    // Save cashout win
const betRecord = await saveChickenBetHistory({
  user,
  betAmount: game.betAmount,
  payout: winAmount,
  currency: game.currency
});

// Broadcast cashout win
if (betRecord && req.app.get('wssBroadcast')) {
  req.app.get('wssBroadcast')({
    type: 'bet',
    username: user.username,
    game: 'Chicken',
    currency: game.currency,
    betAmount: game.betAmount,
    payout: winAmount,
    timestamp: betRecord.createdAt,
  });
}
    
    // Return success
    return res.json({
      success: true,
      result: 'cashout',
      message: `Successfully cashed out at multiplier ${currentMultiplier.toFixed(2)}x!`,
      step: game.currentStep,
      multiplier: currentMultiplier,
      winAmount: winAmount,
      balance: user[balanceField],
      bombSteps: bombSteps
    });
    
  } catch (err) {
    console.error('Error in /chicken/cashout:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
