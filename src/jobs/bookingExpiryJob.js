/**
 * Booking Expiry Job
 * 
 * Background job that runs every 30 seconds to automatically expire PENDING bookings
 * that have passed their expiry time (2 minutes after creation).
 * 
 * This ensures that slots held by PENDING bookings are released if the booking
 * process doesn't complete within the timeout period.
 */

/**
 * Start the booking expiry job
 * Runs every 30 seconds to mark expired PENDING bookings as FAILED
 * 
 * @param {Pool} pool - PostgreSQL connection pool from config/database.js
 * @returns {NodeJS.Timeout} The interval timer (can be used to stop the job)
 */
function start(pool) {
  console.log('Starting booking expiry job (runs every 30 seconds)');

  // Run immediately on startup, then every 30 seconds
  runExpiryCheck(pool);

  const interval = setInterval(() => {
    runExpiryCheck(pool);
  }, 30000); // 30 seconds

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Stopping booking expiry job...');
    clearInterval(interval);
  });

  process.on('SIGINT', () => {
    console.log('Stopping booking expiry job...');
    clearInterval(interval);
  });

  return interval;
}

/**
 * Execute the expiry check query
 * Updates PENDING bookings that have passed their expires_at time to FAILED status
 * 
 * @param {Pool} pool - PostgreSQL connection pool
 */
async function runExpiryCheck(pool) {
  try {
    // Check if expires_at column exists before running the query
    // This prevents errors if migration hasn't been run yet
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'expires_at'
    `);

    if (columnCheck.rows.length === 0) {
      // Column doesn't exist yet - log warning but don't crash
      console.warn('Booking expiry job: expires_at column not found. Please run migration: npm run migrate');
      return;
    }

    // Update all PENDING bookings where expires_at has passed
    // This query uses the index idx_bookings_status_expires for efficient execution
    // Only updates bookings where expires_at is not null and has passed
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'FAILED', updated_at = NOW() 
       WHERE status = 'PENDING' 
         AND expires_at IS NOT NULL 
         AND expires_at <= NOW()`
    );

    const rowsUpdated = result.rowCount;

    if (rowsUpdated > 0) {
      console.log(`[${new Date().toISOString()}] Booking expiry job: Marked ${rowsUpdated} expired booking(s) as FAILED`);
    }
    // Silently succeed if no bookings expired (no need to log every 30s)
  } catch (error) {
    // Log errors but don't crash the job - it will retry on next interval
    // Check if it's a connection error (common during deployment/restart)
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      // Connection errors are expected during deployment - only log once per minute to avoid spam
      const now = Date.now();
      if (!runExpiryCheck.lastConnectionError || (now - runExpiryCheck.lastConnectionError) > 60000) {
        console.warn(`[${new Date().toISOString()}] Booking expiry job: Database connection issue (${error.code}). Will retry...`);
        runExpiryCheck.lastConnectionError = now;
      }
      return; // Silently retry on next interval
    }
    
    // Check if it's a column missing error
    if (error.message && error.message.includes('expires_at')) {
      console.error(`[${new Date().toISOString()}] Booking expiry job: expires_at column error. Please run migration: npm run migrate`);
    } else {
      // Log other errors (but not connection errors that we've already handled)
      console.error(`[${new Date().toISOString()}] Error in booking expiry job:`, {
        message: error.message,
        code: error.code
      });
      // Don't log full stack trace in production to avoid noise
      if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', error.stack);
      }
    }
  }
}

module.exports = {
  start
};

