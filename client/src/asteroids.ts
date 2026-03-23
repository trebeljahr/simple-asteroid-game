import p5, { Image, Vector } from "p5";
import { v4 } from "uuid";

import { goals } from "./goals";
import { Mover } from "./mover";
import { player } from "./player";
import { assets } from "./sketch";
import {
  boardSizeX,
  boardSizeY,
  CameraBounds,
  circleIntersectsBounds,
  distSquare,
} from "./utils";

interface SpawnSlot {
  gridColumn: number;
  gridRow: number;
  key: string;
  x: number;
  y: number;
}

interface SlotLayoutOptions {
  goalSafeRadius: number;
  keepGoalColumnOpen: boolean;
  keepPlayerRowOpen: boolean;
  playerSafeRadius: number;
}

const MAX_SPAWN_SLOT_FACTOR = 1.45;
const MIN_ASTEROID_SIZE = 64;
const MIN_CELL_SIZE = 190;
const SLOT_CONTENT_PADDING = 56;
const SPAWN_QUERY_PADDING = 48;

export let asteroids = {} as Asteroids;
export const resetAsteroids = (p: p5) => {
  asteroids = new Asteroids(p);
};

export const maxAsteroids = 100;
export const maxAsteroidSize = 190;

const createGridKey = (gridColumn: number, gridRow: number) => {
  return `${gridColumn}:${gridRow}`;
};

const clampGridValue = (value: number, maxValue: number) => {
  return Math.max(0, Math.min(maxValue, value));
};

const shuffle = <T>(p: p5, values: T[]) => {
  const nextValues = values.slice();
  for (let i = nextValues.length - 1; i > 0; i--) {
    const swapIndex = Math.floor(p.random(i + 1));
    const currentValue = nextValues[i];
    nextValues[i] = nextValues[swapIndex];
    nextValues[swapIndex] = currentValue;
  }
  return nextValues;
};

class Asteroids {
  asteroids: Asteroid[];
  asteroidIndexByGridKey: Map<string, number>;
  cellSize: number;
  gridColumns: number;
  gridLeftEdge: number;
  gridRows: number;
  gridTopEdge: number;
  maxSpawnJitter: number;
  p: p5;
  occupiedSlotIndices: Set<number>;
  spawnSlots: SpawnSlot[];

  constructor(p: p5) {
    this.p = p;
    this.asteroids = [];
    this.asteroidIndexByGridKey = new Map<string, number>();
    this.occupiedSlotIndices = new Set<number>();
    this.spawnSlots = [];

    this.cellSize = this.computeCellSize();
    this.gridColumns = Math.max(
      1,
      Math.floor((boardSizeX * 2) / this.cellSize)
    );
    this.gridRows = Math.max(1, Math.floor((boardSizeY * 2) / this.cellSize));
    this.gridLeftEdge = -(this.gridColumns * this.cellSize) / 2;
    this.gridTopEdge = -(this.gridRows * this.cellSize) / 2;
    this.maxSpawnJitter = Math.max(12, Math.floor(this.cellSize * 0.08));
    this.spawnSlots = this.createSpawnSlots();

    this.ensureAsteroidCount();
  }

  computeCellSize() {
    const worldWidth = boardSizeX * 2;
    const worldHeight = boardSizeY * 2;
    const targetSlotCount = maxAsteroids * MAX_SPAWN_SLOT_FACTOR;
    return Math.max(
      MIN_CELL_SIZE,
      Math.floor(Math.sqrt((worldWidth * worldHeight) / targetSlotCount))
    );
  }

