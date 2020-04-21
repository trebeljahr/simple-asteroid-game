import p5, { Element } from "p5";
import { T_KEYCODE } from ".";
import { explosionSystem } from "./explosionSystem";
import { asteroidSystem } from "./asteroidSystem";

let menuIsOpen: boolean = false,
  button: null | Element = null,
  div: null | Element = null;

export let gameOver: boolean = false;

export function toggleDeathScreen(p: p5) {
  toggleMenu(p, "Game Over", "Press T to Start Again");
  gameOver = true;
}

export function pauseGame(p: p5) {
  toggleMenu(p, "Pause", "Press T to Continue");
}

export function toggleMenu(p: p5, buttonText: string, divText: string) {
  if (gameOver) return;
  menuIsOpen = !menuIsOpen;
  if (button && div) {
    button.remove();
    button = null;
    div.remove();
    div = null;
    return;
  }
  button = p.createButton(buttonText);
  button.class("resumeButton");
  button.parent("menu");
  button.mouseClicked(pauseGame);

  div = p.createDiv(divText);
  div.parent("menu");
}

export function keyPressed(p: p5) {
  switch (p.keyCode) {
    case T_KEYCODE:
      if (gameOver) {
        restart();
        return;
      }
      pauseGame(p);
      break;
  }
}

function restart(p: p5) {
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
  heartsSystem(p).reset();
  explosionSystem(p).reset();
  asteroidSystem(p).reset();
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
