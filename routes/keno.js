// routes/cases.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Helper Function for saving Keno bet history
async function saveKenoBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Keno',
      currency,
      betAmount,
      payout
    });

    return betRecord;
  } catch (err) {
    console.error('Error saving Keno bet history:', err);
    return null;
  }
}

// Keno hit chances (includes 0 hits)
const kenoChances = {
    1: [0.75, 0.25],
    2: [0.5576923077, 0.3846153846, 0.0576923077],
    3: [0.4109311741, 0.4402834008, 0.1366396761, 0.0121457490],
    4: [0.2998686946, 0.4442499179, 0.2141919247, 0.0393916183, 0.0022978444],
    5: [0.2165718350, 0.4164842981, 0.2776561987, 0.0793303425, 0.0095743517, 0.0003829741],
    6: [0.1546941679, 0.3712660028, 0.3212878871, 0.1269285480, 0.0237991027, 0.0019695809, 0.0000547106],
    7: [0.1091958832, 0.3184879926, 0.3439670320, 0.1763933498, 0.0457316092, 0.0058797783, 0.0003379183, 0.0000064365],
    8: [0.0761062216, 0.2647172926, 0.3474414465, 0.2223625258, 0.0748335423, 0.0133037409, 0.0011878340, 0.0000468112, 0.0000005851],
    9: [0.0523230274, 0.2140487483, 0.3350328234, 0.2605810849, 0.1094440557, 0.0252563205, 0.0031180643, 0.0001909019, 0.0000049371, 0.0000000366],
    10: [0.0354446314, 0.1687839592, 0.3107159249, 0.2882002782, 0.1471022253, 0.0423654409, 0.0067893335, 0.0005747584, 0.000023093, 0.0000003539, 0.0000000012]
};
  
// Keno multipliers (includes 0 hits)
const kenoMultipliers = {
    // Classic Risk Mode
    classic: {
      1:  [0.00, 3.96],
      2:  [0.00, 1.90, 4.50],
      3:  [0.00, 1.00, 3.10, 10.40],
      4:  [0.00, 0.80, 1.80, 5.00, 22.50],
      5:  [0.00, 0.25, 1.40, 4.10, 16.50, 36.00],
      6:  [0.00, 0.00, 1.00, 3.68, 7.00, 16.50, 40.00],
      7:  [0.00, 0.00, 0.47, 3.00, 4.50, 14.00, 31.00, 60.00],
      8:  [0.00, 0.00, 0.00, 2.20, 4.00, 13.00, 22.00, 55.00, 70.00],
      9:  [0.00, 0.00, 0.00, 1.55, 3.00, 8.00, 15.00, 44.00, 60.00, 85.00],
      10: [0.00, 0.00, 0.00, 1.40, 2.25, 4.50, 8.00, 17.00, 50.00, 80.00, 100.00]
    },
    
    // Low risk Mode
    low: {
        1:  [0.70, 1.85],
        2:  [0.00, 2.00, 3.80],
        3:  [0.00, 1.10, 1.38, 26.00],
        4:  [0.00, 0.00, 2.20, 7.90, 90.00],
        5:  [0.00, 0.00, 1.50, 4.20, 13.00, 300.00],
        6:  [0.00, 0.00, 1.10, 2.00, 6.20, 100.00, 700.00],
        7:  [0.00, 0.00, 1.10, 1.60, 3.50, 15.00, 225.00, 700.00],
        8:  [0.00, 0.00, 1.10, 1.50, 2.00, 5.50, 39.00, 100.00, 800.00],
        9:  [0.00, 0.00, 1.10, 1.30, 1.70, 2.50, 7.50, 50.00, 250.00, 1000.00],
        10: [0.00, 0.00, 1.10, 1.20, 1.30, 1.80, 3.50, 13.00, 50.00, 250.00, 1000.00]
      },

    // Medium Risk Mode
    medium: {
        1:  [0.40, 2.75],
        2:  [0.00, 1.80, 5.10],
        3:  [0.00, 0.00, 2.80, 50.00],
        4:  [0.00, 0.00, 1.70, 10.00, 100.00],
        5:  [0.00, 0.00, 1.40, 4.00, 14.00, 390.00],
        6:  [0.00, 0.00, 0.00, 3.00, 9.00, 180.00, 710.00],
        7:  [0.00, 0.00, 0.00, 2.00, 7.00, 30.00, 400.00, 800.00],
        8:  [0.00, 0.00, 0.00, 2.00, 4.00, 11.00, 67.00, 400.00, 900.00],
        9:  [0.00, 0.00, 0.00, 2.00, 2.50, 5.00, 15.00, 100.00, 500.00, 1000.00],
        10: [0.00, 0.00, 0.00, 1.60, 2.00, 4.00, 7.00, 26.00, 100.00, 500.00, 1000.00]
      },

    // High Risk Mode
    high: {
        1:  [0.00, 3.96],
        2:  [0.00, 0.00, 17.10],
        3:  [0.00, 0.00, 0.00, 81.50],
        4:  [0.00, 0.00, 0.00, 10.00, 259.00],
        5:  [0.00, 0.00, 0.00, 4.50, 48.00, 450.00],
        6:  [0.00, 0.00, 0.00, 0.00, 11.00, 350.00, 710.00],
        7:  [0.00, 0.00, 0.00, 0.00, 7.00, 90.00, 400.00, 800.00],
        8:  [0.00, 0.00, 0.00, 0.00, 5.00, 20.00, 270.00, 600.00, 900.00],
        9:  [0.00, 0.00, 0.00, 0.00, 4.00, 11.00, 56.00, 500.00, 800.00, 1000.00],
        10: [0.00, 0.00, 0.00, 0.00, 3.50, 8.00, 13.00, 63.00, 500.00, 800.00, 1000.00]
      },

  };

