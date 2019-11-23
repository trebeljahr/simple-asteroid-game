class Mover {
    constructor(pos, vel, r) {
        this.pos = pos.copy()
        this.vel = vel.copy()
        this.size = r
    }   

    draw() {
        ellipse(this.pos.x, this.pos.y, this.size, this.size)
    }

    update() {
        this.pos = this.pos.add(this.vel)
    }

    setVel(newVel) {
        this.vel = newVel
    }
     
    inScreen() {
        return this.pos.x >= -this.size && this.pos.y >= -this.size && this.pos.x <= width+this.size && this.pos.y <= height+this.size
    }
} 

class Bullet extends Mover {
    constructor(pos, vel, r,) {
        super(pos, vel, r,)
    }
}
