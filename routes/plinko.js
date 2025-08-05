const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // for secure randomness
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');
const BetHistory = require('../models/BetHistory'); // NEW

// Load plinko paths
let plinkoPathsData = null;

async function loadPlinkoPaths() {
  try {
    const pathsFile = await fs.readFile(path.join(__dirname, '../public/data/plinko_paths.json'), 'utf8');
    plinkoPathsData = JSON.parse(pathsFile);
  } catch (err) {
    console.error('Error loading plinko paths:', err);
  }
}

// Load paths on startup
loadPlinkoPaths();

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

const multiplierTables = {
  8: {
    low:    [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3 , 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high:   [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  9: {
      low: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
      medium: [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
      high: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43]
  },
  10: {
      low: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
      medium: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
      high: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76]
  },
  11: {
      low: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
      medium: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
      high: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120]
  },
  12: {
      low: [10, 3, 1.6, 1.4,  1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
      medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
      high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  13: {
      low: [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
      medium: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
      high: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260]
  },
  14: {
      low: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
      medium: [58,  15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
      high: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
  },
  15: {
      low: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
      medium: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
      high: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2,  0.2, 0.2, 0.5, 3, 8, 27, 83, 620]
  },
  16: {
      low: [16, 9, 3, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
      medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
      high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  },

}

// Calculate binomial coefficient (n choose k)
function binomialCoefficient(n, k) {
  if (k === 0 || k === n) return 1n;
  if (k > n) return 0n;
  
  let result = 1n;
  k = BigInt(k);
  n = BigInt(n);
  
  for (let i = 0n; i < k; i++) {
    result = result * (n - i) / (i + 1n);
  }
  
  return result;
}

// Calculate probabilities using ONLY the binomial distribution
function calculateSinkProbabilities(rows) {
  const numRows = parseInt(rows, 10);
  const probs = [];
  
  // For n rows, we have n+1 possible sinks (0 to n)
  for (let k = 0; k <= numRows; k++) {
    const combinations = binomialCoefficient(numRows, k);
    const probability = Number(combinations * 10000n / (2n ** BigInt(numRows))) / 10000;
    probs.push(probability);
  }
  
  return probs;
}

// Select a sink based on probabilities
function selectSink(probabilities) {
  // Generate random number between 0 and 1
  const rand = Math.random(); // Simpler and more reliable for our needs
  
  let cumulativeProb = 0;
  
  // Debug log
  console.log('Random value:', rand);
  
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProb += probabilities[i];
    console.log(`Sink ${i}: cumulative prob ${cumulativeProb}`);
    if (rand < cumulativeProb) {
      return i;
    }
  }
  
  return probabilities.length - 1;
}

// Get a drop position for a sink from pre-computed paths
function getPathForSink(rows, sinkIndex) {
  if (!plinkoPathsData || !plinkoPathsData[rows] || !plinkoPathsData[rows][sinkIndex]) {
    throw new Error('Path data not available');
  }
  
  const paths = plinkoPathsData[rows][sinkIndex];
  // Use crypto for path selection to ensure randomness
  const randomBytes = crypto.randomBytes(4);
  const randomIndex = randomBytes.readUInt32BE(0) % paths.length;
  return paths[randomIndex];
}

// Play endpoint
router.post('/play', async (req, res) => {
  try {
    const { rows, risk, betAmount, currency } = req.body;
    
    // Validate inputs
    if (!rows || !risk || !betAmount || !currency || !multiplierTables[rows] || !multiplierTables[rows][risk]) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    // Validate currency
    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    // Parse bet amount as float and validate
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    // Get user and validate session
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get the correct balance field based on currency
    const balanceField = `balance${currency}`;
    const currentBalance = user[balanceField];

    // Check if user has sufficient balance
    if (currentBalance < bet) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // First deduct the bet amount
    user[balanceField] = currentBalance - bet;
    
    // Calculate probabilities using ONLY binomial distribution
    const probabilities = calculateSinkProbabilities(rows);
    const selectedSink = selectSink(probabilities);
    
    // Calculate win amount
    const multiplier = multiplierTables[rows][risk][selectedSink];
    const winAmountRaw = bet * multiplier;
    const winAmount = formatCurrency(winAmountRaw, currency);

    
    // Add win amount to user's balance
    user[balanceField] += winAmount;
    user[balanceField] = formatCurrency(user[balanceField], currency);

    
    // Save the updated balance
    await user.save();

    // After await user.save()
    req.session.user.balanceUSD = user.balanceUSD;
    req.session.user.balanceLBP = user.balanceLBP;

        // ──────── ✅ NEW: Save to bet history ──────────────
        const betRecord = await BetHistory.create({
          userId: user._id,
          agentId: user.agentId || null,
          agentName: user.agentName || null,
          username: user.username,
          game: 'Plinko',
          currency,
          betAmount: bet,
          payout: winAmount,
        });
    
        // ──────── ✅ NEW: WebSocket broadcast ──────────────
        req.app.get('wssBroadcast')({
          type: 'bet',
          username: user.username,
          game: 'Plinko',
          currency,
          betAmount: bet,
          payout: winAmount,
          timestamp: betRecord.createdAt,
        });

    // Get a pre-computed path that leads to this sink
    const dropX = getPathForSink(rows, selectedSink);
    
    // Return game result with balance updates
    res.json({
      success: true,
      sink: selectedSink,
      multiplier,
      betAmount: bet,
      winAmount,
      dropX,
      probability: probabilities[selectedSink],
      currency,
      previousBalance: currentBalance,
      newBalance: user[balanceField]
    });
    
  } catch (error) {
    console.error('Error in plinko play:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Format Currency Helper
function formatCurrency(value, currency) {
  if (currency === 'USD') {
    return parseFloat(value.toFixed(2));
  } else if (currency === 'LBP') {
    return Math.round(value);
  }
  return value;
}


module.exports = router;
