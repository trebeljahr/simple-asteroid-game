const BULLET_SPEED = 10;
let player,
  game,
  width,
  height,
  xEdge,
  rocket,
  asteroid1,
  asteroid2,
  asteroid3,
  asteroidAssets,
  space,
  border;
let ammunition, ammoAsset, explosionSystem;
let socket;
let enemyPlayers = {};

function preload() {
  heart = loadImage("assets/heart.svg");
  space = loadImage("assets/background.jpg");
  rocket = loadImage("assets/rocket.svg");

  ammoAsset = loadImage("assets/bullets.svg");
}

function restart() {
  socket = io.connect();
  border = new Border();
  let newPos = randomPosition();
  console.log(newPos);
  player = new Player(newPos.x, newPos.y);
  socket.emit("newPlayer", {
    name: "SomeUsername",
    pos: { x: player.pos.x, y: player.pos.y },
  });
  ammunition = new AmmunitionPackages();
  hearts = new Hearts();
  explosionSystem = new ExplosionSystem();
  asteroids = [];
  for (let i = 0; i < 500; i++) {
    asteroids.push(createInitAsteroid());
  }
  bullets = [];
  if (gameOver) {
    gameOver = false;
    toggleMenu();
  }

  socket.on("generateNewPlayer", generateNewPlayer);

  socket.on("playerLeft", deletePlayer);

  socket.on("otherPlayerMoved", (data) => {
    if (!enemyPlayers[data.id]) {
      generateNewPlayer(data);
      return;
    }
    let enemy = enemyPlayers[data.id];
    enemy.pos.x = data.pos.x;
    enemy.pos.y = data.pos.y;
    enemy.rotation = data.rotation;
    enemy.thrusterON = data.thrusterON;
    enemy.vel.x = data.vel.x;
    enemy.vel.y = data.vel.y;
  });
}

function deleteFromObject(keyPart, obj) {
  for (var k in obj) {
    if (~k.indexOf(keyPart)) {
      delete obj[k];
    }
  }
}

function deletePlayer(data) {
  console.log(data);
  deleteFromObject(data.id, enemyPlayers);
}

function generateNewPlayer(data) {
  let enemyPos = createVector(data.pos.x, data.pos.y);
  enemyPlayers[data.id] = new Enemy(enemyPos);
}

function setup() {
  width = windowWidth;
  height = windowHeight;
  boardSizeX = 300; // width*3;
  boardSizeY = 300; // height*3;
  xEdge = width / 3;
  createCanvas(width, height);
  restart();
}

function playerHitsAsteroid(asteroid, player) {
  return playerHitsCircularTarget(asteroid, player);
}

function playerHitsCollectible(ammo, player) {
  return playerHitsCircularTarget(ammo, player);
}

const SPACE_KEYCODE = 32;
const S_KEYCODE = 83;
const W_KEYCODE = 87;
const A_KEYCODE = 65;
const D_KEYCODE = 68;
const P_KEYCODE = 80;
const T_KEYCODE = 84;
