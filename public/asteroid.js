class Asteroid extends Mover {
    constructor(pos, vel, r, hitPoints) {
        super(pos, vel, r)
        this.hitPoints = hitPoints
        this.img = random(asteroidAssets)
        this.rotation = random(PI)
        this.angularVelocity = random(-0.005, 0.005)
    }

    draw() {
        push()
        imageMode(CENTER);
        translate(this.pos.x, this.pos.y)
        this.rotation = this.rotation+this.angularVelocity
        rotate(this.rotation)
        image(this.img, 0, 0, this.size, this.size);
        pop()
    }

    hit() {
        this.hitPoints--
    }
}

function spawnNewAsteroid(i) {
    if (asteroids.length < 0) {
        return
    }
    let asteroid = createNewAsteroid()
    asteroids[i] = asteroid
}

function createNewAsteroid() {
    let r = random(60, 200)
    let pos = createVector(random(-boardSizeX, boardSizeX), random(-boardSizeY, boardSizeY))
    let vel = createVector(0, 0)
    let hitpoints = r/4
    return new Asteroid(pos, vel, r, hitpoints)
}