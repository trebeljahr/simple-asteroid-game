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
  mode: "race";
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
  soundEnabled: boolean;
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
  | { type: "SHOW_RESULT"; title: string; subtitle: string }
  | { type: "TOGGLE_SOUND" };

type GameStateListener = (state: GameState, previousState: GameState) => void;

const SOUND_SETTING_KEY = "simple-asteroid-game-sound-enabled";

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

const createInitialState = (): GameState => {
  return {
    scene: { type: "main-menu" },
    overlay: null,
    settings: {
      soundEnabled: readSoundSetting(),
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
          mode: "race",
          title: event.title,
          subtitle: event.subtitle,
        },
        overlay: null,
        settings: currentState.settings,
      };
    case "TOGGLE_SOUND":
      return {
        scene: currentState.scene,
        overlay: currentState.overlay,
        settings: {
          soundEnabled: !currentState.settings.soundEnabled,
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
    if (event.type === "TOGGLE_SOUND") {
      writeSoundSetting(nextState.settings.soundEnabled);
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
