import app from "../../backend/src/app.js";
import connectDB from "../../backend/src/config/db.js";

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

export default async function handler(req, res) {
  if (!req.url.startsWith("/api/health")) {
    await ensureDatabase();
  }

  return app(req, res);
}
