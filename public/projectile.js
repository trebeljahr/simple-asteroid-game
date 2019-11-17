class Projectile {
  constructor(position, speed, damage) {
    this.position = position;
    this.speed = speed;
    this.damage = damage
  }

  draw() {
    ellipse(this.position.x, this.position.y, 5, 5);
  }

  update() {
    this.position.x = this.position.x + this.speed;
    this.draw();
  }

}