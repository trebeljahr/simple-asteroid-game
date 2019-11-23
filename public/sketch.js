const BULLET_SPEED = 10;
let player, game, width, height, xEdge, rocket, asteroid1, asteroid2, asteroid3, asteroids, space, board;
let enemies = [];
let bullets = [];
let menuIsOpen, button, div, gameOver = false;
let boardSizeX;
let boardSizeY;

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
  width = windowWidth
  height = windowHeight
  boardSizeX = width*3;
  boardSizeY = height*3;
  xEdge = width / 3
  createCanvas(width, height);
  restart()
}

function toggleDeathScreen() {
  toggleMenu('Game Over', 'Press T to Start Again')
  gameOver = true
}

function pauseGame() {
  toggleMenu('Pause', 'Press T to Continue');
}

function toggleMenu(buttonText, divText) {
  if (gameOver) return
  menuIsOpen = !menuIsOpen
  if (button) {
    button.remove();
    button = false;
    div.remove();
    div = false;
    return
  }
  button = createButton(buttonText);
  button.class("resumeButton")
  button.parent("menu")
  button.mouseClicked(pauseGame);

  div = createDiv(divText)
  div.parent('menu')
}

class Board {
  constructor() {
    this.x = -boardSizeX;
    this.y = -boardSizeY;
    this.sizeX = 2*boardSizeX;
    this.sizeY = 2*boardSizeY;
  }

  show() {
    fill('rgba(0,0,0,0)');
    stroke(255);
    rect(this.x, this.y, this.sizeX, this.sizeY);
  }
}

function draw() {


  if (menuIsOpen) {
    background('rgba(0,0,0,0.1)')
    return
  }
  background(space);
  push()
  translate(-player.pos.x, -player.pos.y);
  translate(width/2, height/2);

  board.show();
  noStroke()
  player.run();
  thruster.updatePos(p5.Vector.add(player.pos, p5.Vector.fromAngle(player.rotation-PI, player.size)), player.rotation-PI)
  if (keyIsDown(UP_ARROW)) {
    thruster.spawnNewParticles(10)
  }
  thruster.run()
 
  for(let i=enemies.length-1;i>=0;i--){
      enemy=enemies[i]
      enemy.update();
      enemy.draw();

      for (let j=bullets.length-1; j>0;j--) {
        bullet = bullets[j]
        bullet.update()
        bullet.draw()
        if (!bullet.inScreen()) {
          bullets.splice(j, 1)
        } 
        let distance = distSquare(enemy.pos.x, enemy.pos.y, bullet.pos.x, bullet.pos.y)
        let radiusSum = enemy.size/2 + bullet.size/2
        if (distance <= radiusSum*radiusSum) {
            enemy.hit()
            if (enemy.hitPoints <= 0) {
              enemies.splice(i, 1)
            }
            bullets.splice(j, 1)
        }
      }

      if (playerHitsEnemy(enemy, player)) {
        player.damage()
        enemies.splice(i, 1)
      } 

      if (frameCount % 30 === 0 && enemies.length-1 === i) {
        enemies.push(createNewEnemy(i+1));
      }
    } 
    pop()

    player.showHealth()
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
const T_KEYCODE = 84;

function restart() {
  board = new Board()
  thruster = new ThrusterExhaustSystem(createVector(width/2,height), 0)
  player = new Player(100, height/2)
  enemies = []
  for(let i = 0; i<500;i++){
    enemies.push(createNewEnemy());
  }
  bullets = []
  if (gameOver) {
    gameOver = false
    toggleMenu()
  }
}

function keyPressed() {
    switch(keyCode) {
        case T_KEYCODE:
          if (gameOver) {
              restart()
              return
          }
          pauseGame();
          break;
      }
}
