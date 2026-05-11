const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
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

console.log("Backend API build ready for Vercel.");
