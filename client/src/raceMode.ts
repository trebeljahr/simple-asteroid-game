import p5 from "p5";
import { resetPlayer } from "./player";
import { resetExplosions } from "./explosions";
import { resetAmmunition } from "./ammunition";
import { resetbullets } from "./bullets";
import { resetHearts } from "./hearts";
import { resetAsteroids } from "./asteroids";
import { resetBorder } from "./border";
import { resetGoals } from "./goals";
import { resetRaceStartTime } from "./raceSession";

export const resetRaceMode = (p: p5) => {
  resetRaceStartTime();
  resetPlayer(p);
  resetExplosions(p);
  resetAmmunition(p, {
    initialPackages: 0,
    spawnEnabled: false,
  });
  resetGoals(p);
  resetbullets(p);
  resetHearts(p);
  resetAsteroids(p);
  resetBorder(p);
};
