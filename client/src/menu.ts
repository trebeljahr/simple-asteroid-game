import p5 from "p5";
import { GameMode, GameState, gameStateMachine } from "./gameState";
import {
  closeOptionsMenu,
  openOptionsMenu,
  resumeGameplay,
  returnToMainMenu,
  toggleCollisionDebug,
  toggleSoundEnabled,
} from "./gameUiActions";
import {
  activateGameMode,
  configureGameModeActions,
  restartCurrentMode,
} from "./gameModeActions";
import { isCollisionDebugAvailable } from "./collisionDebug";
import { MULTIPLAYER_SHIP_VARIANTS, ShipVariant } from "../../shared/src";

interface MenuRockConfig {
  delay: string;
  driftX: string;
  driftY: string;
  duration: string;
  opacity: string;
  size: string;
  src: string;
  top: string;
  left: string;
}

const menuRocks: MenuRockConfig[] = [
  {
    src: "/assets/asteroid1.svg",
    left: "8%",
    top: "10%",
    size: "11rem",
    opacity: "0.38",
    duration: "26s",
    delay: "-7s",
    driftX: "2.5rem",
    driftY: "1.75rem",
  },
  {
    src: "/assets/asteroid2.svg",
    left: "78%",
    top: "14%",
    size: "9rem",
    opacity: "0.28",
    duration: "22s",
    delay: "-11s",
    driftX: "-1.25rem",
    driftY: "2rem",
  },
  {
    src: "/assets/asteroid3.svg",
    left: "15%",
    top: "68%",
    size: "13rem",
    opacity: "0.2",
    duration: "31s",
    delay: "-5s",
    driftX: "3rem",
    driftY: "-2.5rem",
  },
  {
    src: "/assets/asteroid2.svg",
    left: "70%",
    top: "62%",
    size: "15rem",
    opacity: "0.18",
    duration: "34s",
    delay: "-13s",
    driftX: "-2.75rem",
    driftY: "-1.5rem",
  },
  {
    src: "/assets/asteroid1.svg",
    left: "47%",
    top: "6%",
    size: "7rem",
    opacity: "0.22",
    duration: "19s",
    delay: "-3s",
    driftX: "1.5rem",
    driftY: "2.25rem",
  },
];

let initialized = false;
let menuPanelMount: HTMLDivElement | null = null;

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

const capitalizeWords = (str: string) => {
  return str.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
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

const createPanelCloseButton = (label: string, onClick: () => void) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "menuPanelClose";
  button.textContent = "X";
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
};

const createPanel = (
  title: string,
  subtitle?: string,
  titleClassName?: string
) => {
  const panel = document.createElement("section");
  panel.className = "menuPanel";

  const titleElement = document.createElement("h1");
  titleElement.className = "menuTitle";
  if (titleClassName !== undefined) {
    titleElement.classList.add(titleClassName);
  }
  titleElement.textContent = title;
  panel.appendChild(titleElement);

  if (subtitle !== undefined && subtitle.trim().length > 0) {
    const subtitleElement = document.createElement("p");
    subtitleElement.className = "menuSubtitle";
    subtitleElement.textContent = subtitle;
    panel.appendChild(subtitleElement);
  }

  return panel;
};

const createButtonRow = () => {
  const buttonRow = document.createElement("div");
  buttonRow.className = "menuActions";
  return buttonRow;
};

const createRockElement = (config: MenuRockConfig) => {
  const rock = document.createElement("img");
  rock.className = "menuRock";
  rock.src = config.src;
  rock.alt = "";
  rock.setAttribute("aria-hidden", "true");
  rock.style.setProperty("--rock-left", config.left);
  rock.style.setProperty("--rock-top", config.top);
  rock.style.setProperty("--rock-size", config.size);
  rock.style.setProperty("--rock-opacity", config.opacity);
  rock.style.setProperty("--rock-duration", config.duration);
  rock.style.setProperty("--rock-delay", config.delay);
  rock.style.setProperty("--rock-drift-x", config.driftX);
  rock.style.setProperty("--rock-drift-y", config.driftY);
  return rock;
};

const ensureMenuStructure = () => {
  const menuRoot = getMenuRoot();
  if (menuRoot === null) {
    return null;
  }

  if (menuPanelMount !== null) {
    return {
      menuRoot,
      menuPanelMount,
    };
  }

  const menuScene = document.createElement("div");
  menuScene.className = "menuScene";

  const menuBackdrop = document.createElement("div");
  menuBackdrop.className = "menuBackdrop";
  menuBackdrop.setAttribute("aria-hidden", "true");
  menuScene.appendChild(menuBackdrop);

  const menuGlow = document.createElement("div");
  menuGlow.className = "menuGlow";
  menuScene.appendChild(menuGlow);

  for (let i = 0; i < menuRocks.length; i++) {
    menuScene.appendChild(createRockElement(menuRocks[i]));
  }

  const menuPane = document.createElement("div");
  menuPane.className = "menuScenePane";
  menuScene.appendChild(menuPane);

  menuPanelMount = document.createElement("div");
  menuPanelMount.className = "menuContent";

  menuRoot.replaceChildren(menuScene, menuPanelMount);

  return {
    menuRoot,
    menuPanelMount,
  };
};

