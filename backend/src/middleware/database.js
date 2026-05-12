const connectDB = require("../config/db");
const ApiError = require("../utils/ApiError");

function isHealthOrPreflight(req) {
  const path = req.path || req.originalUrl || "/";
  return req.method === "OPTIONS" || path === "/" || path === "/api" || path === "/api/" || path === "/health" || path === "/api/health";
}

async function ensureDatabase(req, _res, next) {
  if (isHealthOrPreflight(req)) {
    return next();
  }

  try {
    await connectDB();
    return next();
  } catch (error) {
    return next(
      new ApiError(503, "Database connection failed. Check MONGODB_URI in Vercel environment variables.", {
        reason: error.message
      })
    );
  }
}

module.exports = ensureDatabase;
