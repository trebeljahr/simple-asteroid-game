
const SPEED = 8;
const BULLET_SPEED = 10;
let WHITE;
let ship;
let game;
let width;
let height;
let enemies = [];
let bullets = [];
let xEdge; 

let rocket, asteroid1, asteroid2, asteroid3, asteroids, space;

function preload() {
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
  for (i=0;i<30;i++){ 
    enemies.push(createNewEnemy(i));
  }
  ship = new Player(0, 0)
}

function draw() {
  background(space);
  ship.run();
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
    enemy.draw()
  });

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
        console.log('S')
        game && game.start();
        break;
      }
}
