const path = require("path");
require("dotenv").config();

const isVercel = Boolean(process.env.VERCEL);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/disease_prediction",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000/api",
  uploadDir: path.resolve(process.env.UPLOAD_DIR || (isVercel ? "/tmp/uploads" : "storage/uploads")),
  reportDir: path.resolve(process.env.REPORT_DIR || (isVercel ? "/tmp/reports" : "storage/reports")),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 25)
};

module.exports = env;
