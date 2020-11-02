import p5, { Vector } from "p5";
import { randomSpawnPoint } from "./utils";

export let goals = {} as Goals;
export const resetGoals = (p: p5) => {
  goals = new Goals(p);
};

class Goals {
  goals: Goal[];
  p: p5;
  constructor(p: p5) {
    this.p = p;
    this.goals = [];
    this.addGoal(2);
  }

  addGoal(amount: number) {
    for (let i = 0; i < amount; i++) {
      this.goals.push(
        new Goal(this.p, randomSpawnPoint(this.p), this.goals.length)
      );
    }
  }

  run() {
    this.goals.forEach((goal) => goal.draw());
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
    this.p.fill("yellow");
    this.p.ellipse(this.pos.x, this.pos.y, this.size, this.size);
    this.p.fill(255);
    this.p.textSize(32);
    this.p.text(this.goal, this.pos.x, this.pos.y);
  }
}
