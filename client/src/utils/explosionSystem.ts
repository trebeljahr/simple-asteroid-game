import p5, { Vector } from "p5";
import { Mover } from "./mover";
import { rgba } from ".";

export const explosionSystem = (p: p5) => {
  let instance: ExplosionSystem;

  const createInstance = () => {
    return new ExplosionSystem(p);
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

class ExplosionSystem {
  particles: ExplosionParticle[];
  p: p5;
  constructor(p: p5) {
    this.p = p;
    this.particles = [];
  }

  createExplosion(pos: Vector) {
    for (let i = 0; i < 100; i++) {
      this.particles.push(
        new ExplosionParticle(
          this.p,
          pos,
          this.p.random(-2 * this.p.PI, 2 * this.p.PI),
          this.p.random(0, 10)
        )
      );
    }
  }

  run() {
    for (let i = this.particles.length - 1; i > 0; i--) {
      let particle = this.particles[i];
      particle.run();
      if (particle.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }
}

class ExplosionParticle extends Mover {
  p: p5;
  rotation: number;
  lifespan: number;
  redValue: number;
  greenValue: number;
  blueValue: number;
  greenCap: number;
  constructor(p: p5, pos: Vector, rotation: number, r: number) {
    super(p, pos, p5.Vector.fromAngle(rotation, p.random(1, 5)), r);
    this.p = p;
    this.rotation = rotation;
    this.lifespan = 255;
    this.redValue = 100;
    this.greenValue = 200;
    this.blueValue = 255;
    this.greenCap = this.p.random(100, 255);
  }

  show() {
    this.p.push();
    this.p.translate(this.pos.x, this.pos.y);
    this.p.rotate(this.rotation);
    this.p.rect(0, 0, this.size * 2, this.size / 2);
    this.p.pop();
  }

  run() {
    this.update();
    this.p.fill(
      rgba(this.redValue, this.greenValue, this.blueValue, this.lifespan)
    );
    this.show();
    this.decay();
  }

  decay() {
    if (this.lifespan > 0) {
      this.lifespan -= 15;
      if (this.blueValue > 60) {
        this.blueValue -= 5;
      }
      if (this.redValue < 255) {
        this.redValue += 20;
      }
      if (this.greenValue < this.greenCap) {
        this.greenValue += 10;
      }
    }
  }

  isDead() {
    return this.lifespan === 0;
  }
}
