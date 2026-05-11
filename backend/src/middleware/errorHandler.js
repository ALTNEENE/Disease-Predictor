const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const env = require("../config/env");

function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  logger.error(err.message, { statusCode, stack: err.stack });
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    details: err.details,
    stack: env.nodeEnv === "production" ? undefined : err.stack
  });
}

module.exports = { notFound, errorHandler };
