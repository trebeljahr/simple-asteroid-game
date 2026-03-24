import {
  collisionShapesOverlap,
  circleOverlapsCollisionShape,
  CollisionAabb,
  getCollisionShapeBoundingDiameter,
  Point2D,
  transformCollisionShape,
  TransformedCollisionShape,
} from "./collisionGeometry";
import { SHIP_COLLISION_SHAPES } from "./collisionShapeData";
import type { ShipVariant } from "./multiplayerCore";

export interface ShipColliderSpec {
  length: number;
  renderHeight: number;
  renderWidth: number;
  width: number;
}

export interface ShipCollider {
  angle: number;
  centerX: number;
  centerY: number;
  shape: TransformedCollisionShape;
  shipVariant: ShipVariant;
}

const SHIP_COLLIDER_SPECS: Record<ShipVariant, ShipColliderSpec> = {
  "comet-lance": {
    length: 82,
    renderHeight: 120,
    renderWidth: 60,
    width: 42,
  },
  "orbit-dart": {
    length: 78,
    renderHeight: 120,
    renderWidth: 60,
    width: 40,
  },
};

const SHIP_COLLISION_BOUNDING_DIAMETERS: Record<ShipVariant, number> = {
  "comet-lance": getCollisionShapeBoundingDiameter(
    SHIP_COLLISION_SHAPES["comet-lance"],
    SHIP_COLLIDER_SPECS["comet-lance"].renderHeight,
    SHIP_COLLIDER_SPECS["comet-lance"].renderWidth
  ),
  "orbit-dart": getCollisionShapeBoundingDiameter(
    SHIP_COLLISION_SHAPES["orbit-dart"],
    SHIP_COLLIDER_SPECS["orbit-dart"].renderHeight,
    SHIP_COLLIDER_SPECS["orbit-dart"].renderWidth
  ),
};

export const getShipColliderSpec = (shipVariant: ShipVariant): ShipColliderSpec => {
  return SHIP_COLLIDER_SPECS[shipVariant];
};

export const getShipCollisionBoundingDiameter = (shipVariant: ShipVariant) => {
  return SHIP_COLLISION_BOUNDING_DIAMETERS[shipVariant];
};

export const getShipCollider = (
  x: number,
  y: number,
  angle: number,
  shipVariant: ShipVariant
): ShipCollider => {
  const spec = getShipColliderSpec(shipVariant);

  return {
    angle,
    centerX: x,
    centerY: y,
    shape: transformCollisionShape(
      SHIP_COLLISION_SHAPES[shipVariant],
      x,
      y,
      angle,
      spec.renderHeight,
      spec.renderWidth
    ),
    shipVariant,
  };
};

export const getShipColliderVertices = (collider: ShipCollider): Point2D[] => {
  return collider.shape.loops[0] ?? [];
};

export const getShipColliderLoops = (collider: ShipCollider): Point2D[][] => {
  return collider.shape.loops;
};

export const getShipColliderBroadPhaseAabb = (
  collider: ShipCollider
): CollisionAabb => {
  return collider.shape.aabb;
};

export const circleOverlapsShipCollider = (
  x: number,
  y: number,
  diameter: number,
  collider: ShipCollider
) => {
  return circleOverlapsCollisionShape(x, y, diameter, collider.shape);
};

export const shipCollidersOverlap = (
  firstCollider: ShipCollider,
  secondCollider: ShipCollider
) => {
  return collisionShapesOverlap(firstCollider.shape, secondCollider.shape);
};
