class Ship {
  constructor(position, hitpoints = 100) {
    this.position = position;
    this.hitpoints = hitpoints;
  }

  fire() {
    let projectile = new Projectile(new Position(this.position.x, this.position.y), 10, 10);
  }

  draw() {
    ellipse(this.position.x, this.position.y, 80, 80);
  }

  update() {
    this.draw();
  }
}