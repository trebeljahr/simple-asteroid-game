import { spawnSync } from "node:child_process";

const pnpmExecutable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

console.log("Installing root and workspace dependencies...");

const result = spawnSync(pnpmExecutable, ["install"], {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("");
console.log("Setup complete.");
console.log("Run `pnpm dev` to start the Vite client and the server together.");
