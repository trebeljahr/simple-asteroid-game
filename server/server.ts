import express from "express";
import httpPack from "http";
import socketOver from "socket.io";

const app = express();
const http = httpPack.createServer(app);
app.use(express.static("public"));
const io = socketOver(http);

io.on("connection", function (socket) {
  console.log("New user with id: " + socket.id);

  socket.on("newPlayer", (data) => {
    socket.broadcast.emit("generateNewPlayer", { ...data, id: socket.id });
  });

  socket.on("playerUpdate", (data) => {
    socket.broadcast.emit("otherPlayerMoved", { ...data, id: socket.id });
  });

  socket.on("disconnect", () => {
    console.log("Player with id: " + socket.id + " disconnected");
    socket.broadcast.emit("playerLeft", { id: socket.id });
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
