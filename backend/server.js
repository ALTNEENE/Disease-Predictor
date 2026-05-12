const app = require("./src/app");
const connectDB = require("./src/config/db");
const env = require("./src/config/env");
const logger = require("./src/utils/logger");

let server;

async function start() {
  await connectDB();
  server = app.listen(env.port, () => {
    logger.info(`Backend service running on port ${env.port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    logger.error("Failed to start backend service", error);
    process.exit(1);
  });
}

module.exports = app;
