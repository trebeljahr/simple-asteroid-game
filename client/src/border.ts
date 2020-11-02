import p5 from "p5";
import { boardSizeX, boardSizeY } from "./utils";

export let border = {} as Border;

export const resetBorder = (p: p5) => {
  border = new Border(p);
};
class Border {
  p: p5;
  x: number;
  y: number;
  w: number;
  h: number;
  bW: number;
  constructor(p: p5) {
    this.p = p;
    this.x = -boardSizeX;
    this.y = -boardSizeY;
    this.w = boardSizeX;
    this.h = boardSizeY;
    this.bW = 200;
  }

  show() {
    this.p.noFill();
    this.p.stroke(255);
    this.p.rect(this.x, this.y, this.w * 2, this.h * 2);
  }
}
