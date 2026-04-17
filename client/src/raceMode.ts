import p5 from "p5";
import { clampPlayerToWorldBounds, player, resetPlayer } from "./player";
import { resetExplosions } from "./explosions";
import { resetAmmunition } from "./ammunition";
import { resetbullets } from "./bullets";
import { resetHearts } from "./hearts";
import { asteroids, resetAsteroids } from "./asteroids";
import { resetBorder } from "./border";
import { refreshGoalsAfterResize, resetGoals } from "./goals";
import { resetRaceStartTime } from "./raceSession";
import { clearShipInput } from "./input";
import { resetShipDebris } from "./shipDebris";
import { recordRaceAttempt } from "./stats";
import { reportAchievementEvent } from "./achievementEvents";

export const resetRaceMode = (p: p5) => {
  recordRaceAttempt();
  reportAchievementEvent({ type: "race.attempted" });
  resetRaceStartTime();
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

export const refreshRaceViewport = () => {
  clearShipInput();
  clampPlayerToWorldBounds();
  refreshGoalsAfterResize();
  asteroids.refreshAfterResize();
};
