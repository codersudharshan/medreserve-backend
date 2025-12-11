const cors = require("cors");
require("dotenv").config();
const app = require("./app");
const { pool } = require("../config/database");
const bookingExpiryJob = require("./jobs/bookingExpiryJob");
const { initializeDatabase } = require("./db/init");

const PORT = process.env.PORT || 4000;

// Just to be safe, apply cors at server-level too
app.use(cors());

/**
 * Start the server with database initialization
 */
async function startServer() {
  try {
    // Step 1: Test database connection
    await pool.query('SELECT 1');
    console.log('✓ Database connection successful');
    
    // Step 2: Initialize database schema (creates tables if missing, runs migrations)
    await initializeDatabase();
    
    // Step 3: Start the booking expiry background job
    // This job runs every 30 seconds to mark expired PENDING bookings as FAILED
    bookingExpiryJob.start(pool);
    
    // Step 4: Start the HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 MedReserve API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', {
      message: error.message,
      code: error.code,
      errno: error.errno
    });
    console.error('Please check DATABASE_URL environment variable');
    
    // Still start the server - it might connect later
    // But don't start the expiry job if DB is not connected
    app.listen(PORT, () => {
      console.log(`⚠️  MedReserve API server running on port ${PORT} (database not connected)`);
    });
  }
}

startServer();
