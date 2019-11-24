
class ExplosionSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(pos) {
        for(let i=0;i<100;i++){
            this.particles.push(new ExplosionParticle(pos, random(-2*PI, 2*PI), random(0, 10)))
        }
    }
    
    run() {
        for(let i=this.particles.length-1;i>0;i--){
            let particle = this.particles[i];
            particle.run()
            if (particle.isDead()) {
                this.particles.splice(i, 1)
            }
        }
    }
}

class ExplosionParticle extends Mover {
    constructor(pos, rotation, r) {
        super(pos, p5.Vector.fromAngle(rotation, random(1, 5)), r)
        this.rotation = rotation
        this.lifespan = 255 
        this.redValue = 100
        this.greenValue = 200
        this.blueValue = 255
        this.greenCap = random(100, 255)
    }

    show() {
        push()
        translate(this.pos.x, this.pos.y)
        rotate(this.rotation)
        rect(0, 0, this.size*2, this.size/2)
        pop()
    }

    run() {
        this.update()
        fill(rgba(this.redValue, this.greenValue, this.blueValue, this.lifespan))
        this.show()
        this.decay()
    }

    decay() {
        if (this.lifespan > 0) {
            this.lifespan -= 15
            if (this.blueValue > 60) {
                this.blueValue -= 5
            }
            if (this.redValue < 255) {
                this.redValue += 20
            }
            if (this.greenValue < this.greenCap) {
                this.greenValue += 10
            }
        }
    }

    isDead() {
        return this.lifespan === 0
    }
    
}