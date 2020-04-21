import p5, { Element } from "p5";
import { T_KEYCODE, randomPosition } from ".";
import { explosionSystem } from "./explosionSystem";
import { asteroidSystem } from "./asteroidSystem";
import { borderSystem } from "./border";
import { playerSingleton } from "./player";
import { bulletSystem } from "./bulletSystem";

let menuIsOpen: boolean = false,
  button: null | Element = null,
  div: null | Element = null;

export let gameOver: boolean = false;

export const toggleDeathScreen = (p: p5) => {
  toggleMenu(p, "Game Over", "Press T to Start Again");
  gameOver = true;
};

export const pauseGame = (p: p5) => {
  toggleMenu(p, "Pause", "Press T to Continue");
};

export const toggleMenu = (p: p5, buttonText: string, divText: string) => {
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
};

export const keyPressed = (p: p5) => {
  switch (p.keyCode) {
    case T_KEYCODE:
      if (gameOver) {
        restart(p);
        return;
      }
      pauseGame(p);
      break;
  }
};

export const restart = (p: p5) => {
  // socket = io.connect();
  const border = borderSystem(p).reset();
  playerSingleton(p).reset();
  // socket.emit("newPlayer", {
  //   name: "SomeUsername",
  //   pos: { x: player.pos.x, y: player.pos.y },
  // });
  ammunition = new AmmunitionPackages();
  heartSystem(p).reset();
  explosionSystem(p).reset();
  asteroidSystem(p).reset();
  bulletSystem(p).reset();

  if (gameOver) {
    gameOver = false;
    toggleMenu(p, "", "");
  }

  // socket.on("generateNewPlayer", generateNewPlayer);

  // socket.on("playerLeft", deletePlayer);

  // socket.on("otherPlayerMoved", (data) => {
  //   if (!enemyPlayers[data.id]) {
  //     generateNewPlayer(data);
  //     return;
  //   }
  //   let enemy = enemyPlayers[data.id];
  //   enemy.pos.x = data.pos.x;
  //   enemy.pos.y = data.pos.y;
  //   enemy.rotation = data.rotation;
  //   enemy.thrusterON = data.thrusterON;
  //   enemy.vel.x = data.vel.x;
  //   enemy.vel.y = data.vel.y;
  // });
};
