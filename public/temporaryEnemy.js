class TemporaryEnemy {
    constructor(x, y, speed) {
        this.position = new Position(x,y);
    }

    draw() {
        ellipse(this.pos.x, this.pos.y, 40, 40)
    }

    update() {
        this.position.x = this.position.x - speed;
    }
}