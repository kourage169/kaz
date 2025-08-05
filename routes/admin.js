const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SuperAgent = require('../models/SuperAgent');
const Notification = require('../models/Notifications');
const bcrypt = require('bcrypt');

// Middleware to check admin
router.use(async (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).send('Unauthorized');
  }
  next();
});

// Create a new user
router.post('/create-user', async (req, res) => {
  const { username, password, balanceUSD, balanceLBP } = req.body;

  // Validate that both balances are numbers and not negative
  if (isNaN(balanceUSD) || isNaN(balanceLBP) || balanceUSD < 0 || balanceLBP < 0) {
    return res.status(400).send('Invalid balance amounts');
  }

  const existing = await User.findOne({ username });
  if (existing) return res.status(409).send('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    username,
    password: hashedPassword,
    balanceUSD: Number(balanceUSD), // Use USD balance
    balanceLBP: Number(balanceLBP), // Use LBP balance
    isAdmin: false, // Default to non-admin
  });

  await user.save();
  res.json({ success: true });
});

// Create a new Super Agent
router.post('/create-superagent', async (req, res) => {
  const { username, password, balanceUSD, balanceLBP } = req.body;

  // Validate balance inputs
  if (isNaN(balanceUSD) || isNaN(balanceLBP) || balanceUSD < 0 || balanceLBP < 0) {
    return res.status(400).send('Invalid balance amounts');
  }

  const existing = await SuperAgent.findOne({ username });
  if (existing) return res.status(409).send('Super Agent already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const superAgent = new SuperAgent({
    username,
    password: hashedPassword,
    balanceUSD: Number(balanceUSD),
    balanceLBP: Number(balanceLBP),
  });

  await superAgent.save();
  res.json({ success: true });
});

//////////////////////////////////// Send Notification to Users ///////////////////////////////////////////
router.post('/send-notification', async (req, res) => {
  try {
    const { message, duration, targetType, username } = req.body;

    if (!message || !duration || !targetType) {
      return res.status(400).send('Missing required fields');
    }

    const now = new Date();
    let expiresAt;

    switch (duration) {
      case '1d': expiresAt = new Date(now.getTime() + 1 * 86400000); break;
      case '3d': expiresAt = new Date(now.getTime() + 3 * 86400000); break;
      case '1w': expiresAt = new Date(now.getTime() + 7 * 86400000); break;
      case '1m': expiresAt = new Date(now.getTime() + 30 * 86400000); break;
      default: return res.status(400).send('Invalid duration');
    }

    const notif = {
      message,
      expiresAt,
      username: targetType === 'specific' ? username.trim() : null
    };

    await Notification.create(notif);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to send notification');
  }
});


module.exports = router;
