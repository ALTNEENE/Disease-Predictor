const path = require("path");
require("dotenv").config();

const isVercel = Boolean(process.env.VERCEL);
const isProduction = process.env.NODE_ENV === "production";

function isLocalUrl(value) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value || "");
}

function productionUrl(name, fallback) {
  const value = process.env[name];
  if (isProduction && isLocalUrl(value)) return fallback;
  return value || fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: productionUrl("CLIENT_URL", isProduction ? "" : "http://localhost:5173"),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/disease_prediction",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mlServiceUrl: productionUrl("ML_SERVICE_URL", isProduction ? "" : "http://localhost:8000/api"),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || (isVercel ? "/tmp/uploads" : "storage/uploads")),
  reportDir: path.resolve(process.env.REPORT_DIR || (isVercel ? "/tmp/reports" : "storage/reports")),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 25)
};

module.exports = env;
