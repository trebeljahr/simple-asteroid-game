import p5, { Vector, Image } from "p5";
import {
  randomPositionNotHittingPlayer,
  playerHitsCircularTarget,
} from "./utils";
import { Mover } from "./mover";
import { playerHitsAsteroid, player } from "./player";
import { explosions } from "./explosions";
import { assets } from "./sketch";
import { quadtree } from "./draw";

export let asteroids = {} as Asteroids;
export const resetAsteroids = (p: p5) => {
  asteroids = new Asteroids(p);
};

const maxAsteroids = 500;
class Asteroids {
  asteroids: Asteroid[];
  p: p5;
  constructor(p: p5) {
    this.p = p;
    this.asteroids = [];
    for (let i = 0; i < maxAsteroids; i++) {
      this.addAsteroid();
    }
  }
  run = () => {
    if (this.asteroids.length < maxAsteroids) {
      this.asteroids = [...this.asteroids, this.createNewAsteroid()];
    }
    this.asteroids.forEach((asteroid) => {
      asteroid.update();
      asteroid.draw();
      const {
        pos: { x, y },
      } = asteroid;
      quadtree.push({ x, y, asteroid });
    });
    let invocations = 0;
    const {
      pos: { x, y },
    } = player;
    const collidingAsteroids: Array<Asteroid> = quadtree
      .colliding(
        {
          x,
          y,
          width: player.size,
          height: player.size * 2,
          rotation: player.rotation,
        },
        (_, { asteroid }) => {
          const hit = playerHitsCircularTarget(asteroid, player);
          return hit;
        }
      )
      .map(({ asteroid }) => asteroid);
    this.asteroids = this.asteroids.filter(
      (asteroid) => !collidingAsteroids.includes(asteroid)
    );
    collidingAsteroids.forEach((asteroid) => {
      explosions.createExplosion(asteroid.pos);
    });
    quadtree.clear();
    console.log("Quad: ", invocations);
  };

  // Lower Performance collision detection without quad tree.
  // run = () => {
  //   let invocations = 0;
  //   this.asteroids = this.asteroids.reduce((agg, asteroid) => {
  //     asteroid.update();
  //     asteroid.draw();
  //     invocations++;
  //     if (playerHitsAsteroid(asteroid, player)) {
  //       player.damage();
  //       explosions.createExplosion(asteroid.pos);
  //       return agg;
  //     }
  //     return [...agg, asteroid];
  //   }, [] as Asteroid[]);

  //   if (this.asteroids.length < maxAsteroids) {
  //     this.asteroids = [...this.asteroids, this.createNewAsteroid()];
  //   }
  //   console.log("Normal: ", invocations);
  // };

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
    this.img = p.random(assets.asteroids);
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
