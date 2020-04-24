import p5, { Vector } from "p5";
import { assets } from "./sketch";
import { randomSpawnPoint } from "./utils";

export let hearts = {} as Hearts;
export const resetHearts = (p: p5) => {
  hearts = new Hearts(p);
};

class Hearts {
  hearts: Heart[];
  p: p5;
  constructor(p: p5) {
    this.p = p;
    this.hearts = [];
    this.spawnHearts(50);
  }

  spawnHearts(amount: number) {
    for (let i = 0; i < amount; i++) {
      this.hearts.push(new Heart(this.p, randomSpawnPoint(this.p), 200));
    }
  }

  run() {
    if (this.p.frameCount % 240 === 0) {
      this.spawnHearts(1);
    }
    for (let i = this.hearts.length - 1; i > 0; i--) {
      let heart = this.hearts[i];
      heart.draw();
    }
  }
}

class Heart {
  p: p5;
  pos: Vector;
  size: number;
  constructor(p: p5, pos: Vector, size: number) {
    this.pos = pos.copy();
    this.size = size / 3;
    this.p = p;
  }

  draw() {
    this.p.rectMode(this.p.CENTER);
    this.p.fill(255);
    this.p.imageMode(this.p.CENTER);
    this.p.ellipse(this.pos.x, this.pos.y, this.size, this.size);
    this.p.image(
      assets.heart,
      this.pos.x,
      this.pos.y,
      this.size / 1.5,
      this.size / 1.5
    );
    // text(this.amount, this.pos.x, this.pos.y)
  }
}
