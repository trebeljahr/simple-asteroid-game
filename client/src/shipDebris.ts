import type p5 from "p5";
import type { ShipVariant } from "../../shared/src";
import { type CameraBounds, circleIntersectsBounds } from "./utils";

interface LocalPoint {
  x: number;
  y: number;
}

interface ShipDebrisPieceTemplate {
  fill: "core" | "trim";
  offsetX: number;
  offsetY: number;
  points: LocalPoint[];
}

interface ShipDebrisPalette {
  core: [number, number, number];
  stroke: [number, number, number];
  trim: [number, number, number];
}

const SHIP_DEBRIS_PALETTES: Record<ShipVariant, ShipDebrisPalette> = {
  "comet-lance": {
    core: [84, 198, 176],
    stroke: [7, 17, 29],
    trim: [223, 238, 255],
  },
  "orbit-dart": {
    core: [75, 110, 210],
    stroke: [11, 17, 32],
    trim: [224, 235, 255],
  },
};

const SHIP_DEBRIS_TEMPLATES: Record<ShipVariant, ShipDebrisPieceTemplate[]> = {
  "comet-lance": [
    {
      fill: "trim",
      offsetX: 24,
      offsetY: 0,
      points: [
        { x: 16, y: 0 },
        { x: -10, y: -9 },
        { x: -4, y: 0 },
        { x: -10, y: 9 },
      ],
    },
    {
      fill: "core",
      offsetX: 4,
      offsetY: -11,
      points: [
        { x: 14, y: -4 },
        { x: -8, y: -10 },
        { x: -16, y: 2 },
        { x: -2, y: 8 },
      ],
    },
    {
      fill: "core",
      offsetX: 4,
      offsetY: 11,
      points: [
        { x: 14, y: 4 },
        { x: -2, y: -8 },
        { x: -16, y: -2 },
        { x: -8, y: 10 },
      ],
    },
    {
      fill: "trim",
      offsetX: -20,
      offsetY: -15,
      points: [
        { x: 12, y: -4 },
        { x: -12, y: -7 },
        { x: -4, y: 7 },
      ],
    },
    {
      fill: "trim",
      offsetX: -20,
      offsetY: 15,
      points: [
        { x: 12, y: 4 },
        { x: -4, y: -7 },
        { x: -12, y: 7 },
      ],
    },
  ],
  "orbit-dart": [
    {
      fill: "trim",
      offsetX: 24,
      offsetY: 0,
      points: [
        { x: 16, y: 0 },
        { x: -10, y: -10 },
        { x: -4, y: 0 },
        { x: -10, y: 10 },
      ],
    },
    {
      fill: "core",
      offsetX: 5,
      offsetY: -10,
      points: [
        { x: 15, y: -3 },
        { x: -4, y: -10 },
        { x: -15, y: -2 },
        { x: -3, y: 8 },
      ],
    },
    {
      fill: "core",
      offsetX: 5,
      offsetY: 10,
      points: [
        { x: 15, y: 3 },
        { x: -3, y: -8 },
        { x: -15, y: 2 },
        { x: -4, y: 10 },
      ],
    },
    {
      fill: "trim",
      offsetX: -18,
      offsetY: -14,
      points: [
        { x: 10, y: -4 },
        { x: -14, y: -7 },
        { x: -4, y: 7 },
      ],
    },
    {
      fill: "trim",
      offsetX: -18,
      offsetY: 14,
      points: [
        { x: 10, y: 4 },
        { x: -4, y: -7 },
        { x: -14, y: 7 },
      ],
    },
  ],
};

export let shipDebris = {} as ShipDebrisSystem;

export const resetShipDebris = (p: p5) => {
  shipDebris = new ShipDebrisSystem(p);
};

export class ShipDebrisSystem {
  pieces: ShipDebrisPiece[];
  p: p5;

  constructor(p: p5) {
    this.p = p;
    this.pieces = [];
  }

