
// routes/connect.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Multiplier table based on cluster size (3+ connections only)
const CLUSTER_MULTIPLIERS = {
  3: 0.2,
  4: 1.4,
  5: 4.2,
  6: 6.2,
  7: 10.4,
  8: 24.0,
  9: 44.0,
  10: 100.0
};

// Utility: Generate 10 unique hit positions from 0–79 (80 tiles total)
function generateHits() {
  const positions = Array.from({ length: 80 }, (_, i) => i);
  const hits = [];

  while (hits.length < 10) {
    const index = Math.floor(Math.random() * positions.length);
    hits.push(positions.splice(index, 1)[0]);
  }

  return hits; // No need to sort - order doesn't matter for gameplay
}

// Utility: Find clusters among hit positions (optimized)
function clusterHits(hits) {
  // Use Set for O(1) lookup instead of creating full grid
  const hitSet = new Set(hits);
  const visited = new Set();
  const clusters = [];

  function dfs(index, cluster) {
    if (visited.has(index)) return;
    
    const row = Math.floor(index / 8);
    const col = index % 8;
    
    // Check bounds and if this position is a hit
    if (row < 0 || row >= 10 || col < 0 || col >= 8 || !hitSet.has(index)) return;

    visited.add(index);
    cluster.push(index);

    // Check all 8 adjacent positions (orthogonal + diagonal)
    const adjacent = [
      index - 8,     // up
      index + 8,     // down
      index - 1,     // left
      index + 1,     // right
      index - 9,     // up-left
      index - 7,     // up-right
      index + 7,     // down-left
      index + 9      // down-right
    ];

    for (const adjIndex of adjacent) {
      // Only check valid adjacent positions
      if (adjIndex >= 0 && adjIndex < 80) {
        // For left/right, ensure we're in the same row
        if (Math.abs(adjIndex - index) === 1) {
          if (Math.floor(adjIndex / 8) !== Math.floor(index / 8)) continue;
        }
        
        // For diagonal positions, ensure they're within bounds and valid
        if (Math.abs(adjIndex - index) > 1) {
          const currentRow = Math.floor(index / 8);
          const currentCol = index % 8;
          const adjRow = Math.floor(adjIndex / 8);
          const adjCol = adjIndex % 8;
          
          // Check if diagonal is valid (within 1 row and 1 column difference)
          if (Math.abs(adjRow - currentRow) > 1 || Math.abs(adjCol - currentCol) > 1) {
            continue;
          }
        }
        
        dfs(adjIndex, cluster);
      }
    }
  }

  // Find clusters starting from each unvisited hit
  for (const hit of hits) {
    if (!visited.has(hit)) {
      const cluster = [];
      dfs(hit, cluster);
      if (cluster.length > 0) clusters.push(cluster);
    }
  }

  // Filter out clusters with less than 3 connections
  return clusters.filter(cluster => cluster.length >= 3);
}

// Get multiplier for cluster size
function getMultiplierForClusterSize(size) {
  return CLUSTER_MULTIPLIERS[size] || 0;
}

// Bet limits (same as frontend)
const BET_LIMITS = {
  USD: { min: 0.10, max: 1000 },
  LBP: { min: 10000, max: 100000000 }
};

// Main play route
router.post('/play', async (req, res) => {
  const { betAmount, currency } = req.body;

  if (!['USD', 'LBP'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  if (typeof betAmount !== 'number' || betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  // Check bet limits
  const limits = BET_LIMITS[currency];
  if (betAmount < limits.min || betAmount > limits.max) {
    return res.status(400).json({ 
      error: `Bet amount must be between ${limits.min} and ${limits.max} ${currency}` 
    });
  }

  const user = await User.findById(req.session.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const balanceKey = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
  if (user[balanceKey] < betAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Deduct bet
  user[balanceKey] -= betAmount;
  await user.save();
  req.session.user[balanceKey] = user[balanceKey];

  // Generate 10 hit positions
  const hits = generateHits();

  // Cluster the hits
  const clusters = clusterHits(hits);

  // Calculate win from clusters
  let totalMultiplier = 0;
  for (const cluster of clusters) {
    totalMultiplier += getMultiplierForClusterSize(cluster.length);
  }

  // Round totalMultiplier to 2 decimal places
  totalMultiplier = +(totalMultiplier).toFixed(2);
  const winAmount = +(betAmount * totalMultiplier).toFixed(2);

  // Add winnings
  if (winAmount > 0) {
    user[balanceKey] += winAmount;
    await user.save();
    req.session.user[balanceKey] = user[balanceKey];
  }

  // ─── Save to Bet History ───────────────────────────────
  const betRecord = await BetHistory.create({
    userId: user._id,
    agentId: user.agentId || null,
    agentName: user.agentName || null,
    username: user.username,
    game: 'Connect',
    currency,
    betAmount: betAmount,
    payout: winAmount,
  });

  // ─── Broadcast to WebSocket clients ─────────────────────
  req.app.get('wssBroadcast')({
    type: 'bet',
    username: user.username,
    game: 'Connect',
    currency,
    betAmount: betAmount,
    payout: winAmount,
    timestamp: betRecord.createdAt,
  });

  res.json({
    success: true,
    winAmount,
    currency,
    hits,
    clusters, // array of arrays
    totalMultiplier,
    newBalance: +user[balanceKey].toFixed(2),
  });
});

module.exports = router;
