class Player {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 60;
    this.life = 3;
    this.rotation = 0;
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.ammunition = 1000;
    this.thruster = new ThrusterExhaustSystem(
      createVector(width / 2, height),
      0
    );
  }

  draw() {
    this.thruster.updatePos(
      p5.Vector.add(
        this.pos,
        p5.Vector.fromAngle(this.rotation - PI, this.size)
      ),
      this.rotation - PI
    );
    if (keyIsDown(UP_ARROW) || keyIsDown(W_KEYCODE)) {
      this.thruster.fire(10);
    }
    this.thruster.run();
    push();
    translate(this.pos.x, this.pos.y);
    rectMode(CENTER);
    rotate(this.rotation);
    fill(255);
    imageMode(CENTER);
    rotate(PI / 2);
    image(rocket, 0, 0, this.size, this.size * 2);
    pop();
  }

  damage() {
    this.life--;
    if (this.life <= 0 && !gameOver) {
      explosionSystem.createExplosion(this.pos);
      this.deathCountDown = 255;
    }
  }

  showHealth() {
    fill(255);
    let heartSize = 60;
    let offSet = 20;
    text(
      this.ammunition,
      offSet + (this.life + 1) * heartSize,
      offSet + heartSize / 2
    );
    for (let i = 0; i < this.life; i++) {
      image(heart, i * heartSize + heartSize, offSet, heartSize, heartSize);
    }
  }

  steer() {
    if (keyIsDown(LEFT_ARROW) || keyIsDown(A_KEYCODE)) {
      this.rotation -= 0.05;
    }

    if (keyIsDown(RIGHT_ARROW) || keyIsDown(D_KEYCODE)) {
      this.rotation += 0.05;
    }

    this.acc = p5.Vector.fromAngle(this.rotation, 0.1);
  }

  update() {
    const newX = this.pos.x + this.vel.x;
    const newY = this.pos.y + this.vel.y;
    if (newX >= boardSizeX || newX <= -boardSizeX) {
      this.vel.x = 0;
    }
    if (newY >= boardSizeY || newY <= -boardSizeY) {
      this.vel.y = 0;
    }
    this.pos.add(this.vel);
    if (keyIsDown(UP_ARROW) || keyIsDown(W_KEYCODE)) {
      this.vel.add(this.acc);
      this.vel.limit(5);
    }
  }

  shoot() {
    if (keyIsDown(SPACE_KEYCODE) && this.ammunition > 0) {
      for (let i = 0; i < 2; i++) {
        let pos = createVector(this.pos.x, this.pos.y).add(
          p5.Vector.fromAngle(this.rotation, this.size)
        );
        let r = 5;
        this.ammunition--;
        bullets.push(
          new Bullet(
            pos,
            p5.Vector.fromAngle(this.rotation + random(-PI / 20, PI / 20), 20),
            r
          )
        );
      }
    }
  }

  run() {
    if (this.life <= 0) {
      if (this.deathCountDown < 0) {
        toggleDeathScreen();
      }
      this.deathCountDown -= 15;
      return;
    }
    this.draw();
    this.update();
    this.steer();
    this.shoot();
  }
}
