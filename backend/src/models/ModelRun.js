const mongoose = require("mongoose");

const modelRunSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset", required: true },
    mlModelId: { type: String, required: true, unique: true },
    targets: { type: Object, default: {} },
    metrics: { type: Object, default: {} },
    detectedColumns: { type: Object, default: {} },
    rawFeatureColumns: { type: Array, default: [] },
    featureColumns: { type: Array, default: [] },
    availablePredictions: { type: Array, default: [] },
    status: { type: String, enum: ["trained", "failed"], default: "trained" },
    error: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

modelRunSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ModelRun", modelRunSchema);
