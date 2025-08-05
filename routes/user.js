const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notifications');
const AgentUserTransaction = require('../models/agentUserTransaction');
const ContactMessage = require('../models/ContactMessage');

// === Get Balance === (used in plinko -  roulette - video poker - hilo)
router.get('/balance', async (req, res) => {
  try {
    if (!req.session.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      balanceUSD: user.balanceUSD,
      balanceLBP: user.balanceLBP
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Get Deposit History ===
router.get('/deposit-history', async (req, res) => {
  try {
    if (!req.session.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    
    const page = parseInt(req.query.page) || 0;
    const limit = 10;
    const skip = page * limit;
    
    // Get total count for pagination
    const totalCount = await AgentUserTransaction.countDocuments({
      userId: req.session.user.id,
      type: 'deposit'
    });
    
    // Get deposits with pagination
    const deposits = await AgentUserTransaction.find({
      userId: req.session.user.id,
      type: 'deposit'
    })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .select('type timestamp currency amount');
    
    const hasMore = (skip + limit) < totalCount;
    
    res.json({
      deposits: deposits.map(deposit => ({
        type: deposit.type,
        date: deposit.timestamp,
        currency: deposit.currency,
        amount: deposit.amount
      })),
      hasMore,
      totalCount
    });
    
  } catch (error) {
    console.error('Deposit history fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Get Withdraw History ===
router.get('/withdraw-history', async (req, res) => {
  try {
    if (!req.session.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    
    const page = parseInt(req.query.page) || 0;
    const limit = 10;
    const skip = page * limit;
    
    // Get total count for pagination
    const totalCount = await AgentUserTransaction.countDocuments({
      userId: req.session.user.id,
      type: 'withdraw'
    });
    
    // Get withdraws with pagination
    const withdraws = await AgentUserTransaction.find({
      userId: req.session.user.id,
      type: 'withdraw'
    })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .select('type timestamp currency amount');
    
    const hasMore = (skip + limit) < totalCount;
    
    res.json({
      withdraws: withdraws.map(withdraw => ({
        type: withdraw.type,
        date: withdraw.timestamp,
        currency: withdraw.currency,
        amount: withdraw.amount
      })),
      hasMore,
      totalCount
    });
    
  } catch (error) {
    console.error('Withdraw history fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//////////////////////////////////// Get Notifications ///////////////////////////////////////////
// Get notifications for the logged-in user
router.get('/notifications', async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.username) {
    return res.status(401).send('Not logged in');
  }

  const now = new Date();

  try {
    const notifications = await Notification.find({
      expiresAt: { $gt: now },
      $or: [
        { username: null }, // global notifications
        { username: req.session.user.username } // user-specific notifications
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch notifications');
  }
});

//////////////////////////////////// Get User Joined Date ///////////////////////////////////////////
// Get user's joined date (creation date from ObjectId)
router.get('/joined-date', async (req, res) => {
  try {
    if (!req.session.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.session.user.id).select('_id');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract creation date from ObjectId
    const joinedDate = user._id.getTimestamp();

    res.json({ joinedAt: joinedDate });
  } catch (err) {
    console.error('Error fetching joined date:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// === Submit Contact Message ===
router.post('/contact', async (req, res) => {
  try {
    if (!req.session.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    
    const { name, email, phone, inquiryType, subject, message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Create new contact message
    const contactMessage = new ContactMessage({
      name,
      email,
      phone: phone || '',
      inquiryType: inquiryType || 'Support',
      subject: subject || '',
      message
    });
    
    await contactMessage.save();
    
    res.json({ 
      success: true, 
      message: 'Contact message sent successfully' 
    });
    
  } catch (error) {
    console.error('Contact message save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
