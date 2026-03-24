import { isCollisionDebugAvailable } from "./collisionDebug";
import {
  ShipVariant,
  DEFAULT_RACE_SHIP_VARIANT,
  MULTIPLAYER_SHIP_VARIANTS,
} from "../../shared/src";

export type GameMode = "race" | "multiplayer" | "horde";

export interface MainMenuScene {
  type: "main-menu";
}

export interface ModeScene {
  type: "mode";
  mode: GameMode;
}

export interface ResultScene {
  type: "result";
  mode: GameMode;
  title: string;
  subtitle: string;
}

export type SceneState = MainMenuScene | ModeScene | ResultScene;

export interface PauseOverlay {
  type: "pause";
}

export interface OptionsOverlay {
  type: "options";
  returnTarget: "main-menu" | "pause" | "result";
}

export type OverlayState = PauseOverlay | OptionsOverlay;

export interface SettingsState {
  collisionDebugEnabled: boolean;
  soundEnabled: boolean;
  shipVariant: ShipVariant;
}

export interface GameState {
  scene: SceneState;
  overlay: OverlayState | null;
  settings: SettingsState;
}

export type GameStateEvent =
  | { type: "START_MODE"; mode: GameMode }
  | { type: "OPEN_PAUSE" }
  | { type: "RESUME" }
  | { type: "OPEN_OPTIONS" }
  | { type: "CLOSE_OPTIONS" }
  | { type: "RETURN_TO_MAIN_MENU" }
  | { type: "SHOW_RESULT"; mode: GameMode; title: string; subtitle: string }
  | { type: "TOGGLE_COLLISION_DEBUG" }
  | { type: "TOGGLE_SOUND" }
  | { type: "SELECT_SHIP"; shipVariant: ShipVariant };

type GameStateListener = (state: GameState, previousState: GameState) => void;

const SOUND_SETTING_KEY = "simple-asteroid-game-sound-enabled";
const COLLISION_DEBUG_SETTING_KEY = "simple-asteroid-game-collision-debug";
const SHIP_VARIANT_SETTING_KEY = "simple-asteroid-game-ship-variant";

const readSoundSetting = () => {
  try {
    const storedValue = window.localStorage.getItem(SOUND_SETTING_KEY);
    if (storedValue === null) {
      return true;
    }
    return storedValue === "true";
  } catch (_error) {
    return true;
  }
};

const writeSoundSetting = (soundEnabled: boolean) => {
  try {
    window.localStorage.setItem(SOUND_SETTING_KEY, String(soundEnabled));
  } catch (_error) {
    // Ignore storage issues and keep the session state in memory.
  }
};

const readShipVariantSetting = (): ShipVariant => {
  try {
    const storedValue = window.localStorage.getItem(SHIP_VARIANT_SETTING_KEY);
    if (
      storedValue !== null &&
      MULTIPLAYER_SHIP_VARIANTS.includes(storedValue as ShipVariant)
    ) {
      return storedValue as ShipVariant;
    }
    return DEFAULT_RACE_SHIP_VARIANT;
  } catch (_error) {
    return DEFAULT_RACE_SHIP_VARIANT;
  }
};

const writeShipVariantSetting = (shipVariant: ShipVariant) => {
  try {
    window.localStorage.setItem(SHIP_VARIANT_SETTING_KEY, shipVariant);
  } catch (_error) {
    // Ignore storage issues and keep the session state in memory.
  }
};

const readCollisionDebugSetting = () => {
  if (!isCollisionDebugAvailable()) {
    return false;
  }

  try {
    return window.localStorage.getItem(COLLISION_DEBUG_SETTING_KEY) === "true";
  } catch (_error) {
    return false;
  }
};

const writeCollisionDebugSetting = (collisionDebugEnabled: boolean) => {
  if (!isCollisionDebugAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(
      COLLISION_DEBUG_SETTING_KEY,
      String(collisionDebugEnabled)
    );
  } catch (_error) {
    // Ignore storage issues and keep the session state in memory.
  }
};

const createInitialState = (): GameState => {
  return {
    scene: { type: "main-menu" },
    overlay: null,
    settings: {
      collisionDebugEnabled: readCollisionDebugSetting(),
      soundEnabled: readSoundSetting(),
      shipVariant: readShipVariantSetting(),
    },
  };
};

