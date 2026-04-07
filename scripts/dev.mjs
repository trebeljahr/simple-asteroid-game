#!/usr/bin/env node
// Starts client and server for development.
//
// Usage:
//   node scripts/dev.mjs                Random ports (client 3100-3999, server 9100-9999)
//   node scripts/dev.mjs --fixed        Fixed ports (client 5173, server 9777)
//   node scripts/dev.mjs --fixed --lan  Fixed ports, accessible from LAN (for mobile testing)
//   npm run dev                         Random ports
//   npm run dev:fixed                   Fixed ports
//   npm run dev:lan                     Fixed ports, accessible from LAN

import { createServer } from "net";
import { execSync } from "child_process";

const fixedMode = process.argv.includes("--fixed");
const lanMode = process.argv.includes("--lan");

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

if (lanMode) {
  try {
    const lanIp = execSync("ipconfig getifaddr en0", {
      encoding: "utf8",
    }).trim();
    console.log(`\n  LAN:    http://${lanIp}:${clientPort}`);
  } catch {
    console.log(
      `\n  LAN:    (could not detect LAN IP — check ipconfig getifaddr en0)`
    );
  }
}
console.log();

const viteHostFlag = lanMode ? `--host ${host}` : "";

const processes = [
  `"API_PORT=${serverPort} npx vite --port ${clientPort} ${viteHostFlag} --workspace @simple-asteroid-game/client"`,
  `"PORT=${serverPort} npm run dev --workspace @simple-asteroid-game/server"`,
];

try {
  execSync(
    `npx concurrently -k -n client,server -c cyan,green ${processes.join(" ")}`,
    { stdio: "inherit" }
  );
} catch {
  process.exit(1);
}
