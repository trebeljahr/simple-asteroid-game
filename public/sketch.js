
const SPEED = 8;
const BULLET_SPEED = 10;
let WHITE;
let player;
let game;
let width;
let height;
let enemies = [];
let bullets = [];
let xEdge; 

let rocket, asteroid1, asteroid2, asteroid3, asteroids, space;

function preload() {
  heart = loadImage('assets/heart.svg')
  space = loadImage('assets/background.jpg');
  rocket = loadImage('assets/rocket.svg');
  asteroid1 = loadImage('assets/asteroid1.svg');
  asteroid2 = loadImage('assets/asteroid2.svg');
  asteroid3 = loadImage('assets/asteroid3.svg');
  asteroids = [asteroid1, asteroid2, asteroid3]
}

function setup() {
  game = new Game();
  width = windowWidth
  height = windowHeight
  xEdge = width / 3
  WHITE = color(255, 255, 255);
  createCanvas(width, height);
  enemies = [];
  for (i=0;i<20;i++){ 
    enemies.push(createNewEnemy(i));
 }
  player = new Player(0, 0)
}

function draw() {
  background(space);
  player.run();
  for (i=bullets.length-1; i>0;i--) {
    bullet = bullets[i]
    bullet.draw()
    bullet.hitsEnemy(i)
    bullet.update()
    if (!bullet.inScreen()) {
      bullets.splice(i, 1)
    }
  }
  enemies.forEach(enemy => {
    enemy.update();
    if (!enemy.inScreen()){
      spawnNewEnemy(enemy.i)
    }
    if (playerHitsEnemy(enemy, player)) {
      player.damage()
      spawnNewEnemy(enemy.i)
    }
    enemy.draw()
  });
}

function distSquare(x1,y1,x2,y2) {
  return (x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)
}

function playerHitsEnemy(enemy, player) {
  let distance = distSquare(enemy.pos.x, enemy.pos.y, player.pos.x, player.pos.y)
  let radiusSum = enemy.size/2 + player.size/2
  if (player.life <= 0) {
    return false
  }
  return distance <= radiusSum*radiusSum 
}

const SPACE_KEYCODE = 32
const S_KEYCODE = 83;
const W_KEYCODE = 87;
const A_KEYCODE = 65;
const D_KEYCODE = 68;
const P_KEYCODE = 80;

function keyPressed() {
    switch(keyCode) {
        case P_KEYCODE:
        game && game.start();
        break;
      }
}
