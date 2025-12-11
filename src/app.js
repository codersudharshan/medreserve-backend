const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("../routes"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(require("../middleware/errorHandler"));

module.exports = app;
