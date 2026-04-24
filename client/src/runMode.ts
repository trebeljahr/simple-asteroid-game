import type p5 from "p5";
import { reportAchievementEvent } from "./achievementEvents";
import { resetAmmunition } from "./ammunition";
import { asteroids, resetAsteroids } from "./asteroids";
import { resetBorder } from "./border";
import { resetbullets } from "./bullets";
import { resetExplosions } from "./explosions";
import { refreshGoalsAfterResize, resetGoals } from "./goals";
import { resetHearts } from "./hearts";
import { clearShipInput } from "./input";
import { clampPlayerToWorldBounds, player, resetPlayer } from "./player";
import { resetRunStartTime } from "./runSession";
import { resetShipDebris } from "./shipDebris";
import { recordRunAttempt } from "./stats";

export const resetRunMode = (p: p5) => {
  recordRunAttempt();
  reportAchievementEvent({ type: "run.attempted" });
  resetRunStartTime();
  clearShipInput();
  resetPlayer(p);
  player.ammunition = 0;
  resetExplosions(p);
  resetShipDebris(p);
  resetAmmunition(p, {
    initialPackages: 0,
    spawnEnabled: false,
  });
  resetGoals(p);
  resetbullets(p);
  resetAsteroids(p);
  resetHearts(p);
  resetBorder(p);
};

export const refreshRunViewport = () => {
  clearShipInput();
  clampPlayerToWorldBounds();
  refreshGoalsAfterResize();
  asteroids.refreshAfterResize();
};
