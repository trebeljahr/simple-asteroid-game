function draw() {
  if (menuIsOpen) {
    background('rgba(0,0,0,0.1)')
    return
  }
  background(space);
  push()
  translate(-player.pos.x, -player.pos.y);
  translate(width/2, height/2);
  border.show();
  noStroke()
  player.run();
  for(let i=asteroids.length-1;i>=0;i--){
      asteroid=asteroids[i]
      asteroid.update();
      asteroid.draw();
      for (let j=bullets.length-1; j>0;j--) {
        bullet = bullets[j]
        bullet.update()
        bullet.draw()
        if (!bullet.inScreen()) {
          bullets.splice(j, 1)
        } 
        let distance = distSquare(asteroid.pos.x, asteroid.pos.y, bullet.pos.x, bullet.pos.y)
        let radiusSum = asteroid.size/2 + bullet.size/2
        if (distance <= radiusSum*radiusSum) {
            asteroid.hit()
            if (asteroid.hitPoints <= 0) {
              asteroids.splice(i, 1)
            }
            bullets.splice(j, 1)
        }
      }

      if (playerHitsAsteroid(asteroid, player)) {
        player.damage()
        asteroids.splice(i, 1)
      } 

      if (frameCount % 30 === 0 && asteroids.length-1 === i) {
        asteroids.push(createNewAsteroid());
      }
    } 
    pop()
    player.showHealth()
}


