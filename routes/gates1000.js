const express = require('express');
const router = express.Router();
const User = require('../models/User');

const payoutTable = {
  crown:    { '8-9': 10,  '10-11': 25, '12-30': 50 },
  hourglass:{ '8-9': 2.5, '10-11': 10, '12-30': 25 },
  ring:     { '8-9': 2,   '10-11': 5,  '12-30': 15 },
  chalice:  { '8-9': 1.5, '10-11': 2,  '12-30': 12 },
  gem_red:   { '8-9': 1,   '10-11': 1.5,'12-30': 10 },
  gem_purple:{ '8-9': 0.8, '10-11': 1.2,'12-30': 8  },
  gem_yellow:{ '8-9': 0.5, '10-11': 1,  '12-30': 5  },
  gem_green: { '8-9': 0.4, '10-11': 0.9,'12-30': 4  },
  gem_blue:  { '8-9': 0.25,'10-11': 0.75,'12-30': 2  },
  scatter: { '4': 3, '5': 5, '6': 100 }
};

function getPayout(symbolKey, count) {
  const ranges = payoutTable[symbolKey];
  if (!ranges) return 0;

  // Special handling for scatter
  if (symbolKey === 'scatter') {
    const cappedCount = Math.min(count, 6); // cap at max defined value
    return ranges[cappedCount] || 0;
  }

  if (count >= 8  && count <= 9 ) return ranges['8-9'];
  if (count >= 10 && count <= 11) return ranges['10-11'];
  if (count >= 12)                return ranges['12-30'];
  return 0;
}


function calculateWinnings(symbolCounts = [], bet = 0, orbData = [], globalMultiplier = 1) {
  let baseWin = 0;

  console.log('🧮 calculateWinnings got:', { symbolCounts, bet, orbData, globalMultiplier });

  if (Array.isArray(symbolCounts)) {
    for (const cascade of symbolCounts) {
      for (const key in cascade) {
        const payout = getPayout(key, cascade[key]);
        console.log(`   key=${key}, count=${cascade[key]}, payoutMultiplier=${payout}`);
        baseWin += payout * bet;
      }
    }
  } else {
    for (const key in symbolCounts) {
      const payout = getPayout(key, symbolCounts[key]);
      console.log(`   key=${key}, count=${symbolCounts[key]}, payoutMultiplier=${payout}`);
      baseWin += payout * bet;
    }
  }

  // ✅ Only apply globalMultiplier if this spin had orbs
  const effectiveMultiplier = orbData.length > 0 ? globalMultiplier : 1;

  console.log(`   baseWin=${baseWin}, globalMultiplier=${effectiveMultiplier}`);
  const totalWin = parseFloat((baseWin * effectiveMultiplier).toFixed(2)); // Round Up Decimals

  console.log(`   → totalWin=${totalWin}\n`);
  return totalWin;
}



// --- Route 1: spin (deducts bet) ---
router.post('/spin1000', async (req, res) => {
  const { bet, currency, isFreeSpin = false, ante = false } = req.body;

  console.log('Spin request received:', { bet, currency, isFreeSpin, ante });

  if (!req.session.user) {
    console.log('User not logged in');
    return res.status(401).json({ error: 'Not logged in' });
  }

  // Validate bet
  if (currency === 'USD' && (bet < 0.2 || bet > 100)) {
    console.log('Invalid USD bet:', bet);
    return res.status(400).json({ error: 'Invalid USD bet' });
  }
  if (currency === 'LBP' && (bet < 10000 || bet > 10000000)) {
    console.log('Invalid LBP bet:', bet);
    return res.status(400).json({ error: 'Invalid LBP bet' });
  }

  const user = await User.findById(req.session.user.id);
  if (!user) {
    console.log('User not found:', req.session.user.id);
    return res.status(404).json({ error: 'User not found' });
  }

  const totalBet = ante ? bet * 1.25 : bet; // 💡 Adjust bet if ante is on
  const totalBetRounded = Math.round(totalBet * 100) / 100; // optional: round to 2 decimals for USD

  if (!isFreeSpin) {
    console.log(`Deducting ${totalBetRounded} from user balance (ante: ${ante})`);

    if (currency === 'USD') {
      if (user.balanceUSD < totalBetRounded) {
        console.log('Insufficient USD balance:', user.balanceUSD);
        return res.status(400).json({ error: 'Insufficient USD balance' });
      }
      user.balanceUSD -= totalBetRounded;
      req.session.user.balanceUSD = user.balanceUSD;
    } else {
      if (user.balanceLBP < totalBetRounded) {
        console.log('Insufficient LBP balance:', user.balanceLBP);
        return res.status(400).json({ error: 'Insufficient LBP balance' });
      }
      user.balanceLBP -= totalBetRounded;
      req.session.user.balanceLBP = user.balanceLBP;
    }

    await user.save();
    console.log(`Balance deducted for user ${user._id}, new balances: USD=${user.balanceUSD}, LBP=${user.balanceLBP}`);
  } else {
    console.log('Free spin detected - skipping balance deduction');
  }

  res.json({
    success: true,
    newBalanceUSD: user.balanceUSD,
    newBalanceLBP: user.balanceLBP,
    ante,
    baseBet: bet,
    totalDeducted: totalBetRounded
  });
});




