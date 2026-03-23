import { gameStateMachine, getGameState } from "./gameState";
import { handleEscapeKey } from "./gameUiActions";
import {
  clearShipInput,
  dispatchActionCause,
  isMobileDevice,
  isMobilePortrait,
  registerActionCause,
  requestLandscapeOrientationLock,
  ShipAction,
} from "./input";

interface MobileButtonConfig {
  action: ShipAction;
  causeId: string;
  label: string;
  side: "left" | "right";
  variant?: "accent";
}

const mobileButtons: MobileButtonConfig[] = [
  {
    action: "turnLeft",
    causeId: "mobile:turnLeft",
    label: "Left",
    side: "left",
  },
  {
    action: "turnRight",
    causeId: "mobile:turnRight",
    label: "Right",
    side: "left",
  },
  {
    action: "thrust",
    causeId: "mobile:thrust",
    label: "Boost",
    side: "right",
    variant: "accent",
  },
  {
    action: "fire",
    causeId: "mobile:fire",
    label: "Fire",
    side: "right",
  },
];

let initialized = false;

const shouldShowTouchControls = () => {
  const state = getGameState();
  return (
    isMobileDevice() &&
    state.scene.type === "mode" &&
    state.scene.mode === "race" &&
    state.overlay === null
  );
};

const syncCauseState = (causeId: string, pointerIds: Set<number>) => {
  dispatchActionCause(causeId, pointerIds.size > 0);
};

const bindButtonPress = (button: HTMLButtonElement, causeId: string) => {
  const pointerIds = new Set<number>();

  const syncPressedState = () => {
    button.classList.toggle("is-pressed", pointerIds.size > 0);
  };

  const releasePointer = (pointerId: number) => {
    pointerIds.delete(pointerId);
    syncCauseState(causeId, pointerIds);
    syncPressedState();
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    requestLandscapeOrientationLock();
    pointerIds.add(event.pointerId);
    button.setPointerCapture(event.pointerId);
    syncCauseState(causeId, pointerIds);
    syncPressedState();
  });

  button.addEventListener("pointerup", (event) => {
    releasePointer(event.pointerId);
  });
  button.addEventListener("pointercancel", (event) => {
    releasePointer(event.pointerId);
  });
  button.addEventListener("lostpointercapture", (event) => {
    releasePointer(event.pointerId);
  });

  return () => {
    pointerIds.clear();
    syncCauseState(causeId, pointerIds);
    syncPressedState();
  };
};

const createActionButton = (config: MobileButtonConfig) => {
  registerActionCause(config.causeId, config.action);

  const button = document.createElement("button");
  button.type = "button";
  button.className = `mobileControlButton${config.variant === "accent" ? " mobileControlButton--accent" : ""}`;
  button.textContent = config.label;
  return {
    button,
    reset: bindButtonPress(button, config.causeId),
  };
};

const createControlsRoot = () => {
  const root = document.createElement("div");
  root.className = "mobileControlsRoot";

  const topBar = document.createElement("div");
  topBar.className = "mobileControlsTopBar";

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "mobileMenuButton";
  menuButton.textContent = "Menu";
  menuButton.addEventListener("click", () => {
    handleEscapeKey();
  });
  topBar.appendChild(menuButton);
  root.appendChild(topBar);

  const bottomRow = document.createElement("div");
  bottomRow.className = "mobileControlsBottomRow";

  const leftCluster = document.createElement("div");
  leftCluster.className = "mobileControlCluster mobileControlCluster--left";

  const rightCluster = document.createElement("div");
  rightCluster.className = "mobileControlCluster mobileControlCluster--right";
  const resetControls: Array<() => void> = [];

  for (let i = 0; i < mobileButtons.length; i++) {
    const { button, reset } = createActionButton(mobileButtons[i]);
    resetControls.push(reset);
    if (mobileButtons[i].side === "left") {
      leftCluster.appendChild(button);
      continue;
    }
    rightCluster.appendChild(button);
  }

  bottomRow.append(leftCluster, rightCluster);
  root.appendChild(bottomRow);
  return {
    resetControls,
    root,
  };
};

const createRotatePrompt = () => {
  const overlay = document.createElement("div");
  overlay.className = "mobileRotatePrompt";

  const card = document.createElement("div");
  card.className = "mobileRotateCard";

  const title = document.createElement("h2");
  title.textContent = "Rotate to landscape";
  card.appendChild(title);

  const copy = document.createElement("p");
  copy.textContent =
    "Race mode is built for a wide cockpit view. Turn your device sideways to continue flying.";
  card.appendChild(copy);

  const hint = document.createElement("button");
  hint.type = "button";
  hint.className = "mobileRotateButton";
  hint.textContent = "Try landscape";
  hint.addEventListener("click", () => {
    requestLandscapeOrientationLock();
  });
  card.appendChild(hint);

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "mobileRotateButton mobileRotateButton--secondary";
  menuButton.textContent = "Open menu";
  menuButton.addEventListener("click", () => {
    handleEscapeKey();
  });
  card.appendChild(menuButton);

  overlay.appendChild(card);
  return overlay;
};

export const initializeMobileControls = () => {
  if (initialized) {
    return;
  }

  const { root: controlsRoot, resetControls } = createControlsRoot();
  const rotatePrompt = createRotatePrompt();

  const syncUi = () => {
    const showControls = shouldShowTouchControls();
    const showRotatePrompt = showControls && isMobilePortrait();

    controlsRoot.classList.toggle("is-visible", showControls && !showRotatePrompt);
    rotatePrompt.classList.toggle("is-visible", showRotatePrompt);

    if (!showControls || showRotatePrompt) {
      clearShipInput();
      for (let i = 0; i < resetControls.length; i++) {
        resetControls[i]();
      }
    }
  };

  document.body.append(controlsRoot, rotatePrompt);
  gameStateMachine.subscribe(() => {
    syncUi();
  });
  window.addEventListener("resize", syncUi);
  window.addEventListener("orientationchange", syncUi);
  window.addEventListener("blur", syncUi);
  syncUi();
  initialized = true;
};
