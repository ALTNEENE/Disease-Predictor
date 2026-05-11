const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String },
    rowCount: { type: Number, default: 0 },
    columnCount: { type: Number, default: 0 },
    detectedColumns: { type: Object, default: {} },
    columnSummary: { type: Array, default: [] },
    analytics: { type: Object, default: {} },
    status: { type: String, enum: ["uploaded", "analyzed", "failed"], default: "uploaded" },
    error: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

datasetSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model("Dataset", datasetSchema);
