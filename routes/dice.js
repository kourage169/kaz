// routes/dicejs
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BetHistory = require('../models/BetHistory'); // NEW

// Middleware to check login
router.use((req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
});

//////////////////////// CONST MULTIPLIERS ////////////////////////
const multipliers = {
    rollUnder: {
      "2": "49.5000",
      "3": "33.0000",
      "4": "24.7500",
      "5": "19.8000",
      "6": "16.5000",
      "7": "14.1429",
      "8": "12.3750",
      "9": "11.0000",
      "10": "9.9000",
      "11": "9.0000",
      "12": "8.2500",
      "13": "7.6154",
      "14": "7.0714",
      "15": "6.6000",
      "16": "6.1875",
      "17": "5.8235",
      "18": "5.5000",
      "19": "5.2105",
      "20": "4.9500",
      "21": "4.7143",
      "22": "4.5000",
      "23": "4.3043",
      "24": "4.1250",
      "25": "3.9600",
      "26": "3.8077",
      "27": "3.6667",
      "28": "3.5357",
      "29": "3.4138",
      "30": "3.3000",
      "31": "3.1935",
      "32": "3.0938",
      "33": "3.0000",
      "34": "2.9118",
      "35": "2.8286",
      "36": "2.7500",
      "37": "2.6757",
      "38": "2.6053",
      "39": "2.5385",
      "40": "2.4750",
      "41": "2.4146",
      "42": "2.3571",
      "43": "2.3023",
      "44": "2.2500",
      "45": "2.2000",
      "46": "2.1522",
      "47": "2.1064",
      "48": "2.0625",
      "49": "2.0204",
      "50": "1.9800",
      "51": "1.9412",
      "52": "1.9038",
      "53": "1.8679",
      "54": "1.8333",
      "55": "1.8000",
      "56": "1.7679",
      "57": "1.7368",
      "58": "1.7069",
      "59": "1.6780",
      "60": "1.6500",
      "61": "1.6230",
      "62": "1.5968",
      "63": "1.5714",
      "64": "1.5469",
      "65": "1.5231",
      "66": "1.5000",
      "67": "1.4776",
      "68": "1.4559",
      "69": "1.4348",
      "70": "1.4143",
      "71": "1.3944",
      "72": "1.3750",
      "73": "1.3562",
      "74": "1.3378",
      "75": "1.3200",
      "76": "1.3026",
      "77": "1.2857",
      "78": "1.2692",
      "79": "1.2532",
      "80": "1.2375",
      "81": "1.2222",
      "82": "1.2073",
      "83": "1.1928",
      "84": "1.1786",
      "85": "1.1647",
      "86": "1.1512",
      "87": "1.1379",
      "88": "1.1250",
      "89": "1.1124",
      "90": "1.1000",
      "91": "1.0879",
      "92": "1.0761",
      "93": "1.0645",
      "94": "1.0532",
      "95": "1.0421",
      "96": "1.0312",
      "97": "1.0206",
      "98": "1.0102"
    },
    rollOver: {
      "2": "1.0102",
      "3": "1.0206",
      "4": "1.0312",
      "5": "1.0421",
      "6": "1.0532",
      "7": "1.0645",
      "8": "1.0761",
      "9": "1.0879",
      "10": "1.1000",
      "11": "1.1124",
      "12": "1.1250",
      "13": "1.1379",
      "14": "1.1512",
      "15": "1.1647",
      "16": "1.1786",
      "17": "1.1928",
      "18": "1.2073",
      "19": "1.2222",
      "20": "1.2375",
      "21": "1.2532",
      "22": "1.2692",
      "23": "1.2857",
      "24": "1.3026",
      "25": "1.3200",
      "26": "1.3378",
      "27": "1.3562",
      "28": "1.3750",
      "29": "1.3944",
      "30": "1.4143",
      "31": "1.4348",
      "32": "1.4559",
      "33": "1.4776",
      "34": "1.5000",
      "35": "1.5231",
      "36": "1.5469",
      "37": "1.5714",
      "38": "1.5968",
      "39": "1.6230",
      "40": "1.6500",
      "41": "1.6780",
      "42": "1.7069",
      "43": "1.7368",
      "44": "1.7679",
      "45": "1.8000",
      "46": "1.8333",
      "47": "1.8679",
      "48": "1.9038",
      "49": "1.9412",
      "50": "1.9800",
      "51": "2.0204",
      "52": "2.0625",
      "53": "2.1064",
      "54": "2.1522",
      "55": "2.2000",
      "56": "2.2500",
      "57": "2.3023",
      "58": "2.3571",
      "59": "2.4146",
      "60": "2.4750",
      "61": "2.5385",
      "62": "2.6053",
      "63": "2.6757",
      "64": "2.7500",
      "65": "2.8286",
      "66": "2.9118",
      "67": "3.0000",
      "68": "3.0938",
      "69": "3.1935",
      "70": "3.3000",
      "71": "3.4138",
      "72": "3.5357",
      "73": "3.6667",
      "74": "3.8077",
      "75": "3.9600",
      "76": "4.1250",
      "77": "4.3043",
      "78": "4.5000",
      "79": "4.7143",
      "80": "4.9500",
      "81": "5.2105",
      "82": "5.5000",
      "83": "5.8235",
      "84": "6.1875",
      "85": "6.6000",
      "86": "7.0714",
      "87": "7.6154",
      "88": "8.2500",
      "89": "9.0000",
      "90": "9.9000",
      "91": "11.0000",
      "92": "12.3750",
      "93": "14.1429",
      "94": "16.5000",
      "95": "19.8000",
      "96": "24.7500",
      "97": "33.0000",
      "98": "49.5000"
    }
  };

  router.post('/play', async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { amount, currency, rollType, target } = req.body;
  
      // Validate inputs
      if (!['USD', 'LBP'].includes(currency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }
      if (!['rollUnder', 'rollOver'].includes(rollType)) {
        return res.status(400).json({ error: 'Invalid roll type' });
      }
      const parsedTarget = parseInt(target);
      if (isNaN(parsedTarget) || parsedTarget < 2 || parsedTarget > 98) {
        return res.status(400).json({ error: 'Target must be between 2 and 98' });
      }
  
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Invalid bet amount' });
      }
  
      // Get user
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      if (user[balanceField] < parsedAmount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
  
      // Deduct bet
      user[balanceField] -= parsedAmount;
  
      // Roll the dice (simulate to 2 decimal places)
      const roll = parseFloat((Math.random() * 100).toFixed(2));
      const won = (rollType === 'rollUnder' && roll < parsedTarget) ||
                  (rollType === 'rollOver' && roll > parsedTarget);
  
      let payout = 0;
      if (won) {
        const multiplier = parseFloat(multipliers[rollType][target]);
        payout = parseFloat((parsedAmount * multiplier).toFixed(2));
        user[balanceField] += payout;
      }
  
      await user.save();
  
      // Update session balance (fix the field name)
      req.session.user.balanceUSD = user.balanceUSD;
      req.session.user.balanceLBP = user.balanceLBP;

    // Save to bet history
    const betRecord = await BetHistory.create({
      userId: user._id,
      agentId: user.agentId || null,
      agentName: user.agentName || null,
      username: user.username,
      game: 'Dice',
      currency,
      betAmount: parsedAmount,
      payout: payout,
    });

    // Emit to WebSocket
    req.app.get('wssBroadcast')({
      type: 'bet',
      username: user.username,
      game: 'Dice',
      currency,
      betAmount: parsedAmount,
      payout: payout,
      timestamp: betRecord.createdAt,
    });

  
      return res.json({
        success: true,
        result: roll,
        won,
        payout,
        newBalanceUSD: user.balanceUSD,
        newBalanceLBP: user.balanceLBP
      });
    } catch (err) {
      console.error('Dice play error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });
  

module.exports = router;
