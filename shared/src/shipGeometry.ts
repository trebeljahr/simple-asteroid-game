import type { ShipVariant } from "./multiplayerCore";

export interface Point2D {
  x: number;
  y: number;
}

export interface ShipColliderSpec {
  forwardOffset: number;
  length: number;
  width: number;
}

export interface ShipCollider {
  angle: number;
  centerX: number;
  centerY: number;
  length: number;
  width: number;
}

const SHIP_COLLIDER_SPECS: Record<ShipVariant, ShipColliderSpec> = {
  "comet-lance": {
    forwardOffset: 6,
    length: 82,
    width: 42,
  },
  "orbit-dart": {
    forwardOffset: 5,
    length: 78,
    width: 40,
  },
};

const clamp = (value: number, minValue: number, maxValue: number) => {
  return Math.max(minValue, Math.min(maxValue, value));
};

const projectPoints = (points: Point2D[], axisX: number, axisY: number) => {
  let min = points[0].x * axisX + points[0].y * axisY;
  let max = min;

  for (let i = 1; i < points.length; i++) {
    const value = points[i].x * axisX + points[i].y * axisY;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return { min, max };
};

export const getShipColliderSpec = (shipVariant: ShipVariant): ShipColliderSpec => {
  return SHIP_COLLIDER_SPECS[shipVariant];
};

export const getShipCollisionBoundingDiameter = (shipVariant: ShipVariant) => {
  const collider = getShipColliderSpec(shipVariant);
  return Math.hypot(collider.length, collider.width);
};

export const getShipCollider = (
  x: number,
  y: number,
  angle: number,
  shipVariant: ShipVariant
): ShipCollider => {
  const spec = getShipColliderSpec(shipVariant);
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);

  return {
    angle,
    centerX: x + forwardX * spec.forwardOffset,
    centerY: y + forwardY * spec.forwardOffset,
    length: spec.length,
    width: spec.width,
  };
};

export const getShipColliderVertices = (collider: ShipCollider): Point2D[] => {
  const halfLength = collider.length / 2;
  const halfWidth = collider.width / 2;
  const forwardX = Math.cos(collider.angle);
  const forwardY = Math.sin(collider.angle);
  const rightX = -Math.sin(collider.angle);
  const rightY = Math.cos(collider.angle);

  const getVertex = (forwardOffset: number, rightOffset: number) => {
    return {
      x:
        collider.centerX +
        forwardX * forwardOffset +
        rightX * rightOffset,
      y:
        collider.centerY +
        forwardY * forwardOffset +
        rightY * rightOffset,
    };
  };

  return [
    getVertex(halfLength, -halfWidth),
    getVertex(halfLength, halfWidth),
    getVertex(-halfLength, halfWidth),
    getVertex(-halfLength, -halfWidth),
  ];
};

export const circleOverlapsShipCollider = (
  x: number,
  y: number,
  diameter: number,
  collider: ShipCollider
) => {
  const radius = diameter / 2;
  const dx = x - collider.centerX;
  const dy = y - collider.centerY;
  const forwardX = Math.cos(collider.angle);
  const forwardY = Math.sin(collider.angle);
  const rightX = -Math.sin(collider.angle);
  const rightY = Math.cos(collider.angle);
  const localForward = dx * forwardX + dy * forwardY;
  const localRight = dx * rightX + dy * rightY;
  const nearestForward = clamp(
    localForward,
    -collider.length / 2,
    collider.length / 2
  );
  const nearestRight = clamp(
    localRight,
    -collider.width / 2,
    collider.width / 2
  );
  const offsetForward = localForward - nearestForward;
  const offsetRight = localRight - nearestRight;
  return offsetForward * offsetForward + offsetRight * offsetRight <= radius * radius;
};

export const shipCollidersOverlap = (
  firstCollider: ShipCollider,
  secondCollider: ShipCollider
) => {
  const firstVertices = getShipColliderVertices(firstCollider);
  const secondVertices = getShipColliderVertices(secondCollider);
  const axes = [
    {
      x: Math.cos(firstCollider.angle),
      y: Math.sin(firstCollider.angle),
    },
    {
      x: -Math.sin(firstCollider.angle),
      y: Math.cos(firstCollider.angle),
    },
    {
      x: Math.cos(secondCollider.angle),
      y: Math.sin(secondCollider.angle),
    },
    {
      x: -Math.sin(secondCollider.angle),
      y: Math.cos(secondCollider.angle),
    },
  ];

  for (let axisIndex = 0; axisIndex < axes.length; axisIndex++) {
    const axis = axes[axisIndex];
    const firstProjection = projectPoints(firstVertices, axis.x, axis.y);
    const secondProjection = projectPoints(secondVertices, axis.x, axis.y);

    if (
      firstProjection.max < secondProjection.min ||
      secondProjection.max < firstProjection.min
    ) {
      return false;
    }
  }

  return true;
};
