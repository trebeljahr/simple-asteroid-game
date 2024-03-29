import p5 from "p5";
import { border } from "./border";
import { player, playerHitsCollectible } from "./player";
import { explosions } from "./explosions";
import { ammunition } from "./ammunition";
import { hearts } from "./hearts";
import { asteroids } from "./asteroids";
import { bullets } from "./bullets";
import { assets } from "./sketch";
import { menuIsOpen, toggleWinScreen } from "./menu";
import { distSquare, width, height } from "./utils";
import { goals } from "./goals";

export const draw = (p: p5) => {
  if (menuIsOpen) {
    p.background("rgba(100, 0, 100, 0.1)");
    return;
  }
  p.clear();
  // assets && p.background(assets.space);
  p.push();
  p.translate(-player.enginePlayer.position.x, -player.enginePlayer.position.y);
  p.translate(width / 2, height / 2);
  border.show();
  p.noStroke();
  player.run();
  gameLogic(p);
  // Object.keys(enemyPlayers).forEach((id) => {
  //   fill(255);
  //   enemyPlayers[id].draw();
  // });
  p.pop();
  player.showHealth();
  //   socket.emit("playerUpdate", {
  //     pos: { x: player.pos.x, y: player.pos.y },
  //     vel: { x: player.vel.x, y: player.vel.y },
  //     rotation: player.rotation,
  //     thrusterON: keyIsDown(UP_ARROW) || keyIsDown(W_KEYCODE),
  //   });
};

function gameLogic(p: p5) {
  ammunition.run();
  hearts.run();
  explosions.run();
  asteroids.run();
  goals.run();

  for (let i = asteroids.asteroids.length - 1; i >= 0; i--) {
    let asteroid = asteroids.asteroids[i];
    for (let j = bullets.bullets.length - 1; j > 0; j--) {
      let bullet = bullets.bullets[j];
      let distance = distSquare(
        asteroid.pos.x,
        asteroid.pos.y,
        bullet.pos.x,
        bullet.pos.y
      );
      let radiusSum = asteroid.size / 2 + bullet.size / 2;
      if (distance <= radiusSum * radiusSum) {
        asteroid.hit();
        if (asteroid.hitPoints <= 0) {
          asteroids.spawnNewAsteroid(i);
        }
        bullets.bullets.splice(j, 1);
      }
    }
  }

  for (let i = ammunition.ammunitionPackages.length - 1; i > 0; i--) {
    let packet = ammunition.ammunitionPackages[i];
    if (playerHitsCollectible(packet, player)) {
      player.ammunition += packet.amount;
      ammunition.ammunitionPackages.splice(i, 1);
    }
  }

  for (let i = hearts.hearts.length - 1; i > 0; i--) {
    let heart = hearts.hearts[i];
    if (playerHitsCollectible(heart, player)) {
      player.life++;
      hearts.hearts.splice(i, 1);
    }
  }
}
