import p5 from "p5";
import { player, Player } from "./player";
import { circleOverlapsShipCollider } from "../../shared/src";
import { isMobileDevice } from "./input";

const MOBILE_VIEW_SCALE = 1 / 1.5;

export const BULLET_SPEED = 10;
export const REFERENCE_VIEWPORT_WIDTH = 1440;
export const REFERENCE_VIEWPORT_HEIGHT = 900;
export const REFERENCE_PLAYER_SPAWN_SAFE_RADIUS = REFERENCE_VIEWPORT_WIDTH / 2;
export let width = window.innerWidth;
export let height = window.innerHeight;
export let boardSizeX = REFERENCE_VIEWPORT_WIDTH * 2;
export let boardSizeY = REFERENCE_VIEWPORT_HEIGHT * 2;
export const SPACE_KEYCODE = 32;
export const S_KEYCODE = 83;
export const W_KEYCODE = 87;
export const A_KEYCODE = 65;
export const D_KEYCODE = 68;
export const P_KEYCODE = 80;
export const T_KEYCODE = 84;
export const ESC_KEYCODE = 27;

export const updateWindowSize = () => {
  width = window.innerWidth;
  height = window.innerHeight;
};

export interface CameraBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const getViewScale = () => {
  return isMobileDevice() ? MOBILE_VIEW_SCALE : 1;
};

export const createCameraBounds = (
  centerX: number,
  centerY: number,
  padding = 0
): CameraBounds => {
  const scale = getViewScale();
  const halfWidth = width / (2 * scale);
  const halfHeight = height / (2 * scale);
  return {
    left: centerX - halfWidth - padding,
    right: centerX + halfWidth + padding,
    top: centerY - halfHeight - padding,
    bottom: centerY + halfHeight + padding,
  };
};

export const circleIntersectsBounds = (
  x: number,
  y: number,
  diameter: number,
  bounds: CameraBounds
) => {
  const radius = diameter / 2;
  return (
    x + radius >= bounds.left &&
    x - radius <= bounds.right &&
    y + radius >= bounds.top &&
    y - radius <= bounds.bottom
  );
};

export const randomPosition = (p: p5) => {
  return p.createVector(
    p.random(-boardSizeX, boardSizeX),
    p.random(-boardSizeY, boardSizeY)
  );
};

export const distSquare = (x1: number, y1: number, x2: number, y2: number) => {
  return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
};

export const clamp = (value: number, minValue: number, maxValue: number) => {
  return Math.max(minValue, Math.min(maxValue, value));
};

export const distanceToSegmentSquare = (
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) => {
  const segmentLengthSquare = distSquare(startX, startY, endX, endY);
  if (segmentLengthSquare === 0) {
    return distSquare(pointX, pointY, startX, startY);
  }

  const projection =
    ((pointX - startX) * (endX - startX) + (pointY - startY) * (endY - startY)) /
    segmentLengthSquare;
  const clampedProjection = clamp(projection, 0, 1);
  const nearestX = startX + (endX - startX) * clampedProjection;
  const nearestY = startY + (endY - startY) * clampedProjection;

  return distSquare(pointX, pointY, nearestX, nearestY);
};

export const circlesOverlap = (
  x1: number,
  y1: number,
  diameter1: number,
  x2: number,
  y2: number,
  diameter2: number
) => {
  const radiusSum = diameter1 / 2 + diameter2 / 2;
  return distSquare(x1, y1, x2, y2) <= radiusSum * radiusSum;
};

export const playerHitsCircularTarget = (target: any, player: Player) => {
  if (player.life <= 0) {
    return false;
  }
  return circleOverlapsShipCollider(
    target.pos.x,
    target.pos.y,
    target.size,
    player.getCollider()
  );
};

export const randomPositionNotHittingPlayer = (p: p5, size: number) => {
  let pos = randomPosition(p);
  let target = { pos, size };
  while (playerHitsCircularTarget(target, player)) {
    pos = randomPosition(p);
    target = { pos, size };
  }
  return pos;
};

export const randomSpawnPoint = (p: p5) => {
  let pos = randomPosition(p);
  while (
    distSquare(
      pos.x,
      pos.y,
      player.enginePlayer.position.x,
      player.enginePlayer.position.y
    ) <
    REFERENCE_PLAYER_SPAWN_SAFE_RADIUS * REFERENCE_PLAYER_SPAWN_SAFE_RADIUS
  ) {
    pos = randomPosition(p);
  }
  return pos;
};

export const rgba = (r: number, g: number, b: number, alpha: number) => {
  const rgbaString = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  return rgbaString;
};

// export const deleteFromObject = (keyPart, obj) => {
//   for (var k in obj) {
//     if (~k.indexOf(keyPart)) {
//       delete obj[k];
//     }
//   }
// }

// export const deletePlayer = (data) => {
//   console.log(data);
//   deleteFromObject(data.id, enemyPlayers);
// }

// export const generateNewPlayer = (data) => {
//   let enemyPos = createVector(data.pos.x, data.pos.y);
//   enemyPlayers[data.id] = new Enemy(enemyPos);
// }
