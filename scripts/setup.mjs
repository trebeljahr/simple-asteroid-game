import { spawnSync } from "node:child_process";

const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";

console.log("Installing root and workspace dependencies...");

const result = spawnSync(
  npmExecutable,
  ["install", "--workspaces", "--include-workspace-root"],
  {
    stdio: "inherit",
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("");
console.log("Setup complete.");
console.log("Run `npm run dev` to start the Vite client and the server together.");
