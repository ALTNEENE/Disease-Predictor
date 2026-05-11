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

function pathname(req) {
  return new URL(req.url || "/", "http://localhost").pathname;
}

function isHealthRequest(req) {
  const path = pathname(req);
  return path === "/" || path === "/api" || path === "/api/" || path === "/api/health";
}

export default async function handler(req, res) {
  if (!isHealthRequest(req)) {
    try {
      await ensureDatabase();
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Database connection failed. Check MONGODB_URI in Vercel environment variables.",
        detail: error.message
      });
    }
  }

  return app(req, res);
}
