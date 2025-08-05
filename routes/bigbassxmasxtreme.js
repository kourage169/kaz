const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Store active games with gift boxes
const activeGames = new Map();

/////////////////////////////////////////////////////// Define Paylines patterns in 3x5 grid /////////////////////////////////////////////////////////

// Payline patterns
const PAYLINES = [
  // Payline 1: Top row straight
  [ [0, 0], [1, 0], [2, 0], [3, 0], [4, 0] ],

  // Payline 2: Middle row straight
  [ [0, 1], [1, 1], [2, 1], [3, 1], [4, 1] ],

  // Payline 3: Bottom row straight
  [ [0, 2], [1, 2], [2, 2], [3, 2], [4, 2] ],

  // Payline 4: V-shaped
  [ [0, 0], [1, 1], [2, 2], [3, 1], [4, 0] ],

  // Payline 5: Inverted V
  [ [0, 2], [1, 1], [2, 0], [3, 1], [4, 2] ],

  // Payline 6: Z-shape
  [ [0, 0], [1, 0], [2, 1], [3, 2], [4, 2] ],

  // Payline 7: Flipped Z-shape 
  [ [0, 2], [1, 2], [2, 1], [3, 0], [4, 0] ],

  // Payline 8: U-shape
[ [0, 1], [1, 2], [2, 2], [3, 2], [4, 1] ],


  // Payline 9: Arc shape (stretched M)
[ [0, 1], [1, 0], [2, 0], [3, 0], [4, 1] ],

  // Payline 10: zig zag
  [ [0, 2], [1, 1], [2, 1], [3, 1], [4, 0] ],

];

  ////////////////////////////////////////////////////// Define Global Constants /////////////////////////////////////////////////////////

  const symbolKeys = [
    'crown', 'hourglass', 'ring', 'chalice',
    'gem_red', 'gem_purple', 'gem_yellow', 'gem_green', 'gem_blue', 'scatter', 'wild'
  ];

  ////////////////////////////////////////////// Weights for odds of certain symbols dropping ////////////////////////////////////////

// Weights based on estimated rarity from Gates of Olympus
const symbolWeights = {
  wild: 1,
  scatter: 1,
  crown: 2,
  hourglass: 3,
  ring: 4,
  chalice: 5,
  gem_red: 8,
  gem_purple: 10,
  gem_yellow: 10,
  gem_green: 10,
  gem_blue: 10
};

// Create weighted pool
const weightedPool = [];
for (const [key, weight] of Object.entries(symbolWeights)) {
  for (let i = 0; i < weight; i++) {
    weightedPool.push(key);
  }
}

// Function to pick based on weights
function pickWeightedSymbol(pool) {
  // Simple random item selection for Node.js (no Phaser dependency)
  return pool[Math.floor(Math.random() * pool.length)];
}

////////////////////////////////////////////////////////// Weights for odds of Orbs dropping ////////////////////////////////////////////////

// Orb Appearance Chance
const ORB_APPEARANCE_CHANCE = 0.10; // 2% per cell


// Define Orb Color Weights
const orbColorWeights = [
  { color: 'green', weight: 60 },
  { color: 'blue', weight: 25 },
  { color: 'purple', weight: 10 },
  { color: 'red', weight: 4 },
  { color: 'diamond', weight: 1 }
];

// Function to pick based on Orb Color Weights
function pickWeightedColor(colors) {
  const total = colors.reduce((sum, c) => sum + c.weight, 0);
  let rand = Math.random() * total;
  for (const entry of colors) {
    rand -= entry.weight;
    if (rand <= 0) return entry.color;
  }
  return colors[colors.length - 1].color; // fallback
}


// Define Orb Value Weights
const orbValuePools = {
  green: [
    { value: 0.2, weight: 40 },
    { value: 0.5, weight: 30 },
    { value: 1, weight: 20 },
  ],
  blue: [
    { value: 2, weight: 30 },
    { value: 3, weight: 27 },
    { value: 4, weight: 25 },
    { value: 5, weight: 10 },
    { value: 10, weight: 5 },
  ],
  purple: [
    { value: 15, weight: 50 },
    { value: 20, weight: 25 },
    { value: 25, weight: 20 },
    { value: 50, weight: 5 },
  ],
  red: [
    { value: 200, weight: 80 },
    { value: 250, weight: 60 },
    { value: 333, weight: 15 },
    { value: 500, weight: 5 },
  ],
  diamond: [
    { value: 1000, weight: 100 },
  ]
};

// Function to pick based on Orb Value Weights
function pickWeightedRandom(pool) {
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const item of pool) {
    rand -= item.weight;
    if (rand <= 0) return item;
  }
  return pool[pool.length - 1]; // Fallback
}

/////////////////////////////////////////////////////// WIN AMOUNT TABLE /////////////////////////////////////////////////////////////////////////

