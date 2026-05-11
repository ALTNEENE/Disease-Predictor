const Dataset = require("../models/Dataset");
const ModelRun = require("../models/ModelRun");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const overview = asyncHandler(async (_req, res) => {
  const [users, datasets, models] = await Promise.all([
    User.find().select("-password").sort({ createdAt: -1 }),
    Dataset.find().sort({ createdAt: -1 }).limit(10).populate("uploadedBy", "name email"),
    ModelRun.find().sort({ createdAt: -1 }).limit(10).populate("dataset", "name")
  ]);
  res.json({
    counts: {
      users: users.length,
      datasets: await Dataset.countDocuments(),
      models: await ModelRun.countDocuments()
    },
    users,
    datasets,
    models
  });
});

module.exports = { overview };
