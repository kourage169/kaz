const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).send('Invalid credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).send('Invalid credentials');

  req.session.user = {
    id: user._id,
    username: user.username,
    isAdmin: user.isAdmin,
    balanceUSD: user.balanceUSD,
    balanceLBP: user.balanceLBP,
  };

  console.log(req.session);  // Debug session info

  res.json({ success: true });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Check session info
router.get('/session', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  res.json({
    username: req.session.user.username,
    balanceUSD: req.session.user.balanceUSD,
    balanceLBP: req.session.user.balanceLBP,
    isAdmin: req.session.user.isAdmin,
  });
});

module.exports = router;
