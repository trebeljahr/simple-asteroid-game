
const SPEED = 8;

let WHITE;
let ship;
let game;
let width;
let height;
let enemies = [];
let bullets = [];
let xEdge; 

function setup() {
  game = new Game();
  width = windowWidth
  height = windowHeight
  xEdge = width / 3
  WHITE = color(255, 255, 255);
  createCanvas(width, height);
  enemies = [];
  for (i=0;i<100;i++){
    let x = random(xEdge, width) 
    let y = random(height)
    enemies.push(new Mover(x, y, 80, 0, 0));
  }
  ship = new Player(0, 0)
}

function draw() {
  background(155);
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

function keyPressed() {
    switch(keyCode) {
        case S_KEYCODE:
        console.log('S')
        game && game.start();
        break;
      }
}
