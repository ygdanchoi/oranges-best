const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Get all oranges
async function getOranges() {
  const result = await pool.query('SELECT * FROM oranges ORDER BY name');
  return result.rows;
}

// Get single orange by ID
async function getOrange(id) {
  const result = await pool.query('SELECT * FROM oranges WHERE id = $1', [id]);
  return result.rows[0];
}

// Create new orange
async function createOrange(name, description, imageUrl, store) {
  const result = await pool.query(
    'INSERT INTO oranges (name, description, image_url, store) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, description, imageUrl, store]
  );
  return result.rows[0];
}

// Update orange
async function updateOrange(id, name, description, imageUrl, store) {
  const result = await pool.query(
    'UPDATE oranges SET name = $1, description = $2, image_url = $3, store = $4 WHERE id = $5 RETURNING *',
    [name, description, imageUrl, store, id]
  );
  return result.rows[0];
}

// Delete orange (and its votes via CASCADE)
async function deleteOrange(id) {
  const result = await pool.query('DELETE FROM oranges WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

// Submit or update vote (upsert)
async function submitVote(orangeId, username, tier) {
  const result = await pool.query(
    `INSERT INTO votes (orange_id, username, tier)
     VALUES ($1, $2, $3)
     ON CONFLICT (orange_id, username)
     DO UPDATE SET tier = $3, created_at = NOW()
     RETURNING *`,
    [orangeId, username, tier]
  );
  return result.rows[0];
}

// Get votes for specific orange
async function getVotesForOrange(orangeId) {
  const result = await pool.query(
    'SELECT * FROM votes WHERE orange_id = $1 ORDER BY created_at DESC',
    [orangeId]
  );
  return result.rows;
}

// Get all votes (for tierlist calculation)
async function getAllVotes() {
  const result = await pool.query('SELECT * FROM votes ORDER BY orange_id, created_at DESC');
  return result.rows;
}

// Get tier statistics for an orange (mode calculation)
async function getOrangeTierStats(orangeId) {
  const result = await pool.query(
    `SELECT tier, COUNT(*) as count
     FROM votes
     WHERE orange_id = $1
     GROUP BY tier
     ORDER BY count DESC, tier ASC`,
    [orangeId]
  );
  return result.rows;
}

// Get all oranges with their tier assignments
async function getOrangesWithTiers() {
  const oranges = await getOranges();
  const allVotes = await getAllVotes();

  // Group votes by orange
  const votesByOrange = {};
  allVotes.forEach(vote => {
    if (!votesByOrange[vote.orange_id]) {
      votesByOrange[vote.orange_id] = [];
    }
    votesByOrange[vote.orange_id].push(vote.tier);
  });

  // Calculate tier for each orange using median
  const orangesWithTiers = oranges.map(orange => {
    const votes = votesByOrange[orange.id] || [];
    const tier = calculateTierMedian(votes);

    // Count votes by tier for display
    const voteCounts = {};
    votes.forEach(v => {
      voteCounts[v] = (voteCounts[v] || 0) + 1;
    });

    return {
      ...orange,
      tier,
      voteCount: votes.length,
      votes: votes,
      voteCounts: voteCounts
    };
  });

  return orangesWithTiers;
}

// Calculate tier using median (round up for ties)
function calculateTierMedian(votes) {
  if (votes.length === 0) return null;

  // Map tiers to numeric values
  const tierToNum = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
  const numToTier = { 5: 'S', 4: 'A', 3: 'B', 2: 'C', 1: 'D', 0: 'F' };

  // Convert votes to numbers and sort
  const numericVotes = votes.map(tier => tierToNum[tier]).sort((a, b) => a - b);

  let median;
  const mid = Math.floor(numericVotes.length / 2);

  if (numericVotes.length % 2 === 0) {
    // Even number of votes - average the two middle values and round up
    const avg = (numericVotes[mid - 1] + numericVotes[mid]) / 2;
    median = Math.ceil(avg);
  } else {
    // Odd number of votes - take the middle value
    median = numericVotes[mid];
  }

  return numToTier[median];
}

module.exports = {
  pool,
  getOranges,
  getOrange,
  createOrange,
  updateOrange,
  deleteOrange,
  submitVote,
  getVotesForOrange,
  getAllVotes,
  getOrangeTierStats,
  getOrangesWithTiers
};
