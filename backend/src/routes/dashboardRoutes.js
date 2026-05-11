const express = require("express");
const { authenticate } = require("../middleware/auth");
const { getStats } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/stats", authenticate, getStats);

module.exports = router;
