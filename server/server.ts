let express = require("express");
let app = require("express")();
let cors = require("cors");
let http = require("http").createServer(app);
let io = require("socket.io")(http);

app.use(cors());
app.use(express.static("public"));

let enemies = [];
let bullets = [];
let asteroids = [];

io.on("connection", function (socket: any) {
  console.log("New user with id: " + socket.id);

  socket.on("newPlayer", (data: any) => {
    socket.broadcast.emit("generateNewPlayer", { ...data, id: socket.id });
  });

  socket.on("playerUpdate", (data: any) => {
    socket.broadcast.emit("otherPlayerMoved", { ...data, id: socket.id });
  });

  socket.on("disconnect", () => {
    console.log("Player with id: " + socket.id + " disconnected");
    socket.broadcast.emit("playerLeft", { id: socket.id });
  });
});

http.listen(4000, function () {
  console.log("listening on http://localhost:4000");
});
