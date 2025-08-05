const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware: Ensure logged in
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Load path data once on server start
const aviadataPath = path.join(__dirname, '../public/data/aviamaster_paths.json');
let allPaths = [];

try {
  const file = fs.readFileSync(aviadataPath, 'utf-8');
  allPaths = JSON.parse(file);
  console.log(`Loaded ${allPaths.length} Aviamaster paths`);
} catch (err) {
  console.error('Failed to load Aviamaster path data:', err.message);
}

// Tier config
const tiers = {
  T0: { min: 0.1, max: 0.5, weight: 35, paths: [] },
  T1: { min: 0.5, max: 2, weight: 25, paths: [] },
  T2: { min: 2, max: 10, weight: 15, paths: [] },
  T3: { min: 10, max: 100, weight: 10, paths: [] },
  T4: { min: 100, max: 500, weight: 5, paths: [] },
  T5: { min: 500, max: 1000, weight: 2, paths: [] },
  T6: { min: 1000, max: Infinity, weight: 1, paths: [] },
};

// Distribute paths into tiers
for (const pathData of allPaths) {
  for (const tierKey in tiers) {
    const tier = tiers[tierKey];
    if (pathData.totalMultiplier >= tier.min && pathData.totalMultiplier < tier.max) {
      tier.paths.push(pathData);
      break;
    }
  }
}

// === BET LIMITS ===
const BET_LIMITS = {
  USD: { min: 0.10, max: 1000 },
  LBP: { min: 10000, max: 100000000 },
};

function isValidBet(bet, currency) {
  if (!BET_LIMITS[currency]) return false;
  return bet >= BET_LIMITS[currency].min && bet <= BET_LIMITS[currency].max;
}

// === Helper: Weighted Random Tier Picker ===
function pickWeightedTier() {
  const tierEntries = Object.entries(tiers).filter(([_, t]) => t.paths.length > 0);
  
  // If no tiers have paths, use a default path
  if (tierEntries.length === 0) {
    return {
      paths: [{
        layoutSequence: ['layout1', 'layout2', 'layout3', 'layout4', 'layout5'],
        totalMultiplier: 1.5,
        result: 'landed'
      }]
    };
  }
  
  const totalWeight = tierEntries.reduce((sum, [_, t]) => sum + t.weight, 0);
  let rnd = Math.random() * totalWeight;

  for (const [key, tier] of tierEntries) {
    if (rnd < tier.weight) return tier;
    rnd -= tier.weight;
  }
  return tierEntries[0][1]; // fallback
}

// === Main Spin Endpoint ===
router.post('/play', async (req, res) => {
  try {
    const { betAmount, currency } = req.body;
    
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    
    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }
    
    if (!isValidBet(betAmount, currency)) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const balanceKey = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    if (user[balanceKey] < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Select tier & path
    const chosenTier = pickWeightedTier();
    const chosenPath = chosenTier.paths[Math.floor(Math.random() * chosenTier.paths.length)];

    // Calculate win amount
    const winAmount = +(betAmount * chosenPath.totalMultiplier).toFixed(2);

    // Deduct bet first
    user[balanceKey] -= betAmount;

    // Add win if landed
    if (chosenPath.result === 'landed') {
      user[balanceKey] += winAmount;
    }

    await user.save();
    req.session.user[balanceKey] = user[balanceKey];

      // Save to bet history
      const betRecord = await BetHistory.create({
        userId: user._id,
        agentId: user.agentId || null,
        agentName: user.agentName || null,
        username: user.username,
        game: 'Aviamasters',
        currency,
        betAmount,
        payout: chosenPath.result === 'landed' ? winAmount : 0,
      });
  
      // Broadcast via WebSocket
      req.app.get('wssBroadcast')({
        type: 'bet',
        username: user.username,
        game: 'Aviamasters',
        currency,
        betAmount,
        payout: chosenPath.result === 'landed' ? winAmount : 0,
        timestamp: betRecord.createdAt,
      });

    // Send result to frontend
    res.json({
      layoutSequence: chosenPath.layoutSequence,
      totalMultiplier: chosenPath.totalMultiplier,
      result: chosenPath.result,
      winAmount,
      newBalance: user[balanceKey]
    });
  } catch (err) {
    console.error('Error in /aviamaster/play:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