  createSpawnSlots() {
    const playerPosition = player.enginePlayer.position;
    const goalPosition = goals.goal?.pos;

    const layouts: SlotLayoutOptions[] = [
      {
        keepPlayerRowOpen: true,
        keepGoalColumnOpen: true,
        playerSafeRadius: Math.max(this.cellSize * 1.25, 260),
        goalSafeRadius: Math.max(this.cellSize * 0.8, 180),
      },
      {
        keepPlayerRowOpen: true,
        keepGoalColumnOpen: false,
        playerSafeRadius: Math.max(this.cellSize * 1.1, 240),
        goalSafeRadius: Math.max(this.cellSize * 0.65, 160),
      },
      {
        keepPlayerRowOpen: false,
        keepGoalColumnOpen: false,
        playerSafeRadius: Math.max(this.cellSize, 220),
        goalSafeRadius: Math.max(this.cellSize * 0.5, 140),
      },
    ];

    for (let i = 0; i < layouts.length; i++) {
      const slots = this.buildSpawnSlots(
        playerPosition.x,
        playerPosition.y,
        goalPosition?.x ?? null,
        goalPosition?.y ?? null,
        layouts[i]
      );
      if (slots.length >= maxAsteroids) {
        return shuffle(this.p, slots);
      }
    }

    return shuffle(
      this.p,
      this.buildSpawnSlots(
        playerPosition.x,
        playerPosition.y,
        goalPosition?.x ?? null,
        goalPosition?.y ?? null,
        {
          keepPlayerRowOpen: false,
          keepGoalColumnOpen: false,
          playerSafeRadius: Math.max(this.cellSize * 0.9, 180),
          goalSafeRadius: 0,
        }
      )
    );
  }

  buildSpawnSlots(
    playerX: number,
    playerY: number,
    goalX: number | null,
    goalY: number | null,
    layout: SlotLayoutOptions
  ) {
    const playerGridRow = this.gridRowFor(playerY);
    const goalGridColumn = goalX === null ? null : this.gridColumnFor(goalX);
    const slots: SpawnSlot[] = [];

    for (let gridRow = 0; gridRow < this.gridRows; gridRow++) {
      for (let gridColumn = 0; gridColumn < this.gridColumns; gridColumn++) {
        if (layout.keepPlayerRowOpen && gridRow === playerGridRow) {
          continue;
        }
        if (
          layout.keepGoalColumnOpen &&
          goalGridColumn !== null &&
          gridColumn === goalGridColumn
        ) {
          continue;
        }

        const x = this.gridLeftEdge + gridColumn * this.cellSize + this.cellSize / 2;
        const y = this.gridTopEdge + gridRow * this.cellSize + this.cellSize / 2;

        if (
          distSquare(x, y, playerX, playerY) <
          layout.playerSafeRadius * layout.playerSafeRadius
        ) {
          continue;
        }

        if (
          goalX !== null &&
          goalY !== null &&
          layout.goalSafeRadius > 0 &&
          distSquare(x, y, goalX, goalY) <
            layout.goalSafeRadius * layout.goalSafeRadius
        ) {
          continue;
        }

        slots.push({
          gridColumn,
          gridRow,
          key: createGridKey(gridColumn, gridRow),
          x,
          y,
        });
      }
    }

    return slots;
  }

  gridColumnFor(x: number) {
    return clampGridValue(
      Math.floor((x - this.gridLeftEdge) / this.cellSize),
      this.gridColumns - 1
    );
  }

  gridRowFor(y: number) {
    return clampGridValue(
      Math.floor((y - this.gridTopEdge) / this.cellSize),
      this.gridRows - 1
    );
  }

  pickOpenSlotIndex() {
    const openSlotIndices: number[] = [];

    for (let i = 0; i < this.spawnSlots.length; i++) {
      if (!this.occupiedSlotIndices.has(i)) {
        openSlotIndices.push(i);
      }
    }

    if (openSlotIndices.length === 0) {
      return null;
    }

    return this.p.random(openSlotIndices) as number;
  }

  createAsteroidForSlot(slotIndex: number) {
    const slot = this.spawnSlots[slotIndex];
    const maxSize = Math.max(
      MIN_ASTEROID_SIZE + 24,
      Math.min(maxAsteroidSize, this.cellSize - SLOT_CONTENT_PADDING)
    );
    const minSize = Math.min(MIN_ASTEROID_SIZE, maxSize - 18);
    const size = this.p.random(minSize, maxSize);
    const jitterLimit = Math.max(
      0,
      Math.min(this.maxSpawnJitter, (this.cellSize - size - 24) / 2)
    );
    const pos = this.p.createVector(
      slot.x + this.p.random(-jitterLimit, jitterLimit),
      slot.y + this.p.random(-jitterLimit, jitterLimit)
    );
    const vel = this.p.createVector(0, 0);
    const hitPoints = Math.round(size * 10);

    return new Asteroid(this.p, pos, vel, size, hitPoints, slotIndex, slot.key);
  }

