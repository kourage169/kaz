const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const SuperAgent = require('../models/SuperAgent');
const Agent = require('../models/Agent');
const SuperAgentTransaction = require('../models/SuperAgentTransaction');


// Get super agent session info
router.get('/session', async (req, res) => {
  if (!req.session.superAgent) return res.status(403).json({ error: 'Not logged in' });

  const sa = await SuperAgent.findById(req.session.superAgent.id);
  res.json({
    username: sa.username,
    balanceUSD: sa.balanceUSD,
    balanceLBP: sa.balanceLBP,
  });
});

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const superAgent = await SuperAgent.findOne({ username });
  if (!superAgent) return res.status(401).send('Invalid credentials');

  const match = await bcrypt.compare(password, superAgent.password);
  if (!match) return res.status(401).send('Invalid credentials');

  req.session.superAgent = {
    id: superAgent._id,
    username: superAgent.username
  };

  res.json({ success: true });
});

// Create Agent Route
router.post('/create-agent', async (req, res) => {
    if (!req.session.superAgent?.id) return res.status(401).json({ error: 'Unauthorized' });
  
    const { username, password } = req.body;
  
    const hashed = await bcrypt.hash(password, 10);
  
    const newAgent = new Agent({
      username,
      password: hashed,
      superAgentId: req.session.superAgent.id
    });
  
    await newAgent.save();
    res.json({ success: true });
  });

  // Deposit agent route 
  router.post('/deposit-agent', async (req, res) => {
    const { agentId, amount, currency } = req.body;
    const SuperAgent = require('../models/SuperAgent');
    const Agent = require('../models/Agent');
  
    if (!req.session.superAgent?.id) return res.status(401).json({ error: 'Unauthorized' });
  
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const superAgent = await SuperAgent.findById(req.session.superAgent.id).session(session);
      const agent = await Agent.findById(agentId).session(session);
  
      if (!superAgent || !agent) throw new Error('Not found');
  
      const balanceKey = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      if (superAgent[balanceKey] < amount) throw new Error('Insufficient super agent balance');
  
      superAgent[balanceKey] -= amount;
      agent[balanceKey] += amount;
  
      await superAgent.save({ session });
      await agent.save({ session });

      // ✅ Add transaction log here
      await SuperAgentTransaction.create([{
       superAgentId: superAgent._id,
       superAgentName: superAgent.username, // Added
       agentId: agent._id,
       agentName: agent.username, // Added
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
  
  // Withdraw from agent route
  router.post('/withdraw-from-agent', async (req, res) => {
    const { agentId, amount, currency } = req.body;
    const SuperAgent = require('../models/SuperAgent');
    const Agent = require('../models/Agent');
  
    if (!req.session.superAgent?.id) return res.status(401).json({ error: 'Unauthorized' });
  
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const superAgent = await SuperAgent.findById(req.session.superAgent.id).session(session);
      const agent = await Agent.findById(agentId).session(session);
  
      if (!superAgent || !agent) throw new Error('Not found');
  
      const balanceKey = currency === 'USD' ? 'balanceUSD' : 'balanceLBP';
      if (agent[balanceKey] < amount) throw new Error('Insufficient agent balance');
  
      agent[balanceKey] -= amount;
      superAgent[balanceKey] += amount;
  
      await superAgent.save({ session });
      await agent.save({ session });

      // ✅ Add transaction log here
      await SuperAgentTransaction.create([{
        superAgentId: superAgent._id,
        superAgentName: superAgent.username, // Added
        agentId: agent._id,
        agentName: agent.username, // Added
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

  // List agents under the current super agent
router.get('/agents', async (req, res) => {
  if (!req.session.superAgent?.id) return res.status(401).json({ error: 'Unauthorized' });

  const agents = await Agent.find({ superAgentId: req.session.superAgent.id })
    .select('username balanceUSD balanceLBP');

  res.json(agents);
});

// Get transaction history between super agent and agents
router.get('/transactions', async (req, res) => {
  if (!req.session.superAgent?.id) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const transactions = await SuperAgentTransaction.find({ superAgentId: req.session.superAgent.id })
      .sort({ timestamp: -1 })
      .limit(100);
      // Removed .populate('agentId', 'username') - now using stored agentName

    res.json(transactions);
  } catch (err) {
    console.error('Transaction fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

  
  module.exports = router;