import p5 from "p5";
import { asteroids, maxAsteroidSize } from "./asteroids";
import { border } from "./border";
import { bullets } from "./bullets";
import { explosions } from "./explosions";
import { GameMode, getGameState, shouldAdvanceRaceSimulation } from "./gameState";
import { goals } from "./goals";
import { hearts, maxHeartSize } from "./hearts";
import { player, playerHitsCollectible } from "./player";
import { QuadTree, createQueryRange } from "./quadtree";
import { boardSizeX, boardSizeY, circlesOverlap, height, width } from "./utils";

const modeTitles: Record<GameMode, string> = {
  race: "Racing Mode",
  multiplayer: "Multiplayer Mode",
  horde: "Enemy Hordes Mode",
};

interface IndexedAsteroid {
  asteroidIndex: number;
}

interface IndexedHeart {
  heartIndex: number;
}

export const draw = (p: p5) => {
  const state = getGameState();
  if (state.scene.type === "mode" && state.scene.mode === "race") {
    if (!shouldAdvanceRaceSimulation(state)) {
      return;
    }
    p.clear();
    p.push();
    p.translate(-player.enginePlayer.position.x, -player.enginePlayer.position.y);
    p.translate(width / 2, height / 2);
    border.show();
    p.noStroke();
    player.run();
    gameLogic();
    p.pop();
    player.showHealth();
    drawHudHint(p, "Esc: menu", "Race mode");
    return;
  }

  p.clear();
  drawBackdrop(p);

  if (state.scene.type === "mode") {
    drawPlaceholderMode(p, state.scene.mode);
    return;
  }

  if (state.scene.type === "main-menu") {
    drawCenterMessage(
      p,
      "Choose a Mode",
      "The hangar menu is ready. Race mode is live and the next two modes are staged as placeholders."
    );
    return;
  }

  drawCenterMessage(p, state.scene.title, state.scene.subtitle);
};

function gameLogic() {
  bullets.update();
  hearts.run();
  explosions.run();
  asteroids.run();
  goals.run();

  const asteroidTree = buildAsteroidQuadTree();
  const replacedAsteroidIndices = new Set<number>();

  handlePlayerAsteroidCollisions(asteroidTree, replacedAsteroidIndices);
  handleBulletAsteroidCollisions(asteroidTree, replacedAsteroidIndices);
  handleHeartCollection();
}

function buildAsteroidQuadTree() {
  const asteroidTree = new QuadTree<IndexedAsteroid>(
    createQueryRange(0, 0, boardSizeX, boardSizeY),
    8
  );

  for (let i = 0; i < asteroids.asteroids.length; i++) {
    const asteroid = asteroids.asteroids[i];
    asteroidTree.insert({
      x: asteroid.pos.x,
      y: asteroid.pos.y,
      data: {
        asteroidIndex: i,
      },
    });
  }

  return asteroidTree;
}

function buildHeartQuadTree() {
  const heartTree = new QuadTree<IndexedHeart>(
    createQueryRange(0, 0, boardSizeX, boardSizeY),
    8
  );

  for (let i = 0; i < hearts.hearts.length; i++) {
    const heart = hearts.hearts[i];
    heartTree.insert({
      x: heart.pos.x,
      y: heart.pos.y,
      data: {
        heartIndex: i,
      },
    });
  }

  return heartTree;
}

function handlePlayerAsteroidCollisions(
  asteroidTree: QuadTree<IndexedAsteroid>,
  replacedAsteroidIndices: Set<number>
) {
  const nearbyAsteroids = asteroidTree.query(
    createQueryRange(
      player.enginePlayer.position.x,
      player.enginePlayer.position.y,
      player.size / 2 + maxAsteroidSize / 2,
      player.size / 2 + maxAsteroidSize / 2
    )
  );

  for (let i = 0; i < nearbyAsteroids.length; i++) {
    const asteroidIndex = nearbyAsteroids[i].data.asteroidIndex;
    if (replacedAsteroidIndices.has(asteroidIndex)) {
      continue;
    }
    const asteroid = asteroids.asteroids[asteroidIndex];
    if (
      circlesOverlap(
        asteroid.pos.x,
        asteroid.pos.y,
        asteroid.size,
        player.enginePlayer.position.x,
        player.enginePlayer.position.y,
        player.size
      )
    ) {
      player.damage();
      explosions.createExplosion(asteroid.pos);
      asteroids.spawnNewAsteroid(asteroidIndex);
      replacedAsteroidIndices.add(asteroidIndex);
    }
  }
}

