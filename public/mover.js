class Player {
    constructor(x, y) {
        this.pos = createVector(x,y)
        this.size = 60
        this.life = 3
    }   

    draw() {
        fill(255)
        rectMode(CENTER)
        push()
        imageMode(CENTER);
        translate(this.pos.x, this.pos.y)
        rotate(PI/2)
        image(rocket, 0, 0, this.size, this.size*2);
        pop()
    }
    
    damage() {
        this.life--
        if (this.life <= 0 && !gameOver) {
            toggleDeathScreen()
        }
    }

    showHealth() {
        for(let i=0;i<this.life;i++){
            image(heart, i*60+20, 20, 60, 60)
        }    
    }

    update() {
        if (!(this.pos.x < 0) && (keyIsDown(LEFT_ARROW) || keyIsDown(A_KEYCODE)))  {
            this.pos.x -= 5;
        }

        if (!(this.pos.x > width) && (keyIsDown(RIGHT_ARROW) || keyIsDown(D_KEYCODE))) {
            this.pos.x += 5;
        }

        if (!( this.pos.y < 0) && (keyIsDown(UP_ARROW) || keyIsDown(W_KEYCODE))) {
            this.pos.y -= 5;
        }
        
        if (!(this.pos.y > height) && (keyIsDown(DOWN_ARROW) || keyIsDown(S_KEYCODE))) {
            this.pos.y += 5;
        }
    }

    shoot() {
        if (keyIsDown(SPACE_KEYCODE)) {
            let pos = createVector(this.pos.x + this.size, this.pos.y)
            let vel = createVector(BULLET_SPEED, 0)
            let r = 5
            bullets.push(new Bullet(pos, vel, r))
        }
    }

    run() {
        if (this.life <= 0) {
            return
        }
        this.draw()
        this.showHealth()
        this.update()
        this.shoot()
    }
}   

class Mover {
    constructor(pos, vel, r) {
        this.pos = pos.copy()
        this.vel = vel.copy()
        this.size = r
    }   

    draw() {
        fill(255, 0, 0)
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

class Enemy extends Mover {
    constructor(pos, vel, r, hitPoints) {
        super(pos, vel, r)
        this.hitPoints = hitPoints
        this.img = random(asteroids)
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

function spawnNewEnemy(i) {
    if (enemies.length < 0) {
        return
    }
    enemy = createNewEnemy()
    enemies[i] = enemy
}

function createNewEnemy() {
    let r = random(60, 200)
    let pos = createVector(width+r, random(height))
    let vel = createVector(random(-2, -1), 0)
    let hitpoints = r/4
    return new Enemy(pos, vel, r, hitpoints)
}

class Bullet extends Mover {
    constructor(pos, vel, r,) {
        super(pos, vel, r,)
    }
}
