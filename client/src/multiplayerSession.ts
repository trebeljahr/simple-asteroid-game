import p5 from "p5";
import { io, Socket } from "socket.io-client";

import { drawCollisionCircle, drawShipCollisionBox, isCollisionDebugAvailable } from "./collisionDebug";
import { ExplosionSystem } from "./explosions";
import { gameStateMachine, getGameState } from "./gameState";
import { showMultiplayerResult } from "./gameUiActions";
import {
  clearShipInput,
  isMobileDevice,
  isShipActionActive,
} from "./input";
import {
  getHudHeartSize,
  getHudHeartTopLeft,
} from "./healthHud";
import { assets } from "./sketch";
import { ShipDebrisSystem } from "./shipDebris";
import { ThrusterExhaustSystem } from "./thruster";
import { trpcClient } from "./trpcClient";
import { createCameraBounds, height, width } from "./utils";
import {
  applyWorldEvents,
  BULLET_DIAMETER,
  circleIntersectsBounds,
  circleOverlapsShipCollider,
  ClientToServerEvents,
  createInitialMatchWorld,
  getShipCollider,
  getShipCollisionBoundingDiameter,
  getAmmoPacketsInBounds,
  getAsteroidsInBounds,
  getHeartsInBounds,
  getNearbyAmmoPackets,
  getNearbyHearts,
  LOCAL_INPUT_PUSH_INTERVAL_MS,
  MatchEndedPayload,
  MatchEndReason,
  MatchFoundPayload,
  MATCH_COUNTDOWN_MS,
  MatchOutcome,
  MatchPlayerSnapshot,
  MatchSnapshotPayload,
  MatchWorldEventsPayload,
  MatchWorldRuntime,
  MatchmakingStatusPayload,
  MultiplayerRuntimeConfig,
  PLAYER_MAX_AMMO,
  PlayerSlot,
  projectBulletSnapshot,
  projectPlayerSnapshot,
  ServerToClientEvents,
  ShipCollider,
  ShipVariant,
  ShipInputState,
  RuntimePlayerState,
  stepPlayerState,
  WorldEvent,
} from "../../shared/src";

type MultiplayerStatus = "connecting" | "error" | "idle" | "matched" | "queueing";

interface ActiveMatchState {
  arena: MatchFoundPayload["arena"];
  foundAt: number;
  matchId: string;
  maxHealth: number;
  opponentId: string;
  playerId: string;
  slot: PlayerSlot;
  snapshot: MatchSnapshotPayload | null;
  snapshotReceivedAt: number;
  world: MatchWorldRuntime;
  worldVersion: number;
}

interface MultiplayerViewState {
  errorMessage: string | null;
  match: ActiveMatchState | null;
  queuePosition: number;
  queueSize: number;
  status: MultiplayerStatus;
}

const SNAPSHOT_TICK_MS = 1000 / 60;
const SHIP_WIDTH = 60;
const SHIP_HEIGHT = 120;
const WORLD_CULL_PADDING = 220;
const HUD_EFFECT_BURST_FRAMES = 10;
const HUD_EFFECT_FLIGHT_FRAMES = 24;
const HUD_EFFECT_PARTICLE_COUNT = 4;
const SHIP_ARRIVAL_DURATION_MS = 780;
const SHIP_DESTRUCTION_DURATION_MS = 720;

interface AmmoHudEffect {
  age: number;
  burstOffset: p5.Vector;
  scale: number;
  startScreenPos: p5.Vector;
}

interface PendingResultState {
  showAt: number;
  subtitle: string;
  title: string;
}

interface PlayerDestructionState {
  startedAt: number;
}

interface PlayerArrivalState {
  startedAt: number;
}

const createInitialViewState = (): MultiplayerViewState => {
  return {
    errorMessage: null,
    match: null,
    queuePosition: 0,
    queueSize: 0,
    status: "idle",
  };
};

const getResultCopy = (
  outcome: MatchOutcome,
  reason: MatchEndReason
): { subtitle: string; title: string } => {
  if (reason === "opponent-left") {
    if (outcome === "win") {
      return {
        subtitle: "The other pilot dropped from the field. Queue again to find another duel.",
        title: "Opponent forfeited",
      };
    }
    return {
      subtitle: "The battle ended early before a clean finish. Queue again when you are ready.",
      title: "Match ended early",
    };
  }

  if (reason === "inactive") {
    return {
      subtitle:
        "The match was closed after a minute without meaningful movement. Queue again when both players are ready.",
      title: "Match closed",
    };
  }

  if (outcome === "win") {
    return {
      subtitle: "The other ship broke apart first. Queue again to keep the streak moving.",
      title: "Victory secured",
    };
  }

  if (outcome === "loss") {
    return {
      subtitle: "Your hull gave out under the barrage. Queue again and try a new route through the field.",
      title: "Ship destroyed",
    };
  }

  return {
    subtitle: "Both ships were destroyed in the same exchange. Queue again for a cleaner finish.",
    title: "Mutual destruction",
  };
};

const sameInputState = (left: ShipInputState, right: ShipInputState) => {
  return (
    left.fire === right.fire &&
    left.thrust === right.thrust &&
    left.turnLeft === right.turnLeft &&
    left.turnRight === right.turnRight
  );
};

const drawHeartOutline = (p: p5, x: number, y: number, size: number) => {
  p.push();
  p.translate(x, y);
  p.scale(size / 100);
  p.noFill();
  p.stroke(138, 149, 163, 220);
  p.strokeWeight(7);
  p.beginShape();
  p.vertex(50, 88);
  p.bezierVertex(14, 60, 8, 22, 30, 22);
  p.bezierVertex(43, 22, 50, 34, 50, 34);
  p.bezierVertex(50, 34, 57, 22, 70, 22);
  p.bezierVertex(92, 22, 86, 60, 50, 88);
  p.endShape();
  p.pop();
};

