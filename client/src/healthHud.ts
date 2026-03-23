import { width } from "./utils";

export const MAX_PLAYER_HEALTH = 5;

export const getHudHeartSize = () => {
  return Math.max(42, Math.min(60, width * 0.07));
};

export const getHudHeartOffset = () => {
  return Math.max(14, getHudHeartSize() * 0.33);
};

export const getHudHeartTopLeft = (slotIndex: number) => {
  const heartSize = getHudHeartSize();
  const heartGap = heartSize * 0.08;
  const heartOffset = getHudHeartOffset();

  return {
    x: heartSize + slotIndex * (heartSize + heartGap),
    y: heartOffset,
  };
};

export const getHudHeartCenter = (slotIndex: number) => {
  const heartSize = getHudHeartSize();
  const topLeft = getHudHeartTopLeft(slotIndex);

  return {
    x: topLeft.x + heartSize / 2,
    y: topLeft.y + heartSize / 2,
  };
};
