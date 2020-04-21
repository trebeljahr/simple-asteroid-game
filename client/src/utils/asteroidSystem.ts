import p5, { Vector, Image } from "p5";
import { assets } from "./assets";
import { randomPositionNotHittingPlayer } from ".";
import { Mover } from "./mover";

export const asteroidSystem = (p: p5) => {
  let instance: Asteroids;

  const createInstance = () => {
    return new Asteroids(p);
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

class Asteroids {
  asteroids: Asteroid[];
  p: p5;
  constructor(p: p5) {
    this.p = p;
    this.asteroids = [];
    for (let i = 0; i < 500; i++) {
      this.addAsteroid();
    }
  }

  run = () => {
    this.asteroids.forEach((asteroid) => {
      asteroid.update();
      asteroid.draw();
    });
  };

  addAsteroid = () => {
    this.asteroids = [...this.asteroids, this.createNewAsteroid()];
  };

  spawnNewAsteroid(indexToChange: number) {
    if (this.asteroids.length < 0) {
      return;
    }
    const newAsteroid = this.createNewAsteroid();
    this.asteroids = this.asteroids.map((asteroid, i) => {
      return i === indexToChange ? asteroid : newAsteroid;
    });
  }

  createNewAsteroid() {
    let r = this.p.random(60, 200);
    let pos = randomPositionNotHittingPlayer(this.p, r);
    let vel = this.p.createVector(0, 0);
    let hitpoints = r * 10;
    return new Asteroid(this.p, pos, vel, r, hitpoints);
  }
}

export class Asteroid extends Mover {
  hitPoints: number;
  img: Image;
  rotation: number;
  angularVelocity: number;
  p: p5;
  constructor(p: p5, pos: Vector, vel: Vector, r: number, hitPoints: number) {
    super(p, pos, vel, r);
    this.p = p;
    this.hitPoints = hitPoints;
    this.img = p.random(assets(p).getInstance().asteroids);
    this.rotation = p.random(p.PI);
    this.angularVelocity = p.random(-0.005, 0.005);
  }

  draw() {
    this.p.push();
    this.p.imageMode(this.p.CENTER);
    this.p.translate(this.pos.x, this.pos.y);
    this.rotation = this.rotation + this.angularVelocity;
    this.p.rotate(this.rotation);
    this.p.image(this.img, 0, 0, this.size, this.size);
    this.p.pop();
  }

  hit() {
    this.hitPoints--;
  }
}
