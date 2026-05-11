const Dataset = require("../models/Dataset");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const excelService = require("../services/excelService");
const mlClient = require("../services/mlClient");
const logger = require("../utils/logger");

const uploadDataset = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Dataset file is required");

  const localAnalysis = excelService.analyzeFile(req.file.path);
  let analysis = localAnalysis;

  try {
    analysis = await mlClient.analyzeDataset(req.file.path);
  } catch (error) {
    logger.warn("ML analysis unavailable; using Node.js analytics fallback", { error: error.message });
  }

  const dataset = await Dataset.create({
    name: req.body.name || req.file.originalname,
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    mimeType: req.file.mimetype,
    rowCount: analysis.profile?.rows || localAnalysis.profile.rows,
    columnCount: analysis.profile?.columns || localAnalysis.profile.columns,
    detectedColumns: analysis.detected_columns || localAnalysis.detected_columns,
    columnSummary: analysis.columns || localAnalysis.columns,
    analytics: analysis.analytics || localAnalysis.analytics,
    status: "analyzed",
    uploadedBy: req.user._id
  });

  res.status(201).json({ dataset, analysis: { ...analysis, options: localAnalysis.options } });
});

const listDatasets = asyncHandler(async (_req, res) => {
  const datasets = await Dataset.find().sort({ createdAt: -1 }).populate("uploadedBy", "name email");
  res.json({ datasets });
});

const getDataset = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findById(req.params.id).populate("uploadedBy", "name email");
  if (!dataset) throw new ApiError(404, "Dataset not found");
  const analysis = excelService.analyzeFile(dataset.path);
  res.json({ dataset, analysis });
});

const getDatasetAnalytics = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) throw new ApiError(404, "Dataset not found");
  const analysis = excelService.analyzeFile(dataset.path, req.query);
  res.json({ datasetId: dataset._id, ...analysis });
});

module.exports = {
  uploadDataset,
  listDatasets,
  getDataset,
  getDatasetAnalytics
};