class MultiplayerClientSession {
  private ammoHudEffects: AmmoHudEffect[] = [];
  private collisionExplosions: ExplosionSystem | null = null;
  private initialized = false;
  private inputPushIntervalMs = LOCAL_INPUT_PUSH_INTERVAL_MS;
  private isLeavingMode = false;
  private lastSentAt = 0;
  private lastSentInput: ShipInputState = {
    fire: false,
    inputSeq: 0,
    thrust: false,
    turnLeft: false,
    turnRight: false,
  };
  private inputBuffer: Array<{ seq: number; input: ShipInputState }> = [];
  private inputSeqCounter = 0;
  private pendingResult: PendingResultState | null = null;
  private predictedSelf: RuntimePlayerState | null = null;
  private p: p5 | null = null;
  private playerArrivals = new Map<string, PlayerArrivalState>();
  private playerDestructions = new Map<string, PlayerDestructionState>();
  private shipDebrisEffects: ShipDebrisSystem | null = null;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private thrusters = new Map<string, ThrusterExhaustSystem>();
  private viewState = createInitialViewState();

  initialize(p: p5) {
    if (this.initialized) {
      return;
    }

    this.p = p;
    this.resetClientEffects();

    gameStateMachine.subscribe((state, previousState) => {
      const wasMultiplayerMode =
        previousState.scene.type === "mode" &&
        previousState.scene.mode === "multiplayer";
      const isMultiplayerMode =
        state.scene.type === "mode" && state.scene.mode === "multiplayer";

      if (!wasMultiplayerMode && isMultiplayerMode) {
        this.enterMode();
        return;
      }

      if (wasMultiplayerMode && !isMultiplayerMode) {
        this.leaveMode();
      }
    });

    this.initialized = true;
  }

  draw(p: p5) {
    this.pushLatestInput();
    if (this.flushPendingResultIfReady()) {
      return;
    }
    p.clear();

    const activeMatch = this.viewState.match;
    if (activeMatch === null) {
      this.drawBackdrop(p);
      this.drawQueueState(p);
      this.drawHint(p, "Esc: menu");
      return;
    }

    if (
      activeMatch.snapshot === null ||
      activeMatch.snapshot.phase === "countdown"
    ) {
      this.drawBackdrop(p);
      this.drawMatchFoundOverlay(p, activeMatch);
      this.drawHint(p, "Esc: menu");
      return;
    }

    this.drawMatchWorld(p, activeMatch);
    this.drawHint(p, "Esc: menu");
  }

  private applyRuntimeConfig(runtimeConfig: MultiplayerRuntimeConfig) {
    this.inputPushIntervalMs = runtimeConfig.inputPushIntervalMs;
  }

  private async fetchRuntimeConfig() {
    try {
      const runtimeConfig = await trpcClient.multiplayer.runtime.query();
      this.applyRuntimeConfig(runtimeConfig);
    } catch (_error) {
      // The socket path is still the critical path. Keep a safe fallback if the
      // typed control plane is unavailable temporarily.
    }
  }

