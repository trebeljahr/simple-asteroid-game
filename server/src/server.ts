import cors from "cors";
import express from "express";
import { existsSync } from "fs";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import * as trpcExpress from "@trpc/server/adapters/express";
import { MultiplayerService } from "./multiplayerService";
import { ClientToServerEvents, ServerToClientEvents } from "../../shared/src";
import { createAppRouter } from "./trpc/router";
import { getRedisClient } from "./redis";

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
const appRouter = createAppRouter(multiplayerService);

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

io.on("connection", (socket) => {
  console.log(`New user with id: ${socket.id}`);
  multiplayerService.registerSocket(socket);
});

const port = Number(process.env.PORT ?? 9777);

httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
