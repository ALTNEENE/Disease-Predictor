const express = require("express");
const { overview } = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/overview", authenticate, authorize("admin"), overview);

module.exports = router;
