import p5, { Vector } from "p5";
import { randomSpawnPoint } from ".";
import { assets } from "../components/P5Component";

export let ammunition = {} as AmmunitionPackages;
export const resetAmmunition = (p: p5) => {
  ammunition = new AmmunitionPackages(p);
};

class AmmunitionPackages {
  ammunitionPackages: Ammunition[];
  p: p5;
  constructor(p: p5) {
    this.p = p;
    this.ammunitionPackages = [];
    this.addAmmunitionPackages(50);
  }

  addAmmunitionPackages(amount: number) {
    for (let i = 0; i < amount; i++) {
      const possibleSizes = [100, 100, 100, 100, 100, 200, 200, 400];
      this.ammunitionPackages.push(
        new Ammunition(
          this.p,
          randomSpawnPoint(this.p),
          this.p.random(possibleSizes)
        )
      );
    }
  }

  run() {
    if (this.p.frameCount % 240 === 0) {
      this.addAmmunitionPackages(1);
    }
    for (let i = this.ammunitionPackages.length - 1; i > 0; i--) {
      const heart = this.ammunitionPackages[i];
      heart.draw();
    }
  }
}

export class Ammunition {
  p: p5;
  pos: Vector;
  size: number;
  amount: number;
  constructor(p: p5, pos: Vector, size: number) {
    this.pos = pos.copy();
    this.size = size;
    this.p = p;
    this.amount = this.p.map(size, 0, 60, 0, 100);
  }

  draw() {
    this.p.rectMode(this.p.CENTER);
    this.p.fill(255);
    this.p.imageMode(this.p.CENTER);
    this.p.ellipse(this.pos.x, this.pos.y, this.size, this.size);
    this.p.image(
      assets.ammoAsset,
      this.pos.x,
      this.pos.y,
      this.size / 1.5,
      this.size / 1.5
    );
    // text(this.amount, this.pos.x, this.pos.y)
  }
}
