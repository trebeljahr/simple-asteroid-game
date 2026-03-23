import cors from "cors";
import express from "express";
import { existsSync } from "fs";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const clientDistPath = path.resolve(__dirname, "../../client/dist");

app.use(
  cors({
    origin: true,
    credentials: true,
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

  socket.on("newPlayer", (data: unknown) => {
    socket.broadcast.emit("generateNewPlayer", {
      ...((data as Record<string, unknown>) || {}),
      id: socket.id,
    });
  });

  socket.on("playerUpdate", (data: unknown) => {
    socket.broadcast.emit("otherPlayerMoved", {
      ...((data as Record<string, unknown>) || {}),
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log(`Player with id: ${socket.id} disconnected`);
    socket.broadcast.emit("playerLeft", { id: socket.id });
  });
});

const port = Number(process.env.PORT ?? 9777);

httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
