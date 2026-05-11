const path = require("path");
const Dataset = require("../models/Dataset");
const ModelRun = require("../models/ModelRun");
const Report = require("../models/Report");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const excelService = require("../services/excelService");
const { createReport } = require("../services/reportService");

const exportReport = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findById(req.body.datasetId);
  if (!dataset) throw new ApiError(404, "Dataset not found");
  const modelRun = req.body.modelRunId ? await ModelRun.findById(req.body.modelRunId) : null;
  const analysis = excelService.analyzeFile(dataset.path, req.body.filters || {});
  const reportFile = createReport({ dataset, modelRun, analytics: analysis.analytics, user: req.user });

  const report = await Report.create({
    title: req.body.title || `Disease Report - ${dataset.name}`,
    dataset: dataset._id,
    modelRun: modelRun?._id,
    path: reportFile.path,
    createdBy: req.user._id
  });

  res.download(reportFile.path, `${path.basename(reportFile.filename)}`, (error) => {
    if (error && !res.headersSent) {
      res.status(500).json({ message: "Could not download report" });
    }
  });
});

const listReports = asyncHandler(async (_req, res) => {
  const reports = await Report.find()
    .sort({ createdAt: -1 })
    .populate("dataset", "name")
    .populate("modelRun", "name")
    .populate("createdBy", "name email");
  res.json({ reports });
});

module.exports = { exportReport, listReports };
