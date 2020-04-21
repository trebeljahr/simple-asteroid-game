import p5, { Element } from "p5";
import { T_KEYCODE } from ".";

let menuIsOpen: boolean = false,
  button: null | Element = null,
  div: null | Element = null,
  gameOver: boolean = false;

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
