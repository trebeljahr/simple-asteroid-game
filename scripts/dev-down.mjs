#!/usr/bin/env node
// Stop the local dev dependencies (postgres + redis) started by
// `pnpm dev`. Containers and their volumes are left on disk so
// data persists across restarts — add `--volumes` to wipe them.
//
// Usage:
//   node scripts/dev-down.mjs             Stop containers, keep data
//   node scripts/dev-down.mjs --volumes   Stop containers, drop data volumes
//   pnpm dev:down
//   pnpm dev:down -- --volumes

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";

const dropVolumes = process.argv.includes("--volumes");

const probe = spawnSync("docker", ["info"], { stdio: "ignore" });
if (probe.status !== 0) {
  console.error("Docker is not available. Nothing to stop — exiting successfully.");
  process.exit(0);
}

// Pick whichever flavour of docker-compose is installed: the modern
// plugin (`docker compose ...`) or the legacy standalone binary
// (`docker-compose ...`). Matches scripts/dev.mjs.
function resolveComposeCommand() {
  const plugin = spawnSync("docker", ["compose", "version"], {
    stdio: "ignore",
  });
  if (plugin.status === 0) {
    return { command: "docker", prefix: ["compose"] };
  }
  const legacy = spawnSync("docker-compose", ["version"], {
    stdio: "ignore",
  });
  if (legacy.status === 0) {
    return { command: "docker-compose", prefix: [] };
  }
  return null;
}

const compose = resolveComposeCommand();
if (compose === null) {
  console.error("docker compose not found — install Docker Desktop or the compose plugin.");
  process.exit(0);
}

function getComposeProjectName() {
  if (process.env.COMPOSE_PROJECT_NAME) {
    return process.env.COMPOSE_PROJECT_NAME;
  }

  const baseName =
    path
      .basename(process.cwd())
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^[^a-z0-9]+/, "")
      .replace(/[^a-z0-9]+$/, "") || "asteroid-game";
  const worktreeHash = createHash("sha1").update(process.cwd()).digest("hex").slice(0, 8);
  return `${baseName}-${worktreeHash}`;
}

function buildComposeArgs(args) {
  return [...compose.prefix, "-p", composeProjectName, "-f", "docker-compose.yaml", ...args];
}

const composeProjectName = getComposeProjectName();

// Only bring down postgres/redis so we don't accidentally tear down
// other services if the user has extended the compose file. Use stop
// + rm rather than a blanket `down` for targeted removal.
const stop = spawnSync(compose.command, buildComposeArgs(["stop", "postgres", "redis"]), {
  stdio: "inherit",
  env: { ...process.env, COMPOSE_PROJECT_NAME: composeProjectName },
});
if (stop.status !== 0) {
  process.exit(stop.status ?? 1);
}
const rm = spawnSync(
  compose.command,
  buildComposeArgs(["rm", "-f", ...(dropVolumes ? ["-v"] : []), "postgres", "redis"]),
  { stdio: "inherit", env: { ...process.env, COMPOSE_PROJECT_NAME: composeProjectName } },
);
if (rm.status !== 0) {
  process.exit(rm.status ?? 1);
}

if (dropVolumes) {
  // rm -v only removes anonymous volumes attached to the containers.
  // Our named volume `postgres-data` must be dropped explicitly.
  spawnSync("docker", ["volume", "rm", `${composeProjectName}_postgres-data`], {
    stdio: "inherit",
  });
}

console.log("Dev dependencies stopped.");
