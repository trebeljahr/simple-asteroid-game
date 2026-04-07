import { GameMode, gameStateMachine, getGameState } from "./gameState";
import { formatRaceDuration } from "./raceSession";

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

export const toggleCollisionDebug = () => {
  return gameStateMachine.send({ type: "TOGGLE_COLLISION_DEBUG" });
};

export const toggleNetcodeDebug = () => {
  return gameStateMachine.send({ type: "TOGGLE_NETCODE_DEBUG" });
};

export const showModeResult = (
  mode: GameMode,
  title: string,
  subtitle: string
) => {
  return gameStateMachine.send({
    type: "SHOW_RESULT",
    mode,
    title,
    subtitle,
  });
};

export const showSingleplayerVictory = () => {
  const totalTime = formatRaceDuration(undefined, 2);
  return showModeResult(
    "singleplayer",
    `Singleplayer complete in ${totalTime}`,
    "The course is clear. Launch again or head back to the menu."
  );
};

export const showSingleplayerDefeat = () => {
  return showModeResult(
    "singleplayer",
    "Ship destroyed",
    "Take another run at the course or head back to the hangar."
  );
};

export const showMultiplayerResult = (title: string, subtitle: string) => {
  return showModeResult("multiplayer", title, subtitle);
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
