const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'add_store_field.sql'), 'utf8');

    console.log('Adding store field to oranges table...');
    await pool.query(sql);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
