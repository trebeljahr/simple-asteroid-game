import p5 from "p5";

export const boardSizeX = 500;
export const boardSizeY = 500;
export const width = 500;
export const height = 500;

export const randomPosition = (p: p5) => {
  return p.createVector(
    p.random(-boardSizeX, boardSizeX),
    p.random(-boardSizeY, boardSizeY)
  );
};

export const distSquare = (x1, y1, x2, y2) => {
  return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
};

export const playerHitsCircularTarget = (target, player) => {
  let distance = distSquare(
    target.pos.x,
    target.pos.y,
    player.pos.x,
    player.pos.y
  );
  let radiusSum = target.size / 2 + player.size / 2;
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
