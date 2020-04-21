class Enemy {
    constructor(pos) {
        this.pos = pos.copy()
        this.size = 60
        this.rotation = 0
        this.vel = createVector(0,0)
        this.thruster = new ThrusterExhaustSystem(createVector(width/2,height), 0)
        this.thrusterON = false;
    }   

    draw() {
        this.thruster.updatePos(p5.Vector.add(this.pos, p5.Vector.fromAngle(this.rotation-PI, this.size)), this.rotation-PI)
        if (this.thrusterON) {
          this.thruster.fire(10)
        }
        this.thruster.run()
        push()
        translate(this.pos.x, this.pos.y)
        rectMode(CENTER)
        rotate(this.rotation)
        fill(255)
        imageMode(CENTER);
        rotate(PI/2)
        image(rocket, 0, 0, this.size, this.size*2);
        pop()
    }

} 