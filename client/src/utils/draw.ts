import p5 from "p5";
import { menuIsOpen } from "./menu";
import { width, height } from ".";
import { playerSingleton } from "./player";
import { borderSystem } from "./border";
import { player } from "../components/P5Component";

export const draw = (p: p5) => {
  if (menuIsOpen) {
    p.background("rgba(0,0,0,0.1)");
    return;
  }
  p.push();
  p.translate(-player.pos.x, -player.pos.y);
  p.translate(width / 2, height / 2);
  borderSystem(p).getInstance().show();
  p.noStroke();
  player.run();
  // gameLogic();
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

// function gameLogic() {
//   ammunition.run();
//   hearts.run();
//   explosionSystem.run();

//   for (let i = asteroids.length - 1; i >= 0; i--) {
//     let asteroid = asteroids[i];
//     asteroid.update();
//     asteroid.draw();

//     if (playerHitsAsteroid(asteroid, player)) {
//       player.damage();
//       explosionSystem.createExplosion(asteroid.pos);
//       asteroids.splice(i, 1);
//     }

//     if (frameCount % 30 === 0 && asteroids.length - 1 === i) {
//       if (asteroids.length < 1000) {
//         asteroids.push(createNewAsteroid());
//       }
//     }
//   }

//   for (let i = asteroids.length - 1; i >= 0; i--) {
//     let asteroid = asteroids[i];
//     for (let j = bullets.length - 1; j > 0; j--) {
//       let bullet = bullets[j];
//       let distance = distSquare(
//         asteroid.pos.x,
//         asteroid.pos.y,
//         bullet.pos.x,
//         bullet.pos.y
//       );
//       let radiusSum = asteroid.size / 2 + bullet.size / 2;
//       if (distance <= radiusSum * radiusSum) {
//         asteroid.hit();
//         if (asteroid.hitPoints <= 0) {
//           spawnNewAsteroid(i);
//         }
//         bullets.splice(j, 1);
//       }
//     }
//   }

//   for (let i = ammunition.packets.length - 1; i > 0; i--) {
//     let packet = ammunition.packets[i];
//     if (playerHitsCollectible(packet, player)) {
//       player.ammunition += packet.amount;
//       ammunition.packets.splice(i, 1);
//     }
//   }

//   for (let i = hearts.hearts.length - 1; i > 0; i--) {
//     let heart = hearts.hearts[i];
//     if (playerHitsCollectible(heart, player)) {
//       player.life++;
//       hearts.hearts.splice(i, 1);
//     }
//   }
// }
