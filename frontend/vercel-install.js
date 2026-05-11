import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendDir, "..");
const backendDir = path.join(repoRoot, "backend");
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

runInstall(frontendDir);

if (fs.existsSync(path.join(backendDir, "package.json"))) {
  runInstall(backendDir);
}
