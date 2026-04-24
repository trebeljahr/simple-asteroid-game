export type ShipAction = "fire" | "thrust" | "turnLeft" | "turnRight";

interface ShipInputReceiver {
  clear(): void;
  isActive(action: ShipAction): boolean;
  setActionState(action: ShipAction, active: boolean, sourceId: string): void;
}

interface InputCommand {
  execute(receiver: ShipInputReceiver, active: boolean): void;
}

class SetShipActionCommand implements InputCommand {
  action: ShipAction;
  sourceId: string;

  constructor(action: ShipAction, sourceId: string) {
    this.action = action;
    this.sourceId = sourceId;
  }

  execute(receiver: ShipInputReceiver, active: boolean) {
    receiver.setActionState(this.action, active, this.sourceId);
  }
}

class ShipInputBuffer implements ShipInputReceiver {
  activeSources: Record<ShipAction, Set<string>>;

  constructor() {
    this.activeSources = {
      fire: new Set<string>(),
      thrust: new Set<string>(),
      turnLeft: new Set<string>(),
      turnRight: new Set<string>(),
    };
  }

  clear() {
    for (const action in this.activeSources) {
      this.activeSources[action as ShipAction].clear();
    }
  }

  isActive(action: ShipAction) {
    return this.activeSources[action].size > 0;
  }

  setActionState(action: ShipAction, active: boolean, sourceId: string) {
    if (active) {
      this.activeSources[action].add(sourceId);
      return;
    }

    this.activeSources[action].delete(sourceId);
  }
}

const inputBuffer = new ShipInputBuffer();
const commands = new Map<string, InputCommand>();

let initialized = false;

const defaultKeyboardBindings: Array<{ action: ShipAction; code: string }> = [
  { action: "thrust", code: "ArrowUp" },
  { action: "thrust", code: "KeyW" },
  { action: "turnLeft", code: "ArrowLeft" },
  { action: "turnLeft", code: "KeyA" },
  { action: "turnRight", code: "ArrowRight" },
  { action: "turnRight", code: "KeyD" },
  { action: "fire", code: "Space" },
];

const isLikelyTouchDevice = () => {
  return window.matchMedia("(pointer: coarse)").matches || window.navigator.maxTouchPoints > 0;
};

const onKeyboardInput = (active: boolean) => {
  return (event: KeyboardEvent) => {
    const causeId = `keyboard:${event.code}`;
    const command = commands.get(causeId);
    if (command === undefined) {
      return;
    }

    event.preventDefault();
    command.execute(inputBuffer, active);
  };
};

const clearInputOnHidden = () => {
  if (!document.hidden) {
    return;
  }
  inputBuffer.clear();
};

export const registerActionCause = (causeId: string, action: ShipAction) => {
  commands.set(causeId, new SetShipActionCommand(action, causeId));
};

export const dispatchActionCause = (causeId: string, active: boolean) => {
  const command = commands.get(causeId);
  if (command === undefined) {
    return;
  }
  command.execute(inputBuffer, active);
};

export const clearShipInput = () => {
  inputBuffer.clear();
};

export const initializeShipInput = () => {
  if (initialized) {
    return;
  }

  for (let i = 0; i < defaultKeyboardBindings.length; i++) {
    const binding = defaultKeyboardBindings[i];
    registerActionCause(`keyboard:${binding.code}`, binding.action);
  }

  window.addEventListener("keydown", onKeyboardInput(true));
  window.addEventListener("keyup", onKeyboardInput(false));
  window.addEventListener("blur", clearShipInput);
  document.addEventListener("visibilitychange", clearInputOnHidden);
  initialized = true;
};

export const isShipActionActive = (action: ShipAction) => {
  return inputBuffer.isActive(action);
};

export const isMobileDevice = () => {
  return isLikelyTouchDevice() && Math.min(window.innerWidth, window.innerHeight) <= 1200;
};

export const isMobilePortrait = () => {
  return isMobileDevice() && window.innerHeight > window.innerWidth;
};

export const requestLandscapeOrientationLock = () => {
  if (!isMobileDevice()) {
    return;
  }

  const orientationApi = window.screen.orientation as
    | (ScreenOrientation & {
        lock?: (orientation: "landscape") => Promise<void>;
      })
    | undefined;
  if (orientationApi === undefined || typeof orientationApi.lock !== "function") {
    return;
  }

  void orientationApi.lock("landscape").catch(() => {
    // Some browsers only allow this after a user gesture. The rotate prompt remains as a fallback.
  });
};
