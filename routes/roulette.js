const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory');
const fs = require('fs');
const path = require('path');

const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = new Set([32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3]);

// Load roulette paths data
let roulettePaths = {};
try {
  const pathsData = fs.readFileSync(path.join(__dirname, '../public/data/roulette_paths.json'), 'utf8');
  roulettePaths = JSON.parse(pathsData);
  console.log(`Loaded roulette paths for ${Object.keys(roulettePaths).length} numbers`);
} catch (err) {
  console.error('Error loading roulette paths:', err);
}

// Helper function to get a random path for a number
function getRandomPathForNumber(number) {
  const numberStr = number.toString();
  if (roulettePaths[numberStr] && roulettePaths[numberStr].length > 0) {
    const randomIndex = Math.floor(Math.random() * roulettePaths[numberStr].length);
    return roulettePaths[numberStr][randomIndex];
  }
  // Fallback to default values if no path found
  return {
    initialAngle: 4.0307811203308,
    initialVelocity: 0.22999430561133852,
    outerPhaseFrames: 120
  };
}

// Format Currency Helper
function formatCurrency(value, currency) {
  if (currency === 'USD') {
    return parseFloat(value.toFixed(2));
  } else if (currency === 'LBP') {
    return Math.round(value);
  }
  return value;
}

// Auth check middleware
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

// Function to check if a bet key is numeric
function isNumericBet(betKey) {
  return typeof betKey === 'number' || (!isNaN(parseInt(betKey)) && /^\d+$/.test(String(betKey)));
}

// Function to get numeric value from a bet key
function getNumericBetValue(betKey) {
  return typeof betKey === 'number' ? betKey : parseInt(String(betKey));
}

