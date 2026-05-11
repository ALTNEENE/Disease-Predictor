const express = require("express");
const upload = require("../middleware/upload");
const { authenticate } = require("../middleware/auth");
const {
  uploadDataset,
  listDatasets,
  getDataset,
  getDatasetAnalytics
} = require("../controllers/datasetController");

const router = express.Router();

router.use(authenticate);
router.post("/upload", upload.single("file"), uploadDataset);
router.get("/", listDatasets);
router.get("/:id", getDataset);
router.get("/:id/analytics", getDatasetAnalytics);

module.exports = router;
