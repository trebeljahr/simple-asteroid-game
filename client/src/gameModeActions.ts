import p5 from "p5";
import { GameMode, getGameState, gameStateMachine } from "./gameState";
import { requestLandscapeOrientationLock } from "./input";
import { resetRaceMode } from "./raceMode";

let activeP5Instance: p5 | null = null;

export const configureGameModeActions = (p: p5) => {
  activeP5Instance = p;
};

export const activateGameMode = (mode: GameMode) => {
  if (mode === "race" || mode === "multiplayer") {
    requestLandscapeOrientationLock();
  }

  if (mode === "race") {
    if (activeP5Instance === null) {
      return;
    }
    resetRaceMode(activeP5Instance);
  }
  gameStateMachine.send({
    type: "START_MODE",
    mode,
  });
};

export const restartCurrentMode = () => {
  const state = getGameState();
  if (state.scene.type === "mode") {
    activateGameMode(state.scene.mode);
    return;
  }
  if (state.scene.type === "result") {
    activateGameMode(state.scene.mode);
  }
};