// --- Route 2: resolve-win (give out wins) ---
router.post('/resolve-win1000', async (req, res) => {
  const {
    bet,
    currency,
    symbolCounts = [],
    orbData = [],
    isFreeSpin = false,
    globalMultiplier = 0  // default 0, since your frontend starts at 0
  } = req.body;

  console.log('resolve-win payload', {
    bet,
    currency,
    symbolCounts,
    orbData,
    isFreeSpin,
    globalMultiplier
  });

  if (!req.session.user) {
    console.log('resolve-win error: Not logged in');
    return res.status(401).json({ error: 'Not logged in' });
  }

  const user = await User.findById(req.session.user.id);
  if (!user) {
    console.log('resolve-win error: User not found', req.session.user.id);
    return res.status(404).json({ error: 'User not found' });
  }

  // Calculate orb multiplier sum from orbData (sum of orb values)
  const orbSum = Array.isArray(orbData) ? orbData.reduce((sum, orb) => sum + (orb.value || 0), 0) : 0;
  
  // Update the global multiplier by adding orbSum (the increment from this spin)
  const updatedGlobalMultiplier = globalMultiplier + orbSum;

  // Calculate total winnings using updated global multiplier
  const totalWin = calculateWinnings(symbolCounts, bet, orbData, updatedGlobalMultiplier);
  console.log(`Calculated totalWin: ${totalWin} for user ${user._id} (isFreeSpin: ${isFreeSpin}), updatedGlobalMultiplier: ${updatedGlobalMultiplier}`);

  // Only credit user if not a free spin
  if (!isFreeSpin) {
    console.log(`Updating balance for user ${user._id} with totalWin: ${totalWin}`);
    if (currency === 'USD') {
      user.balanceUSD += totalWin;
      req.session.user.balanceUSD = user.balanceUSD;
    } else if (currency === 'LBP') {
      user.balanceLBP += totalWin;
      req.session.user.balanceLBP = user.balanceLBP;
    } else {
      console.log(`resolve-win error: Invalid currency '${currency}'`);
      return res.status(400).json({ error: 'Invalid currency' });
    }
    await user.save();
    console.log(`Balance updated. New balances - USD: ${user.balanceUSD}, LBP: ${user.balanceLBP}`);
  } else {
    console.log(`Free spin detected - skipping balance update for user ${user._id}`);
  }

  res.json({
    success: true,
    totalWin,
    updatedGlobalMultiplier,       // <---- send updated global multiplier back
    newBalanceUSD: user.balanceUSD,
    newBalanceLBP: user.balanceLBP
  });
});




// --- Route 3: buy free spins (deduct bet x 100) ---
router.post('/buy-free-spins1000', async (req, res) => {
  const { bet, currency } = req.body;

  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  // Validate bet and currency just like spin route
  if (currency === 'USD' && (bet < 0.2 || bet > 100)) {
    return res.status(400).json({ error: 'Invalid USD bet' });
  }
  if (currency === 'LBP' && (bet < 10000 || bet > 10000000)) {
    return res.status(400).json({ error: 'Invalid LBP bet' });
  }

  const user = await User.findById(req.session.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const cost = bet * 100;

  // Deduct balance based on currency
  if (currency === 'USD') {
    if (user.balanceUSD < cost) return res.status(400).json({ error: 'Insufficient USD balance' });
    user.balanceUSD -= cost;
    req.session.user.balanceUSD = user.balanceUSD;
  } else if (currency === 'LBP') {
    if (user.balanceLBP < cost) return res.status(400).json({ error: 'Insufficient LBP balance' });
    user.balanceLBP -= cost;
    req.session.user.balanceLBP = user.balanceLBP;
  } else {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  await user.save();

  res.json({ 
    success: true,
    newBalanceUSD: user.balanceUSD,
    newBalanceLBP: user.balanceLBP,
    cost
  });
});

// --- Route 4: complete-free-spins (apply total win from bonus round) ---
router.post('/complete-free-spins1000', async (req, res) => {
  try {
    const { totalWin, currency } = req.body;
    console.log('complete-free-spins payload', { totalWin, currency });

    if (!req.session.user) {
      console.log('complete-free-spins error: Not logged in');
      return res.status(401).json({ error: 'Not logged in' });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      console.log('complete-free-spins error: User not found', req.session.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    if (typeof totalWin !== 'number' || totalWin < 0) {
      console.log('complete-free-spins error: Invalid totalWin amount', totalWin);
      return res.status(400).json({ error: 'Invalid total win amount' });
    }

    // Round totalWin to 2 decimal places
    const roundedWin = Math.round((totalWin + Number.EPSILON) * 100) / 100;

    if (currency === 'USD') {
      console.log(`Adding total free spin win ${roundedWin} USD to user ${user._id}`);
      user.balanceUSD += roundedWin;
      user.balanceUSD = Math.round((user.balanceUSD + Number.EPSILON) * 100) / 100;
      req.session.user.balanceUSD = user.balanceUSD;
    } else if (currency === 'LBP') {
      console.log(`Adding total free spin win ${roundedWin} LBP to user ${user._id}`);
      user.balanceLBP += roundedWin;
      user.balanceLBP = Math.round((user.balanceLBP + Number.EPSILON) * 100) / 100;
      req.session.user.balanceLBP = user.balanceLBP;
    } else {
      console.log(`complete-free-spins error: Invalid currency '${currency}'`);
      return res.status(400).json({ error: 'Invalid currency' });
    }

    await user.save();
    console.log(`Balance updated after free spins. New balances - USD: ${user.balanceUSD}, LBP: ${user.balanceLBP}`);

    res.json({
      success: true,
      newBalanceUSD: user.balanceUSD,
      newBalanceLBP: user.balanceLBP,
      totalWin: roundedWin  // ✅ Return clean win value
    });
  } catch (err) {
    console.error('Unexpected error in complete-free-spins:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

module.exports = router;
