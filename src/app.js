const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("../routes"));

app.get("/health", async (req, res) => {
  try {
    // Test database connection
    const { query } = require("../config/database");
    await query("SELECT 1");
    
    res.json({ 
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use(require("../middleware/errorHandler"));

module.exports = app;
