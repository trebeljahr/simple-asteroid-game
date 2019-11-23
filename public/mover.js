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
        return this.pos.x >= -this.size-width/2-boardSizeX && this.pos.y >= -this.size-height/2-boardSizeY && this.pos.x <= boardSizeX+width/2+this.size && this.pos.y <= height/2+boardSizeY+this.size
    }
} 

class Bullet extends Mover {
    constructor(pos, vel, r,) {
        super(pos, vel, r,)
    }
}
