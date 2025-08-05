// routes/mines.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory'); // NEW

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Helper Function for saving Mines bet history
async function saveMinesBetHistory({ user, betAmount, payout, currency }) {
  try {
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Mines',
      currency,
      betAmount,
      payout
    });

    return betRecord; // ⬅️ return it!
  } catch (err) {
    console.error('Error saving Mines bet history:', err);
    return null; // Optional: return null so you can check for failure
  }
}

const TOTAL_TILES = 25;
const HOUSE_EDGE = 0.99;

const MULTIPLIER_TABLE = {
  1:  [1.01, 1.08, 1.12, 1.18, 1.24, 1.30, 1.37, 1.46, 1.55, 1.65, 1.77, 1.90, 2.06, 2.25, 2.47, 2.75, 3.09, 3.54, 4.12, 4.95, 6.19, 8.25, 12.37, 24.7],
  2:  [1.08, 1.17, 1.29, 1.41, 1.56, 1.74, 1.94, 2.18, 2.47, 2.83, 3.26, 3.81, 4.50, 5.4, 6.6, 8.25, 10.61, 14.14, 19.80, 29.70, 49.50, 99, 297],
  3:  [1.12, 1.29, 1.48, 1.71, 2.00, 2.35, 2.79, 3.35, 4.07, 5.00, 6.26, 7.96, 10.35, 13.80, 18.97, 27.11, 40.66, 65.06, 113.85, 227.70, 569.25, 2277],
  4:  [1.18, 1.41, 1.71, 2.09, 2.58, 3.23, 4.09, 5.26, 6.88, 9.17, 12.51, 17.52, 25.30, 37.95, 59.64, 99.39, 178.91, 357.81, 834.90, 2504, 12523],
  5:  [1.24, 1.56, 2.00, 2.58, 3.39, 4.52, 6.14, 8.50, 12.04, 17.52, 26.77, 40.87, 66.41, 113.85, 208.72, 417.45, 939.26, 2504, 8766, 52598],
  6:  [1.30, 1.74, 2.35, 3.23, 4.52, 6.46, 9.44, 14.17, 21.89, 35.03, 58.38, 102.17, 189.75, 379.5, 834.9, 2087, 6261, 25047, 175329],
  7:  [1.37, 1.94, 2.79, 4.09, 6.14, 9.44, 14.95, 24.47, 41.60, 73.95, 138.66, 277.33, 600.87, 1442, 3965, 13219, 59486, 475893],
  8:  [1.46, 2.18, 3.35, 5.26, 8.50, 14.17, 24.47, 44.05, 83.20, 166.40, 356.56, 831.98, 2163, 6489, 23794, 118973, 1070759],
  9:  [1.55, 2.47, 4.07, 6.88, 12.04, 21.89, 41.60, 83.20, 176.80, 404.10, 1010, 2828, 9193, 36773, 202254, 2022545],
  10: [1.65, 2.83, 5.00, 9.17, 17.52, 35.03, 73.95, 166.4, 404.10, 1077, 3232, 11314, 49031, 294188, 3236072],
  11: [1.77, 3.26, 6.26, 12.51, 26.27, 58.38, 138.66, 356.56, 1010, 3232, 12123, 56574, 367735, 4412826],
  12: [1.90, 3.81, 7.96, 17.52, 40.87, 102.17, 277.33, 831.98, 2828, 11314, 56574, 396022, 5148297],
  13: [2.06, 4.50, 10.35, 25.30, 66.41, 189.75, 600.87, 2163, 9193, 49031, 367735, 5148297],
  14: [2.25, 5.40, 13.80, 37.95, 113.85, 379.50, 1442, 6489, 36773, 294188, 4412826],
  15: [2.47, 6.60, 18.97, 59.64, 208.72, 834.90, 3965, 23794, 202254, 3236072],
  16: [2.75, 8.25, 27.11, 99.39, 417.45, 2087, 13219, 118973, 2022545],
  17: [3.09, 10.61, 40.66, 178.91, 939,26, 6261, 59486, 1070759],
  18: [3.54, 14.14, 65.06, 357.81, 2504, 25047, 475893],
  19: [4.12, 19.80, 113.85, 834.90, 8766, 175329],
  20: [4.95, 29.70, 227.70, 2504, 52598],
  21: [6.19, 49.50, 569.25, 12523],
  22: [8.25, 99, 2277],
  23: [12.38, 297],
  24: [24.75]
};


// Replace the old compute‐on‐the‐fly version with a table lookup:

function generateMultipliers(totalTiles, mineCount) {
  // 1) Calculate how many safe tiles there are:
  const safeTiles = totalTiles - mineCount;

  // 2) Get the full array for this mineCount:
  const tableEntry = MULTIPLIER_TABLE[mineCount];

  if (!tableEntry) {
    throw new Error(`No MULTIPLIER_TABLE entry for mineCount=${mineCount}`);
  }

  // 3) The tableEntry array should have exactly "safeTiles" elements:
  if (tableEntry.length !== safeTiles) {
    console.warn(
      `Warning: MULTIPLIER_TABLE[${mineCount}].length (${tableEntry.length}) ` +
      `does not match safeTiles (${safeTiles}). ` +
      `Truncating or padding with 0.`
    );
  }

  // 4) Return exactly the first "safeTiles" multipliers:
  return tableEntry.slice(0, safeTiles);
}

function generateMinePositions(tileCount, mineCount) {
  const positions = Array(tileCount).fill(false);
  let placed = 0;

  while (placed < mineCount) {
    const i = Math.floor(Math.random() * tileCount);
    if (!positions[i]) {
      positions[i] = true;
      placed++;
    }
  }

  return positions;
}

