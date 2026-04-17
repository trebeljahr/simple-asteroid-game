import cors from "cors";
import express from "express";
import { existsSync } from "fs";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import * as trpcExpress from "@trpc/server/adapters/express";
import { MultiplayerService } from "./multiplayerService";
import { BattleRoyaleService } from "./battleRoyaleService";
import { ClientToServerEvents, ServerToClientEvents } from "../../shared/src";
import { createAppRouter, createTRPCContext } from "./trpc/router";
import { getRedisClient } from "./redis";
import { achievementService } from "./achievementService";
import { runMigrations } from "./db/runMigrations";

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const redisClient = getRedisClient();
if (redisClient) {
  const pubClient = redisClient;
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  console.log("[socket.io] Using Redis adapter for horizontal scaling");
}

const multiplayerService = new MultiplayerService(io);
const battleRoyaleService = new BattleRoyaleService(io);
const appRouter = createAppRouter(
  multiplayerService,
  battleRoyaleService,
  achievementService
);

const clientDistPath = path.resolve(__dirname, "../../client/dist");

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get("*", (_request, response) => {
    response.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  app.get("/", (_request, response) => {
    response
      .status(200)
      .send("Client build not found. Run `npm run dev` or `npm run build` from the repo root.");
  });
}

io.use(async (socket, next) => {
  const token = extractDeviceToken(socket.handshake.auth?.deviceToken);
  if (token === null) {
    // Allow anonymous connections — they simply won't earn achievements.
    next();
    return;
  }
  try {
    const { getOrCreateUserByDeviceToken } = await import("./userService");
    const context = await getOrCreateUserByDeviceToken(token);
    (socket.data as { userId?: string }).userId = context.user.id;
  } catch (error) {
    // Never block the handshake on DB errors — multiplayer must keep
    // working even if persistence is down. Just log and move on.
    console.warn("[socket.io] device-token resolution failed", error);
  }
  next();
});

const userRoomId = (userId: string) => `user:${userId}`;

io.on("connection", (socket) => {
  console.log(`New user with id: ${socket.id}`);
  const userId = (socket.data as { userId?: string }).userId;
  if (userId !== undefined) {
    // Join a personal room so the achievement service can push
    // unlocks to just this user, even across multiple tabs.
    socket.join(userRoomId(userId));
  }
  multiplayerService.registerSocket(socket);
  battleRoyaleService.registerSocketHandlers(socket);
});

// Fan out achievement unlocks to the owning user's room. Since the
// achievement service lives in-process, this handles pushes from any
// code that calls applyEvent — gameplay services, tRPC endpoints, etc.
achievementService.onUnlock((event) => {
  io.to(userRoomId(event.userId)).emit("achievement:unlocked", {
    achievementId: event.achievementId,
    unlockedAt: event.unlockedAt.toISOString(),
  });
});

function extractDeviceToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 128) return null;
  return trimmed;
}

const port = Number(process.env.PORT ?? 9777);

const start = async () => {
  if (process.env.DATABASE_URL) {
    try {
      await runMigrations();
    } catch (error) {
      console.error(
        "[db] Startup migration failed. Continuing without persistence:",
        error
      );
    }
  } else {
    console.warn(
      "[db] DATABASE_URL not set — user accounts and achievements disabled"
    );
  }

  httpServer.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
};

void start();
