const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const AgentUserTransaction = require('../models/agentUserTransaction');

// === Agent Login ===
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const agent = await Agent.findOne({ username });
  if (!agent) return res.status(401).send('Invalid credentials');

  const match = await bcrypt.compare(password, agent.password);
  if (!match) return res.status(401).send('Invalid credentials');

  req.session.agent = {
    id: agent._id,
    username: agent.username,
    superAgentId: agent.superAgentId
  };

  res.json({ success: true });
});

// === Agent Logout ===
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/agent/login');
  });
});

// === Check Agent Session ===
router.get('/session', async (req, res) => {
  if (!req.session.agent) {
    return res.status(401).json({ error: 'Not logged in as agent' });
  }

  const agent = await Agent.findById(req.session.agent.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  res.json({
    username: agent.username,
    balanceUSD: agent.balanceUSD,
    balanceLBP: agent.balanceLBP
  });
});

// === Create a new user (by agent) ===
router.post('/create-user', async (req, res) => {
  if (!req.session.agent?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { username, password, balanceUSD, balanceLBP } = req.body;

  if (!username || !password || balanceUSD < 0 || balanceLBP < 0) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const existing = await User.findOne({ username });
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    password: hashed,
    balanceUSD: Number(balanceUSD),
    balanceLBP: Number(balanceLBP),
    isAdmin: false,
    agentId: req.session.agent.id,
    agentName: req.session.agent.username,  // <-- Add this line
  });

  await user.save();
  res.json({ success: true });
});

// === Get all users created by the agent ===
router.get('/users', async (req, res) => {
  if (!req.session.agent?.id) return res.status(401).json({ error: 'Unauthorized' });

  const users = await User.find({ agentId: req.session.agent.id }).select('username balanceUSD balanceLBP');
  res.json(users);
});

// === Deposit to user (agent → user) ===
// === Deposit to user (agent → user) ===
router.post('/deposit-user', async (req, res) => {
  if (!req.session.agent?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { userId, amount, currency } = req.body;
  if (!['USD', 'LBP'].includes(currency)) return res.status(400).json({ error: 'Invalid currency' });

  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const agent = await Agent.findById(req.session.agent.id).session(session);
    const user = await User.findById(userId).session(session);

    if (!agent || !user) throw new Error('Agent or user not found');

    const balanceKey = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

    if (agent[balanceKey] < amount) throw new Error('Insufficient agent balance');

    agent[balanceKey] -= amount;
    user[balanceKey] += amount;

    await agent.save({ session });
    await user.save({ session });

    // ✅ Save transaction
    const AgentUserTransaction = require('../models/agentUserTransaction');
    await AgentUserTransaction.create([{
      agentId: agent._id,
      agentName: agent.username,
      userId: user._id,
      userName: user.username,
      type: 'deposit',
      currency,
      amount
    }], { session });

    await session.commitTransaction();
    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});


// === Withdraw from user (user → agent) ===
router.post('/withdraw-from-user', async (req, res) => {
  if (!req.session.agent?.id) return res.status(401).json({ error: 'Unauthorized' });

  const { userId, amount, currency } = req.body;
  if (!['USD', 'LBP'].includes(currency)) return res.status(400).json({ error: 'Invalid currency' });

  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const agent = await Agent.findById(req.session.agent.id).session(session);
    const user = await User.findById(userId).session(session);

    if (!agent || !user) throw new Error('Agent or user not found');

    const balanceKey = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';

    if (user[balanceKey] < amount) throw new Error('Insufficient user balance');

    user[balanceKey] -= amount;
    agent[balanceKey] += amount;

    await agent.save({ session });
    await user.save({ session });

    // ✅ Save transaction
    const AgentUserTransaction = require('../models/agentUserTransaction');
    await AgentUserTransaction.create([{
      agentId: agent._id,
      agentName: agent.username,
      userId: user._id,
      userName: user.username,
      type: 'withdraw',
      currency,
      amount
    }], { session });

    await session.commitTransaction();
    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});



module.exports = router;
