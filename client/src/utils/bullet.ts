import { Mover } from "./mover";
import p5, { Vector } from "p5";

export class Bullet extends Mover {
  constructor(p: p5, pos: Vector, vel: Vector, r: number) {
    super(p, pos, vel, r);
  }

  run() {
    this.draw();
    this.update();
  }
}
