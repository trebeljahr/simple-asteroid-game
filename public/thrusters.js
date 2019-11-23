
class ThrusterExhaustSystem {
    constructor(pos, rotation) {
        this.pos = pos.copy()
        this.rotation = rotation
        this.particles = [];
    }

    spawnNewParticles(number) {
        for(let i=0;i<number;i++){
            this.particles.push(new ExhaustParticle(this.pos, p5.Vector.fromAngle(this.rotation + random(-PI/10, PI/10), random(5, 10)), 10))
        }
    }

    updatePos(pos, rotation) {
        this.pos = pos.copy()
        this.rotation = rotation
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

function rgba(r, g, b, alpha) {
    const rgbaString = `rgba(${r}, ${g}, ${b}, ${alpha})`
    return rgbaString
}

class ExhaustParticle extends Mover {
    constructor(pos, vel, r) {
        super(pos, vel,r)
        this.lifespan = 255 
        this.redValue = 100
        this.greenValue = 200
        this.blueValue = 255
        this.greenCap = random(100, 255)
    }

    run() {
        this.update()
        fill(rgba(this.redValue, this.greenValue, this.blueValue, this.lifespan))
        this.draw()
        this.decay()
    }

    decay() {
        if (this.lifespan > 0) {
            this.lifespan -= 15
            if (this.blueValue > 60) {
                this.blueValue -= 10
            }
            if (this.redValue < 255) {
                this.redValue += 30
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