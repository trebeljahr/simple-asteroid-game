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
import { showRaceDefeat } from "./gameUiActions";
import { explosions } from "./explosions";
import { ThrusterExhaustSystem } from "./thruster";
import { bullets } from "./bullets";
import { assets } from "./sketch";
import { World, Body, Bodies, Vector } from "matter-js";
import { engine } from "./engine";
import { goals } from "./goals";

export let player = {} as Player;
export const maxSpeed = 10;
export const resetPlayer = (p: p5) => {
  if (player && player.enginePlayer) {
    World.remove(engine.world, player.enginePlayer);
  }
  player = new Player(p, p.random(width), p.random(height));
};

const stopVerticalMotion = (body: Body, yPos: number) => {
  Body.setVelocity(body, Vector.create(body.velocity.x, 0));
  Body.setPosition(body, Vector.create(body.position.x, yPos));
};

const stopHorizontalMotion = (body: Body, xPos: number) => {
  Body.setVelocity(body, Vector.create(0, body.velocity.y));
  Body.setPosition(body, Vector.create(xPos, body.position.y));
};

export class Player {
  p: p5;
  size: number;
  life: number;
  ammunition: number;
  thruster: ThrusterExhaustSystem;
  deathCountDown: number;
  enginePlayer: Body;
  constructor(p: p5, x: number, y: number) {
    this.p = p;
    this.deathCountDown = 0;
    this.size = 60;
    this.life = 3;
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
    World.add(engine.world, [this.enginePlayer]);
  }

  draw() {
    const {
      position: { x, y },
      angle,
    } = this.enginePlayer;

    const playerPos = this.p.createVector(x, y);

    this.thruster.updatePos(
      p5.Vector.add(
        playerPos,
        p5.Vector.fromAngle(angle - this.p.PI, this.size)
      ),
      angle - this.p.PI
    );

    if (this.p.keyIsDown(this.p.UP_ARROW) || this.p.keyIsDown(W_KEYCODE)) {
      this.thruster.fire(10);
    }
    this.thruster.run();
    this.p.push();
    this.p.translate(x, y);
    this.p.angleMode(this.p.RADIANS);
    this.p.rectMode(this.p.CENTER);
    this.p.rotate(angle);
    this.p.fill(255);
    this.p.imageMode(this.p.CENTER);
    this.p.rotate(this.p.PI / 2);
    this.p.image(assets.rocket, 0, 0, this.size, this.size * 2);
    this.p.noFill();

    this.p.pop();
    this.p.stroke(255);

    this.drawGoalIndicator(playerPos);

    // const nose = p5.Vector.add(
    //   this.p.createVector(x, y),
    //   p5.Vector.fromAngle(angle + this.p.PI, -this.size)
    // );
    // if (goal) {
    //   this.p.line(nose.x, nose.y, goal.pos.x, goal.pos.y);
    // }
  }

  drawGoalIndicator(playerPos: p5.Vector) {
    const goal = goals.goal;
    if (!goal) {
      return;
    }

    const angleToGoal = p5.Vector.sub(goal.pos, playerPos).heading();
    const pulse = (this.p.sin(this.p.frameCount * 0.12) + 1) * 4;
    const tailStart = this.size * 1.1;
    const tailEnd = this.size * 1.8 + pulse;
    const arrowBase = this.size * 1.45 + pulse;
    const arrowTip = this.size * 2.05 + pulse;

    this.p.push();
    this.p.translate(playerPos.x, playerPos.y);
    this.p.rotate(angleToGoal);
    this.p.stroke(255, 225, 110);
    this.p.strokeWeight(4);
    this.p.line(tailStart, 0, tailEnd, 0);
    this.p.noStroke();
    this.p.fill(255, 225, 110, 220);
    this.p.triangle(
      arrowTip,
      0,
      arrowBase,
      -this.size * 0.22,
      arrowBase,
      this.size * 0.22
    );
    this.p.noFill();
    this.p.stroke(255, 225, 110, 120);
    this.p.strokeWeight(2);
    this.p.circle(tailStart - this.size * 0.15, 0, this.size * 0.45);
    this.p.pop();
  }

  damage() {
    if (this.life <= 0) {
      return;
    }
    this.life--;
    if (this.life <= 0) {
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
  }

  update() {
    const {
      position: { x, y },
      velocity,
      angle,
    } = this.enginePlayer;
    if (x >= boardSizeX) {
      stopHorizontalMotion(this.enginePlayer, boardSizeX);
    }
    if (x <= -boardSizeX) {
      stopHorizontalMotion(this.enginePlayer, -boardSizeX);
    }
    if (y >= boardSizeY) {
      stopVerticalMotion(this.enginePlayer, boardSizeY);
    }
    if (y <= -boardSizeY) {
      stopVerticalMotion(this.enginePlayer, -boardSizeY);
    }
    if (this.p.keyIsDown(this.p.UP_ARROW) || this.p.keyIsDown(W_KEYCODE)) {
      Body.applyForce(
        this.enginePlayer,
        this.enginePlayer.position,
        Vector.rotate(Vector.create(0.01, 0), angle)
      );
    }
    if (velocity.x > maxSpeed) {
      Body.setVelocity(this.enginePlayer, {
        x: maxSpeed,
        y: velocity.y,
      });
    }
    if (velocity.y > maxSpeed) {
      Body.setVelocity(this.enginePlayer, {
        x: velocity.x,
        y: maxSpeed,
      });
    }
    if (velocity.x < -maxSpeed) {
      Body.setVelocity(this.enginePlayer, {
        x: -maxSpeed,
        y: velocity.y,
      });
    }
    if (velocity.y < -maxSpeed) {
      Body.setVelocity(this.enginePlayer, {
        x: velocity.x,
        y: -maxSpeed,
      });
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
        showRaceDefeat();
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

export const playerHitsCollectible = (ammo: any, player: Player) => {
  return playerHitsCircularTarget(ammo, player);
};
