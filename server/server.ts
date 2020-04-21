let express = require("express");
let app = require("express")();
let http = require("http").createServer(app);
let io = require("socket.io")(http);

app.use(express.static("public"));

let enemies = [];
let bullets = [];
let asteroids = [];

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
