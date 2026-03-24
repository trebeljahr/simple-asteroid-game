import { initializeMenu } from "./menu";
import { draw } from "./draw";
import {
  width,
  height,
  ESC_KEYCODE,
  boardSizeX,
  boardSizeY,
  updateWindowSize,
} from "./utils";
import p5, { Image } from "p5";
import { Engine } from "matter-js";
import { engine } from "./engine";
import { handleEscapeKey } from "./gameUiActions";
import { getGameState, shouldAdvanceRaceSimulation } from "./gameState";
import { initializeShipInput } from "./input";
import { initializeMobileControls } from "./mobileControls";
import { initializeMultiplayerSession } from "./multiplayerSession";
import { refreshRaceViewport } from "./raceMode";
import type { ShipVariant } from "../../shared/src";

const MIN_SPLASH_DURATION_MS = 1000;
const ASTEROID_TEXTURE_SIZE = 512;
const VIEWPORT_RESIZE_SETTLE_DELAY_MS = 140;
const appBootStartedAt = performance.now();

const rasterizeImageAsset = (p: p5, source: Image, size: number) => {
  const graphics = p.createGraphics(size, size);
  graphics.clear();
  graphics.imageMode(graphics.CENTER);
  graphics.image(source, size / 2, size / 2, size, size);
  const rasterized = graphics.get();
  graphics.remove();
  return rasterized;
};

const sketch = (p: p5) => {
  let hasShownFirstFrame = false;
  let loadingShellDismissed = false;
  let viewportResizeTimeoutId: number | null = null;

  const completeInitialLoading = () => {
    if (loadingShellDismissed) {
      return;
    }

    const elapsed = performance.now() - appBootStartedAt;
    const remaining = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);
    loadingShellDismissed = true;

    window.setTimeout(() => {
      document.body.classList.remove("app-loading");
      document.body.classList.add("app-ready");
    }, remaining);
  };

  const syncViewport = () => {
    updateWindowSize();
    p.resizeCanvas(width, height);
    engine.world.bounds.min.x = -boardSizeX;
    engine.world.bounds.min.y = -boardSizeY;
    engine.world.bounds.max.x = boardSizeX;
    engine.world.bounds.max.y = boardSizeY;

    const state = getGameState();
    if (state.scene.type === "mode" && state.scene.mode === "race") {
      refreshRaceViewport();
    }
  };

  const scheduleViewportSync = () => {
    if (viewportResizeTimeoutId !== null) {
      window.clearTimeout(viewportResizeTimeoutId);
    }

    viewportResizeTimeoutId = window.setTimeout(() => {
      viewportResizeTimeoutId = null;
      syncViewport();
    }, VIEWPORT_RESIZE_SETTLE_DELAY_MS);
  };

  p.keyPressed = () => {
    switch (p.keyCode) {
      case ESC_KEYCODE:
        if (handleEscapeKey()) {
          return false;
        }
        break;
    }
  };

  p.preload = () => {
    const asteroid1 = p.loadImage("/assets/asteroid1.svg");
    const asteroid2 = p.loadImage("/assets/asteroid2.svg");
    const asteroid3 = p.loadImage("/assets/asteroid3.svg");
    const heart = p.loadImage("/assets/heart.svg");
    const space = p.loadImage("/assets/background.jpg");
    const orbitDart = p.loadImage("/assets/alternatives/ship-alt-orbit-dart.svg");
    const cometLance = p.loadImage("/assets/alternatives/ship-alt-comet-lance.svg");
    const ammoAsset = p.loadImage("/assets/bullets.svg");
    assets = {
      asteroids: [asteroid1, asteroid2, asteroid3],
      heart,
      space,
      multiplayerShips: {
        "comet-lance": cometLance,
        "orbit-dart": orbitDart,
      },
      raceShip: orbitDart,
      ammoAsset,
    };
  };
  p.setup = () => {
    p.createCanvas(width, height);
    assets.asteroids = [
      rasterizeImageAsset(p, assets.asteroids[0], ASTEROID_TEXTURE_SIZE),
      rasterizeImageAsset(p, assets.asteroids[1], ASTEROID_TEXTURE_SIZE),
      rasterizeImageAsset(p, assets.asteroids[2], ASTEROID_TEXTURE_SIZE),
    ];
    initializeShipInput();
    initializeMobileControls();
    initializeMultiplayerSession(p);
    initializeMenu(p);
    engine.world.gravity.y = 0;
    engine.world.bounds.min.x = -boardSizeX;
    engine.world.bounds.min.y = -boardSizeY;
    engine.world.bounds.max.x = boardSizeX;
    engine.world.bounds.max.y = boardSizeY;
    window.addEventListener("orientationchange", scheduleViewportSync);
  };
  p.draw = () => {
    draw(p);
    if (shouldAdvanceRaceSimulation(getGameState())) {
      Engine.update(engine, 1000 / 60);
    }
    if (!hasShownFirstFrame) {
      completeInitialLoading();
      hasShownFirstFrame = true;
    }
  };

  p.windowResized = () => {
    scheduleViewportSync();
  };
};

export const p = new p5(sketch);

export interface Assets {
  asteroids: [Image, Image, Image];
  heart: Image;
  space: Image;
  multiplayerShips: Record<ShipVariant, Image>;
  raceShip: Image;
  ammoAsset: Image;
}
export let assets = {} as Assets;
