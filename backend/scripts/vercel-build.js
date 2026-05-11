const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const nodeCommand = process.execPath;

for (const file of ["src/server.js", "api/[...path].js"]) {
  const result = spawnSync(nodeCommand, ["--check", file], {
    cwd: rootDir,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(
  path.join(publicDir, "index.html"),
  "<!doctype html><title>Disease Prediction API</title><h1>Disease Prediction API</h1><p>Use /api/health to verify the backend.</p>\n"
);

console.log("Backend API build ready for Vercel.");
