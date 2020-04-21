import p5, { Vector, Image } from "p5";

export const asteroidAssets = (p: p5) => {
  let instance: Image[];

  const createInstance = () => {
    const asteroid1 = p.loadImage("assets/asteroid1.svg");
    const asteroid2 = p.loadImage("assets/asteroid2.svg");
    const asteroid3 = p.loadImage("assets/asteroid3.svg");
    return [asteroid1, asteroid2, asteroid3];
  };

  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
};

export class Asteroid extends Mover {
  hitPoints: number;
  img: any;
  rotation: number;
  angularVelocity: number;
  p: p5;
  constructor(p: p5, pos: Vector, vel: Vector, r: number, hitPoints: number) {
    super(pos, vel, r);
    this.p = p;
    this.hitPoints = hitPoints;
    this.img = p.random(asteroidAssets(p).getInstance());
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

export function spawnNewAsteroid(
  p: p5,
  indexToChange: number,
  asteroids: Asteroid[]
) {
  if (asteroids.length < 0) {
    return;
  }
  const newAsteroid = createNewAsteroid(p);
  return asteroids.map((asteroid, i) => {
    return i === indexToChange ? asteroid : newAsteroid;
  });
}

export function createNewAsteroid(p: p5) {
  const r = p.random(60, 200);
  const pos = randomSpawnPoint();
  const vel = p.createVector(0, 0);
  const hitpoints = r * 10;
  return new Asteroid(p, pos, vel, r, hitpoints);
}

export function createInitAsteroid(p: p5) {
  let r = p.random(60, 200);
  let pos = randomPositionNotHittingPlayer(r);
  let vel = p.createVector(0, 0);
  let hitpoints = r * 10;
  return new Asteroid(p, pos, vel, r, hitpoints);
}
