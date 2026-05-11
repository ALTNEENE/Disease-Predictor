const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = [".xls", ".xlsx", ".csv"];
  if (!allowed.includes(ext)) {
    return cb(new ApiError(400, "Only .xls, .xlsx, and .csv dataset files are allowed"));
  }
  return cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 }
});
