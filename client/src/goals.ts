import p5, { Vector } from "p5";
import { toggleWinScreen } from "./menu";
import { randomSpawnPoint } from "./utils";
import { player, playerHitsCollectible } from "./player";

export let goals = {} as Goals;
export const resetGoals = (p: p5) => {
  goals = new Goals(p);
};

const lastGoal = 5;
class Goals {
  goal: Goal;
  p: p5;
  currentGoal: number;
  constructor(p: p5) {
    this.p = p;
    this.currentGoal = 1;
    this.goal = new Goal(this.p, randomSpawnPoint(this.p), this.currentGoal);
  }
  changeGoal() {
    if (this.currentGoal === lastGoal) {
      toggleWinScreen(this.p);
    }
    this.goal = new Goal(this.p, randomSpawnPoint(this.p), this.currentGoal);
    this.currentGoal++;
  }

  run() {
    this.goal.draw();
    if (playerHitsCollectible(this.goal, player)) {
      this.changeGoal();
    }
  }
}

export class Goal {
  p: p5;
  pos: Vector;
  size: number;
  goal: number;
  constructor(p: p5, pos: Vector, goal: number) {
    this.pos = pos.copy();
    this.size = 100;
    this.p = p;
    this.goal = goal;
  }

  draw() {
    this.p.rectMode(this.p.CENTER);
    this.p.stroke("yellow");
    this.p.strokeWeight(10);
    this.p.noFill();
    this.p.ellipse(this.pos.x, this.pos.y, this.size, this.size);
    this.p.strokeWeight(1);
    this.p.noStroke();
    this.p.fill(255);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(32);
    this.p.text(this.goal, this.pos.x, this.pos.y);
  }
}
