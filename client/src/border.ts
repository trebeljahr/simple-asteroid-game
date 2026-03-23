import p5 from "p5";
import { boardSizeX, boardSizeY } from "./utils";

export let border = {} as Border;

export const resetBorder = (p: p5) => {
  border = new Border(p);
};
class Border {
  p: p5;
  constructor(p: p5) {
    this.p = p;
  }

  show() {
    this.p.noFill();
    this.p.stroke(255);
    this.p.rect(-boardSizeX, -boardSizeY, boardSizeX * 2, boardSizeY * 2);
  }
}
