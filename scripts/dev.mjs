#!/usr/bin/env node
// Starts client and server for development.
//
// Usage:
//   node scripts/dev.mjs                Random ports (client 3100-3999, server 9100-9999)
//   node scripts/dev.mjs --fixed        Fixed ports (client 5173, server 9777)
//   node scripts/dev.mjs --fixed --lan  Fixed ports, accessible from LAN (for mobile testing)
//   node scripts/dev.mjs --no-deps      Skip docker postgres/redis (use env vars you set yourself)
//   npm run dev                         Random ports
//   npm run dev:fixed                   Fixed ports
//   npm run dev:lan                     Fixed ports, accessible from LAN
//   npm run dev:down                    Stop the docker dev dependencies
//
// The script auto-starts postgres and redis via docker compose so a
// fresh checkout + `npm run dev` is all you need. Containers are left
// running between sessions for fast reboots; use `npm run dev:down` to
// stop them. If docker isn't available or the user sets DATABASE_URL
// themselves, dep bootstrapping is skipped — the server degrades
// gracefully when persistence is missing.

import { createServer } from "net";
import { execSync, spawnSync } from "child_process";

const fixedMode = process.argv.includes("--fixed");
const lanMode = process.argv.includes("--lan");
const skipDeps = process.argv.includes("--no-deps");

const DEFAULT_POSTGRES_USER = "asteroids";
const DEFAULT_POSTGRES_PASSWORD = "asteroids_dev_password";
const DEFAULT_POSTGRES_DB = "asteroids";
const DEFAULT_POSTGRES_PORT = "5432";
const DEFAULT_REDIS_PORT = "6379";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

/**
 * Checks whether *any* process is already listening on the port,
 * including processes bound to 0.0.0.0 or other interfaces. Docker
 * maps container ports to 0.0.0.0 by default, so we need the stricter
 * check for dep-bootstrap decisions even though a 127.0.0.1 bind
 * would succeed alongside a 0.0.0.0 listener on macOS.
 */
function isPortBindableForDocker(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findRandomFreePort(min, max, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = randomInt(min, max);
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(
    `Could not find a free port in range ${min}-${max} after ${maxAttempts} attempts`
  );
}

function hasDocker() {
  const probe = spawnSync("docker", ["info"], {
    stdio: "ignore",
  });
  return probe.status === 0;
}

/**
 * Returns the command + fixed prefix args for invoking docker compose,
 * picking whichever flavour is installed: the modern plugin
 * (`docker compose ...`) or the legacy standalone binary
 * (`docker-compose ...`). Returns null if neither is available.
 */
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

/**
 * Start the minimal dependency stack (postgres + redis) via docker
 * compose. Non-fatal: any failure is logged and dev continues without
 * persistence so you can still work on client-only changes.
 *
 * Returns an env snapshot to forward to the server process, or null
 * if the deps couldn't be started.
 */
async function startDependencies() {
  if (skipDeps) {
    console.log("  Deps:   skipped (--no-deps)");
    return null;
  }

  // If the user explicitly wired their own postgres, respect that and
  // don't touch docker at all.
  if (process.env.DATABASE_URL) {
    console.log(
      `  Deps:   using DATABASE_URL from env (${redact(process.env.DATABASE_URL)})`
    );
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL ?? "",
    };
  }

  if (!hasDocker()) {
    console.log(
      "  Deps:   docker not available — running without postgres/redis.\n" +
        "          Achievements & accounts will be disabled. Install Docker\n" +
        "          Desktop or set DATABASE_URL to enable them."
    );
    return null;
  }

  const compose = resolveComposeCommand();
  if (compose === null) {
    console.log(
      "  Deps:   docker compose not found (neither the plugin nor the\n" +
        "          legacy docker-compose binary). Skipping dep bootstrap."
    );
    return null;
  }

  const user = process.env.POSTGRES_USER ?? DEFAULT_POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD ?? DEFAULT_POSTGRES_PASSWORD;
  const db = process.env.POSTGRES_DB ?? DEFAULT_POSTGRES_DB;
  const postgresPort = process.env.POSTGRES_PORT ?? DEFAULT_POSTGRES_PORT;
  const redisPort = process.env.REDIS_PORT ?? DEFAULT_REDIS_PORT;

  // Detect existing services on the default ports (common: brew-installed
  // redis / a user's own postgres). If the port is busy we assume the
  // service on it is compatible enough and reuse it; the server degrades
  // gracefully if it isn't.
  const postgresPortFree = await isPortBindableForDocker(
    parseInt(postgresPort, 10)
  );
  const redisPortFree = await isPortBindableForDocker(
    parseInt(redisPort, 10)
  );

  const servicesToStart = [];
  if (postgresPortFree) {
    servicesToStart.push("postgres");
  } else {
    console.log(
      `  Deps:   port ${postgresPort} already in use — reusing existing postgres.\n` +
        "          If migrations fail, stop the other instance or set\n" +
        "          POSTGRES_PORT to a free port before `npm run dev`."
    );
  }
  if (redisPortFree) {
    servicesToStart.push("redis");
  } else {
    console.log(
      `  Deps:   port ${redisPort} already in use — reusing existing redis.`
    );
  }

  if (servicesToStart.length > 0) {
    console.log(
      `  Deps:   starting ${servicesToStart.join(" + ")} via docker compose...`
    );
    const started = spawnSync(
      compose.command,
      [
        ...compose.prefix,
        "-f",
        "docker-compose.yaml",
        "up",
        "-d",
        "--wait",
        ...servicesToStart,
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          POSTGRES_USER: user,
          POSTGRES_PASSWORD: password,
          POSTGRES_DB: db,
          POSTGRES_PORT: postgresPort,
          REDIS_PORT: redisPort,
        },
      }
    );

    if (started.status !== 0) {
      console.log(
        "  Deps:   failed to start docker deps — continuing without them.\n" +
          "          Check `docker compose ps` or run `npm run dev:down` and retry."
      );
      return null;
    }
  }

  const databaseUrl = `postgres://${user}:${password}@127.0.0.1:${postgresPort}/${db}`;
  const redisUrl = `redis://127.0.0.1:${redisPort}`;
  console.log(`  Deps:   postgres on :${postgresPort}, redis on :${redisPort}`);
  return { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl };
}

