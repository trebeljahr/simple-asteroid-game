import p5 from "p5";
import { boardSizeX, boardSizeY } from "./utils";
import { Bodies, Body, World } from "matter-js";
import { engine } from "./engine";

export let border = {} as Border;

export const resetBorder = (p: p5) => {
  border = new Border(p);
};
class Border {
  p: p5;
  x: number;
  y: number;
  x2: number;
  y2: number;
  sizeX: number;
  sizeY: number;
  borderWidth: number;
  engineBorder: [Body, Body, Body, Body];
  constructor(p: p5) {
    this.p = p;
    this.x = -boardSizeX;
    this.y = -boardSizeY;
    this.sizeX = 2 * boardSizeX;
    this.sizeY = 2 * boardSizeY;
    this.x2 = boardSizeX;
    this.y2 = boardSizeY;
    this.borderWidth = 200;
    this.engineBorder = [
      Bodies.rectangle(this.x, this.y, this.sizeX, this.borderWidth, {
        isStatic: true,
      }),
      Bodies.rectangle(this.x, this.y, this.borderWidth, this.sizeY, {
        isStatic: true,
      }),
      Bodies.rectangle(this.x2, this.y2, -this.sizeX, this.borderWidth, {
        isStatic: true,
      }),
      Bodies.rectangle(this.x2, this.y2, this.borderWidth, -this.sizeY, {
        isStatic: true,
      }),
    ];
    World.add(engine.world, this.engineBorder);
  }

  show() {
    this.p.fill(255);
    this.p.stroke(255);
    // this.p.rect(this.x, this.y, this.sizeX, this.sizeY);
    this.p.rect(this.x, this.y, this.sizeX, this.borderWidth);
    this.p.rect(this.x, this.y, this.borderWidth, this.sizeY);
    this.p.rect(this.x2, this.y2, -this.sizeX, this.borderWidth);
    this.p.rect(this.x2, this.y2, this.borderWidth, -this.sizeY);
  }
}