  private connectSocket() {
    if (this.socket !== null) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      autoConnect: false,
    });

    socket.on("connect", () => {
      if (!this.isMultiplayerModeActive()) {
        return;
      }

      this.viewState.errorMessage = null;
      this.viewState.status = "queueing";
      if (socket.id !== undefined) {
        void this.joinQueue(socket.id);
      }
    });

    socket.on("connect_error", () => {
      if (!this.isMultiplayerModeActive() || this.isLeavingMode) {
        return;
      }

      this.viewState.errorMessage =
        "Unable to reach the matchmaking server. Start the server and try again.";
      this.viewState.status = "error";
    });

    socket.on("disconnect", () => {
      if (!this.isMultiplayerModeActive() || this.isLeavingMode) {
        return;
      }

      const hadActiveMatch = this.viewState.match !== null;
      this.resetViewState();

      if (hadActiveMatch) {
        showMultiplayerResult(
          "Connection lost",
          "The arena link dropped before the match could finish. Rejoin multiplayer to battle again."
        );
        return;
      }

      this.viewState.errorMessage = "Reconnecting to the matchmaking server.";
      this.viewState.status = "connecting";
    });

    socket.on("matchmaking:status", (payload: MatchmakingStatusPayload) => {
      if (!this.isMultiplayerModeActive()) {
        return;
      }

      this.viewState.errorMessage = null;
      this.viewState.match = null;
      this.viewState.queuePosition = payload.position;
      this.viewState.queueSize = payload.queueSize;
      this.viewState.status = "queueing";
    });

    socket.on("match:found", (payload: MatchFoundPayload) => {
      if (!this.isMultiplayerModeActive()) {
        return;
      }

      this.viewState.errorMessage = null;
      this.viewState.match = {
        arena: payload.arena,
        foundAt: performance.now(),
        matchId: payload.matchId,
        maxHealth: payload.maxHealth,
        opponentId: payload.opponentId,
        playerId: payload.playerId,
        slot: payload.slot,
        snapshot: null,
        snapshotReceivedAt: performance.now(),
        world: createInitialMatchWorld(payload.worldSeed, payload.arena),
        worldVersion: 0,
      };
      this.viewState.queuePosition = 0;
      this.viewState.queueSize = 0;
      this.viewState.status = "matched";
      this.lastSentAt = 0;
      this.lastSentInput = {
        fire: false,
        inputSeq: 0,
        thrust: false,
        turnLeft: false,
        turnRight: false,
      };
      this.resetClientEffects();
    });

    socket.on("match:world-events", (payload: MatchWorldEventsPayload) => {
      if (!this.isMultiplayerModeActive() || this.viewState.match === null) {
        return;
      }
      if (payload.matchId !== this.viewState.match.matchId) {
        return;
      }
      if (payload.worldVersion <= this.viewState.match.worldVersion) {
        return;
      }

      this.playWorldEventEffects(this.viewState.match, payload.events);
      applyWorldEvents(
        this.viewState.match.world,
        payload.events,
        this.viewState.match.arena
      );
      this.viewState.match.worldVersion = payload.worldVersion;
    });

    socket.on("match:snapshot", (payload: MatchSnapshotPayload) => {
      if (!this.isMultiplayerModeActive() || this.viewState.match === null) {
        return;
      }
      if (payload.matchId !== this.viewState.match.matchId) {
        return;
      }

      const previousSnapshot = this.viewState.match.snapshot;

      if (previousSnapshot !== null) {
        this.playSnapshotEffects(previousSnapshot, payload);
      }

      if (
        (previousSnapshot === null && payload.phase === "active") ||
        (previousSnapshot !== null &&
          previousSnapshot.phase === "countdown" &&
          payload.phase === "active")
      ) {
        this.triggerPlayerArrivals(payload.players);
      }

      this.viewState.match.snapshot = payload;
      this.viewState.match.snapshotReceivedAt = performance.now();
      this.viewState.status = "matched";

      const serverSelf = payload.players.find(
        (player) => player.id === this.viewState.match?.playerId
      );
      if (serverSelf !== undefined) {
        this.reconcilePredictedSelf(serverSelf, this.viewState.match.arena);
      }
    });

    socket.on("match:ended", (payload: MatchEndedPayload) => {
      if (!this.isMultiplayerModeActive() || this.viewState.match === null) {
        return;
      }
      if (payload.matchId !== this.viewState.match.matchId) {
        return;
      }

      const resultCopy = getResultCopy(payload.outcome, payload.reason);
      clearShipInput();

      if (payload.reason === "destroyed") {
        this.pendingResult = {
          showAt: performance.now() + SHIP_DESTRUCTION_DURATION_MS,
          subtitle: resultCopy.subtitle,
          title: resultCopy.title,
        };

        const latestSnapshot = this.viewState.match.snapshot;
        if (latestSnapshot !== null) {
          for (let i = 0; i < latestSnapshot.players.length; i++) {
            const player = latestSnapshot.players[i];
            if (
              payload.winnerId !== null &&
              player.id === payload.winnerId
            ) {
              continue;
            }

            this.createShipDestruction(player);
          }
        }
        return;
      }

      this.resetViewState();
      showMultiplayerResult(resultCopy.title, resultCopy.subtitle);
    });

    this.socket = socket;
    socket.connect();
  }

  private createCollisionExplosion(x: number, y: number, extraBursts = 0) {
    if (this.p === null) {
      return;
    }

    if (this.collisionExplosions === null) {
      this.collisionExplosions = new ExplosionSystem(this.p);
    }

    this.collisionExplosions.createExplosion(this.p.createVector(x, y));
    for (let i = 0; i < extraBursts; i++) {
      const offset = p5.Vector.fromAngle(
        this.p.random(0, this.p.TWO_PI),
        this.p.random(8, 24)
      );
      const burstPos = this.p.createVector(x + offset.x, y + offset.y);
      this.collisionExplosions.createExplosion(burstPos);
    }
  }

  private createAmmoPickupEffect(
    worldX: number,
    worldY: number,
    cameraCenterX: number,
    cameraCenterY: number
  ) {
    if (this.p === null) {
      return;
    }

    const startScreenPos = this.p.createVector(
      width / 2 + (worldX - cameraCenterX),
      height / 2 + (worldY - cameraCenterY)
    );

    for (let i = 0; i < HUD_EFFECT_PARTICLE_COUNT; i++) {
      const angle =
        (this.p.TWO_PI * i) / HUD_EFFECT_PARTICLE_COUNT +
        this.p.random(-0.2, 0.2);
      const burstDistance = this.p.random(18, 34);
      this.ammoHudEffects.push({
        age: this.p.random(3),
        burstOffset: p5.Vector.fromAngle(angle, burstDistance),
        scale: this.p.random(0.5, 0.72),
        startScreenPos: startScreenPos.copy(),
      });
    }
  }

  private createShipDestruction(player: MatchPlayerSnapshot) {
    if (this.playerDestructions.has(player.id)) {
      return;
    }

    const startedAt = performance.now();
    this.playerDestructions.set(player.id, { startedAt });
    this.createCollisionExplosion(player.x, player.y, 2);
    this.shipDebrisEffects?.createShipBreakup(
      player.x,
      player.y,
      player.angle,
      player.shipVariant
    );

    if (this.pendingResult !== null) {
      this.pendingResult.showAt = Math.max(
        this.pendingResult.showAt,
        startedAt + SHIP_DESTRUCTION_DURATION_MS
      );
    }
  }

  private drawAmmoHudEffects(p: p5) {
    const target = this.getAmmoHudCenter();

    for (let i = this.ammoHudEffects.length - 1; i >= 0; i--) {
      const effect = this.ammoHudEffects[i];
      const totalFrames = HUD_EFFECT_BURST_FRAMES + HUD_EFFECT_FLIGHT_FRAMES;

      if (effect.age >= totalFrames) {
        this.ammoHudEffects.splice(i, 1);
        continue;
      }

      const burstProgress = Math.min(effect.age / HUD_EFFECT_BURST_FRAMES, 1);
      const easedBurst = 1 - (1 - burstProgress) * (1 - burstProgress);
      const burstPos = p5.Vector.add(
        effect.startScreenPos,
        p5.Vector.mult(effect.burstOffset, easedBurst)
      ).add(0, -8 * easedBurst);

      let drawX = burstPos.x;
      let drawY = burstPos.y;
      let drawSize = 20 * effect.scale;
      let drawAlpha = 230;

      if (effect.age >= HUD_EFFECT_BURST_FRAMES) {
        const flightProgress =
          (effect.age - HUD_EFFECT_BURST_FRAMES) / HUD_EFFECT_FLIGHT_FRAMES;
        const easedFlight =
          1 - (1 - flightProgress) * (1 - flightProgress) * (1 - flightProgress);
        drawX = p.lerp(burstPos.x, target.x, easedFlight);
        drawY = p.lerp(burstPos.y, target.y, easedFlight);
        drawSize = p.lerp(20 * effect.scale, 16, easedFlight);
        drawAlpha = p.lerp(230, 215, easedFlight);
      }

      p.push();
      p.noStroke();
      p.fill(190, 233, 255, 34);
      p.circle(drawX, drawY, drawSize * 1.85);
      p.imageMode(p.CENTER);
      p.tint(255, drawAlpha);
      p.image(assets.ammoAsset, drawX, drawY, drawSize, drawSize);
      p.noTint();
      p.pop();

      effect.age++;
    }
  }

  private flushPendingResultIfReady() {
    if (
      this.pendingResult === null ||
      performance.now() < this.pendingResult.showAt ||
      !this.isMultiplayerModeActive()
    ) {
      return false;
    }

    const result = this.pendingResult;
    this.resetViewState();
    showMultiplayerResult(result.title, result.subtitle);
    return true;
  }

  private getAmmoHudCenter() {
    const panelWidth = Math.min(188, Math.max(154, width * 0.18));
    const panelHeight = 70;
    const panelX = width - panelWidth - 20;
    const panelY = 18;

    return {
      x: panelX + 34,
      y: panelY + panelHeight / 2,
    };
  }

  private drawAmmoCollectible(
    p: p5,
    ammoPacket: ReturnType<typeof getAmmoPacketsInBounds>[number],
    highlighted: boolean
  ) {
    p.push();
    p.imageMode(p.CENTER);

    if (highlighted) {
      p.noStroke();
      p.fill(166, 233, 255, 42);
      p.circle(ammoPacket.x, ammoPacket.y, ammoPacket.size * 1.45);
    }

    p.noStroke();
    p.fill(218, 244, 255, 240);
    p.ellipse(ammoPacket.x, ammoPacket.y, ammoPacket.size, ammoPacket.size);
    p.image(
      assets.ammoAsset,
      ammoPacket.x,
      ammoPacket.y,
      ammoPacket.size / 1.5,
      ammoPacket.size / 1.5
    );
    p.pop();
  }

  private drawAmmoHud(p: p5, ammo: number) {
    const panelWidth = Math.min(188, Math.max(154, width * 0.18));
    const panelHeight = 70;
    const panelX = width - panelWidth - 20;
    const panelY = 18;
    const isLowAmmo = ammo <= 3;
    const ammoCenter = this.getAmmoHudCenter();

    p.push();
    p.rectMode(p.CORNER);
    p.noStroke();
    p.fill(isLowAmmo ? 34 : 15, isLowAmmo ? 27 : 30, isLowAmmo ? 24 : 49, 220);
    p.rect(panelX, panelY, panelWidth, panelHeight, 18);
    p.stroke(isLowAmmo ? 255 : 103, isLowAmmo ? 172 : 201, isLowAmmo ? 128 : 242, 120);
    p.strokeWeight(1.2);
    p.noFill();
    p.rect(panelX, panelY, panelWidth, panelHeight, 18);

    p.imageMode(p.CENTER);
    p.noTint();
    p.image(assets.ammoAsset, ammoCenter.x, ammoCenter.y, 30, 30);

    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.fill(194, 219, 235, 155);
    p.textSize(12);
    p.text("Ammo", panelX + 56, panelY + 12);

    p.fill(244, 249, 255);
    p.textSize(26);
    p.text(`${ammo} / ${PLAYER_MAX_AMMO}`, panelX + 56, panelY + 26);
    p.pop();
  }

  private drawAsteroid(
    p: p5,
    asteroid: ReturnType<typeof getAsteroidsInBounds>[number],
    predictedSequence: number
  ) {
    const asteroidTexture = assets.asteroids[asteroid.variant] ?? assets.asteroids[0];

    p.push();
    p.imageMode(p.CENTER);
    p.translate(asteroid.x, asteroid.y);
    p.rotate(asteroid.baseRotation + predictedSequence * asteroid.spinSpeed);
    p.image(asteroidTexture, 0, 0, asteroid.size, asteroid.size);
    p.pop();
  }

  private drawBackdrop(p: p5, focusX = 0, focusY = 0) {
    const parallaxX = width / 2 - focusX * 0.025;
    const parallaxY = height / 2 - focusY * 0.025;

    p.push();
    p.imageMode(p.CENTER);
    p.tint(255, 36);
    p.image(assets.space, parallaxX, parallaxY, width * 1.34, height * 1.34);
    p.noTint();
    p.pop();
  }

  private drawBullet(
    p: p5,
    bullet: MatchSnapshotPayload["bullets"][number],
    isLocalBullet: boolean
  ) {
    p.push();
    p.noStroke();
    if (isLocalBullet) {
      p.fill(255, 240, 230, 245);
    } else {
      p.fill(255, 181, 118, 240);
    }
    p.circle(bullet.x, bullet.y, 12);
    p.pop();
  }

  private drawCenterCard(
    p: p5,
    title: string,
    subtitle: string,
    cardHeight = 224
  ) {
    const cardWidth = Math.min(540, width - 40);
    const cardX = width / 2 - cardWidth / 2;
    const cardY = height / 2 - cardHeight / 2;

    p.push();
    p.rectMode(p.CORNER);
    p.noStroke();
    p.fill(5, 14, 28, 228);
    p.rect(cardX, cardY, cardWidth, cardHeight, 24);
    p.stroke(116, 204, 245, 122);
    p.strokeWeight(1.4);
    p.noFill();
    p.rect(cardX, cardY, cardWidth, cardHeight, 24);

    p.noStroke();
    p.fill(241, 247, 252);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text(title, width / 2, cardY + 58);

    p.fill(196, 216, 231);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.textLeading(24);
    p.text(subtitle, cardX + 36, cardY + 102, cardWidth - 72, cardHeight - 132);
    p.pop();
  }

  private drawMatchFoundOverlay(p: p5, match: ActiveMatchState) {
    const remainingCountdownMs =
      match.snapshot?.countdownMs ??
      Math.max(0, MATCH_COUNTDOWN_MS - (performance.now() - match.foundAt));
    const progress = 1 - remainingCountdownMs / MATCH_COUNTDOWN_MS;
    const countdownValue = Math.max(
      1,
      Math.min(3, Math.ceil(remainingCountdownMs / 1000))
    );
    const cardWidth = Math.min(560, width - 40);
    const cardHeight = 244;
    const cardX = width / 2 - cardWidth / 2;
    const cardY = height / 2 - cardHeight / 2;
    const barX = cardX + 48;
    const barY = cardY + 170;
    const barWidth = cardWidth - 96;
    const barHeight = 14;

    p.push();
    p.rectMode(p.CORNER);
    p.noStroke();
    p.fill(6, 13, 25, 170);
    p.rect(0, 0, width, height);

    p.fill(5, 14, 28, 234);
    p.rect(cardX, cardY, cardWidth, cardHeight, 24);
    p.stroke(116, 204, 245, 122);
    p.strokeWeight(1.4);
    p.noFill();
    p.rect(cardX, cardY, cardWidth, cardHeight, 24);

    p.noStroke();
    p.fill(241, 247, 252);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("Another pilot found", width / 2, cardY + 58);

    p.fill(196, 216, 231);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.textLeading(24);
    p.text(
      "Get ready. Stabilizing the arena link and preparing both ships for launch.",
      cardX + 36,
      cardY + 98,
      cardWidth - 72,
      58
    );

    p.noStroke();
    p.fill(12, 28, 46, 220);
    p.rect(barX, barY, barWidth, barHeight, 999);
    p.fill(104, 197, 244, 220);
    p.rect(barX, barY, barWidth * Math.max(0, Math.min(1, progress)), barHeight, 999);

    p.fill(180, 207, 224, 188);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(13);
    p.text(`Launch sequence • ${countdownValue}`, width / 2, barY + 24);
    p.pop();
  }

  private drawHeartCollectible(
    p: p5,
    heart: ReturnType<typeof getHeartsInBounds>[number],
    highlighted: boolean
  ) {
    p.push();
    p.imageMode(p.CENTER);

    if (highlighted) {
      p.noStroke();
      p.fill(255, 196, 214, 48);
      p.circle(heart.x, heart.y, heart.size * 1.35);
    }

    p.noStroke();
    p.fill(255);
    p.ellipse(heart.x, heart.y, heart.size, heart.size);
    p.image(assets.heart, heart.x, heart.y, heart.size / 1.5, heart.size / 1.5);
    p.pop();
  }

  private drawHealthHud(
    p: p5,
    label: string,
    health: number,
    maxHealth: number,
    align: "left" | "right"
  ) {
    const heartSize = getHudHeartSize();
    const heartGap = heartSize * 0.08;
    const top = getHudHeartTopLeft(0).y;
    const labelY = Math.max(8, top - 18);

    p.push();
    if (label.trim().length > 0) {
      p.textSize(12);
      p.noStroke();
      p.fill(212, 224, 235, 178);

      if (align === "left") {
        p.textAlign(p.LEFT, p.TOP);
        p.text(label, getHudHeartTopLeft(0).x, labelY);
      } else {
        p.textAlign(p.RIGHT, p.TOP);
        p.text(label, width - getHudHeartTopLeft(0).x, labelY);
      }
    }

    for (let i = 0; i < maxHealth; i++) {
      const x =
        align === "left"
          ? getHudHeartTopLeft(i).x
          : width - getHudHeartTopLeft(0).x - heartSize - i * (heartSize + heartGap);

      if (i < health) {
        p.image(assets.heart, x, top, heartSize, heartSize);
        continue;
      }

      drawHeartOutline(p, x, top, heartSize);
    }

    p.pop();
  }

  private drawHint(p: p5, text: string) {
    if (isMobileDevice()) {
      return;
    }

    p.fill(200, 220, 232, 160);
    p.noStroke();
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(13);
    p.text("Multiplayer mode", width - 24, height - 42);
    p.fill(170, 198, 214, 150);
    p.textSize(12);
    p.text(text, width - 24, height - 22);
  }

  private drawMatchWorld(p: p5, match: ActiveMatchState) {
    if (match.snapshot === null) {
      return;
    }

    const predictedTicks = Math.min(
      4,
      (performance.now() - match.snapshotReceivedAt) / SNAPSHOT_TICK_MS
    );
    const renderedBullets = match.snapshot.bullets.map((bullet) => {
      return projectBulletSnapshot(bullet, predictedTicks);
    });

    const selfPlayer: MatchPlayerSnapshot | null =
      this.getPredictedSelfSnapshot(match)
      ?? match.snapshot.players.find((player) => player.id === match.playerId)
      ?? null;

    const opponentSnapshot =
      match.snapshot.players.find((player) => player.id === match.opponentId) ?? null;
    const opponentPlayer = opponentSnapshot !== null
      ? projectPlayerSnapshot(opponentSnapshot, predictedTicks, match.arena)
      : null;

    const renderedPlayers: MatchPlayerSnapshot[] = [];
    if (selfPlayer !== null) renderedPlayers.push(selfPlayer);
    if (opponentPlayer !== null) renderedPlayers.push(opponentPlayer);

    if (selfPlayer === null) {
      this.drawBackdrop(p);
      this.drawCenterCard(
        p,
        "Waiting for own ship",
        "The shared simulation is live, but the latest player snapshot has not arrived yet."
      );
      return;
    }

    const cameraBounds = createCameraBounds(
      selfPlayer.x,
      selfPlayer.y,
      WORLD_CULL_PADDING
    );
    const selfCollider = this.getPlayerCollider(selfPlayer);
    const visibleAsteroids = getAsteroidsInBounds(match.world, cameraBounds, match.arena);
    const visibleHearts = getHeartsInBounds(match.world, cameraBounds, match.arena);
    const visibleAmmoPackets = getAmmoPacketsInBounds(
      match.world,
      cameraBounds,
      match.arena
    );

    const collidingHeartIds = new Set(
      getNearbyHearts(
        match.world,
        selfPlayer.x,
        selfPlayer.y,
        getShipCollisionBoundingDiameter(selfPlayer.shipVariant),
        match.arena
      )
        .filter((heart) => {
          return circleOverlapsShipCollider(
            heart.x,
            heart.y,
            heart.size,
            selfCollider
          );
        })
        .map((heart) => heart.id)
    );

    const collidingAmmoIds = new Set(
      getNearbyAmmoPackets(
        match.world,
        selfPlayer.x,
        selfPlayer.y,
        getShipCollisionBoundingDiameter(selfPlayer.shipVariant),
        match.arena
      )
        .filter((ammoPacket) => {
          return circleOverlapsShipCollider(
            ammoPacket.x,
            ammoPacket.y,
            ammoPacket.size,
            selfCollider
          );
        })
        .map((ammoPacket) => ammoPacket.id)
    );

    this.drawBackdrop(p, selfPlayer.x, selfPlayer.y);

    p.push();
    p.translate(-selfPlayer.x, -selfPlayer.y);
    p.translate(width / 2, height / 2);
    this.drawWorldBorder(p, match.arena);

    for (let heartIndex = 0; heartIndex < visibleHearts.length; heartIndex++) {
      this.drawHeartCollectible(
        p,
        visibleHearts[heartIndex],
        collidingHeartIds.has(visibleHearts[heartIndex].id)
      );
    }

    for (
      let ammoPacketIndex = 0;
      ammoPacketIndex < visibleAmmoPackets.length;
      ammoPacketIndex++
    ) {
      this.drawAmmoCollectible(
        p,
        visibleAmmoPackets[ammoPacketIndex],
        collidingAmmoIds.has(visibleAmmoPackets[ammoPacketIndex].id)
      );
    }

    this.collisionExplosions?.run(cameraBounds);
    this.shipDebrisEffects?.run(cameraBounds);

    for (let asteroidIndex = 0; asteroidIndex < visibleAsteroids.length; asteroidIndex++) {
      this.drawAsteroid(
        p,
        visibleAsteroids[asteroidIndex],
        match.snapshot.sequence + predictedTicks
      );
    }

    this.drawThrusters(p, renderedPlayers, match.playerId);

    for (let bulletIndex = 0; bulletIndex < renderedBullets.length; bulletIndex++) {
      const bullet = renderedBullets[bulletIndex];
      if (!circleIntersectsBounds(bullet.x, bullet.y, BULLET_DIAMETER, cameraBounds)) {
        continue;
      }
      this.drawBullet(p, bullet, bullet.ownerId === match.playerId);
    }

    this.drawPlayerArrivalPortals(p, renderedPlayers);

    for (let playerIndex = 0; playerIndex < renderedPlayers.length; playerIndex++) {
      this.drawShip(
        p,
        renderedPlayers[playerIndex],
        renderedPlayers[playerIndex].id === match.playerId
      );
    }

    if (getGameState().settings.collisionDebugEnabled && isCollisionDebugAvailable()) {
      this.drawCollisionDebug(
        p,
        renderedPlayers,
        renderedBullets,
        visibleAsteroids,
        visibleHearts,
        visibleAmmoPackets
      );
    }

    p.pop();

    this.drawHealthHud(p, "", selfPlayer.health, match.maxHealth, "left");
    this.drawAmmoHud(p, selfPlayer.ammo);
    this.drawAmmoHudEffects(p);
    this.drawRadarHud(p, selfPlayer, opponentPlayer, match.arena);
  }

  private drawQueueState(p: p5) {
    if (this.viewState.status === "error" && this.viewState.errorMessage !== null) {
      this.drawCenterCard(p, "Matchmaking offline", this.viewState.errorMessage);
      return;
    }

    if (this.viewState.status === "connecting") {
      this.drawCenterCard(
        p,
        "Connecting to matchmaking",
        "Reaching the battle server and preparing the multiplayer queue."
      );
      return;
    }

    const title = "Waiting for other player";
    const subtitle =
      this.viewState.queuePosition > 0
        ? `Queue ${this.viewState.queuePosition}/${this.viewState.queueSize}. Starting the duel as soon as another pilot joins.`
        : "Joining the multiplayer queue now. Starting the duel as soon as another pilot joins.";

    this.drawCenterCard(p, title, subtitle);
  }

  private drawRadarHud(
    p: p5,
    selfPlayer: MatchPlayerSnapshot,
    opponentPlayer: MatchPlayerSnapshot | null,
    arena: MatchFoundPayload["arena"]
  ) {
    const panelWidth = Math.min(248, Math.max(208, width * 0.22));
    const panelPadding = 12;
    const mapWidth = panelWidth - panelPadding * 2;
    const mapHeight = mapWidth * (arena.height / arena.width);
    const panelHeight = mapHeight + panelPadding * 2;
    const panelX = width - panelWidth - 20;
    const panelY = 98;
    const mapX = panelX + panelPadding;
    const mapY = panelY + panelPadding;

    const toMapX = (worldX: number) => {
      return mapX + ((worldX + arena.width / 2) / arena.width) * mapWidth;
    };
    const toMapY = (worldY: number) => {
      return mapY + ((worldY + arena.height / 2) / arena.height) * mapHeight;
    };

    p.push();
    p.rectMode(p.CORNER);
    p.noStroke();
    p.fill(10, 23, 39, 220);
    p.rect(panelX, panelY, panelWidth, panelHeight, 18);
    p.stroke(103, 201, 242, 110);
    p.strokeWeight(1.2);
    p.noFill();
    p.rect(panelX, panelY, panelWidth, panelHeight, 18);

    p.fill(5, 15, 28, 205);
    p.rect(mapX, mapY, mapWidth, mapHeight, 14);
    p.stroke(103, 201, 242, 88);
    p.strokeWeight(1);
    p.noFill();
    p.rect(mapX, mapY, mapWidth, mapHeight, 14);

    const selfMapX = toMapX(selfPlayer.x);
    const selfMapY = toMapY(selfPlayer.y);
    p.noStroke();
    p.fill(121, 220, 255, 235);
    p.circle(selfMapX, selfMapY, 9);

    if (opponentPlayer !== null) {
      const opponentMapX = toMapX(opponentPlayer.x);
      const opponentMapY = toMapY(opponentPlayer.y);

      p.noStroke();
      p.fill(218, 228, 237, 228);
      p.circle(opponentMapX, opponentMapY, 9);
    }
    p.pop();
  }

  private drawShip(
    p: p5,
    player: MatchPlayerSnapshot,
    _isSelf: boolean
  ) {
    const destruction = this.playerDestructions.get(player.id);
    const destructionProgress =
      destruction === undefined
        ? null
        : Math.min(
            1,
            (performance.now() - destruction.startedAt) / SHIP_DESTRUCTION_DURATION_MS
          );

    if (destructionProgress === 1) {
      return;
    }

    const baseRecoveryAlpha =
      player.damageRecoveryTicks > 0
        ? Math.floor(player.damageRecoveryTicks / 3) % 2 === 0
          ? 170
          : 105
        : 255;
    const recoveryAlpha =
      destructionProgress === null
        ? baseRecoveryAlpha
        : p.lerp(baseRecoveryAlpha, 0, destructionProgress);
    const arrivalProgress = this.getPlayerArrivalProgress(player.id);
    const arrivalReveal =
      arrivalProgress === null
        ? 1
        : 1 - Math.pow(1 - arrivalProgress, 3);
    const arrivalAlpha =
      arrivalProgress === null ? 255 : p.lerp(0, 255, arrivalReveal);
    const shipScale =
      destructionProgress === null
        ? 1
        : p.lerp(1, 0.32, destructionProgress);
    const arrivalScale =
      arrivalProgress === null ? 1 : p.lerp(0.56, 1.04, arrivalReveal);

    p.push();
    p.translate(player.x, player.y);
    p.angleMode(p.RADIANS);
    p.rotate(player.angle);
    p.scale(shipScale * arrivalScale);
    p.imageMode(p.CENTER);
    p.rotate(p.PI / 2);
    p.tint(255, Math.min(recoveryAlpha, arrivalAlpha));
    p.image(this.getShipAsset(player.shipVariant), 0, 0, SHIP_WIDTH, SHIP_HEIGHT);
    p.noTint();
    p.pop();
  }

  private drawCollisionDebug(
    p: p5,
    players: MatchPlayerSnapshot[],
    bullets: MatchSnapshotPayload["bullets"],
    asteroids: ReturnType<typeof getAsteroidsInBounds>,
    hearts: ReturnType<typeof getHeartsInBounds>,
    ammoPackets: ReturnType<typeof getAmmoPacketsInBounds>
  ) {
    for (let i = 0; i < asteroids.length; i++) {
      drawCollisionCircle(p, asteroids[i].x, asteroids[i].y, asteroids[i].size);
    }

    for (let i = 0; i < hearts.length; i++) {
      drawCollisionCircle(p, hearts[i].x, hearts[i].y, hearts[i].size);
    }

    for (let i = 0; i < ammoPackets.length; i++) {
      drawCollisionCircle(p, ammoPackets[i].x, ammoPackets[i].y, ammoPackets[i].size);
    }

    for (let i = 0; i < bullets.length; i++) {
      drawCollisionCircle(p, bullets[i].x, bullets[i].y, BULLET_DIAMETER);
    }

    for (let i = 0; i < players.length; i++) {
      drawShipCollisionBox(p, this.getPlayerCollider(players[i]));
    }
  }

  private getShipAsset(shipVariant: ShipVariant) {
    return assets.multiplayerShips[shipVariant] ?? assets.raceShip;
  }

  private drawPlayerArrivalPortals(p: p5, players: MatchPlayerSnapshot[]) {
    for (let i = 0; i < players.length; i++) {
      const arrivalProgress = this.getPlayerArrivalProgress(players[i].id);
      if (arrivalProgress === null || arrivalProgress >= 1) {
        continue;
      }

      const easedProgress = 1 - Math.pow(1 - arrivalProgress, 2);
      const portalSize = p.lerp(108, 42, easedProgress);
      const portalAlpha = p.lerp(210, 0, easedProgress);

      p.push();
      p.noStroke();
      p.fill(92, 214, 255, portalAlpha * 0.14);
      p.circle(players[i].x, players[i].y, portalSize * 1.2);
      p.fill(255, 255, 255, portalAlpha * 0.08);
      p.circle(players[i].x, players[i].y, portalSize * 0.68);
      p.noFill();
      p.stroke(92, 214, 255, portalAlpha);
      p.strokeWeight(2.4);
      p.circle(players[i].x, players[i].y, portalSize);
      p.stroke(214, 246, 255, portalAlpha * 0.7);
      p.strokeWeight(1.4);
      p.circle(players[i].x, players[i].y, portalSize * 0.76);
      p.pop();
    }

    this.prunePlayerArrivals();
  }

  private getPlayerCollider(player: MatchPlayerSnapshot): ShipCollider {
    return getShipCollider(player.x, player.y, player.angle, player.shipVariant);
  }

  private getPlayerArrivalProgress(playerId: string) {
    const arrival = this.playerArrivals.get(playerId);
    if (arrival === undefined) {
      return null;
    }

    return Math.min(
      1,
      (performance.now() - arrival.startedAt) / SHIP_ARRIVAL_DURATION_MS
    );
  }

  private prunePlayerArrivals() {
    this.playerArrivals.forEach((arrival, playerId) => {
      if (
        performance.now() - arrival.startedAt >= SHIP_ARRIVAL_DURATION_MS
      ) {
        this.playerArrivals.delete(playerId);
      }
    });
  }

  private triggerPlayerArrivals(players: MatchPlayerSnapshot[]) {
    const startedAt = performance.now();
    for (let i = 0; i < players.length; i++) {
      this.playerArrivals.set(players[i].id, { startedAt });
    }
  }

  private drawThrusters(
    p: p5,
    players: MatchPlayerSnapshot[],
    localPlayerId: string
  ) {
    const activePlayerIds = new Set<string>();

    for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
      const player = players[playerIndex];
      activePlayerIds.add(player.id);

      let thruster = this.thrusters.get(player.id);
      if (thruster === undefined) {
        thruster = new ThrusterExhaustSystem(
          p,
          p.createVector(player.x, player.y),
          player.angle - p.PI
        );
        this.thrusters.set(player.id, thruster);
      }

      const exhaustPos = p5.Vector.add(
        p.createVector(player.x, player.y),
        p5.Vector.fromAngle(player.angle - p.PI, SHIP_WIDTH * 0.94)
      );
      thruster.updatePos(exhaustPos, player.angle - p.PI);

      if (player.thrusting) {
        thruster.fire(player.id === localPlayerId ? 8 : 5);
      }

      thruster.run();
    }

    Array.from(this.thrusters.keys()).forEach((playerId) => {
      if (!activePlayerIds.has(playerId)) {
        this.thrusters.delete(playerId);
      }
    });
  }

  private drawWorldBorder(p: p5, arena: MatchFoundPayload["arena"]) {
    p.push();
    p.rectMode(p.CORNER);
    p.noFill();
    p.stroke(255, 255, 255, 230);
    p.strokeWeight(1.5);
    p.rect(-arena.width / 2, -arena.height / 2, arena.width, arena.height);
    p.pop();
  }

  private enterMode() {
    this.resetViewState();
    this.viewState.status = "connecting";
    this.lastSentAt = 0;
    this.lastSentInput = {
      fire: false,
      inputSeq: 0,
      thrust: false,
      turnLeft: false,
      turnRight: false,
    };
    void this.fetchRuntimeConfig();
    this.connectSocket();
  }

  private isMultiplayerModeActive() {
    const state = getGameState();
    return state.scene.type === "mode" && state.scene.mode === "multiplayer";
  }

  private async joinQueue(socketId: string) {
    try {
      const state = getGameState();
      await trpcClient.multiplayer.joinQueue.mutate({
        socketId,
        shipVariant: state.settings.shipVariant,
      });
    } catch (_error) {
      if (!this.isMultiplayerModeActive()) {
        return;
      }

      this.viewState.errorMessage =
        "Unable to enter matchmaking through the typed control plane.";
      this.viewState.status = "error";
    }
  }

  private leaveMode() {
    this.isLeavingMode = true;
    clearShipInput();

    if (this.socket !== null) {
      if (this.socket.connected && this.socket.id !== undefined) {
        void trpcClient.multiplayer.leaveQueue
          .mutate({ socketId: this.socket.id })
          .catch(() => {
            // Best-effort shutdown.
          });
      }
      this.socket.disconnect();
    }

    this.resetViewState();
    this.lastSentAt = 0;
    this.lastSentInput = {
      fire: false,
      inputSeq: 0,
      thrust: false,
      turnLeft: false,
      turnRight: false,
    };
    this.isLeavingMode = false;
  }

  private playSnapshotEffects(
    previousSnapshot: MatchSnapshotPayload,
    nextSnapshot: MatchSnapshotPayload
  ) {
    const previousPlayers = new Map<string, MatchPlayerSnapshot>();
    for (let i = 0; i < previousSnapshot.players.length; i++) {
      const player = previousSnapshot.players[i];
      previousPlayers.set(player.id, player);
    }

    for (let i = 0; i < nextSnapshot.players.length; i++) {
      const nextPlayer = nextSnapshot.players[i];
      const previousPlayer = previousPlayers.get(nextPlayer.id);

      if (nextPlayer.health > 0) {
        this.playerDestructions.delete(nextPlayer.id);
      }

      if (
        previousPlayer === undefined ||
        nextPlayer.health >= previousPlayer.health ||
        nextPlayer.health > 0
      ) {
        continue;
      }

      this.createShipDestruction(nextPlayer);
    }
  }

  private playWorldEventEffects(match: ActiveMatchState, events: WorldEvent[]) {
    const localPlayer =
      match.snapshot?.players.find((player) => player.id === match.playerId) ?? null;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.type === "asteroid-removed") {
        const asteroid = match.world.asteroids.get(event.asteroidId);
        if (asteroid !== undefined) {
          this.createCollisionExplosion(asteroid.x, asteroid.y);
        }
        continue;
      }

      if (
        event.type === "ammo-removed" &&
        localPlayer !== null &&
        localPlayer.ammo < PLAYER_MAX_AMMO
      ) {
        const ammoPacket = match.world.ammunitionPackets.get(event.ammoId);
        if (
          ammoPacket !== undefined &&
          circleOverlapsShipCollider(
            ammoPacket.x,
            ammoPacket.y,
            ammoPacket.size,
            this.getPlayerCollider(localPlayer)
          )
        ) {
          this.createAmmoPickupEffect(
            ammoPacket.x,
            ammoPacket.y,
            localPlayer.x,
            localPlayer.y
          );
        }
      }
    }
  }

  private pushLatestInput() {
    const state = getGameState();
    if (
      state.scene.type !== "mode" ||
      state.scene.mode !== "multiplayer" ||
      this.socket === null ||
      !this.socket.connected ||
      this.viewState.match === null
    ) {
      return;
    }

    const nextInput = state.overlay === null
      ? {
          fire: isShipActionActive("fire"),
          inputSeq: 0,
          thrust: isShipActionActive("thrust"),
          turnLeft: isShipActionActive("turnLeft"),
          turnRight: isShipActionActive("turnRight"),
        }
      : {
          fire: false,
          inputSeq: 0,
          thrust: false,
          turnLeft: false,
          turnRight: false,
        };

    const now = performance.now();
    const inputChanged = !sameInputState(nextInput, this.lastSentInput);
    if (!inputChanged && now - this.lastSentAt < this.inputPushIntervalMs) {
      return;
    }

    const seq = ++this.inputSeqCounter;
    nextInput.inputSeq = seq;

    // Buffer for replay during server reconciliation
    this.inputBuffer.push({ seq, input: nextInput });
    if (this.inputBuffer.length > 120) {
      this.inputBuffer.shift();
    }

    this.socket.emit("match:input", nextInput);
    this.lastSentInput = nextInput;
    this.lastSentAt = now;
  }

  private reconcilePredictedSelf(serverState: MatchPlayerSnapshot, arena: ActiveMatchState["arena"]) {
    // Accept authoritative server state as base
    this.predictedSelf = { ...serverState, fireCooldownTicks: 0 };

    // Discard inputs the server has already processed
    this.inputBuffer = this.inputBuffer.filter(
      (entry) => entry.seq > serverState.lastInputSeq
    );

    // Replay unacknowledged inputs on top of server state.
    // The server applies one input per tick — each buffered entry
    // corresponds to one server tick worth of simulation.
    for (const entry of this.inputBuffer) {
      if (this.predictedSelf.health > 0) {
        stepPlayerState(this.predictedSelf, entry.input, arena);
      }
    }
  }

  private getPredictedSelfSnapshot(match: ActiveMatchState): MatchPlayerSnapshot | null {
    if (this.predictedSelf === null) {
      return null;
    }

    // Extrapolate from the reconciled state using current velocity
    // to cover the time between the last reconciliation and now.
    // This is purely visual — the actual predicted state only advances
    // during reconciliation replay.
    const ticksSinceSnapshot =
      (performance.now() - match.snapshotReceivedAt) / SNAPSHOT_TICK_MS;
    // Only extrapolate for the fraction of a tick since reconciliation,
    // capped to avoid over-shooting between snapshots.
    const extrapolateTicks = Math.min(ticksSinceSnapshot, 3);

    return projectPlayerSnapshot(this.predictedSelf, extrapolateTicks, match.arena);
  }

  private clearPendingResult() {
    this.pendingResult = null;
  }

  private resetClientEffects() {
    this.predictedSelf = null;
    this.inputBuffer = [];
    this.inputSeqCounter = 0;
    this.ammoHudEffects = [];
    this.playerArrivals.clear();
    this.playerDestructions.clear();
    this.thrusters.clear();

    if (this.p === null) {
      this.collisionExplosions = null;
      this.shipDebrisEffects = null;
      return;
    }

    this.collisionExplosions = new ExplosionSystem(this.p);
    this.shipDebrisEffects = new ShipDebrisSystem(this.p);
  }

  private resetViewState() {
    this.clearPendingResult();
    this.viewState = createInitialViewState();
    this.resetClientEffects();
  }
}

const multiplayerClientSession = new MultiplayerClientSession();

export const initializeMultiplayerSession = (p: p5) => {
  multiplayerClientSession.initialize(p);
};

export const drawMultiplayerMode = (p: p5) => {
  multiplayerClientSession.draw(p);
};