const renderShipSelection = (currentVariant: ShipVariant) => {
  const container = document.createElement("div");
  container.className = "shipSelection";

  const label = document.createElement("h2");
  label.className = "shipSelectionLabel";
  label.textContent = "Choose Your Ship";
  container.appendChild(label);

  const grid = document.createElement("div");
  grid.className = "shipGrid";

  for (const variant of MULTIPLAYER_SHIP_VARIANTS) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "shipItem";
    if (variant === currentVariant) {
      item.classList.add("is-selected");
    }

    const img = document.createElement("img");
    img.className = "shipImage";
    img.src = `/assets/alternatives/ship-alt-${variant}.svg`;
    img.alt = capitalizeWords(variant);
    item.appendChild(img);

    const name = document.createElement("span");
    name.className = "shipName";
    name.textContent = capitalizeWords(variant);
    item.appendChild(name);

    item.addEventListener("click", () => {
      gameStateMachine.send({ type: "SELECT_SHIP", shipVariant: variant });
    });

    grid.appendChild(item);
  }

  container.appendChild(grid);
  return container;
};

const renderOptionsPanel = (state: GameState) => {
  const panel = createPanel("Options");
  const buttonRow = createButtonRow();
  const soundLabel = state.settings.soundEnabled ? "Sound: On" : "Sound: Off";
  buttonRow.appendChild(
    createActionButton(soundLabel, () => {
      toggleSoundEnabled();
    })
  );
  if (isCollisionDebugAvailable()) {
    const collisionDebugLabel = state.settings.collisionDebugEnabled
      ? "Collision Debug: On"
      : "Collision Debug: Off";
    buttonRow.appendChild(
      createActionButton(collisionDebugLabel, () => {
        toggleCollisionDebug();
      })
    );
  }
  buttonRow.appendChild(
    createActionButton(
      "Back",
      () => {
        closeOptionsMenu();
      },
      "secondary"
    )
  );
  panel.appendChild(buttonRow);
  return panel;
};

const renderMainMenuPanel = (state: GameState) => {
  const panel = createPanel(
    "Asteroids",
    "Race the force-field route or queue for a live two-ship duel.",
    "menuTitle--main-menu"
  );
  
  panel.appendChild(renderShipSelection(state.settings.shipVariant));

  const buttonRow = createButtonRow();
  buttonRow.appendChild(
    createActionButton("Race Mode", () => {
      activateGameMode("race");
    })
  );
  buttonRow.appendChild(
    createActionButton(
      "Multiplayer Battle",
      () => {
        activateGameMode("multiplayer");
      },
      "secondary"
    )
  );
  buttonRow.appendChild(
    createActionButton(
      "Options",
      () => {
        openOptionsMenu();
      },
      "ghost"
    )
  );
  panel.appendChild(buttonRow);

  return panel;
};

const renderPausePanel = (state: GameState) => {
  const modeLabel =
    state.scene.type === "mode" ? getModeLabel(state.scene.mode) : "Game";
  const panel = createPanel(
    `${modeLabel} Paused`,
    undefined,
    "menuTitle--compact"
  );
  panel.classList.add("menuPanel--pause");
  panel.appendChild(
    createPanelCloseButton("Close pause menu", () => {
      resumeGameplay();
    })
  );
  const buttonRow = createButtonRow();
  buttonRow.classList.add("menuActions--pause");
  buttonRow.appendChild(
    createActionButton("Resume", () => {
      resumeGameplay();
    })
  );
  buttonRow.appendChild(
    createActionButton(
      "Options",
      () => {
        openOptionsMenu();
      },
      "secondary"
    )
  );
  buttonRow.appendChild(
    createActionButton(
      "Main Menu",
      () => {
        returnToMainMenu();
      },
      "ghost"
    )
  );
  panel.appendChild(buttonRow);
  return panel;
};

const renderResultPanel = (state: GameState, title: string, subtitle: string) => {
  const panel = createPanel(title, subtitle);
  
  panel.appendChild(renderShipSelection(state.settings.shipVariant));

  const buttonRow = createButtonRow();
  buttonRow.appendChild(
    createActionButton("Try Again", () => {
      restartCurrentMode();
    })
  );
  buttonRow.appendChild(
    createActionButton(
      "Options",
      () => {
        openOptionsMenu();
      },
      "secondary"
    )
  );
  buttonRow.appendChild(
    createActionButton(
      "Main Menu",
      () => {
        returnToMainMenu();
      },
      "ghost"
    )
  );
  panel.appendChild(buttonRow);
  return panel;
};

const renderMenu = (state: GameState) => {
  const menuElements = ensureMenuStructure();
  if (menuElements === null) {
    return;
  }

  const { menuRoot, menuPanelMount: panelMount } = menuElements;

  const shouldShowMenu =
    state.scene.type === "main-menu" ||
    state.scene.type === "result" ||
    state.overlay !== null;
  const shouldShowDecorativeScene =
    state.scene.type === "main-menu" ||
    state.scene.type === "result" ||
    (state.overlay !== null &&
      state.overlay.type === "options" &&
      (state.overlay.returnTarget === "main-menu" ||
        state.overlay.returnTarget === "result"));
  const shouldShowGameplayShade =
    state.overlay?.type === "pause" ||
    (state.overlay?.type === "options" && state.overlay.returnTarget === "pause");

  menuRoot.classList.toggle("is-active", shouldShowMenu);
  menuRoot.classList.toggle("has-scene", shouldShowDecorativeScene);
  menuRoot.classList.toggle("has-gameplay-shade", shouldShowGameplayShade);
  panelMount.replaceChildren();

  if (!shouldShowMenu) {
    return;
  }

  if (state.overlay !== null && state.overlay.type === "options") {
    panelMount.appendChild(renderOptionsPanel(state));
    return;
  }

  if (state.scene.type === "main-menu") {
    panelMount.appendChild(renderMainMenuPanel(state));
    return;
  }

  if (state.overlay !== null && state.overlay.type === "pause") {
    panelMount.appendChild(renderPausePanel(state));
    return;
  }

  if (state.scene.type === "result") {
    panelMount.appendChild(renderResultPanel(state, state.scene.title, state.scene.subtitle));
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
