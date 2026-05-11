const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

async function start() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      logger.info(`Backend API running on port ${env.port}`);
    });
  } catch (error) {
    logger.error("Failed to start backend", { error: error.message });
    process.exit(1);
  }
}

start();
