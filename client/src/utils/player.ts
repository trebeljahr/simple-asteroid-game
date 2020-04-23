import p5, { Vector } from "p5";
import {
  width,
  height,
  boardSizeX,
  boardSizeY,
  A_KEYCODE,
  D_KEYCODE,
  W_KEYCODE,
  SPACE_KEYCODE,
  playerHitsCircularTarget,
} from ".";
import { toggleDeathScreen, gameOver } from "./menu";
import { explosions } from "./explosions";
import { ThrusterExhaustSystem } from "./thruster";
import { Asteroid } from "./asteroids";
import { assets } from "../components/P5Component";
import { bullets } from "./bullets";

export let player = {} as Player;

export const resetPlayer = (p: p5) => {
  player = new Player(p, p.random(width), p.random(height));
};

export class Player {
  p: p5;
  pos: Vector;
  size: number;
  life: number;
  rotation: number;
  vel: Vector;
  acc: Vector;
  ammunition: number;
  thruster: ThrusterExhaustSystem;
  deathCountDown: number;
  constructor(p: p5, x: number, y: number) {
    this.p = p;
    this.deathCountDown = 0;
    this.pos = this.p.createVector(x, y);
    this.size = 60;
    this.life = 3;
    this.rotation = 0;
    this.vel = this.p.createVector(0, 0);
    this.acc = this.p.createVector(0, 0);
    this.ammunition = 1000;
    this.thruster = new ThrusterExhaustSystem(
      p,
      this.p.createVector(width / 2, height),
      0
    );
  }

  draw() {
    this.thruster.updatePos(
      p5.Vector.add(
        this.pos,
        p5.Vector.fromAngle(this.rotation - this.p.PI, this.size)
      ),
      this.rotation - this.p.PI
    );
    if (this.p.keyIsDown(this.p.UP_ARROW) || this.p.keyIsDown(W_KEYCODE)) {
      this.thruster.fire(10);
    }
    this.thruster.run();
    this.p.push();
    this.p.translate(this.pos.x, this.pos.y);
    this.p.rectMode(this.p.CENTER);
    this.p.rotate(this.rotation);
    this.p.fill(255);
    this.p.imageMode(this.p.CENTER);
    this.p.rotate(this.p.PI / 2);
    this.p.image(assets.rocket, 0, 0, this.size, this.size * 2);
    this.p.pop();
  }

  damage() {
    this.life--;
    if (this.life <= 0 && !gameOver) {
      explosions.createExplosion(this.pos);
      this.deathCountDown = 255;
    }
  }

  showHealth() {
    this.p.fill(255);
    let heartSize = 60;
    let offSet = 20;
    this.p.text(
      this.ammunition,
      offSet + (this.life + 1) * heartSize,
      offSet + heartSize / 2
    );
    for (let i = 0; i < this.life; i++) {
      this.p.image(
        assets.heart,
        i * heartSize + heartSize,
        offSet,
        heartSize,
        heartSize
      );
    }
  }

  steer() {
    if (this.p.keyIsDown(this.p.LEFT_ARROW) || this.p.keyIsDown(A_KEYCODE)) {
      this.rotation -= 0.05;
    }

    if (this.p.keyIsDown(this.p.RIGHT_ARROW) || this.p.keyIsDown(D_KEYCODE)) {
      this.rotation += 0.05;
    }

    this.acc = p5.Vector.fromAngle(this.rotation, 0.1);
  }

  update() {
    const newX = this.pos.x + this.vel.x;
    const newY = this.pos.y + this.vel.y;
    if (newX >= boardSizeX || newX <= -boardSizeX) {
      this.vel.x = 0;
    }
    if (newY >= boardSizeY || newY <= -boardSizeY) {
      this.vel.y = 0;
    }
    this.pos.add(this.vel);
    if (this.p.keyIsDown(this.p.UP_ARROW) || this.p.keyIsDown(W_KEYCODE)) {
      this.vel.add(this.acc);
      this.vel.limit(5);
    }
  }

  shoot() {
    if (this.p.keyIsDown(SPACE_KEYCODE) && this.ammunition > 0) {
      for (let i = 0; i < 2; i++) {
        const newPos = this.p
          .createVector(this.pos.x, this.pos.y)
          .add(p5.Vector.fromAngle(this.rotation, this.size));
        this.ammunition--;
        bullets.addBullet(newPos, this.rotation);
      }
    }
  }

  run() {
    if (this.life <= 0) {
      if (this.deathCountDown < 0) {
        toggleDeathScreen(this.p);
      }
      this.deathCountDown -= 15;
      return;
    }
    this.draw();
    this.update();
    this.steer();
    this.shoot();
  }
}

export const playerHitsAsteroid = (asteroid: Asteroid, player: Player) => {
  return playerHitsCircularTarget(asteroid, player);
};

export const playerHitsCollectible = (
  ammo: { pos: Vector; size: number },
  player: Player
) => {
  return playerHitsCircularTarget(ammo, player);
};
