/**
 * Migration: Add expires_at column to bookings table
 * 
 * This migration:
 * 1. Adds expires_at TIMESTAMPTZ column if it doesn't exist
 * 2. Sets expires_at for existing PENDING bookings (created_at + 2 minutes)
 * 3. Creates an index on (status, expires_at) for efficient expiry queries
 * 
 * Run with: npm run migrate
 */

require('dotenv').config();
const { pool } = require('../../config/database');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: add_expires_at');
    await client.query('BEGIN');

    // Step 1: Add expires_at column if it doesn't exist
    console.log('Adding expires_at column...');
    await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL
    `);
    console.log('✓ expires_at column added (or already exists)');

    // Step 2: Set expires_at for existing PENDING bookings
    console.log('Updating existing PENDING bookings...');
    const updateResult = await client.query(`
      UPDATE bookings
      SET expires_at = created_at + INTERVAL '2 minutes'
      WHERE status = 'PENDING' AND expires_at IS NULL
    `);
    console.log(`✓ Updated ${updateResult.rowCount} existing PENDING booking(s)`);

    // Step 3: Create index for efficient expiry queries
    console.log('Creating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status_expires 
      ON bookings(status, expires_at)
    `);
    console.log('✓ Index created (or already exists)');

    await client.query('COMMIT');
    console.log('✓ Migration completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    // Don't close the pool - it may be used by the server
    // The process will exit naturally
    process.exit(0);
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Migration error:', error);
  process.exit(1);
});

