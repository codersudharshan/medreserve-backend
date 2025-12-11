/**
 * bookingExpiryJob.js
 * - Runs periodically to mark expired PENDING bookings as FAILED
 * - Throttles DB connection error logs to once per minute to avoid log spam during deploys
 */
const pool = require('../../config/database')

let lastDbErrorAt = 0

async function runExpiryCheck() {
  try {
    // Check if the bookings table has the expires_at column (safe guard)
    const colCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='bookings' AND column_name='expires_at'
      LIMIT 1
    `)

    if (colCheck.rowCount === 0) {
      console.log('Booking expiry job: expires_at column not found. Please run migration: npm run migrate')
      return
    }

    const res = await pool.query(
      `UPDATE bookings
       SET status = 'FAILED', updated_at = NOW()
       WHERE status = 'PENDING' AND expires_at IS NOT NULL AND expires_at <= NOW()
       RETURNING id`
    )

    if (res.rowCount > 0) {
      console.log(`Booking expiry job: marked ${res.rowCount} expired booking(s) as FAILED`)
    }
  } catch (err) {
    // Throttle connection error logs to once per minute
    const now = Date.now()
    const isConnRefused = err && (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED'))
    if (now - lastDbErrorAt > 60 * 1000) {
      console.error('Error in booking expiry job:', {
        message: err.message,
        code: err.code,
      })
      lastDbErrorAt = now
    } else if (!isConnRefused) {
      // log non-connection errors more often
      console.error('Error in booking expiry job (non-conn):', { message: err.message, code: err.code })
    }
    // don't rethrow — job should keep running next interval
  }
}

function start() {
  // run immediately then every 30 seconds
  runExpiryCheck()
  const id = setInterval(runExpiryCheck, 30 * 1000)
  return () => clearInterval(id)
}

module.exports = { start }
