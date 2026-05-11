const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset" },
    modelRun: { type: mongoose.Schema.Types.ObjectId, ref: "ModelRun" },
    path: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
