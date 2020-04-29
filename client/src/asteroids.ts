import p5, { Vector, Image } from "p5";
import {
  randomPositionNotHittingPlayer,
  playerHitsCircularTarget,
  boardSizeX,
  boardSizeY,
} from "./utils";
import { Mover } from "./mover";
import { playerHitsAsteroid, player } from "./player";
import { explosions } from "./explosions";
import { assets } from "./sketch";
// import { quadtree } from "./draw";
import { QuadTree, Rectangle, Point } from "./quadtree";
import { v4 } from "uuid";

let quadtree: QuadTree;
export let asteroids = {} as Asteroids;
export const resetAsteroids = (p: p5) => {
  asteroids = new Asteroids(p);
};

export let invocations = { amount: 0 };

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
  findById(id: string): Asteroid {
    return this.asteroids.find((asteroid) => asteroid.id === id);
  }
  run = () => {
    if (this.asteroids.length < maxAsteroids) {
      this.asteroids = [...this.asteroids, this.createNewAsteroid()];
    }

    quadtree = new QuadTree(
      new Rectangle(-boardSizeX, -boardSizeY, 2 * boardSizeX, 2 * boardSizeY),
      4
    );
    this.asteroids.forEach((asteroid) => {
      asteroid.update();
      asteroid.draw();
      const {
        pos: { x, y },
        id,
      } = asteroid;
      const point = new Point(x, y, { id });
      quadtree.insert(point);
    });

    invocations.amount = 0;
    const {
      pos: { x, y },
      size,
    } = player;
    const collidingPoints: Array<Point> = quadtree.query(
      new Rectangle(x, y, size, size),
      []
    );
    const collidingAsteroids = collidingPoints
      .filter(({ data }) => {
        const id = data.id as string;
        return playerHitsAsteroid(this.findById(id), player);
      })
      .map(({ data }) => {
        const id = data.id as string;
        return this.findById(id);
      });
    console.log(collidingPoints);

    collidingAsteroids.forEach((asteroid) => {
      explosions.createExplosion(asteroid.pos);
    });

    const collidingIds = collidingAsteroids.map(({ id }) => {
      return id;
    });
    this.asteroids = this.asteroids.reduce((agg, value) => {
      if (collidingIds.includes(value.id)) {
        return [...agg];
      }
      return [...agg, value];
    }, []);

    quadtree = new QuadTree(
      new Rectangle(0, 0, window.innerWidth, window.innerHeight),
      0
    );

    console.log("Shiffman Quad: ", invocations);
    // DifferentQuadTree
    // invocations = 0;
    // const {
    //   pos: { x, y },
    // } = player;
    // const collidingAsteroids: Array<Asteroid> = quadtree
    //   .colliding(
    //     {
    //       x,
    //       y,
    //       width: player.size,
    //       height: player.size * 2,
    //       rotation: player.rotation,
    //     },
    //     (_, { asteroid }) => {
    //       const hit = playerHitsCircularTarget(asteroid, player);
    //       return hit;
    //     }
    //   )
    //   .map(({ asteroid }) => asteroid);
    // this.asteroids = this.asteroids.filter(
    //   (asteroid) => !collidingAsteroids.includes(asteroid)
    // );
    // collidingAsteroids.forEach((asteroid) => {
    //   explosions.createExplosion(asteroid.pos);
    // });
    // quadtree.clear();
    // console.log("Quad: ", invocations);
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
  id: string;
  p: p5;
  constructor(p: p5, pos: Vector, vel: Vector, r: number, hitPoints: number) {
    super(p, pos, vel, r);
    this.p = p;
    this.hitPoints = hitPoints;
    this.img = p.random(assets.asteroids);
    this.rotation = p.random(p.PI);
    this.angularVelocity = p.random(-0.005, 0.005);
    this.id = v4();
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