function redact(connectionString) {
  return connectionString.replace(/:\/\/[^@]+@/, "://***:***@");
}

let clientPort;
let serverPort;

if (process.env.CLIENT_PORT) {
  clientPort = parseInt(process.env.CLIENT_PORT, 10);
} else if (fixedMode) {
  clientPort = 5173;
} else {
  clientPort = await findRandomFreePort(3100, 3999);
}

if (process.env.SERVER_PORT) {
  serverPort = parseInt(process.env.SERVER_PORT, 10);
} else if (fixedMode) {
  serverPort = 9777;
} else {
  serverPort = await findRandomFreePort(9100, 9999);
}

const host = lanMode ? "0.0.0.0" : "127.0.0.1";

console.log(
  `\n  Mode:   ${fixedMode ? "fixed" : "random"}${lanMode ? " (LAN)" : ""}`
);
console.log(`  Client: http://localhost:${clientPort}`);
console.log(`  Server: http://localhost:${serverPort}`);

const depsEnv = await startDependencies();

if (lanMode) {
  try {
    const lanIp = execSync("ipconfig getifaddr en0", {
      encoding: "utf8",
    }).trim();
    console.log(`  LAN:    http://${lanIp}:${clientPort}`);
  } catch {
    console.log(
      `  LAN:    (could not detect LAN IP — check ipconfig getifaddr en0)`
    );
  }
}
console.log();

const viteHostFlag = lanMode ? `--host ${host}` : "";

// Build the server command with the dep env vars prefixed so the
// server process sees DATABASE_URL / REDIS_URL at startup. Using env
// prefixes keeps us consistent with the existing PORT= pattern and
// avoids needing a cross-platform env loader.
const serverEnvPrefix = [
  `PORT=${serverPort}`,
  depsEnv?.DATABASE_URL ? `DATABASE_URL=${depsEnv.DATABASE_URL}` : null,
  depsEnv?.REDIS_URL ? `REDIS_URL=${depsEnv.REDIS_URL}` : null,
]
  .filter(Boolean)
  .join(" ");

const processes = [
  `"API_PORT=${serverPort} npx --workspace @simple-asteroid-game/client vite --port ${clientPort} ${viteHostFlag}"`,
  `"${serverEnvPrefix} npm run dev --workspace @simple-asteroid-game/server"`,
];

try {
  execSync(
    `npx concurrently -k -n client,server -c cyan,green ${processes.join(" ")}`,
    { stdio: "inherit" }
  );
} catch {
  process.exit(1);
}
