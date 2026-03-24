import p5 from "p5";
import { getShipColliderVertices, ShipCollider } from "../../shared/src";

const LOCAL_DEBUG_HOSTNAMES = new Set(["127.0.0.1", "::1", "localhost"]);

export const isCollisionDebugAvailable = () => {
  const hostName = window.location.hostname;
  return (
    LOCAL_DEBUG_HOSTNAMES.has(hostName) ||
    hostName.endsWith(".localhost")
  );
};

const applyDebugStyle = (p: p5) => {
  p.stroke(255, 72, 72, 235);
  p.strokeWeight(2);
  p.fill(255, 56, 56, 26);
};

export const drawCollisionCircle = (
  p: p5,
  x: number,
  y: number,
  diameter: number
) => {
  p.push();
  applyDebugStyle(p);
  p.circle(x, y, diameter);
  p.pop();
};

export const drawShipCollisionBox = (p: p5, collider: ShipCollider) => {
  const vertices = getShipColliderVertices(collider);

  p.push();
  applyDebugStyle(p);
  p.beginShape();
  for (let i = 0; i < vertices.length; i++) {
    p.vertex(vertices[i].x, vertices[i].y);
  }
  p.endShape(p.CLOSE);
  p.pop();
};