const payoutTable = {
  crown: {
    '5': 200,
    '4': 20,
    '3': 5,
    '2': 0.5
  },
  hourglass: {
    '5': 100,
    '4': 15,
    '3': 3
  },
  ring: {
    '5': 50,
    '4': 10,
    '3': 2
  },
  chalice: {
    '5': 50,
    '4': 10,
    '3': 2
  },
  gem_red: {
    '5': 10,
    '4': 2.5,
    '3': 0.2
  },
  gem_purple: {
    '5': 10,
    '4': 2.50,
    '3': 0.2
  },
  gem_yellow: {
    '5': 5,
    '4': 1,
    '3': 0.2
  },
  gem_green: {
    '5': 5,
    '4': 1,
    '3': 0.2
  },
  gem_blue: {
    '5': 5,
    '4': 1,
    '3': 0.2
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to generate a random grid of symbols
function generateGrid(cols, rows, isFreeSpins = false, ante = false) {
  const grid = [];
  
  // Create a filtered pool without wild symbols for regular spins
  const filteredPool = isFreeSpins 
    ? weightedPool 
    : weightedPool.filter(symbol => symbol !== 'wild');
  
  // If ante is active, create a pool with doubled scatter weight instead of duplicating entries
  let adjustedPool = filteredPool;
  if (ante && !isFreeSpins) {
    // Create a new pool with adjusted weights
    const scatterWeight = symbolWeights.scatter * 2; // Double the scatter weight
    
    // Create a temporary weighted pool with adjusted weights
    const tempPool = [];
    for (const [key, weight] of Object.entries(symbolWeights)) {
      // Skip wild for regular spins
      if (key === 'wild' && !isFreeSpins) continue;
      
      // Use doubled weight for scatter when ante is active
      const adjustedWeight = key === 'scatter' ? scatterWeight : weight;
      
      for (let i = 0; i < adjustedWeight; i++) {
        tempPool.push(key);
      }
    }
    
    adjustedPool = tempPool;
  }
  
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      // Check if an orb should appear at this position
      if (Math.random() < ORB_APPEARANCE_CHANCE) {
        // Determine orb color
        const color = pickWeightedColor(orbColorWeights);
        
        // Determine orb value based on color
        const valueObj = pickWeightedRandom(orbValuePools[color]);
        
        // Store orb info in the grid cell
        grid[row][col] = {
          type: 'orb',
          color: color,
          value: valueObj.value
        };
      } else {
        // Pick a weighted random symbol from the adjusted pool
        const symbol = pickWeightedSymbol(adjustedPool);
        grid[row][col] = symbol;
      }
    }
  }
  
  return grid;
}

// Function to check if a specific payline has matching symbols
function checkPaylineMatch(grid, payline) {
  const firstPosition = grid[payline[0][1]][payline[0][0]];
  
  // Skip if the first position is an orb
  if (firstPosition && typeof firstPosition === 'object' && firstPosition.type === 'orb') {
    return null;
  }
  
  const firstSymbol = firstPosition;
  
  // Wild symbols can match with anything
  const isWild = firstSymbol === 'wild';
  
  // If first symbol is wild, find the first non-wild symbol
  let matchSymbol = firstSymbol;
  let matchCount = 1;
  let i = 1;
  
  if (isWild) {
    while (i < payline.length) {
      const [x, y] = payline[i];
      const position = grid[y][x];
      
      // Skip orbs when looking for matches
      if (position && typeof position === 'object' && position.type === 'orb') {
        i++;
        continue;
      }
      
      const symbol = position;
      
      if (symbol !== 'wild') {
        matchSymbol = symbol;
        break;
      }
      i++;
    }
  }
  
  // Count consecutive matches from left to right
  for (i; i < payline.length; i++) {
    const [x, y] = payline[i];
    const position = grid[y][x];
    
    // If we encounter an orb, stop the match sequence completely
    if (position && typeof position === 'object' && position.type === 'orb') {
      return null;  // Return null to indicate no valid match if an orb is in the sequence
    }
    
    const symbol = position;
    
    // Match if symbol is the same or is a wild
    if (symbol === matchSymbol || symbol === 'wild') {
      matchCount++;
    } else {
      break; // Stop counting on first non-match
    }
  }
  
  // Check if the match count is enough for a win based on the payout table
  if (matchSymbol !== 'wild' && payoutTable[matchSymbol] && payoutTable[matchSymbol][matchCount]) {
    return {
      symbol: matchSymbol,
      count: matchCount,
      positions: payline.slice(0, matchCount)
    };
  }
  
  return null;
}

// Function to check all paylines for matches
function checkAllPaylines(grid) {
  const matches = [];
  
  for (let i = 0; i < PAYLINES.length; i++) {
    const payline = PAYLINES[i];
    const match = checkPaylineMatch(grid, payline);
    
    if (match) {
      matches.push({
        paylineIndex: i,
        ...match
      });
    }
  }
  
  return matches;
}

// Function to calculate total win amount based on matches and bet amount
function calculateWinAmount(matches, betAmount, grid = null, isFreeSpins = false, wildMultiplier = 1) {
  let totalWin = 0;
  
  // Calculate wins from payline matches
  for (const match of matches) {
    const { symbol, count } = match;
    
    // Skip if symbol is not in payout table or count is not defined
    if (!payoutTable[symbol] || !payoutTable[symbol][count]) {
      continue;
    }
    
    // Calculate win for this match
    const paylineMultiplier = payoutTable[symbol][count];
    totalWin += betAmount * paylineMultiplier;
  }
  
  // For free spins, calculate additional wins from wilds collecting orbs
  if (isFreeSpins && grid) {
    // First, find all orbs in the grid
    const orbs = [];
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];
        if (cell && typeof cell === 'object' && cell.type === 'orb') {
          orbs.push(cell);
        }
      }
    }
    
    // If there are orbs, count wilds in this spin and calculate additional win
    if (orbs.length > 0) {
      let wildCount = 0;
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          if (grid[row][col] === 'wild') {
            wildCount++;
          }
        }
      }
      
      // Each wild collects all orb values with the current wild multiplier
      if (wildCount > 0) {
        const orbValuesSum = orbs.reduce((sum, orb) => sum + orb.value, 0);
        totalWin += orbValuesSum * betAmount * wildCount * wildMultiplier;
      }
    }
  }
  
  return totalWin;
}