// Generate keno results based on difficulty and selected numbers
function generateKenoResults(difficulty, selectedNumbers) {
  const config = kenoMultipliers[difficulty];
  if (!config) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  const numSelected = selectedNumbers.length;
  const chances = kenoChances[numSelected];
  const multipliers = config[numSelected];
  
  if (!chances || !multipliers) {
    throw new Error(`Invalid number of selections: ${numSelected}`);
  }

  // Generate 10 random hits from all 40 numbers
  const allNumbers = Array.from({length: 40}, (_, i) => i + 1); // 1-40
  const shuffledNumbers = allNumbers.sort(() => 0.5 - Math.random());
  const tenHits = shuffledNumbers.slice(0, 10);
  
  // Check which selected numbers hit
  const selectedHits = selectedNumbers.filter(num => {
    const blockNumber = parseInt(num.split(',')[0]) * 8 + parseInt(num.split(',')[1]) + 1;
    return tenHits.includes(blockNumber);
  });
  
  // Calculate actual number of hits
  const actualHits = selectedHits.length;
  
  // Get the multiplier for the actual number of hits
  const multiplier = multipliers[actualHits];
  
  return {
    hits: actualHits,
    multiplier,
    totalMultiplier: parseFloat(multiplier.toFixed(2)),
    selectedNumbers,
    tenHits,
    selectedHits
  };
}

// Calculate winnings based on hits and multiplier
function calculateWinnings(hits, multiplier, betAmount) {
  const winAmount = parseFloat((betAmount * multiplier).toFixed(2));
  
  return {
    winAmount,
    hits,
    multiplier: parseFloat(multiplier.toFixed(2))
  };
}

// Play route
router.post('/play', async (req, res) => {
  const { betAmount, currency, difficulty, selectedNumbers } = req.body;
  
  // Validate inputs
  if (!['USD', 'LBP'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }
  
  if (!kenoMultipliers[difficulty]) {
    return res.status(400).json({ error: 'Invalid difficulty' });
  }
  
  if (!Array.isArray(selectedNumbers) || selectedNumbers.length < 1 || selectedNumbers.length > 10) {
    return res.status(400).json({ error: 'Must select between 1 and 10 numbers' });
  }
  
  if (betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  
  // Check user balance
  const user = await User.findById(req.session.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
  if (user[balanceField] < betAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Deduct bet
  user[balanceField] -= betAmount;
  await user.save();
  
  // Update session balance
  req.session.user[balanceField] = user[balanceField];
  
  // Generate results and calculate winnings
  const { hits, multiplier, totalMultiplier, tenHits, selectedHits } = generateKenoResults(difficulty, selectedNumbers);
  const { winAmount } = calculateWinnings(hits, multiplier, betAmount);
  
  // Add winnings if any
  if (winAmount > 0) {
    user[balanceField] += winAmount;
    await user.save();
    req.session.user[balanceField] = user[balanceField];
  }
  
  // Save bet history
  const betRecord = await saveKenoBetHistory({
    user,
    betAmount,
    payout: winAmount,
    currency
  });
  
  // Broadcast if websocket is available
  if (betRecord && req.app.get('wssBroadcast')) {
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Keno',
      currency,
      betAmount,
      payout: winAmount,
      timestamp: betRecord.createdAt
    });
  }
  
  return res.json({
    success: true,
    winAmount,
    currency,
    hits,
    multiplier: totalMultiplier,
    selectedNumbers,
    tenHits,
    selectedHits,
    newBalance: parseFloat(user[balanceField].toFixed(2))
  });
});

module.exports = router;