import React from "react";
import p5, { Image } from "p5";
import { restart } from "../utils/menu";
import { width, height } from "../utils";
import { draw } from "../utils/draw";
import P5Wrapper from "react-p5-wrapper";

interface Assets {
  asteroids: [Image, Image, Image];
  heart: Image;
  space: Image;
  rocket: Image;
  ammoAsset: Image;
}
export let assets = {} as Assets;

const sketch = (p: p5) => {
  p.preload = async () => {
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
    p.createCanvas(width, height);
    restart(p);
  };
  p.draw = () => {
    draw(p);
  };
};

export const P5Component = () => {
  return <P5Wrapper sketch={sketch} />;
};
