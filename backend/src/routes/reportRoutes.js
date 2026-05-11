const express = require("express");
const { authenticate } = require("../middleware/auth");
const { exportReport, listReports } = require("../controllers/reportController");

const router = express.Router();

router.use(authenticate);
router.get("/", listReports);
router.post("/export", exportReport);

module.exports = router;
