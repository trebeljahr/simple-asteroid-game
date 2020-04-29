import { restart, gameOver, pauseGame } from "./menu";
import { draw } from "./draw";
import { width, height, T_KEYCODE, boardSizeX, boardSizeY } from "./utils";
import p5, { Image } from "p5";
import {
  Engine,
  Render,
  World,
  Bodies,
  Composite,
  Body,
  Vector,
} from "matter-js";
import { player } from "./player";
import { engine } from "./engine";

const sketch = (p: p5) => {
  p.keyPressed = () => {
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

  p.preload = () => {
    const asteroid1 = p.loadImage("assets/asteroid1.svg");
    const asteroid2 = p.loadImage("assets/asteroid2.svg");
    const asteroid3 = p.loadImage("assets/asteroid3.svg");
    const heart = p.loadImage("assets/heart.svg");
    const space = p.loadImage("assets/background.jpg");
    const rocket = p.loadImage("assets/rocket.svg");
    const ammoAsset = p.loadImage("assets/bullets.svg");
    assets = {
      asteroids: [asteroid1, asteroid2, asteroid3],
      heart,
      space,
      rocket,
      ammoAsset,
    };
  };
  p.setup = () => {
    p.noCanvas();
    p.createCanvas(width, height);
    restart(p);
    engine.world.gravity.y = 0;
    engine.world.bounds.min.x = -boardSizeX;
    engine.world.bounds.min.x = -boardSizeY;
    engine.world.bounds.max.x = boardSizeX;
    engine.world.bounds.max.x = boardSizeY;
  };
  p.draw = () => {
    draw(p);
    Engine.update(engine, 1000 / 60);
    // console.log(enginePlayer.position);
  };
};

export const p = new p5(sketch);

export interface Assets {
  asteroids: [Image, Image, Image];
  heart: Image;
  space: Image;
  rocket: Image;
  ammoAsset: Image;
}
export let assets = {} as Assets;
