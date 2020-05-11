import p5 from "p5";
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
} from "./utils";
import { toggleDeathScreen, gameOver } from "./menu";
import { explosions } from "./explosions";
import { ThrusterExhaustSystem } from "./thruster";
import { Asteroid, invocations } from "./asteroids";
import { bullets } from "./bullets";
import { assets } from "./sketch";
import { World, Body, Bodies, Vector } from "matter-js";
import { engine } from "./engine";

export let player = {} as Player;

export const resetPlayer = (p: p5) => {
  player = new Player(p, p.random(width), p.random(height));
};

export class Player {
  p: p5;
  // pos: Vector;
  size: number;
  life: number;
  // rotation: number;
  // vel: Vector;
  // acc: Vector;
  ammunition: number;
  thruster: ThrusterExhaustSystem;
  deathCountDown: number;
  enginePlayer: Body;
  constructor(p: p5, x: number, y: number) {
    this.p = p;
    this.deathCountDown = 0;
    // this.pos = this.p.createVector(x, y);
    this.size = 60;
    this.life = 3;
    // this.rotation = 0;
    // this.vel = this.p.createVector(0, 0);
    // this.acc = this.p.createVector(0, 0);
    this.ammunition = 1000;
    this.thruster = new ThrusterExhaustSystem(
      p,
      this.p.createVector(width / 2, height),
      0
    );
    this.enginePlayer = Bodies.rectangle(x, y, this.size, this.size * 2, {
      frictionAir: 0,
      angle: 0,
    });
    console.log(this.enginePlayer);
    World.add(engine.world, [this.enginePlayer]);
  }

  draw() {
    this.thruster.updatePos(
      p5.Vector.add(
        this.p.createVector(
          this.enginePlayer.position.x,
          this.enginePlayer.position.y
        ),
        p5.Vector.fromAngle(this.enginePlayer.angle - this.p.PI, this.size)
      ),
      this.enginePlayer.angle - this.p.PI
    );
    // this.thruster.updatePos(
    //   p5.Vector.add(
    //     this.pos,
    //     p5.Vector.fromAngle(this.rotation - this.p.PI, this.size)
    //   ),
    //   this.rotation - this.p.PI
    // );
    if (this.p.keyIsDown(this.p.UP_ARROW) || this.p.keyIsDown(W_KEYCODE)) {
      this.thruster.fire(10);
    }
    this.thruster.run();
    this.p.push();
    this.p.translate(
      this.enginePlayer.position.x,
      this.enginePlayer.position.y
    );
    this.p.angleMode(this.p.RADIANS);
    this.p.rectMode(this.p.CENTER);
    // console.log(this.enginePlayer);
    this.p.rotate(this.enginePlayer.angle);
    this.p.fill(255);
    this.p.imageMode(this.p.CENTER);
    this.p.rotate(this.p.PI / 2);
    this.p.image(assets.rocket, 0, 0, this.size, this.size * 2);
    this.p.pop();
  }

  damage() {
    this.life--;
    if (this.life <= 0 && !gameOver) {
      explosions.createExplosion(
        this.p.createVector(
          this.enginePlayer.position.x,
          this.enginePlayer.position.y
        )
      );
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
      Body.rotate(this.enginePlayer, -0.05);
    }

    if (this.p.keyIsDown(this.p.RIGHT_ARROW) || this.p.keyIsDown(D_KEYCODE)) {
      Body.rotate(this.enginePlayer, 0.05);
    }

    // this.acc = p5.Vector.fromAngle(this.enginePlayer.angle, 0.1);
  }

  update() {
    // if (
    //   this.enginePlayer.position.x >= boardSizeX ||
    //   this.enginePlayer.position.x <= -boardSizeX
    // ) {
    //   Body.setVelocity(
    //     this.enginePlayer,
    //     Vector.create(0, this.enginePlayer.velocity.y)
    //   );
    // }
    // if (
    //   this.enginePlayer.position.y >= boardSizeY ||
    //   this.enginePlayer.position.y <= -boardSizeY
    // ) {
    //   Body.setVelocity(
    //     this.enginePlayer,
    //     Vector.create(this.enginePlayer.velocity.y, 0)
    //   );
    // }
    if (this.p.keyIsDown(this.p.UP_ARROW) || this.p.keyIsDown(W_KEYCODE)) {
      Body.applyForce(
        this.enginePlayer,
        this.enginePlayer.position,
        Vector.rotate(Vector.create(0.01, 0), this.enginePlayer.angle)
      );
    }
  }

  shoot() {
    if (this.p.keyIsDown(SPACE_KEYCODE) && this.ammunition > 0) {
      for (let i = 0; i < 2; i++) {
        const newPos = this.p
          .createVector(
            this.enginePlayer.position.x,
            this.enginePlayer.position.y
          )
          .add(p5.Vector.fromAngle(this.enginePlayer.angle, this.size));
        this.ammunition--;
        bullets.addBullet(newPos, this.enginePlayer.angle);
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
  invocations.amount = invocations.amount + 1;
  return playerHitsCircularTarget(asteroid, player);
};

export const playerHitsCollectible = (ammo: any, player: Player) => {
  return playerHitsCircularTarget(ammo, player);
};
