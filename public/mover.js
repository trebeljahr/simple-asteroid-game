class Player {
    constructor(x, y) {
        this.pos = createVector(x,y)
        this.size = 40
    }   

    draw() {
        fill(255)
        rectMode(CENTER)
        rect(this.pos.x, this.pos.y, this.size, this.size)
    }

    update() {
        if (!(this.pos.x < 0) && keyIsDown(LEFT_ARROW)) {
            this.pos.x -= 5;
        }

        if (!(this.pos.x > xEdge) && keyIsDown(RIGHT_ARROW)) {
            this.pos.x += 5;
        }

        if (!( this.pos.y < 0)&&keyIsDown(UP_ARROW)) {
            this.pos.y -= 5;
        }
        
        if (!(this.pos.y > height) && keyIsDown(DOWN_ARROW)) {
            this.pos.y += 5;
        }
    }

    shoot() {
        if (keyIsDown(SPACE_KEYCODE)) {
                bullets.push(new Bullet(this.pos.x + this.size/2, this.pos.y, 5, 10, 0))
        }
    }

    run() {
        this.update()
        this.draw()
        this.shoot()
    }
}   

class Mover {
    constructor(x, y, r, velX, velY) {
        this.pos = createVector(x,y)
        this.vel = createVector(velX, velY)
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

class Bullet extends Mover {
    constructor(x, y, r, velX, velY) {
        super(x, y, r, velX, velY)
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
                enemies[i] = new Mover(random(xEdge, width), random(height), 80, 0, 0)
                bullets.splice(bulletIndex, 1)
                console.log('Hit enemy')
            }
        }
    }
}
