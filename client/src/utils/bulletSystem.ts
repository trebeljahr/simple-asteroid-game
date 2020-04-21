import p5, { Vector } from "p5";
import { Mover } from "./mover";

export const bulletSystem = (p: p5) => {
  let instance: BulletSystem;

  const createInstance = () => {
    return new BulletSystem(p);
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

class BulletSystem {
  p: p5;
  bullets: Bullet[];
  constructor(p: p5) {
    this.p = p;
    this.bullets = [];
  }
  update() {
    for (let j = this.bullets.length - 1; j > 0; j--) {
      const bullet = this.bullets[j];
      this.p.fill(255);
      this.p.stroke(255, 0, 0);
      bullet.run();
      if (!bullet.inScreen()) {
        this.bullets.splice(j, 1);
      }
    }
  }
  addBullet(pos: Vector, rotation: number) {
    this.bullets.push(
      new Bullet(
        this.p,
        pos,
        p5.Vector.fromAngle(
          rotation + this.p.random(-this.p.PI / 20, this.p.PI / 20),
          20
        ),
        10
      )
    );
  }
}

export class Bullet extends Mover {
  run() {
    this.draw();
    this.update();
  }
}
