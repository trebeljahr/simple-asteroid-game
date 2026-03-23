import p5 from "p5";
import { GameMode, GameState, gameStateMachine } from "./gameState";
import {
  closeOptionsMenu,
  openOptionsMenu,
  resumeGameplay,
  returnToMainMenu,
  toggleSoundEnabled,
} from "./gameUiActions";
import {
  activateGameMode,
  configureGameModeActions,
  restartCurrentMode,
} from "./gameModeActions";

let initialized = false;

const getMenuRoot = () => {
  return document.getElementById("menu");
};

const getModeLabel = (mode: GameMode) => {
  switch (mode) {
    case "race":
      return "Racing";
    case "multiplayer":
      return "Multiplayer";
    case "horde":
      return "Enemy Hordes";
    default:
      return mode;
  }
};

const createActionButton = (
  label: string,
  onClick: () => void,
  variant = "primary"
) => {
  const button = document.createElement("button");
  button.className = `menuButton menuButton--${variant}`;
  button.textContent = label;
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
};

const createPanel = (title: string, subtitle: string) => {
  const panel = document.createElement("section");
  panel.className = "menuPanel";

  const titleElement = document.createElement("h1");
  titleElement.className = "menuTitle";
  titleElement.textContent = title;
  panel.appendChild(titleElement);

  const subtitleElement = document.createElement("p");
  subtitleElement.className = "menuSubtitle";
  subtitleElement.textContent = subtitle;
  panel.appendChild(subtitleElement);

  return panel;
};

const createButtonRow = () => {
  const buttonRow = document.createElement("div");
  buttonRow.className = "menuActions";
  return buttonRow;
};

const renderOptionsPanel = (state: GameState) => {
  const panel = createPanel(
    "Options",
    "Tune the experience here. More settings can slot in later without changing the state flow."
  );
  const buttonRow = createButtonRow();
  const soundLabel = state.settings.soundEnabled ? "Sound: On" : "Sound: Off";
  buttonRow.appendChild(
    createActionButton(soundLabel, () => {
      toggleSoundEnabled();
    })
  );
  buttonRow.appendChild(
    createActionButton("Back", () => {
      closeOptionsMenu();
    }, "secondary")
  );
  panel.appendChild(buttonRow);
  return panel;
};

const renderMainMenuPanel = () => {
  const panel = createPanel(
    "Asteroid Hangar",
    "Pick a mode. Racing is live now, and the other modes are ready as placeholders for the next steps."
  );
  const buttonRow = createButtonRow();
  buttonRow.appendChild(
    createActionButton("Race Mode", () => {
      activateGameMode("race");
    })
  );
  buttonRow.appendChild(
    createActionButton("Multiplayer", () => {
      activateGameMode("multiplayer");
    }, "secondary")
  );
  buttonRow.appendChild(
    createActionButton("Enemy Hordes", () => {
      activateGameMode("horde");
    }, "secondary")
  );
  buttonRow.appendChild(
    createActionButton("Options", () => {
      openOptionsMenu();
    }, "ghost")
  );
  panel.appendChild(buttonRow);

  const helperText = document.createElement("p");
  helperText.className = "menuHelper";
  helperText.textContent = "Press Esc during any mode to open the in-game menu.";
  panel.appendChild(helperText);

  return panel;
};

const renderPausePanel = (state: GameState) => {
  const modeLabel =
    state.scene.type === "mode" ? getModeLabel(state.scene.mode) : "Game";
  const panel = createPanel(
    `${modeLabel} Paused`,
    "Resume the run, tweak options, or head back to the mode select screen."
  );
  const buttonRow = createButtonRow();
  buttonRow.appendChild(
    createActionButton("Resume", () => {
      resumeGameplay();
    })
  );
  buttonRow.appendChild(
    createActionButton("Options", () => {
      openOptionsMenu();
    }, "secondary")
  );
  buttonRow.appendChild(
    createActionButton("Main Menu", () => {
      returnToMainMenu();
    }, "ghost")
  );
  panel.appendChild(buttonRow);
  return panel;
};

const renderResultPanel = (title: string, subtitle: string) => {
  const panel = createPanel(title, subtitle);
  const buttonRow = createButtonRow();
  buttonRow.appendChild(
    createActionButton("Try Again", () => {
      restartCurrentMode();
    })
  );
  buttonRow.appendChild(
    createActionButton("Options", () => {
      openOptionsMenu();
    }, "secondary")
  );
  buttonRow.appendChild(
    createActionButton("Main Menu", () => {
      returnToMainMenu();
    }, "ghost")
  );
  panel.appendChild(buttonRow);
  return panel;
};

const renderMenu = (state: GameState) => {
  const menuRoot = getMenuRoot();
  if (menuRoot === null) {
    return;
  }

  menuRoot.innerHTML = "";

  const shouldShowMenu =
    state.scene.type === "main-menu" ||
    state.scene.type === "result" ||
    state.overlay !== null;

  menuRoot.classList.toggle("is-active", shouldShowMenu);

  if (!shouldShowMenu) {
    return;
  }

  if (state.overlay !== null && state.overlay.type === "options") {
    menuRoot.appendChild(renderOptionsPanel(state));
    return;
  }

  if (state.scene.type === "main-menu") {
    menuRoot.appendChild(renderMainMenuPanel());
    return;
  }

  if (state.overlay !== null && state.overlay.type === "pause") {
    menuRoot.appendChild(renderPausePanel(state));
    return;
  }

  if (state.scene.type === "result") {
    menuRoot.appendChild(renderResultPanel(state.scene.title, state.scene.subtitle));
  }
};

export const initializeMenu = (p: p5) => {
  configureGameModeActions(p);
  if (!initialized) {
    gameStateMachine.subscribe((state) => {
      renderMenu(state);
    });
    initialized = true;
  }
  renderMenu(gameStateMachine.getState());
};
