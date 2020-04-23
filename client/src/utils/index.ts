import p5, { Vector } from "p5";
import { player } from "./player";

export const BULLET_SPEED = 10;
export const width = window.innerWidth;
export const height = window.innerHeight;
export const boardSizeX = width * 3;
export const boardSizeY = height * 3;
export const SPACE_KEYCODE = 32;
export const S_KEYCODE = 83;
export const W_KEYCODE = 87;
export const A_KEYCODE = 65;
export const D_KEYCODE = 68;
export const P_KEYCODE = 80;
export const T_KEYCODE = 84;

export const randomPosition = (p: p5) => {
  return p.createVector(
    p.random(-boardSizeX, boardSizeX),
    p.random(-boardSizeY, boardSizeY)
  );
};

export const distSquare = (x1: number, y1: number, x2: number, y2: number) => {
  return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
};

export const playerHitsCircularTarget = (
  target: { pos: Vector; size: number },
  player: { pos: Vector; size: number; life: number }
) => {
  const distance = distSquare(
    target.pos.x,
    target.pos.y,
    player.pos.x,
    player.pos.y
  );
  const radiusSum = target.size / 2 + player.size / 2;
  if (player.life <= 0) {
    return false;
  }
  return distance <= radiusSum * radiusSum;
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
    distSquare(pos.x, pos.y, player.pos.x, player.pos.y) <
    ((width / 2) * width) / 2
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