// Function to check for scatter symbols and determine free spins
function checkScatters(grid) {
  let scatterCount = 0;
  const scatterPositions = [];
  
  // Count scatters in the grid
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const position = grid[row][col];
      
      // Skip orbs when counting scatters
      if (position && typeof position === 'object' && position.type === 'orb') {
        continue;
      }
      
      if (position === 'scatter') {
        scatterCount++;
        scatterPositions.push([col, row]);
      }
    }
  }
  
  // Determine free spins based on scatter count
  let freeSpins = 0;
  if (scatterCount >= 3) {
    // All scatter counts (3, 4, or 5) will award 10 free spins
    freeSpins = 10;
  }
  
  return {
    count: scatterCount,
    positions: scatterPositions,
    freeSpins: freeSpins
  };
}

// Function to generate orbs for the grid
function generateOrbs(cols, rows) {
  const orbs = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Check if an orb should appear at this position
      if (Math.random() < ORB_APPEARANCE_CHANCE) {
        // Determine orb color
        const color = pickWeightedColor(orbColorWeights);
        
        // Determine orb value based on color
        const valueObj = pickWeightedRandom(orbValuePools[color]);
        
        orbs.push({
          position: [col, row],
          color: color,
          value: valueObj.value
        });
      }
    }
  }
  
  return orbs;
}

// POST route for spinning the reels
router.post('/spin', async (req, res) => {
  try {
    const { betAmount, currency, freeSpins, ante } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    
    // Validate inputs
    if (!betAmount || !currency) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Get user data if logged in
    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Calculate total bet with ante if active
      const totalBet = ante ? betAmount * 1.25 : betAmount;
      const totalBetRounded = Math.round(totalBet * 100) / 100; // Round to 2 decimals for USD
      
      // Check if user has enough balance
      const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      if (user[balanceField] < totalBetRounded) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
    }
    
    // Generate grid of symbols (5 columns x 3 rows)
    // If ante is active, double the chance of scatters appearing
    const grid = generateGrid(5, 3, freeSpins, ante);
    
    // Check for winning paylines
    const matches = checkAllPaylines(grid);
    
    // Check for scatters
    const scatters = checkScatters(grid);
    
    // Generate orbs
    const orbs = generateOrbs(5, 3);
    
    // Calculate win amount from paylines
    let winAmount = calculateWinAmount(matches, betAmount);
    
    // Track special events
    let orbChestTriggered = false;
    let orbChestWin = 0;
    let extraScatterTriggered = false;
    let extraScatterGrid = null;
    let extraScatterWin = 0;
    
    // Set free spins eligibility if 3+ scatters are found
    if (scatters.count >= 3) {
      req.session.freeSpinsEligible = true;
      req.session.scatterCount = scatters.count;
      req.session.eligibleBetAmount = betAmount;
      req.session.eligibleCurrency = currency;
    }
    
    // Check for orb chest event if:
    // 1. No payline wins
    // 2. No scatter matches (less than 3)
    // 3. There are orbs in the grid
    if (matches.length === 0 && scatters.count < 3) {
      // Find all orbs in the grid
      const orbsInGrid = [];
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          const cell = grid[row][col];
          if (cell && typeof cell === 'object' && cell.type === 'orb') {
            orbsInGrid.push(cell);
          }
        }
      }
      
      // Check if orb chest event should trigger
      if (orbsInGrid.length > 0 && Math.random() < 0.01) {
        orbChestTriggered = true;
        
        // Calculate orb chest win: bet amount × sum of all orb values
        const orbValuesSum = orbsInGrid.reduce((sum, orb) => sum + orb.value, 0);
        orbChestWin = betAmount * orbValuesSum;
        
        // Add to total win amount
        winAmount += orbChestWin;
      }
      // Check for extra scatter event if:
      // 1. No payline wins
      // 2. Exactly 2 scatter symbols
      // 3. Orb chest didn't trigger
      else if (scatters.count === 2 && Math.random() < 0.9) {
        extraScatterTriggered = true;
        
        // Find columns that already have scatter symbols
        const scatterColumns = new Set();
        for (const [col, row] of scatters.positions) {
          scatterColumns.add(col);
        }
        
        // Create a new grid with the same dimensions
        extraScatterGrid = [];
        for (let row = 0; row < grid.length; row++) {
          extraScatterGrid[row] = [];
          for (let col = 0; col < grid[0].length; col++) {
            // Keep the original symbol for columns that already have scatters
            if (scatterColumns.has(col)) {
              extraScatterGrid[row][col] = grid[row][col];
            } else {
              // For other columns, generate new symbols
              // We'll ensure at least one scatter in one of these columns
              extraScatterGrid[row][col] = null; // Placeholder, will fill in below
            }
          }
        }
        
        // Identify columns without scatters
        const columnsWithoutScatter = [];
        for (let col = 0; col < grid[0].length; col++) {
          if (!scatterColumns.has(col)) {
            columnsWithoutScatter.push(col);
          }
        }
        
        // Choose one random column to place the third scatter
        const randomScatterCol = columnsWithoutScatter[Math.floor(Math.random() * columnsWithoutScatter.length)];
        const randomScatterRow = Math.floor(Math.random() * grid.length);
        
        // Fill in the remaining columns with random symbols
        for (let col = 0; col < grid[0].length; col++) {
          if (!scatterColumns.has(col)) {
            for (let row = 0; row < grid.length; row++) {
              if (col === randomScatterCol && row === randomScatterRow) {
                extraScatterGrid[row][col] = 'scatter';
              } else {
                // Generate a random symbol (excluding scatter and wild to avoid more than 3 scatters and no wilds)
                const filteredPool = weightedPool.filter(symbol => symbol !== 'scatter' && symbol !== 'wild');
                extraScatterGrid[row][col] = pickWeightedSymbol(filteredPool);
              }
            }
          }
        }
        
        // Calculate win for 3 scatters (10 free spins)
        extraScatterWin = 0; // No direct win, but player gets free spins
        
        // Set free spins eligibility for the extra scatter feature
        req.session.freeSpinsEligible = true;
        req.session.scatterCount = 3; // Always 3 scatters for extra scatter event
        req.session.eligibleBetAmount = betAmount;
        req.session.eligibleCurrency = currency;
      }
    }
    
    // Update user balance if logged in
    if (user) {
      const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      
      // Calculate total bet with ante if active
      const totalBet = ante ? betAmount * 1.25 : betAmount;
      const totalBetRounded = Math.round(totalBet * 100) / 100; // Round to 2 decimals for USD
      
      // Deduct bet amount and add winnings
      user[balanceField] -= totalBetRounded;
      user[balanceField] += winAmount;
      await user.save();
      
      // Update session data
      if (req.session.user) {
        req.session.user[balanceField] = user[balanceField];
      }
    }
    
    // Return response
    res.json({
      grid: grid,
      matches: matches,
      scatters: scatters,
      orbs: orbs,
      winAmount: winAmount,
      orbChestTriggered: orbChestTriggered,
      orbChestWin: orbChestWin,
      extraScatterTriggered: extraScatterTriggered,
      extraScatterGrid: extraScatterGrid,
      newBalance: user ? user[currency === 'USD' ? 'balanceUSD' : 'balanceLBP'] : null
    });
  } catch (error) {
    console.error('Error in spin route:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Function to generate a grid with guaranteed scatters
function generateGridWithScatters(cols, rows) {
  // Generate a normal grid first
  const grid = generateGrid(cols, rows, false);
  
  // Determine how many scatters (3 is minimum, 4-5 have lower probability)
  const scatterRoll = Math.random();
  let scatterCount = 3; // Default
  
  if (scatterRoll > 0.85) {
    scatterCount = 5;     // 15% chance for 5 scatters
  } else if (scatterRoll > 0.60) {
    scatterCount = 4;     // 25% chance for 4 scatters
  }
  
  // Make sure we don't exceed the maximum of 5 scatters
  scatterCount = Math.min(scatterCount, 5);
  
  // Count existing scatters in the grid (just in case)
  let existingScatterCount = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === 'scatter') {
        existingScatterCount++;
      }
    }
  }
  
  // Adjust the number of scatters to add based on existing ones
  const scattersToAdd = Math.min(scatterCount, 5 - existingScatterCount);
  
  // Find random positions for scatters
  const positions = [];
  while (positions.length < scattersToAdd) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    
    // Check if this position is already used or already has a scatter
    const alreadyUsed = positions.some(pos => pos[0] === row && pos[1] === col);
    const alreadyScatter = grid[row][col] === 'scatter';
    
    if (!alreadyUsed && !alreadyScatter) {
      positions.push([row, col]);
    }
  }
  
  // Place scatters in the grid
  for (const [row, col] of positions) {
    grid[row][col] = 'scatter';
  }
  
  return grid;
}

