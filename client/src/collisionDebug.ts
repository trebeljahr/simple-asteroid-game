import type p5 from "p5";
import {
  type CollisionAabb,
  getShipColliderBroadPhaseAabb,
  getShipColliderLoops,
  type Point2D,
  type ShipCollider,
  type TransformedCollisionShape,
} from "../../shared/src";

const LOCAL_DEBUG_HOSTNAMES = new Set(["127.0.0.1", "::1", "localhost"]);

export const isCollisionDebugAvailable = () => {
  const hostName = window.location.hostname;
  return LOCAL_DEBUG_HOSTNAMES.has(hostName) || hostName.endsWith(".localhost");
};

const applyBroadPhaseStyle = (p: p5) => {
  p.stroke(255, 72, 72, 235);
  p.strokeWeight(2);
  p.fill(255, 56, 56, 26);
};

const applyFinePhaseStyle = (p: p5) => {
  p.stroke(72, 255, 132, 240);
  p.strokeWeight(2);
  p.fill(74, 255, 144, 18);
};

const drawLoop = (p: p5, loop: readonly Point2D[]) => {
  if (loop.length === 0) {
    return;
  }

  p.beginShape();
  for (let index = 0; index < loop.length; index++) {
    p.vertex(loop[index].x, loop[index].y);
  }
  p.endShape(p.CLOSE);
};

export const drawCollisionCircle = (p: p5, x: number, y: number, diameter: number) => {
  p.push();
  applyBroadPhaseStyle(p);
  p.circle(x, y, diameter);
  p.pop();
};

export const drawCollisionBroadPhaseAabb = (p: p5, aabb: CollisionAabb) => {
  p.push();
  applyBroadPhaseStyle(p);
  p.rectMode(p.CORNERS);
  p.rect(aabb.minX, aabb.minY, aabb.maxX, aabb.maxY);
  p.pop();
};

export const drawCollisionFineShape = (
  p: p5,
  shapeOrLoops: TransformedCollisionShape | readonly Point2D[][],
) => {
  const loops = "loops" in shapeOrLoops ? shapeOrLoops.loops : shapeOrLoops;

  p.push();
  applyFinePhaseStyle(p);
  for (let loopIndex = 0; loopIndex < loops.length; loopIndex++) {
    drawLoop(p, loops[loopIndex]);
  }
  p.pop();
};

export const drawCollisionShapeDebug = (p: p5, shape: TransformedCollisionShape) => {
  drawCollisionBroadPhaseAabb(p, shape.aabb);
  drawCollisionFineShape(p, shape);
};

export const drawShipCollisionBox = (p: p5, collider: ShipCollider) => {
  drawCollisionBroadPhaseAabb(p, getShipColliderBroadPhaseAabb(collider));
  drawCollisionFineShape(p, getShipColliderLoops(collider));
};
