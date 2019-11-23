
class ParticleSystem {
    constructor(pos, rotation) {
        this.pos = pos.copy()
        this.rotation = rotation
        this.particles = [];
    }

    spawnNewParticles(number) {
        for(let i=0;i<number;i++){
            this.particles.push(new Particle(this.pos, p5.Vector.fromAngle(this.rotation, random(5, 10)), 10))
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

class Particle extends Mover {
    constructor(pos, vel, r) {
        super(pos, vel,r)
        this.lifespan = 255 
    }

    run() {
        this.update()
        this.draw()
        this.decay()
    }

    decay() {
        if (this.lifespan > 0) {
            this.lifespan -= 15
        }
    }

    isDead() {
        return this.lifespan === 0
    }
}