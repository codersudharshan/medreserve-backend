const cors = require("cors");
require("dotenv").config();
const app = require("./app");
const { pool } = require("../config/database");
const bookingExpiryJob = require("./jobs/bookingExpiryJob");

const PORT = process.env.PORT || 4000;

// Just to be safe, apply cors at server-level too
app.use(cors());

// Start the booking expiry background job
// This job runs every 30 seconds to mark expired PENDING bookings as FAILED
bookingExpiryJob.start(pool);

app.listen(PORT, () => {
  console.log(`MedReserve API server running on port ${PORT}`);
});
