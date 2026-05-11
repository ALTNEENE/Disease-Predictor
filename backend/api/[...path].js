const app = require("../src/app");
const connectDB = require("../src/config/db");

let connectionPromise;

function ensureDatabase() {
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  return connectionPromise;
}

module.exports = async function handler(req, res) {
  if (!req.url.startsWith("/api/health")) {
    await ensureDatabase();
  }

  return app(req, res);
};
