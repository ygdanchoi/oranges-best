const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  // Use DATABASE_PUBLIC_URL if available, otherwise DATABASE_URL
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: DATABASE_PUBLIC_URL or DATABASE_URL not found in .env file');
    process.exit(1);
  }

  console.log('Connecting to database...');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');

    console.log('Running migrations...');
    await pool.query(sql);

    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
