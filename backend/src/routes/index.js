const express = require("express");
const authRoutes = require("./authRoutes");
const datasetRoutes = require("./datasetRoutes");
const modelRoutes = require("./modelRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const reportRoutes = require("./reportRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.get("/health", (_req, res) => res.json({ status: "healthy", service: "backend" }));
router.use("/auth", authRoutes);
router.use("/datasets", datasetRoutes);
router.use("/models", modelRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
