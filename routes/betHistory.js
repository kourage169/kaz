// routes/betHistory.js 

const express = require('express');
const router = express.Router();
const BetHistory = require('../models/BetHistory'); // BetHistory model

// get last 50 bets for public history page
router.get('/', async (req, res) => {
  try {
    // Fetch last 50 bets, sorted newest first
    const recentBets = await BetHistory.find({})
      .sort({ createdAt: -1 }) // Sort by createdAt (Mongoose's built-in timestamp)
      .limit(50)
      .lean();

    res.json(recentBets);
  } catch (err) {
    console.error('Failed to fetch bet history:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// get user-specific bet history
router.get('/user', async (req, res) => {
  try {
    // Get username from query parameter instead of session
    const username = req.query.username;
    
    if (!username) {
      return res.status(400).json({ error: 'Username parameter is required' });
    }

    // Fetch bets for the specified user, sorted newest first
    const userBets = await BetHistory.find({ username: username })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(userBets);
  } catch (err) {
    console.error('Failed to fetch user bet history:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// get cursor-based paginated user-specific bet history for My Bets page
router.get('/user/paginated', async (req, res) => {
  try {
    const username = req.query.username;
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor; // ISO string timestamp for cursor
    
    if (!username) {
      return res.status(400).json({ error: 'Username parameter is required' });
    }

    // Build query based on cursor
    let query = { username: username };
    if (cursor) {
      // For pagination, we want documents created before the cursor timestamp
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch paginated bets with cursor-based pagination
    const userBets = await BetHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1) // Get one extra to check if there's a next page
      .lean();

    // Check if there's a next page
    const hasNextPage = userBets.length > limit;
    const bets = hasNextPage ? userBets.slice(0, limit) : userBets;

    // Get the cursor for the next page (timestamp of the last document)
    let nextCursor = null;
    if (hasNextPage && bets.length > 0) {
      nextCursor = bets[bets.length - 1].createdAt.toISOString();
    }

    res.json({
      bets: bets,
      pagination: {
        hasNextPage: hasNextPage,
        nextCursor: nextCursor
      }
    });
  } catch (err) {
    console.error('Failed to fetch paginated user bet history:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
