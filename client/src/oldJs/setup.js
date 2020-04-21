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