  createShipBreakup(x: number, y: number, angle: number, shipVariant: ShipVariant) {
    const palette = SHIP_DEBRIS_PALETTES[shipVariant];
    const templates = SHIP_DEBRIS_TEMPLATES[shipVariant];
    const forwardX = Math.cos(angle);
    const forwardY = Math.sin(angle);
    const rightX = -Math.sin(angle);
    const rightY = Math.cos(angle);

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const pieceX = x + forwardX * template.offsetX + rightX * template.offsetY;
      const pieceY = y + forwardY * template.offsetX + rightY * template.offsetY;
      const radialX = pieceX - x;
      const radialY = pieceY - y;
      const radialMagnitude = Math.max(1, Math.hypot(radialX, radialY));
      const escapeSpeed = this.p.random(2.2, 5.2);
      const velocity = this.p.createVector(
        (radialX / radialMagnitude) * escapeSpeed + forwardX * this.p.random(-0.5, 1.4),
        (radialY / radialMagnitude) * escapeSpeed + forwardY * this.p.random(-0.5, 1.4),
      );

      this.pieces.push(
        new ShipDebrisPiece(this.p, {
          angle: angle + this.p.random(-0.12, 0.12),
          angularVelocity: this.p.random(-0.16, 0.16),
          fill: template.fill === "core" ? palette.core : palette.trim,
          points: template.points,
          pos: this.p.createVector(pieceX, pieceY),
          stroke: palette.stroke,
          vel: velocity,
        }),
      );
    }
  }

  run(cameraBounds?: CameraBounds) {
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i];
      piece.run(cameraBounds);
      if (piece.isDead()) {
        this.pieces.splice(i, 1);
      }
    }
  }
}

class ShipDebrisPiece {
  angle: number;
  angularVelocity: number;
  fill: [number, number, number];
  lifespan: number;
  maxRadius: number;
  p: p5;
  points: LocalPoint[];
  pos: p5.Vector;
  stroke: [number, number, number];
  vel: p5.Vector;

  constructor(
    p: p5,
    options: {
      angle: number;
      angularVelocity: number;
      fill: [number, number, number];
      points: LocalPoint[];
      pos: p5.Vector;
      stroke: [number, number, number];
      vel: p5.Vector;
    },
  ) {
    this.p = p;
    this.angle = options.angle;
    this.angularVelocity = options.angularVelocity;
    this.fill = options.fill;
    this.lifespan = 255;
    this.points = options.points;
    this.pos = options.pos.copy();
    this.stroke = options.stroke;
    this.vel = options.vel.copy();
    this.maxRadius = this.points.reduce((largestRadius, point) => {
      return Math.max(largestRadius, Math.hypot(point.x, point.y));
    }, 0);
  }

  isDead() {
    return this.lifespan <= 0;
  }

  private show() {
    this.p.push();
    this.p.translate(this.pos.x, this.pos.y);
    this.p.rotate(this.angle);
    this.p.stroke(this.stroke[0], this.stroke[1], this.stroke[2], this.lifespan);
    this.p.strokeWeight(2);
    this.p.fill(this.fill[0], this.fill[1], this.fill[2], this.lifespan * 0.78);
    this.p.beginShape();
    for (let i = 0; i < this.points.length; i++) {
      this.p.vertex(this.points[i].x, this.points[i].y);
    }
    this.p.endShape(this.p.CLOSE);
    this.p.pop();
  }

  run(cameraBounds?: CameraBounds) {
    this.pos.add(this.vel);
    this.vel.mult(0.986);
    this.angle += this.angularVelocity;

    if (
      cameraBounds === undefined ||
      circleIntersectsBounds(this.pos.x, this.pos.y, this.maxRadius * 2, cameraBounds)
    ) {
      this.show();
    }

    this.lifespan = Math.max(0, this.lifespan - 6);
  }
}