// POST route for buying free spins
router.post('/buy-free-spins', async (req, res) => {
  try {
    const { betAmount, currency } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    
    // Validate inputs
    if (!betAmount || !currency) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Get user data if logged in
    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user has enough balance for 100x bet
      const cost = betAmount * 100;
      const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      if (user[balanceField] < cost) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      // Deduct cost from user balance
      user[balanceField] -= cost;
      await user.save();
      
      // Update session data
      if (req.session.user) {
        req.session.user[balanceField] = user[balanceField];
      }
    }
    
    // Generate grid with guaranteed scatters (minimum 3, with small chance for 4-5)
    const grid = generateGridWithScatters(5, 3);
    
    // Check for winning paylines
    const matches = checkAllPaylines(grid);
    
    // Get scatter data
    const scatters = checkScatters(grid);
    
    // Set free spins eligibility for purchased free spins
    req.session.freeSpinsEligible = true;
    req.session.scatterCount = scatters.count;
    req.session.eligibleBetAmount = betAmount;
    req.session.eligibleCurrency = currency;
    
    // Generate orbs
    const orbs = generateOrbs(5, 3);
    
    // Return response
    res.json({
      success: true,
      grid: grid,
      matches: matches,
      scatters: scatters,
      orbs: orbs,
      newBalanceUSD: user ? user.balanceUSD : null,
      newBalanceLBP: user ? user.balanceLBP : null
    });
  } catch (error) {
    console.error('Error in buy-free-spins route:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Function to generate gift boxes with the specified prizes
function generateGiftBoxes() {
  // Define the prizes
  const prizes = [
    { type: 'free_spins', value: 1 },
    { type: 'free_spins', value: 2 },
    { type: 'free_spins', value: 3 },
    { type: 'fixed_fish', value: 1 },  // First fixed fish
    { type: 'fixed_fish', value: 1 },  // Second fixed fish
    { type: 'fixed_fish', value: 1 },  // Third fixed fish
    { type: 'fisher_wild', value: 1 }, // First fisher wild
    { type: 'fisher_wild', value: 1 }, // Second fisher wild
    { type: 'fisher_wild', value: 1 }, // Third fisher wild
    { type: 'remove_lowest_fish', value: 1 },
    { type: 'boot', value: 0 },
    { type: 'boot', value: 0 },
    { type: 'boot', value: 0 },
    { type: 'boot', value: 0 }
  ];
  
  // Shuffle the prizes (Fisher-Yates algorithm)
  const shuffledPrizes = [...prizes];
  for (let i = shuffledPrizes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPrizes[i], shuffledPrizes[j]] = [shuffledPrizes[j], shuffledPrizes[i]];
  }
  
  // We now have exactly 14 prizes, so no need to duplicate any
  const allPrizes = [...shuffledPrizes];
  
  // Shuffle again to mix the duplicated prizes
  for (let i = allPrizes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPrizes[i], allPrizes[j]] = [allPrizes[j], allPrizes[i]];
  }
  
  // Assign positions to each box (for a 7x2 grid layout)
  const boxes = [];
  for (let i = 0; i < allPrizes.length; i++) {
    boxes.push({
      id: i,
      prize: allPrizes[i],
      opened: false,
      position: [i % 7, Math.floor(i / 7)] // 7 boxes per row, 2 rows total
    });
  }
  
  return boxes;
}

// POST route for starting a free spins bonus game with gift boxes
router.post('/start-bonus', async (req, res) => {
  try {
    const { betAmount, currency } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not logged in' });
    }
    
    // Security check: Verify the user is eligible for free spins
    // This flag should be set by either:
    // 1. The spin route when 3+ scatters are hit
    // 2. The buy-free-spins route when free spins are purchased
    if (!req.session.freeSpinsEligible) {
      console.warn(`Unauthorized free spins attempt by user ${userId}`);
      return res.status(403).json({ error: 'Not eligible for free spins' });
    }
    
    // Verify bet amount matches the one used when eligibility was earned
    if (req.session.eligibleBetAmount !== betAmount || req.session.eligibleCurrency !== currency) {
      console.warn(`Bet amount/currency mismatch for user ${userId}`);
      return res.status(403).json({ error: 'Bet amount or currency mismatch' });
    }
    
    // Generate a unique game ID
    const gameId = `${userId}_${Date.now()}`;
    
    // Generate the gift boxes
    const giftBoxes = generateGiftBoxes();
    
    // Get the scatter count from the active game or session
    const scatterCount = req.session.scatterCount || 3;
    
    // Pre-reveal boots based on scatter count
    const preRevealedBoots = [];
    
    if (scatterCount >= 4) {
      // Find boot boxes
      const bootBoxes = giftBoxes.filter(box => box.prize.type === 'boot');
      
      // For 4 scatters, reveal 1 boot
      if (scatterCount === 4 && bootBoxes.length > 0) {
        const bootToReveal = bootBoxes[0];
        preRevealedBoots.push(bootToReveal.id);
        bootToReveal.opened = true;
      }
      // For 5 scatters, reveal 2 boots
      else if (scatterCount === 5 && bootBoxes.length > 1) {
        const firstBoot = bootBoxes[0];
        const secondBoot = bootBoxes[1];
        preRevealedBoots.push(firstBoot.id, secondBoot.id);
        firstBoot.opened = true;
        secondBoot.opened = true;
      }
    }
    
    // Store the game state
    activeGames.set(gameId, {
      userId,
      betAmount,
      currency,
      giftBoxes,
      startTime: Date.now(),
      additionalFreeSpins: 0,
      fixedFishCount: 0,
      fisherWildCount: 0,
      removeLowestFish: false
    });
    
    // Reset eligibility flag after starting the bonus game
    req.session.freeSpinsEligible = false;
    req.session.scatterCount = null;
    req.session.eligibleBetAmount = null;
    req.session.eligibleCurrency = null;
    
    // Return initial game state
    res.json({
      success: true,
      gameId,
      giftBoxes: giftBoxes.map(box => ({
        id: box.id,
        opened: box.opened || false,
        position: box.position
      })),
      preRevealedBoots
    });
  } catch (error) {
    console.error('Error starting bonus game:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST route for opening a gift box
router.post('/open-box', async (req, res) => {
  try {
    const { gameId, boxId } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not logged in' });
    }
    
    // Get the game state
    const gameState = activeGames.get(gameId);
    
    if (!gameState) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if this game belongs to the user
    if (gameState.userId !== userId) {
      return res.status(403).json({ error: 'Not your game' });
    }
    
    // Find the box
    const box = gameState.giftBoxes.find(b => b.id === parseInt(boxId));
    
    if (!box) {
      return res.status(404).json({ error: 'Box not found' });
    }
    
    if (box.opened) {
      return res.status(400).json({ error: 'Box already opened' });
    }
    
    // Mark the box as opened
    box.opened = true;
    
    // Apply the prize
    const prize = box.prize;
    
    // Flag to determine if gifts phase should end
    let endGiftsPhase = false;
    
    // Check if the prize is a boot
    if (prize.type === 'boot') {
      // End the gifts phase if it's a boot
      endGiftsPhase = true;
    } else {
      // Apply the prize based on type
      switch (prize.type) {
        case 'free_spins':
          gameState.additionalFreeSpins += prize.value;
          break;
        case 'fixed_fish':
          gameState.fixedFishCount += prize.value;
          break;
        case 'fisher_wild':
          gameState.fisherWildCount += prize.value;
          break;
        case 'remove_lowest_fish':
          gameState.removeLowestFish = true;
          break;
      }
    }
    
    // Count opened non-boot boxes
    const openedNonBootBoxes = gameState.giftBoxes
      .filter(b => b.opened && b.prize.type !== 'boot')
      .length;
    
    // End gifts phase if user has opened all 10 prize boxes (all non-boot boxes)
    if (openedNonBootBoxes >= 10) {
      endGiftsPhase = true;
    }
    
    // Check if all boxes are opened
    const allOpened = gameState.giftBoxes.every(b => b.opened);
    
    // If gifts phase is ending, generate free spins results
    let freeSpinsResults = null;
    let totalWinAmount = 0;
    
    if (endGiftsPhase) {
      // Get the number of free spins (base 10 + any additional from gifts)
      const totalFreeSpins = 10 + gameState.additionalFreeSpins;
      
      // Generate results for each free spin
      freeSpinsResults = [];
      
      // Track wilds collected during free spins
      // Start with the number of fisher_wild collected during gift phase
      let totalWildsCollected = gameState.fisherWildCount;
      let additionalSpinsFromWilds = 0;
      const maxAdditionalSetsFromWilds = 7; // Maximum 7 sets of additional spins (70 spins)
      
      // Track multiplier for wild collections (starts at 1x)
      let currentWildMultiplier = 1;
      // Define the progression of multipliers after first 4 wilds are collected
      const multiplierProgression = [2, 3, 10, 20, 30, 40, 50];
      
      // Generate initial set of free spins
      let currentSpinIndex = 0;
      let spinsToGenerate = totalFreeSpins;
      
      while (currentSpinIndex < spinsToGenerate) {
        // Generate grid with enhanced features
        const freeSpinResult = generateFreeSpinGrid(
          5, 
          3, 
          gameState.fixedFishCount, 
          0, // Don't force wilds to appear based on fisherWildCount
          gameState.removeLowestFish
        );
        
        // Extract grid and hook event data
        const grid = freeSpinResult.grid;
        const hookTriggered = freeSpinResult.hookTriggered;
        const hookColumn = freeSpinResult.hookColumn;
        const hookGrid = freeSpinResult.hookGrid;
        const waterfallTriggered = freeSpinResult.waterfallTriggered;
        const waterfallGrid = freeSpinResult.waterfallGrid;
        const randomOrbsTriggered = freeSpinResult.randomOrbsTriggered;
        const randomOrbsGrid = freeSpinResult.randomOrbsGrid;
        
        // Use the appropriate grid for calculations
        let finalGrid;
        if (waterfallTriggered && waterfallGrid) {
          finalGrid = waterfallGrid;
        } else if (randomOrbsTriggered && randomOrbsGrid) {
          finalGrid = randomOrbsGrid;
        } else if (hookTriggered && hookGrid) {
          finalGrid = hookGrid;
        } else {
          finalGrid = grid;
        }
        
        // Count wilds in this spin's grid
        let wildsInThisSpin = 0;
        for (let row = 0; row < finalGrid.length; row++) {
          for (let col = 0; col < finalGrid[row].length; col++) {
            if (finalGrid[row][col] === 'wild') {
              wildsInThisSpin++;
            }
          }
        }
        
        // Check for scatters to award additional free spins
        const scatters = checkScatters(finalGrid);
        if (scatters.count >= 3) {
          // Award 5 more free spins when hitting 3 or more scatters during free spins
          spinsToGenerate += 5;
        }
        
        // Store the multiplier before adding new wilds
        const multiplierBeforeThisSpin = currentWildMultiplier;
        
        // Add to total wilds collected
        const previousWildsCollected = totalWildsCollected;
        totalWildsCollected += wildsInThisSpin;
        
        // Check if we've collected enough wilds for additional free spins
        // Calculate how many new sets of 4 wilds we've completed with this spin
        const previousSets = Math.floor(previousWildsCollected / 4);
        const currentSets = Math.floor(totalWildsCollected / 4);
        const newCompletedSets = currentSets - previousSets;
        
        // Update multiplier if we've completed new sets
        // First set of 4 wilds doesn't increase multiplier (stays at 1x)
        // Second set of 4 wilds increases to 2x, and so on
        if (newCompletedSets > 0) {
          // Determine the new multiplier based on total sets completed
          if (currentSets > 0 && currentSets <= multiplierProgression.length) {
            currentWildMultiplier = multiplierProgression[currentSets - 1];
          } else if (currentSets > multiplierProgression.length) {
            // If we somehow exceed the progression, use the max multiplier
            currentWildMultiplier = multiplierProgression[multiplierProgression.length - 1];
          }
        }
        
        // Add additional spins if we've completed new sets and haven't hit the max
        if (newCompletedSets > 0 && additionalSpinsFromWilds < maxAdditionalSetsFromWilds) {
          // Add 10 spins for each new set, up to the maximum
          const setsToAdd = Math.min(newCompletedSets, maxAdditionalSetsFromWilds - additionalSpinsFromWilds);
          const newSpins = setsToAdd * 10;
          spinsToGenerate += newSpins;
          additionalSpinsFromWilds += setsToAdd;
        }
        
        // Check for winning paylines (using the final grid with hook changes if applicable)
        const matches = checkAllPaylines(finalGrid);
        
        // Calculate win amount for this spin (using the final grid with hook changes if applicable)
        const spinWinAmount = calculateWinAmount(matches, gameState.betAmount, finalGrid, true, multiplierBeforeThisSpin);
        
        // Add to total win amount
        totalWinAmount += spinWinAmount;
        
        // Add result to array with wild collection data
        freeSpinsResults.push({
          spinNumber: currentSpinIndex + 1,
          grid,
          matches,
          winAmount: spinWinAmount,
          wildsInThisSpin: wildsInThisSpin,
          wildsCollected: totalWildsCollected,
          completedWildSets: Math.floor(totalWildsCollected / 4),
          additionalSpinsAwarded: additionalSpinsFromWilds * 10,
          wildMultiplier: multiplierBeforeThisSpin,
          // Include hook event data
          hookTriggered,
          hookColumn,
          hookGrid,
          // Include waterfall event data
          waterfallTriggered,
          waterfallGrid,
          // Include random orbs event data
          randomOrbsTriggered,
          randomOrbsGrid
        });
        
        currentSpinIndex++;
      }
      
      // Update user balance with winnings
      const user = await User.findById(userId);
      if (user) {
        const balanceField = gameState.currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
        user[balanceField] += totalWinAmount;
        await user.save();
        
        // Update session data
        if (req.session.user) {
          req.session.user[balanceField] = user[balanceField];
        }
      }
    }
    
    // Return the result
    res.json({
      success: true,
      boxId,
      prize,
      allOpened,
      endGiftsPhase,
      gameState: {
        additionalFreeSpins: gameState.additionalFreeSpins,
        fixedFishCount: gameState.fixedFishCount,
        fisherWildCount: gameState.fisherWildCount,
        removeLowestFish: gameState.removeLowestFish
      },
      // Include free spins results if phase is ending
      ...(endGiftsPhase && {
        freeSpinsResults,
        totalFreeSpins: 10 + gameState.additionalFreeSpins,
        totalWinAmount
      })
    });
    
    // Clean up game state if gifts phase has ended
    if (endGiftsPhase) {
      activeGames.delete(gameId);
    }
    
  } catch (error) {
    console.error('Error opening gift box:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Function to generate a grid for free spins with special features
function generateFreeSpinGrid(cols, rows, fixedFishCount, fisherWildCount, removeLowestFish) {
  // Generate a base grid with standard free spins rules (wilds enabled)
  const grid = generateGrid(cols, rows, true);
  
  // Apply remove lowest fish feature if enabled - replace all green orbs
  if (removeLowestFish) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid[row][col];
        if (cell && typeof cell === 'object' && cell.type === 'orb' && cell.color === 'green') {
          // Replace with a random higher-value orb color
          const betterColors = ['blue', 'purple', 'red', 'diamond'];
          const randomColor = betterColors[Math.floor(Math.random() * betterColors.length)];
          
          // Get a value for the new orb color
          const valueObj = pickWeightedRandom(orbValuePools[randomColor]);
          
          // Update the orb with the new color and value
          grid[row][col] = {
            type: 'orb',
            color: randomColor,
            value: valueObj.value
          };
        }
      }
    }
  }
  
  // Apply fixed fish feature (always add extra orbs)
  if (fixedFishCount > 0) {
    // Find positions without orbs to place new ones
    const availablePositions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid[row][col];
        // Skip positions that already have orbs, wilds, or scatters
        if (!(cell && typeof cell === 'object' && cell.type === 'orb') && 
            cell !== 'wild' && cell !== 'scatter') {
          availablePositions.push([row, col]);
        }
      }
    }
    
    // Shuffle available positions
    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
    }
    
    // Place new orbs - always add fixedFishCount orbs if possible
    const orbsToAdd = Math.min(fixedFishCount, availablePositions.length);
    
    for (let i = 0; i < orbsToAdd; i++) {
      const [row, col] = availablePositions[i];
      
      // Determine orb color (respecting removeLowestFish)
      let availableColors = removeLowestFish 
        ? ['blue', 'purple', 'red', 'diamond'] 
        : ['green', 'blue', 'purple', 'red', 'diamond'];
      
      // Apply color weights
      const weightedColors = [];
      for (const colorEntry of orbColorWeights) {
        if (availableColors.includes(colorEntry.color)) {
          for (let w = 0; w < colorEntry.weight; w++) {
            weightedColors.push(colorEntry.color);
          }
        }
      }
      
      const color = weightedColors[Math.floor(Math.random() * weightedColors.length)];
      const valueObj = pickWeightedRandom(orbValuePools[color]);
      
      grid[row][col] = {
        type: 'orb',
        color: color,
        value: valueObj.value
      };
    }
  }
  
  // Note: fisherWildCount parameter is no longer used to force wilds
  // It's only used in the open-box route to set the initial wild count
  
  // Check for "hook" special event: 90% chance when grid has orbs but no wilds
  let hookTriggered = false;
  let hookColumn = null;
  let hookGrid = null;

  // Check if grid has orbs
  let hasOrbs = false;
  // Check if grid has wilds
  let hasWilds = false;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      if (cell && typeof cell === 'object' && cell.type === 'orb') {
        hasOrbs = true;
      }
      if (cell === 'wild') {
        hasWilds = true;
      }
    }
  }

  // If grid has orbs but no wilds, 90% chance to trigger hook event
  if (hasOrbs && !hasWilds && Math.random() < 0.01) {
    hookTriggered = true;
    
    // Find columns without orbs and without scatters to place wilds
    const columnsWithoutOrbsAndScatters = [];
    for (let col = 0; col < cols; col++) {
      let hasOrbInColumn = false;
      let hasScatterInColumn = false;
      for (let row = 0; row < rows; row++) {
        const cell = grid[row][col];
        if (cell && typeof cell === 'object' && cell.type === 'orb') {
          hasOrbInColumn = true;
        }
        if (cell === 'scatter') {
          hasScatterInColumn = true;
        }
      }
      if (!hasOrbInColumn && !hasScatterInColumn) {
        columnsWithoutOrbsAndScatters.push(col);
      }
    }
    
    // If there are columns without orbs and scatters, choose one randomly
    if (columnsWithoutOrbsAndScatters.length > 0) {
      hookColumn = columnsWithoutOrbsAndScatters[Math.floor(Math.random() * columnsWithoutOrbsAndScatters.length)];
      
      // Create a deep copy of the grid for the hook event
      hookGrid = JSON.parse(JSON.stringify(grid));
      
      // Determine how many wilds to add (1-3)
      // Use weighted distribution: 95% chance for 1 wild, 4.5% chance for 2 wilds, 0.5% chance for 3 wilds
      const wildRoll = Math.random();
      let wildCount;
      if (wildRoll < 0.95) {
        wildCount = 1;       // 95% chance
      } else if (wildRoll < 0.995) {
        wildCount = 2;       // 4.5% chance
      } else {
        wildCount = 3;       // 0.5% chance
      }
      
      // Choose random positions in the selected column to place wilds
      const rowPositions = Array.from({ length: rows }, (_, i) => i);
      // Shuffle row positions
      for (let i = rowPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rowPositions[i], rowPositions[j]] = [rowPositions[j], rowPositions[i]];
      }
      
      // Place wilds in the selected positions
      for (let i = 0; i < Math.min(wildCount, rows); i++) {
        hookGrid[rowPositions[i]][hookColumn] = 'wild';
      }
      
      // Safety check: ensure no scatters or orbs in the hook grid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = hookGrid[row][col];
          
          // Replace any scatter symbols with regular symbols
          if (cell === 'scatter') {
            // Create a filtered pool without scatter and wild symbols
            const safePool = weightedPool.filter(symbol => symbol !== 'scatter' && symbol !== 'wild');
            hookGrid[row][col] = pickWeightedSymbol(safePool);
          }
          
          // Replace any orbs with regular symbols
          if (cell && typeof cell === 'object' && cell.type === 'orb') {
            // Create a filtered pool without scatter and wild symbols
            const safePool = weightedPool.filter(symbol => symbol !== 'scatter' && symbol !== 'wild');
            hookGrid[row][col] = pickWeightedSymbol(safePool);
          }
        }
      }
    } else {
      // If all columns have orbs or scatters, don't trigger hook event
      hookTriggered = false;
    }
  }
  
  // Check for waterfall event or random orbs event when there are wilds but no orbs
  let waterfallTriggered = false;
  let waterfallGrid = null;
  let randomOrbsTriggered = false;
  let randomOrbsGrid = null;
  
  if (hasWilds && !hasOrbs && Math.random() < 0.9) {
    // Check for payline matches first
    const paylineMatches = checkAllPaylines(grid);
    // Check for scatters
    const scatterCheck = checkScatters(grid);
    
    // Only trigger special events if there are no payline wins and less than 3 scatters
    if (paylineMatches.length === 0 && scatterCheck.count < 3) {
      // Decide which special event to trigger (50/50 chance)
      const eventRoll = Math.random();
      
      if (eventRoll < 0.5) {
        // Trigger waterfall event
        waterfallTriggered = true;
        waterfallGrid = JSON.parse(JSON.stringify(grid)); // Deep copy
        
        // Define weights for number of orbs to add
        const orbCountWeights = [
          { count: 2, weight: 50 },
          { count: 3, weight: 30 },
          { count: 4, weight: 15 },
          { count: 5, weight: 5 }
        ];
        
        // Function to pick weighted random orb count
        const pickWeightedOrbCount = (weights) => {
          const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
          let rand = Math.random() * totalWeight;
          for (const item of weights) {
            rand -= item.weight;
            if (rand <= 0) return item.count;
          }
          return weights[0].count; // Fallback
        };
        
        // Determine how many orbs to add
        const orbsToAdd = pickWeightedOrbCount(orbCountWeights);
        
        // Find positions that don't have wilds, scatters, or existing orbs
        const availablePositions = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const cell = waterfallGrid[row][col];
            // Skip positions that have wilds, scatters, or orbs
            if (cell !== 'wild' && cell !== 'scatter' && 
                !(cell && typeof cell === 'object' && cell.type === 'orb')) {
              availablePositions.push([row, col]);
            }
          }
        }
        
        // Shuffle available positions
        for (let i = availablePositions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
        }
        
        // Place new orbs - limit by orbsToAdd or available positions
        const actualOrbsToAdd = Math.min(orbsToAdd, availablePositions.length);
        
        for (let i = 0; i < actualOrbsToAdd; i++) {
          const [row, col] = availablePositions[i];
          
          // Determine orb color using the weighted color system
          const color = pickWeightedColor(orbColorWeights);
          const valueObj = pickWeightedRandom(orbValuePools[color]);
          
          // Place the orb in the grid
          waterfallGrid[row][col] = {
            type: 'orb',
            color: color,
            value: valueObj.value
          };
        }
      } else {
        // Trigger random orbs event
        randomOrbsTriggered = true;
        randomOrbsGrid = JSON.parse(JSON.stringify(grid)); // Deep copy
        
        // Determine how many orbs to add (1-3)
        // Use weighted distribution: 70% chance for 1 orb, 25% chance for 2 orbs, 5% chance for 3 orbs
        const orbRoll = Math.random();
        let orbCount;
        if (orbRoll < 0.70) {
          orbCount = 1;       // 70% chance
        } else if (orbRoll < 0.95) {
          orbCount = 2;       // 25% chance
        } else {
          orbCount = 3;       // 5% chance
        }
        
        // Find positions that don't have wilds or scatters to place orbs
        const availablePositions = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const cell = randomOrbsGrid[row][col];
            // Skip positions that have wilds or scatters
            if (cell !== 'wild' && cell !== 'scatter') {
              availablePositions.push([row, col]);
            }
          }
        }
        
        // Shuffle available positions
        for (let i = availablePositions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
        }
        
        // Place new orbs - limit by orbCount or available positions
        const orbsToAdd = Math.min(orbCount, availablePositions.length);
        
        for (let i = 0; i < orbsToAdd; i++) {
          const [row, col] = availablePositions[i];
          
          // Determine orb color using the weighted color system
          const color = pickWeightedColor(orbColorWeights);
          const valueObj = pickWeightedRandom(orbValuePools[color]);
          
          // Place the orb in the grid
          randomOrbsGrid[row][col] = {
            type: 'orb',
            color: color,
            value: valueObj.value
          };
        }
      }
    }
  }
  
  return {
    grid,
    hookTriggered,
    hookColumn,
    hookGrid,
    waterfallTriggered,
    waterfallGrid,
    randomOrbsTriggered,
    randomOrbsGrid
  };
}

module.exports = router;
