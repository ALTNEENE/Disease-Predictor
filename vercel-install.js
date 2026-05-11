const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function runInstall(target) {
  const result = spawnSync(npmCommand, ["install"], {
    cwd: target,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

runInstall(path.join(rootDir, "frontend"));

if (fs.existsSync(path.join(rootDir, "backend", "package.json"))) {
  runInstall(path.join(rootDir, "backend"));
}
