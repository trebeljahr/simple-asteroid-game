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
        return this.pos.x >= -this.size-boardSizeX && this.pos.y >= -this.size-boardSizeY && this.pos.x <= boardSizeX+this.size && this.pos.y <= boardSizeY+this.size
    }
} 

class Bullet extends Mover {
    constructor(pos, vel, r,) {
        super(pos, vel, r,)
    }
}
