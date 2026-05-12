const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

let connectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  mongoose.set("strictQuery", true);
  connectionPromise = mongoose
    .connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 })
    .then(() => {
      logger.info(`MongoDB connected: ${mongoose.connection.name}`);
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
}

module.exports = connectDB;
