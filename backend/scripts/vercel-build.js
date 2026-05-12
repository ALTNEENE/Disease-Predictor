const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const nodeCommand = process.execPath;

for (const file of ["server.js", "src/server.js", "api/[...path].js"]) {
  const result = spawnSync(nodeCommand, ["--check", file], {
    cwd: rootDir,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.cpSync(path.join(rootDir, "src"), path.join(distDir, "src"), { recursive: true });
fs.writeFileSync(
  path.join(distDir, "index.js"),
  `const app = require("./src/app");
const connectDB = require("./src/config/db");

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

module.exports = async function handler(req, res) {
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
};
`
);

console.log("Backend API build ready for Vercel.");
