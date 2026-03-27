const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'ojoj';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Simple auth middleware
function checkAuth(req, res, next) {
  const password = req.body.password || req.query.password || req.cookies.auth;

  if (password === MASTER_PASSWORD) {
    res.cookie('auth', password, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
    next();
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
}

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/tierlist.html');
});

app.get('/tierlist.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'tierlist.html'));
});

app.use(express.static('public'));

// API Endpoints

// Get all oranges
app.get('/api/oranges', async (req, res) => {
  try {
    const oranges = await db.getOranges();
    res.json(oranges);
  } catch (error) {
    console.error('Error fetching oranges:', error);
    res.status(500).json({ error: 'Failed to fetch oranges' });
  }
});

// Get single orange with vote stats
app.get('/api/oranges/:id', async (req, res) => {
  try {
    const orange = await db.getOrange(req.params.id);
    if (!orange) {
      return res.status(404).json({ error: 'Orange not found' });
    }

    const votes = await db.getVotesForOrange(req.params.id);
    const tierStats = await db.getOrangeTierStats(req.params.id);

    res.json({
      ...orange,
      votes,
      tierStats
    });
  } catch (error) {
    console.error('Error fetching orange:', error);
    res.status(500).json({ error: 'Failed to fetch orange' });
  }
});

// Get all votes
app.get('/api/votes', async (req, res) => {
  try {
    const votes = await db.getAllVotes();
    res.json(votes);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

// Get oranges with tiers
app.get('/api/tierlist', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const orangesWithTiers = await db.getOrangesWithTiers();
    res.json(orangesWithTiers);
  } catch (error) {
    console.error('Error fetching tierlist:', error);
    res.status(500).json({ error: 'Failed to fetch tierlist' });
  }
});

// Submit vote
app.post('/api/vote', checkAuth, async (req, res) => {
  try {
    const { orangeId, username, tier } = req.body;

    if (!orangeId || !username || !tier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['S', 'A', 'B', 'C', 'D', 'F'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const vote = await db.submitVote(orangeId, username, tier);

    // Broadcast vote update via WebSocket
    io.emit('voteUpdate', {
      orangeId: parseInt(orangeId),
      username,
      tier,
      timestamp: vote.created_at
    });

    res.json({ success: true, vote });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Remove own vote
app.delete('/api/vote', checkAuth, async (req, res) => {
  try {
    const { orangeId, username } = req.body;

    if (!orangeId || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const vote = await db.deleteVoteByUser(orangeId, username);

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    io.emit('voteUpdate', { orangeId: parseInt(orangeId), username });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

// Admin endpoints

// Create orange
app.post('/api/admin/oranges', checkAuth, async (req, res) => {
  try {
    const { name, description, imageUrl, store } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const orange = await db.createOrange(name, description, imageUrl, store);

    // Broadcast orange creation
    io.emit('orangeCreated', orange);

    res.json({ success: true, orange });
  } catch (error) {
    console.error('Error creating orange:', error);
    res.status(500).json({ error: 'Failed to create orange' });
  }
});

// Update orange
app.put('/api/admin/oranges/:id', checkAuth, async (req, res) => {
  try {
    const { name, description, imageUrl, store } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const orange = await db.updateOrange(req.params.id, name, description, imageUrl, store);

    if (!orange) {
      return res.status(404).json({ error: 'Orange not found' });
    }

    // Broadcast orange update
    io.emit('orangeUpdated', orange);

    res.json({ success: true, orange });
  } catch (error) {
    console.error('Error updating orange:', error);
    res.status(500).json({ error: 'Failed to update orange' });
  }
});

// Update vote
app.put('/api/admin/votes/:id', checkAuth, async (req, res) => {
  try {
    const { tier } = req.body;
    const vote = await db.updateVote(req.params.id, tier);

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    io.emit('voteUpdate', { orangeId: vote.orange_id });

    res.json({ success: true, vote });
  } catch (error) {
    console.error('Error updating vote:', error);
    res.status(500).json({ error: 'Failed to update vote' });
  }
});

// Delete vote
app.delete('/api/admin/votes/:id', checkAuth, async (req, res) => {
  try {
    const vote = await db.deleteVote(req.params.id);

    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    io.emit('voteUpdate', { orangeId: vote.orange_id });

    res.json({ success: true, vote });
  } catch (error) {
    console.error('Error deleting vote:', error);
    res.status(500).json({ error: 'Failed to delete vote' });
  }
});

// Delete orange
app.delete('/api/admin/oranges/:id', checkAuth, async (req, res) => {
  try {
    const orange = await db.deleteOrange(req.params.id);

    if (!orange) {
      return res.status(404).json({ error: 'Orange not found' });
    }

    // Broadcast orange deletion
    io.emit('orangeDeleted', { id: parseInt(req.params.id) });

    res.json({ success: true, orange });
  } catch (error) {
    console.error('Error deleting orange:', error);
    res.status(500).json({ error: 'Failed to delete orange' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected via WebSocket');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
