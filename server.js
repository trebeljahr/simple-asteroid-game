let express = require("express");
let app = require("express")();
let http = require("http").createServer(app);
let io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", function(socket) {
  console.log("New user with id: " + socket.id);
  socket.on("setPlayerName", playerName => {
  });

  socket.on("updateState", data => {
  });

  socket.on("disconnect", function() {
  });
});

http.listen(3000, function() {
  console.log("listening on *:3000");
});