router.post('/start', async (req, res) => {
  const { betAmount, mineCount, currency } = req.body;
  
  if (!['USD', 'LBP'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }
  if (mineCount < 1 || mineCount >= TOTAL_TILES) {
    return res.status(400).json({ error: 'Invalid mine count' });
  }
  if (betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
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
  
  // Update session balance
  req.session.user[balanceField] = user[balanceField];

  const multipliers = generateMultipliers(TOTAL_TILES, mineCount);
  const mines = generateMinePositions(TOTAL_TILES, mineCount);

  req.session.minesGame = {
    active: true,
    revealed: Array(TOTAL_TILES).fill(false),
    mineCount,
    mines,
    multipliers,
    revealedCount: 0,
    betAmount,
    currency,
    safeTilesCount: TOTAL_TILES - mineCount // Add count of safe tiles
  };

  return res.json({ 
    success: true, 
    balance: user[balanceField],
    mines: TOTAL_TILES 
  });
});

router.post('/reveal', async (req, res) => {
  const { index } = req.body;
  const game = req.session.minesGame;

  if (!game || !game.active || index < 0 || index >= TOTAL_TILES) {
    return res.status(400).json({ error: 'Invalid game state or index' });
  }
  if (game.revealed[index]) {
    return res.status(400).json({ error: 'Position already revealed' });
  }

  const isMine = game.mines[index];
  game.revealed[index] = true;

  if (isMine) {
    game.active = false;

    // Save bet history (get user from session first)
    const user = await User.findById(req.session.user.id);
    if (user) {
      const betRecord = await saveMinesBetHistory({
        user,
        betAmount: game.betAmount,
        payout: 0,
        currency: game.currency
      });

      if (betRecord && req.app.get('wssBroadcast')) {
        req.app.get('wssBroadcast')({
          type: 'bet',
          username: user.username,
          game: 'Mines',
          currency: game.currency,
          betAmount: game.betAmount,
          payout: 0,
          timestamp: betRecord.createdAt
        });
      }
    }

    // Convert mine positions array to indices
    const mineIndices = [];
    game.mines.forEach((isMine, index) => {
        if (isMine) mineIndices.push(index);
    });
    return res.json({ 
        mineHit: true, 
        index,
        allMinePositions: mineIndices  // Send all mine positions
    });
  }

  game.revealedCount++;
  const currentMultiplier = game.multipliers[game.revealedCount - 1];

  // Check if all safe tiles have been revealed (auto-win condition)
  if (game.revealedCount === game.safeTilesCount) {
    // Handle win
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const winAmount = parseFloat((game.betAmount * currentMultiplier).toFixed(2));
    const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    
    console.log('Auto-win calculation:', {
        betAmount: game.betAmount,
        multiplier: currentMultiplier,
        calculatedWinAmount: winAmount,
        currency: game.currency
    });
    
    user[balanceField] += winAmount;
    await user.save();
    
    // Update session balance
    req.session.user[balanceField] = user[balanceField];
    game.active = false;

    const betRecord = await saveMinesBetHistory({
      user,
      betAmount: game.betAmount,
      payout: winAmount,
      currency: game.currency
    });

    if (betRecord && req.app.get('wssBroadcast')) {
      req.app.get('wssBroadcast')({
        type: 'bet',
        username: user.username,
        game: 'Mines',
        currency: game.currency,
        betAmount: game.betAmount,
        payout: winAmount,
        timestamp: betRecord.createdAt
      });
    }

    // Get mine positions
    const mineIndices = [];
    game.mines.forEach((isMine, index) => {
        if (isMine) mineIndices.push(index);
    });

    return res.json({
        mineHit: false,
        index,
        revealedCount: game.revealedCount,
        multiplier: currentMultiplier,
        gameWon: true,
        currency: game.currency,
        winAmount,
        balance: user[balanceField],
        allMinePositions: mineIndices
    });
  }

  return res.json({
    mineHit: false,
    index,
    revealedCount: game.revealedCount,
    multiplier: currentMultiplier
  });
});

router.post('/cashout', async (req, res) => {
  const game = req.session.minesGame;

  if (!game || !game.active) {
    return res.status(400).json({ error: 'Invalid game state' });
  }

  const user = await User.findById(req.session.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const currentMultiplier = game.multipliers[game.revealedCount - 1];
  const winAmount = parseFloat((game.betAmount * currentMultiplier).toFixed(2));
  const balanceField = game.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

  console.log('Cashout calculation:', {
    betAmount: game.betAmount,
    multiplier: currentMultiplier,
    calculatedWinAmount: winAmount,
    currency: game.currency,
    revealedCount: game.revealedCount,
    totalSafeTiles: game.safeTilesCount,
    calculation: `${game.betAmount} * ${currentMultiplier} = ${winAmount}`
  });

  user[balanceField] += winAmount;
  await user.save();
  
  // Update session balance
  req.session.user[balanceField] = user[balanceField];
  game.active = false;

  
  // Save bet history
  const betRecord = await saveMinesBetHistory({
    user,
    betAmount: game.betAmount,
    payout: winAmount,
    currency: game.currency
  });

  // Emit WebSocket broadcast
  if (betRecord && req.app.get('wssBroadcast')) {
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Mines',
      currency: game.currency,
      betAmount: game.betAmount,
      payout: winAmount,
      timestamp: betRecord.createdAt
    });
  }

  // Get mine positions
  const mineIndices = [];
  game.mines.forEach((isMine, index) => {
      if (isMine) mineIndices.push(index);
  });

  return res.json({
    success: true,
    winnings: winAmount,
    balance: user[balanceField],
    currency: game.currency,
    multiplier: currentMultiplier,
    allMinePositions: mineIndices
  });
});

module.exports = router;