router.post('/spin', async (req, res) => {
  const { betAmount, betType, bets, currency } = req.body;
  
  console.log('===== ROULETTE SPIN REQUEST =====');
  console.log('Received bet request:', { betAmount, betType, currency });
  console.log('Bets object:', JSON.stringify(bets, null, 2));
  
  // DEEP DEBUG: Log all bet keys and their types
  if (bets) {
    console.log('DEEP DEBUG - Bet keys:');
    Object.keys(bets).forEach(key => {
      console.log(`> Key: "${key}" | Type: ${typeof key} | isNumericBet: ${isNumericBet(key)}`);
    });
  }

  const validCurrencies = ['USD', 'LBP'];
  if (!validCurrencies.includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  // Handle both single bet and multiple bets
  let amount;
  let betTypes = {};

  if (bets) {
    // Multiple bets case
    amount = parseFloat(betAmount);
    betTypes = bets;
    console.log('Processing multiple bets. Total amount:', amount);
    console.log('Bet types:', betTypes);
    
    // Log data types of each bet key
    for (const [key, value] of Object.entries(betTypes)) {
      console.log(`Bet key "${key}" (${typeof key}) = ${value} (${typeof value})`);
    }
  } else if (betType) {
    // Single bet case (legacy support)
    amount = parseFloat(betAmount);
    betTypes = { [betType]: amount };
    console.log('Processing single bet:', betTypes);
  } else {
    return res.status(400).json({ error: 'No bet provided' });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get the correct balance field based on currency
    const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
    
    // Check if user has sufficient balance
    if (user[balanceField] < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct the bet amount
    user[balanceField] -= amount;

    // Spin logic
    const winningIndex = Math.floor(Math.random() * numbers.length);
    const winningNumber = numbers[winningIndex];
    console.log(`Winning number: ${winningNumber}`);

    // Get a random path for the winning number
    const spinPath = getRandomPathForNumber(winningNumber);

    const isRed = RED_NUMBERS.has(winningNumber);
    const isBlack = winningNumber !== 0 && !isRed;
    const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
    const isOdd = winningNumber % 2 === 1;
    const isLow = winningNumber >= 1 && winningNumber <= 18;
    const isHigh = winningNumber >= 19 && winningNumber <= 36;
    const isFirstDozen = winningNumber >= 1 && winningNumber <= 12;
    const isSecondDozen = winningNumber >= 13 && winningNumber <= 24;
    const isThirdDozen = winningNumber >= 25 && winningNumber <= 36;
    const isCol1 = [1,4,7,10,13,16,19,22,25,28,31,34].includes(winningNumber);
    const isCol2 = [2,5,8,11,14,17,20,23,26,29,32,35].includes(winningNumber);
    const isCol3 = [3,6,9,12,15,18,21,24,27,30,33,36].includes(winningNumber);

    let totalWinAmount = 0;

    // Process each bet
    for (const [currentBetType, betAmount] of Object.entries(betTypes)) {
      let winAmount = 0;
      const parsedBetAmount = parseFloat(betAmount);
      
      console.log(`Processing bet type: ${currentBetType}, amount: ${parsedBetAmount}, winning number: ${winningNumber}`);

      // Convert to string for exact matching
      const betTypeStr = String(currentBetType);
      
      // Direct handling of dozen bets
      if (betTypeStr === '1st12') {
        console.log(`DOZEN BET: 1st12 check - Win? ${isFirstDozen}`);
        if (isFirstDozen) {
          winAmount = parsedBetAmount * 2; // 3x total payout (2x profit + original bet)
          console.log(`1st dozen bet won, winAmount: ${winAmount}`);
        }
      } 
      else if (betTypeStr === '2nd12') {
        console.log(`DOZEN BET: 2nd12 check - Win? ${isSecondDozen}`);
        if (isSecondDozen) {
          winAmount = parsedBetAmount * 2; // 3x total payout (2x profit + original bet)
          console.log(`2nd dozen bet won, winAmount: ${winAmount}`);
        }
      }
      else if (betTypeStr === '3rd12') {
        console.log(`DOZEN BET: 3rd12 check - Win? ${isThirdDozen}`);
        if (isThirdDozen) {
          winAmount = parsedBetAmount * 2; // 3x total payout (2x profit + original bet)
          console.log(`3rd dozen bet won, winAmount: ${winAmount}`);
        }
      }
      // Handle numeric bets
      else if (isNumericBet(currentBetType)) {
        const numBetType = getNumericBetValue(currentBetType);
        console.log(`Processing numeric bet: "${currentBetType}" -> ${numBetType}, winning number: ${winningNumber}`);
        if (numBetType === winningNumber) {
          // Win amount is (36 * bet) - original bet = 35 * bet
          winAmount = parsedBetAmount * 35;
          console.log(`Number bet won: ${numBetType} = ${winningNumber}, winAmount: ${winAmount}`);
        }
      } 
      // Handle other string bets
      else {
        console.log(`Processing other string bet: "${betTypeStr}"`);
        switch (betTypeStr) {
          case 'red':
            if (isRed) {
              winAmount = parsedBetAmount;
              console.log(`Red bet won, winAmount: ${winAmount}`);
            }
            break;
          case 'black':
            if (isBlack) {
              winAmount = parsedBetAmount;
              console.log(`Black bet won, winAmount: ${winAmount}`);
            }
            break;
          case 'odd':
            if (isOdd) {
              winAmount = parsedBetAmount;
              console.log(`Odd bet won, winAmount: ${winAmount}`);
            }
            break;
          case 'even':
            if (isEven) {
              winAmount = parsedBetAmount;
              console.log(`Even bet won, winAmount: ${winAmount}`);
            }
            break;
          case 'low':
          case '1to18':
            if (isLow) {
              winAmount = parsedBetAmount;
              console.log(`Low/1to18 bet won, winAmount: ${winAmount}`);
            }
            break;
          case 'high':
          case '19to36':
            if (isHigh) {
              winAmount = parsedBetAmount;
              console.log(`High/19to36 bet won, winAmount: ${winAmount}`);
            }
            break;
          case 'col1':
            if (isCol1) {
              winAmount = parsedBetAmount * 2;
              console.log(`Column 1 bet won, winAmount: ${winAmount}`);
            }
            break;
          case 'col2':
            if (isCol2) {
              winAmount = parsedBetAmount * 2;
              console.log(`Column 2 bet won, winAmount: ${winAmount}`);
            }
            break;
          case 'col3':
            if (isCol3) {
              winAmount = parsedBetAmount * 2;
              console.log(`Column 3 bet won, winAmount: ${winAmount}`);
            }
            break;
          default:
            // Log and skip invalid bet types
            console.warn('Invalid bet type:', currentBetType);
            continue;
        }
      }

      // Add to total winnings
      totalWinAmount += winAmount;
    }

    // Format the win amount according to currency
    totalWinAmount = formatCurrency(totalWinAmount, currency);

    // Add original bet back for all winning bets
    let returnedBetAmount = 0;
    for (const [currentBetType, betAmount] of Object.entries(betTypes)) {
      // Check if this bet won
      let won = false;
      const parsedBetAmount = parseFloat(betAmount);
      
      console.log(`Checking if bet type ${currentBetType} won for return...`);
      
      // Convert to string for exact matching
      const betTypeStr = String(currentBetType);
      
      // Direct handling of dozen bets
      if (betTypeStr === '1st12') {
        console.log(`DOZEN BET RETURN: 1st12 check - Win? ${isFirstDozen}`);
        if (isFirstDozen) won = true;
      } 
      else if (betTypeStr === '2nd12') {
        console.log(`DOZEN BET RETURN: 2nd12 check - Win? ${isSecondDozen}`);
        if (isSecondDozen) won = true;
      }
      else if (betTypeStr === '3rd12') {
        console.log(`DOZEN BET RETURN: 3rd12 check - Win? ${isThirdDozen}`);
        if (isThirdDozen) won = true;
      }
      // Handle numeric bets
      else if (isNumericBet(currentBetType)) {
        const numBetType = getNumericBetValue(currentBetType);
        console.log(`Checking numeric bet: ${numBetType} against winning number: ${winningNumber}`);
        if (numBetType === winningNumber) {
          won = true;
          console.log(`Number bet ${numBetType} won`);
        }
      } 
      // Handle other string bets
      else {
        console.log(`Checking string bet: "${betTypeStr}"`);
        switch (betTypeStr) {
          case 'red':
            if (isRed) won = true;
            break;
          case 'black':
            if (isBlack) won = true;
            break;
          case 'odd':
            if (isOdd) won = true;
            break;
          case 'even':
            if (isEven) won = true;
            break;
          case 'low':
          case '1to18':
            if (isLow) won = true;
            break;
          case 'high':
          case '19to36':
            if (isHigh) won = true;
            break;
          case 'col1':
            if (isCol1) won = true;
            break;
          case 'col2':
            if (isCol2) won = true;
            break;
          case 'col3':
            if (isCol3) won = true;
            break;
        }
      }
      
      // If this bet won, add the original bet amount to the return
      if (won) {
        returnedBetAmount += parsedBetAmount;
        console.log(`Bet won, adding ${parsedBetAmount} to returnedBetAmount, now: ${returnedBetAmount}`);
      }
    }

    // Format the returned bet amount
    returnedBetAmount = formatCurrency(returnedBetAmount, currency);

    // Calculate the total bet amount
    const totalBetAmount = Object.values(betTypes).reduce((sum, val) => sum + parseFloat(val || 0), 0);


    // Add both profit and returned bet to user's balance
    const totalReturn = totalWinAmount + returnedBetAmount;
    if (totalReturn > 0) {
      user[balanceField] += totalReturn;
    }

    // Format the final balance
    user[balanceField] = formatCurrency(user[balanceField], currency);

    // Save the updated user data
    await user.save();

    // Update session balances
    req.session.user.balanceUSD = user.balanceUSD;
    req.session.user.balanceLBP = user.balanceLBP;

    // Final debug logging
    console.log('===== CALCULATION RESULTS =====');
    console.log(`Winning number: ${winningNumber}`);
    console.log(`Total profit: ${totalWinAmount}`);
    console.log(`Returned bets: ${returnedBetAmount}`);
    console.log(`Total return to player: ${totalWinAmount + returnedBetAmount}`);
    console.log('===============================');

     // Save to bet history
const betRecord = await BetHistory.create({
  userId: user._id,
  agentId: user.agentId || null,
  agentName: user.agentName || null,
  username: user.username,
  game: 'Roulette',
  currency,
  betAmount: totalBetAmount,
  payout: totalWinAmount + returnedBetAmount,
  metadata: {
    winningNumber,
    bets: betTypes
  }
});

// Broadcast to WebSocket clients
req.app.get('wssBroadcast')?.({
  type: 'bet',
  username: user.username,
  game: 'Roulette',
  currency,
  betAmount: totalBetAmount,
  payout: totalWinAmount + returnedBetAmount,
  timestamp: betRecord.createdAt,
});


    return res.json({
      success: true,
      winningIndex,
      winningNumber,
      profit: totalWinAmount,
      returnedBets: returnedBetAmount,
      totalReturn: totalWinAmount + returnedBetAmount,
      newBalance: user[balanceField],
      spinPath,
      currency
    });

  } catch (err) {
    console.error('Roulette spin error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
