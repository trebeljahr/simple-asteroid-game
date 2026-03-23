import { gameStateMachine, getGameState } from "./gameState";
import { getRaceDurationSeconds } from "./raceSession";

export const openPauseMenu = () => {
  return gameStateMachine.send({ type: "OPEN_PAUSE" });
};

export const resumeGameplay = () => {
  return gameStateMachine.send({ type: "RESUME" });
};

export const openOptionsMenu = () => {
  return gameStateMachine.send({ type: "OPEN_OPTIONS" });
};

export const closeOptionsMenu = () => {
  return gameStateMachine.send({ type: "CLOSE_OPTIONS" });
};

export const returnToMainMenu = () => {
  return gameStateMachine.send({ type: "RETURN_TO_MAIN_MENU" });
};

export const toggleSoundEnabled = () => {
  return gameStateMachine.send({ type: "TOGGLE_SOUND" });
};

export const showRaceVictory = () => {
  const totalTime = getRaceDurationSeconds();
  return gameStateMachine.send({
    type: "SHOW_RESULT",
    title: `Race complete in ${totalTime} seconds`,
    subtitle: "The course is clear. Launch again or switch to another mode.",
  });
};

export const showRaceDefeat = () => {
  return gameStateMachine.send({
    type: "SHOW_RESULT",
    title: "Ship destroyed",
    subtitle: "Take another run at the course or head back to the hangar.",
  });
};

export const handleEscapeKey = () => {
  const state = getGameState();
  if (state.overlay !== null && state.overlay.type === "options") {
    closeOptionsMenu();
    return true;
  }

  if (state.scene.type === "mode") {
    if (state.overlay !== null && state.overlay.type === "pause") {
      resumeGameplay();
      return true;
    }
    if (state.overlay === null) {
      openPauseMenu();
      return true;
    }
  }

  return false;
};
