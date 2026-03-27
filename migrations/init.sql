-- Create oranges table
CREATE TABLE IF NOT EXISTS oranges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    orange_id INTEGER NOT NULL REFERENCES oranges(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    tier CHAR(1) NOT NULL CHECK (tier IN ('S', 'A', 'B', 'C', 'D', 'F')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(orange_id, username)
);

-- Create index on orange_id for faster vote queries
CREATE INDEX IF NOT EXISTS idx_votes_orange_id ON votes(orange_id);

-- Create index on username for user query optimization
CREATE INDEX IF NOT EXISTS idx_votes_username ON votes(username);
