/**
 * Database Initialization Module
 * 
 * Automatically initializes the database schema on server startup.
 * Checks if tables exist, creates them if missing, and runs migrations.
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../../config/database');

/**
 * Check if a table exists in the database
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} True if table exists
 */
async function tableExists(tableName) {
  try {
    const result = await pool.query(
      "SELECT to_regclass($1) as exists",
      [`public.${tableName}`]
    );
    return result.rows[0].exists !== null;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Execute SQL file content
 * @param {string} sqlContent - SQL statements to execute
 */
async function executeSQL(sqlContent) {
  // Remove SQL comments (-- style)
  const withoutComments = sqlContent
    .split('\n')
    .map(line => {
      const commentIndex = line.indexOf('--');
      return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
    })
    .join('\n');

  // Split by semicolons and filter out empty statements
  const statements = withoutComments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await pool.query(statement);
      } catch (error) {
        // Ignore "already exists" errors for CREATE TABLE IF NOT EXISTS
        if (!error.message.includes('already exists') && 
            !error.message.includes('duplicate') &&
            !error.message.includes('relation') && // PostgreSQL relation already exists
            !error.message.includes('already')) {
          throw error;
        }
      }
    }
  }
}

/**
 * Run the expires_at migration if needed
 */
async function runExpiresAtMigration() {
  try {
    // Check if expires_at column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'expires_at'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('ℹ️  expires_at column already exists, skipping migration');
      return;
    }

    console.log('ℹ️  Running expires_at migration...');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Add expires_at column
      await client.query(`
        ALTER TABLE bookings 
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL
      `);

      // Set expires_at for existing PENDING bookings
      const updateResult = await client.query(`
        UPDATE bookings
        SET expires_at = created_at + INTERVAL '2 minutes'
        WHERE status = 'PENDING' AND expires_at IS NULL
      `);
      
      if (updateResult.rowCount > 0) {
        console.log(`   Updated ${updateResult.rowCount} existing PENDING booking(s)`);
      }

      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_bookings_status_expires 
        ON bookings(status, expires_at)
      `);

      await client.query('COMMIT');
      console.log('✅ expires_at migration completed');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('⚠️  expires_at migration error:', error.message);
    // Don't throw - allow server to start even if migration fails
  }
}

/**
 * Initialize the database schema
 * Checks if tables exist and creates them if needed
 */
async function initializeDatabase() {
  try {
    console.log('🔍 Checking database schema...');

    // Check if bookings table exists (main table)
    const bookingsExists = await tableExists('bookings');
    const doctorsExists = await tableExists('doctors');
    const slotsExists = await tableExists('slots');

    if (!bookingsExists || !doctorsExists || !slotsExists) {
      console.log('📌 Schema missing → creating tables from sql/init.sql');

      // Read and execute init.sql
      const initSQLPath = path.join(__dirname, '../../sql/init.sql');
      const sqlContent = fs.readFileSync(initSQLPath, 'utf8');
      
      await executeSQL(sqlContent);
      console.log('✅ Schema ready');
    } else {
      console.log('✅ Schema ready');
    }

    // Run expires_at migration if needed
    console.log('ℹ️  Running expires_at migration if needed');
    await runExpiresAtMigration();

    console.log('✅ Backend fully initialized');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  tableExists
};

