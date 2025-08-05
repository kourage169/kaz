// routes/cases.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');


// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

const bingo_multiplier = {
  "1": 5,
  "2": 40,
  "3": 250,
  "4": 500,
  "5": 1000,
}

// Bet limits (same as frontend)
const BET_LIMITS = {
  USD: { min: 0.10, max: 1000 },
  LBP: { min: 10000, max: 100000000 }
};

// Utility: Generate 28 unique random numbers between 1 and 75
function generateBingoNumbers() {
  const numbers = [];
  const allNumbers = Array.from({length: 75}, (_, i) => i + 1); // Create array 1-75
  
  // Shuffle the array using Fisher-Yates algorithm
  for (let i = allNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
  }
  
  // Take first 28 numbers from shuffled array
  return allNumbers.slice(0, 28);
}

// Utility: Calculate win amount based on completed bingo lines
function calculateBingoWin(selectedPositions, betAmount) {
  // 5x5 grid positions (0-24)
  // Middle tile (position 12) is always marked
  const middleTile = 12;
  
  // Create a set of all marked positions (including middle tile)
  const markedPositions = new Set([middleTile, ...selectedPositions]);
  
  let completedLines = [];
  
  // Check horizontal lines (rows)
  for (let row = 0; row < 5; row++) {
    let rowComplete = true;
    for (let col = 0; col < 5; col++) {
      const position = row * 5 + col;
      if (!markedPositions.has(position)) {
        rowComplete = false;
        break;
      }
    }
    if (rowComplete) {
      completedLines.push({ type: 'row', index: row });
    }
  }
  
  // Check vertical lines (columns)
  for (let col = 0; col < 5; col++) {
    let colComplete = true;
    for (let row = 0; row < 5; row++) {
      const position = row * 5 + col;
      if (!markedPositions.has(position)) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) {
      completedLines.push({ type: 'column', index: col });
    }
  }
  
  // Check diagonal lines
  // Diagonal 1: top-left to bottom-right (0, 6, 12, 18, 24)
  let diagonal1Complete = true;
  for (let i = 0; i < 5; i++) {
    const position = i * 6; // 0, 6, 12, 18, 24
    if (!markedPositions.has(position)) {
      diagonal1Complete = false;
      break;
    }
  }
  if (diagonal1Complete) {
    completedLines.push({ type: 'diagonal', index: 0 });
  }
  
  // Diagonal 2: top-right to bottom-left (4, 8, 12, 16, 20)
  let diagonal2Complete = true;
  for (let i = 0; i < 5; i++) {
    const position = i * 4 + 4; // 4, 8, 12, 16, 20
    if (!markedPositions.has(position)) {
      diagonal2Complete = false;
      break;
    }
  }
  if (diagonal2Complete) {
    completedLines.push({ type: 'diagonal', index: 1 });
  }
  
  // Calculate win amount based on number of completed lines
  let multiplier = 0;
  const lineCount = completedLines.length;
  if (lineCount >= 1) multiplier = bingo_multiplier["1"];
  if (lineCount >= 2) multiplier = bingo_multiplier["2"];
  if (lineCount >= 3) multiplier = bingo_multiplier["3"];
  if (lineCount >= 4) multiplier = bingo_multiplier["4"];
  if (lineCount >= 5) multiplier = bingo_multiplier["5"];
  
  const winAmount = +(betAmount * multiplier).toFixed(2);
  
  return {
    winAmount,
    completedLines,
    multiplier
  };
}

// Play bingo game
router.post('/play', async (req, res) => {
  try {
    const { betAmount, currency, tileNumbers } = req.body;
    const user = req.session.user;

    // Validate input
    if (!betAmount || !currency || !tileNumbers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['USD', 'LBP'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    if (!Array.isArray(tileNumbers) || tileNumbers.length !== 24) {
      return res.status(400).json({ error: 'Invalid tile numbers' });
    }

    // Validate bet amount
    const limits = BET_LIMITS[currency];
    if (betAmount < limits.min || betAmount > limits.max) {
      return res.status(400).json({ 
        error: `Bet must be between ${limits.min} and ${limits.max} ${currency}` 
      });
    }

    // Check user balance
    const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    if (user[balanceField] < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct bet amount
    user[balanceField] -= betAmount;
    await User.findByIdAndUpdate(user._id, { [balanceField]: user[balanceField] });

    // Generate 20 random numbers (1-70)
    const serverNumbers = generateBingoNumbers();
    
    // Find which numbers from user's grid match server numbers
    const markedNumbers = [];
    const markedPositions = [];
    
    // Always mark center tile (position 12)
    markedPositions.push(12);
    
    // Check each tile number against server numbers
    let tileIndex = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const position = row * 5 + col;
        
        // Skip center tile (position 12)
        if (position === 12) continue;
        
        const tileNumber = tileNumbers[tileIndex];
        if (serverNumbers.includes(tileNumber)) {
          markedNumbers.push(tileNumber);
          markedPositions.push(position);
        }
        tileIndex++;
      }
    }

    // Calculate win amount and completed lines
    const { winAmount, completedLines } = calculateBingoWin(markedPositions, betAmount);
    
    // Add winnings to user balance
    if (winAmount > 0) {
      user[balanceField] += winAmount;
      await User.findByIdAndUpdate(user._id, { [balanceField]: user[balanceField] });
    }
    
    // Prepare completed lines data for frontend
    const completedLinesData = completedLines.map(line => {
      let tiles = [];
      
      if (line.type === 'row') {
        const row = line.index;
        for (let col = 0; col < 5; col++) {
          tiles.push(`${row},${col}`);
        }
      } else if (line.type === 'column') {
        const col = line.index;
        for (let row = 0; row < 5; row++) {
          tiles.push(`${row},${col}`);
        }
      } else if (line.type === 'diagonal') {
        if (line.index === 0) {
          // Diagonal 1: top-left to bottom-right
          tiles = ['0,0', '1,1', '2,2', '3,3', '4,4'];
        } else {
          // Diagonal 2: top-right to bottom-left
          tiles = ['0,4', '1,3', '2,2', '3,1', '4,0'];
        }
      }
      
      return { type: line.type, index: line.index, tiles };
    });
    
    res.json({
      success: true,
      numbers: serverNumbers,
      markedNumbers: markedNumbers,
      winAmount: winAmount,
      newBalance: user[balanceField],
      currency: currency,
      completedLines: completedLinesData
    });

  } catch (error) {
    console.error('Bingo play error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
