const Dataset = require("../models/Dataset");
const ModelRun = require("../models/ModelRun");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const excelService = require("../services/excelService");

const getStats = asyncHandler(async (req, res) => {
  const [datasetCount, modelCount, userCount, latestDataset] = await Promise.all([
    Dataset.countDocuments(),
    ModelRun.countDocuments(),
    User.countDocuments(),
    Dataset.findOne().sort({ createdAt: -1 })
  ]);

  const analysis = latestDataset ? excelService.analyzeFile(latestDataset.path, req.query) : null;
  res.json({
    overview: {
      datasets: datasetCount,
      models: modelCount,
      users: userCount,
      rows: latestDataset?.rowCount || 0,
      columns: latestDataset?.columnCount || 0
    },
    latestDataset,
    analysis
  });
});

module.exports = { getStats };
