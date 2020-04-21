class AmmunitionPackages {
  constructor() {
    this.packets = [];
    this.spawnAmmo(100);
  }

  spawnAmmo(number) {
    for (let i = 0; i < number; i++) {
      this.packets.push(
        new Ammunition(
          randomSpawnPoint(),
          Math.floor((Math.random() + 1) * 10) * 10
        )
      );
    }
  }

  run() {
    if (frameCount % 60 === 0) {
      this.spawnAmmo(1);
    }
    for (let i = this.packets.length - 1; i > 0; i--) {
      let packet = this.packets[i];
      packet.draw();
    }
  }
}

class Ammunition {
  constructor(pos, amount) {
    this.pos = pos.copy();
    this.amount = amount;
    this.size = amount / 2;
  }

  draw() {
    rectMode(CENTER);
    fill(50, 255, 255);
    imageMode(CENTER);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
    image(ammoAsset, this.pos.x, this.pos.y, this.size / 1.5, this.size / 1.5);
    // text(this.amount, this.pos.x, this.pos.y)
  }
}

class Hearts {
  constructor() {
    this.hearts = [];
    this.spawnHearts(50);
  }

  spawnHearts(number) {
    for (let i = 0; i < number; i++) {
      let possibleSizes = [100, 100, 100, 100, 100, 200, 200, 400];
      this.hearts.push(new Heart(randomSpawnPoint(), random(possibleSizes)));
    }
  }

  run() {
    if (frameCount % 240 === 0) {
      this.spawnHearts(1);
    }
    for (let i = this.hearts.length - 1; i > 0; i--) {
      let heart = this.hearts[i];
      heart.draw();
    }
  }
}

class Heart {
  constructor(pos) {
    this.pos = pos.copy();
    this.size = 60;
  }

  draw() {
    rectMode(CENTER);
    fill(255);
    imageMode(CENTER);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
    image(heart, this.pos.x, this.pos.y, this.size / 1.5, this.size / 1.5);
    // text(this.amount, this.pos.x, this.pos.y)
  }
}