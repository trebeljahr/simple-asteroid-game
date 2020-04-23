import p5 from "p5";
import { boardSizeX, boardSizeY } from "./utils";

export const borderSystem = (p: p5) => {
  let instance: Border;

  const createInstance = () => {
    return new Border(p);
  };

  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
    reset: () => {
      instance = createInstance();
      return instance;
    },
  };
};

class Border {
  p: p5;
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
  constructor(p: p5) {
    this.p = p;
    this.x = -boardSizeX;
    this.y = -boardSizeY;
    this.sizeX = 2 * boardSizeX;
    this.sizeY = 2 * boardSizeY;
  }

  show() {
    this.p.fill("rgba(0,0,0,0)");
    this.p.stroke(255);
    this.p.rect(this.x, this.y, this.sizeX, this.sizeY);
  }
}