const transitionState = (
  currentState: GameState,
  event: GameStateEvent
): GameState => {
  switch (event.type) {
    case "START_MODE":
      return {
        scene: {
          type: "mode",
          mode: event.mode,
        },
        overlay: null,
        settings: currentState.settings,
      };
    case "OPEN_PAUSE":
      if (currentState.scene.type !== "mode" || currentState.overlay !== null) {
        return currentState;
      }
      return {
        scene: currentState.scene,
        overlay: { type: "pause" },
        settings: currentState.settings,
      };
    case "RESUME":
      if (currentState.scene.type !== "mode") {
        return currentState;
      }
      return {
        scene: currentState.scene,
        overlay: null,
        settings: currentState.settings,
      };
    case "OPEN_OPTIONS":
      if (currentState.overlay !== null) {
        if (currentState.overlay.type === "options") {
          return currentState;
        }
        return {
          scene: currentState.scene,
          overlay: {
            type: "options",
            returnTarget: "pause",
          },
          settings: currentState.settings,
        };
      }
      if (currentState.scene.type === "main-menu") {
        return {
          scene: currentState.scene,
          overlay: {
            type: "options",
            returnTarget: "main-menu",
          },
          settings: currentState.settings,
        };
      }
      if (currentState.scene.type === "result") {
        return {
          scene: currentState.scene,
          overlay: {
            type: "options",
            returnTarget: "result",
          },
          settings: currentState.settings,
        };
      }
      return currentState;
    case "CLOSE_OPTIONS":
      if (currentState.overlay === null || currentState.overlay.type !== "options") {
        return currentState;
      }
      if (currentState.overlay.returnTarget === "pause") {
        return {
          scene: currentState.scene,
          overlay: { type: "pause" },
          settings: currentState.settings,
        };
      }
      return {
        scene: currentState.scene,
        overlay: null,
        settings: currentState.settings,
      };
    case "RETURN_TO_MAIN_MENU":
      return {
        scene: { type: "main-menu" },
        overlay: null,
        settings: currentState.settings,
      };
    case "SHOW_RESULT":
      return {
        scene: {
          type: "result",
          mode: event.mode,
          title: event.title,
          subtitle: event.subtitle,
        },
        overlay: null,
        settings: currentState.settings,
      };
    case "TOGGLE_COLLISION_DEBUG":
      if (!isCollisionDebugAvailable()) {
        return currentState;
      }
      return {
        scene: currentState.scene,
        overlay: currentState.overlay,
        settings: {
          ...currentState.settings,
          collisionDebugEnabled: !currentState.settings.collisionDebugEnabled,
        },
      };
    case "TOGGLE_SOUND":
      return {
        scene: currentState.scene,
        overlay: currentState.overlay,
        settings: {
          ...currentState.settings,
          soundEnabled: !currentState.settings.soundEnabled,
        },
      };
    case "SELECT_SHIP":
      return {
        scene: currentState.scene,
        overlay: currentState.overlay,
        settings: {
          ...currentState.settings,
          shipVariant: event.shipVariant,
        },
      };
    default:
      return currentState;
  }
};

class GameStateMachine {
  private state: GameState;
  private listeners: GameStateListener[];

  constructor() {
    this.state = createInitialState();
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  subscribe(listener: GameStateListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(
        (registeredListener) => registeredListener !== listener
      );
    };
  }

  send(event: GameStateEvent) {
    const previousState = this.state;
    const nextState = transitionState(previousState, event);
    if (nextState === previousState) {
      return previousState;
    }
    this.state = nextState;
    if (event.type === "TOGGLE_COLLISION_DEBUG") {
      writeCollisionDebugSetting(nextState.settings.collisionDebugEnabled);
    }
    if (event.type === "TOGGLE_SOUND") {
      writeSoundSetting(nextState.settings.soundEnabled);
    }
    if (event.type === "SELECT_SHIP") {
      writeShipVariantSetting(nextState.settings.shipVariant);
    }
    this.listeners.forEach((listener) => listener(nextState, previousState));
    return nextState;
  }
}

export const gameStateMachine = new GameStateMachine();

export const getGameState = () => {
  return gameStateMachine.getState();
};

export const isRaceScene = (state: GameState) => {
  return state.scene.type === "mode" && state.scene.mode === "race";
};

export const shouldAdvanceRaceSimulation = (state: GameState) => {
  return isRaceScene(state) && state.overlay === null;
};