  assignAsteroidToSlot(index: number, asteroid: Asteroid) {
    this.occupiedSlotIndices.add(asteroid.slotIndex);
    this.asteroidIndexByGridKey.set(asteroid.slotKey, index);
  }

  createNewAsteroid() {
    const slotIndex = this.pickOpenSlotIndex();
    if (slotIndex === null) {
      return null;
    }
    return this.createAsteroidForSlot(slotIndex);
  }

  ensureAsteroidCount() {
    while (this.asteroids.length < maxAsteroids) {
      const asteroid = this.createNewAsteroid();
      if (asteroid === null) {
        return;
      }
      const asteroidIndex = this.asteroids.length;
      this.asteroids.push(asteroid);
      this.assignAsteroidToSlot(asteroidIndex, asteroid);
    }
  }

  run(cameraBounds: CameraBounds) {
    this.ensureAsteroidCount();

    for (let i = 0; i < this.asteroids.length; i++) {
      const asteroid = this.asteroids[i];
      if (
        !circleIntersectsBounds(
          asteroid.pos.x,
          asteroid.pos.y,
          asteroid.size,
          cameraBounds
        )
      ) {
        continue;
      }
      asteroid.draw();
    }
  }

  queryNearby(x: number, y: number, radius: number) {
    const candidateIndices: number[] = [];
    const searchPadding = radius + maxAsteroidSize / 2 + SPAWN_QUERY_PADDING;
    const minColumn = this.gridColumnFor(x - searchPadding);
    const maxColumn = this.gridColumnFor(x + searchPadding);
    const minRow = this.gridRowFor(y - searchPadding);
    const maxRow = this.gridRowFor(y + searchPadding);

    for (let gridRow = minRow; gridRow <= maxRow; gridRow++) {
      for (let gridColumn = minColumn; gridColumn <= maxColumn; gridColumn++) {
        const asteroidIndex = this.asteroidIndexByGridKey.get(
          createGridKey(gridColumn, gridRow)
        );
        if (asteroidIndex !== undefined) {
          candidateIndices.push(asteroidIndex);
        }
      }
    }

    return candidateIndices;
  }

  spawnNewAsteroid(indexToChange: number) {
    if (this.asteroids.length <= 0) {
      return;
    }

    const previousAsteroid = this.asteroids[indexToChange];
    this.occupiedSlotIndices.delete(previousAsteroid.slotIndex);
    this.asteroidIndexByGridKey.delete(previousAsteroid.slotKey);

    const replacement = this.createNewAsteroid();
    if (replacement === null) {
      this.assignAsteroidToSlot(indexToChange, previousAsteroid);
      return;
    }

    this.asteroids[indexToChange] = replacement;
    this.assignAsteroidToSlot(indexToChange, replacement);
  }
}

export class Asteroid extends Mover {
  baseRotation: number;
  hitPoints: number;
  id: string;
  img: Image;
  p: p5;
  slotIndex: number;
  slotKey: string;
  spinSpeed: number;

  constructor(
    p: p5,
    pos: Vector,
    vel: Vector,
    r: number,
    hitPoints: number,
    slotIndex: number,
    slotKey: string
  ) {
    super(p, pos, vel, r);
    this.p = p;
    this.hitPoints = hitPoints;
    this.img = p.random(assets.asteroids);
    this.baseRotation = p.random(p.TWO_PI);
    this.spinSpeed = p.random(-0.0045, 0.0045);
    this.slotIndex = slotIndex;
    this.slotKey = slotKey;
    this.id = v4();
  }

  draw() {
    this.p.push();
    this.p.imageMode(this.p.CENTER);
    this.p.translate(this.pos.x, this.pos.y);
    this.p.rotate(this.baseRotation + this.p.frameCount * this.spinSpeed);
    this.p.image(this.img, 0, 0, this.size, this.size);
    this.p.pop();
  }

  hit() {
    this.hitPoints--;
  }
}