function handleBulletAsteroidCollisions(
  asteroidTree: QuadTree<IndexedAsteroid>,
  replacedAsteroidIndices: Set<number>
) {
  for (let bulletIndex = bullets.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
    const bullet = bullets.bullets[bulletIndex];
    const nearbyAsteroids = asteroidTree.query(
      createQueryRange(
        bullet.pos.x,
        bullet.pos.y,
        bullet.size / 2 + maxAsteroidSize / 2,
        bullet.size / 2 + maxAsteroidSize / 2
      )
    );

    for (let i = 0; i < nearbyAsteroids.length; i++) {
      const asteroidIndex = nearbyAsteroids[i].data.asteroidIndex;
      if (replacedAsteroidIndices.has(asteroidIndex)) {
        continue;
      }
      const asteroid = asteroids.asteroids[asteroidIndex];
      if (
        circlesOverlap(
          asteroid.pos.x,
          asteroid.pos.y,
          asteroid.size,
          bullet.pos.x,
          bullet.pos.y,
          bullet.size
        )
      ) {
        asteroid.hit();
        if (asteroid.hitPoints <= 0) {
          asteroids.spawnNewAsteroid(asteroidIndex);
          replacedAsteroidIndices.add(asteroidIndex);
        }
        bullets.bullets.splice(bulletIndex, 1);
        break;
      }
    }
  }
}

function handleHeartCollection() {
  const nearbyHearts = buildHeartQuadTree().query(
    createQueryRange(
      player.enginePlayer.position.x,
      player.enginePlayer.position.y,
      player.size / 2 + maxHeartSize / 2,
      player.size / 2 + maxHeartSize / 2
    )
  );
  const collectedHeartIndices = new Set<number>();

  for (let i = 0; i < nearbyHearts.length; i++) {
    const heartIndex = nearbyHearts[i].data.heartIndex;
    if (collectedHeartIndices.has(heartIndex)) {
      continue;
    }
    const heart = hearts.hearts[heartIndex];
    if (playerHitsCollectible(heart, player)) {
      player.life++;
      collectedHeartIndices.add(heartIndex);
    }
  }

  if (collectedHeartIndices.size === 0) {
    return;
  }

  hearts.hearts = hearts.hearts.filter((_heart, index) => {
    return !collectedHeartIndices.has(index);
  });
}

function drawBackdrop(p: p5) {
  p.background(4, 9, 24, 210);
  p.noFill();
  p.stroke(120, 220, 255, 50);
  p.strokeWeight(2);
  p.circle(width * 0.2, height * 0.25, 220);
  p.circle(width * 0.82, height * 0.72, 320);
  p.stroke(255, 185, 90, 45);
  p.circle(width * 0.75, height * 0.18, 140);
}

function drawCenterMessage(p: p5, title: string, subtitle: string) {
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(44);
  p.text(title, width / 2, height / 2 - 40);
  p.fill(220, 232, 240);
  p.textSize(18);
  p.text(subtitle, width / 2, height / 2 + 20, width * 0.6, 140);
}

function drawPlaceholderMode(p: p5, mode: GameMode) {
  drawCenterMessage(
    p,
    modeTitles[mode],
    "This mode is wired into the state machine as a placeholder for now. Press Esc to open the in-game menu and switch back out."
  );
  drawHudHint(p, "Esc: menu", "Placeholder");
}

function drawHudHint(p: p5, actionText: string, modeLabel: string) {
  p.fill(255);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(modeLabel, width - 24, 24);
  p.fill(210, 225, 235);
  p.textSize(14);
  p.text(actionText, width - 24, 48);
}
