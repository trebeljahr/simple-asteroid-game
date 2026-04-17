import { GameMode, gameStateMachine, getGameState } from "./gameState";
import {
  didTakeDamageInCurrentRun,
  formatRunDuration,
  getRunDurationMilliseconds,
} from "./runSession";
import { playSound } from "./audio";
import { recordRunCompletion } from "./stats";
import { reportAchievementEvent } from "./achievementEvents";

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

export const openAchievementsMenu = () => {
  return gameStateMachine.send({ type: "OPEN_ACHIEVEMENTS" });
};

export const closeAchievementsMenu = () => {
  return gameStateMachine.send({ type: "CLOSE_ACHIEVEMENTS" });
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
  const durationMs = getRunDurationMilliseconds();
  const totalTime = formatRunDuration(durationMs, 2);
  const completion = recordRunCompletion(durationMs);
  reportAchievementEvent({
    type: "run.completed",
    durationMs,
    noDamage: !didTakeDamageInCurrentRun(),
  });
  playSound("victory");
  let subtitle: string;
  if (completion.isNewRecord) {
    if (completion.previousBestMs === null) {
      subtitle = `New personal best: ${totalTime}. Launch again or head back to the menu.`;
    } else {
      const previousBest = formatRunDuration(completion.previousBestMs, 2);
      subtitle = `New personal best! Previous best ${previousBest}.`;
    }
  } else {
    const bestTime = formatRunDuration(completion.newBestMs, 2);
    subtitle = `Personal best still ${bestTime}. Try to beat it.`;
  }
  return showModeResult(
    "singleplayer",
    `Singleplayer complete in ${totalTime}`,
    subtitle
  );
};

export const showSingleplayerDefeat = () => {
  playSound("defeat");
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
  if (state.overlay !== null && state.overlay.type === "achievements") {
    closeAchievementsMenu();
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
