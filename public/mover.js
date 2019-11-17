class Player {
    constructor(x, y) {
        this.pos = createVector(x,y)
        this.size = 60
    }   

    draw() {
        fill(255)
        rectMode(CENTER)
        //rect(this.pos.x, this.pos.y, this.size*2, this.size)
        push()
        imageMode(CENTER);
        translate(this.pos.x, this.pos.y)
        rotate(PI/2)
        image(rocket, 0, 0, this.size, this.size*2);
        pop()
    }
    
    update() {
        if (!(this.pos.x < 0) && (keyIsDown(LEFT_ARROW) || keyIsDown(A_KEYCODE)))  {
            this.pos.x -= 5;
        }

        if (!(this.pos.x > xEdge) && (keyIsDown(RIGHT_ARROW) || keyIsDown(D_KEYCODE))) {
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
            let pos = createVector(this.pos.x + this.size/2, this.pos.y)
            let vel = createVector(BULLET_SPEED, 0)
            let r = 5
            bullets.push(new Bullet(pos, vel, r))
        }
    }

    run() {
        this.draw()
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
} 

class Enemy extends Mover {
    constructor(pos, vel, r, hitPoints, i) {
        super(pos, vel, r)
        this.i = i
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
        if (this.hitPoints <= 0) {
            spawnNewEnemy(this.i)
        }
    }
}

function spawnNewEnemy(i) {
    if (enemies.length < 0) {
        return
    }
    enemy = createNewEnemy(i)
    enemies[i] = enemy
}

function createNewEnemy(i) {
    let pos = createVector(random(xEdge, width), random(height))
    let vel = createVector(-0.1, 0)
    let r = random(60, 80)
    let hitpoints = r/4
    return new Enemy(pos, vel, r, hitpoints, i)
}

class Bullet extends Mover {
    constructor(pos, vel, r,) {
        super(pos, vel, r,)
    }

    inScreen() {
        return this.pos.x >= 0 && this.pos.y >= 0 && this.pos.x <= width && this.pos.y <= height
    }

    hitsEnemy(bulletIndex) {
        for (let i=enemies.length-1;i>=0;i--){
            let enemy = enemies[i]
            function distSquare(x1,y1,x2,y2) {
                return (x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)
            }
            let distance = distSquare(enemy.pos.x, enemy.pos.y, this.pos.x, this.pos.y)
            let radiusSum = enemy.size/2 + this.size/2
        
            if (distance <= radiusSum*radiusSum) {
                enemy.hit()
                bullets.splice(bulletIndex, 1)
            }
        }
    }
}
