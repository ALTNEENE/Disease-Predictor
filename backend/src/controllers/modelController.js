const Dataset = require("../models/Dataset");
const ModelRun = require("../models/ModelRun");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const mlClient = require("../services/mlClient");

const trainModel = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findById(req.body.datasetId);
  if (!dataset) throw new ApiError(404, "Dataset not found");

  const result = await mlClient.trainModel(dataset.path, {
    target_disease: req.body.targetDisease,
    target_cases: req.body.targetCases,
    target_deaths: req.body.targetDeaths,
    model_name: req.body.name || `Decision Tree - ${dataset.name}`
  });

  const modelRun = await ModelRun.create({
    name: req.body.name || result.model_name || `Decision Tree - ${dataset.name}`,
    dataset: dataset._id,
    mlModelId: result.model_id,
    targets: result.targets,
    metrics: result.metrics,
    detectedColumns: result.detected_columns,
    rawFeatureColumns: result.raw_feature_columns,
    featureColumns: result.feature_columns,
    availablePredictions: result.available_predictions,
    createdBy: req.user._id
  });

  res.status(201).json({ modelRun, ml: result });
});

const listModels = asyncHandler(async (_req, res) => {
  const models = await ModelRun.find()
    .sort({ createdAt: -1 })
    .populate("dataset", "name rowCount columnCount detectedColumns")
    .populate("createdBy", "name email");
  res.json({ models });
});

const getModel = asyncHandler(async (req, res) => {
  const model = await ModelRun.findById(req.params.id).populate("dataset");
  if (!model) throw new ApiError(404, "Model not found");
  res.json({ model });
});

const predict = asyncHandler(async (req, res) => {
  const model = await ModelRun.findById(req.body.modelRunId);
  if (!model) throw new ApiError(404, "Model not found");
  if (!req.body.features || typeof req.body.features !== "object") {
    throw new ApiError(400, "Prediction features object is required");
  }
  const prediction = await mlClient.predict(model.mlModelId, req.body.features);
  res.json({ prediction, modelRun: model });
});

const getTree = asyncHandler(async (req, res) => {
  const model = await ModelRun.findById(req.params.id);
  if (!model) throw new ApiError(404, "Model not found");
  const tree = await mlClient.getTree(model.mlModelId);
  res.json(tree);
});

module.exports = {
  trainModel,
  listModels,
  getModel,
  predict,
  getTree
};
