const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "frontend");
const frontendDist = path.join(frontendDir, "dist");
const rootDist = path.join(rootDir, "dist");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const result = spawnSync(npmCommand, ["run", "build"], {
  cwd: frontendDir,
  stdio: "inherit"
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

fs.rmSync(rootDist, { recursive: true, force: true });
fs.cpSync(frontendDist, rootDist, { recursive: true });
console.log("Copied frontend/dist to root dist for Vercel output.");
