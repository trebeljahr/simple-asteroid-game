import type p5 from "p5";
import { type GameMode, gameStateMachine, getGameState } from "./gameState";
import { requestLandscapeOrientationLock } from "./input";
import { resetRunMode } from "./runMode";

let activeP5Instance: p5 | null = null;

export const configureGameModeActions = (p: p5) => {
  activeP5Instance = p;
};

export const activateGameMode = (mode: GameMode) => {
  if (mode === "singleplayer" || mode === "multiplayer" || mode === "battle-royale") {
    requestLandscapeOrientationLock();
  }

  if (mode === "singleplayer") {
    if (activeP5Instance === null) {
      return;
    }
    resetRunMode(activeP5Instance);
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
