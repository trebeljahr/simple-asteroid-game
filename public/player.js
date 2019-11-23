class Player {
    constructor(x, y) {
        this.pos = createVector(x,y)
        this.size = 60
        this.life = 3
        this.rotation = 0
        this.vel = createVector(0,0)
        this.acc = createVector(0, 0)
    }   

    draw() {
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

    steer() {
        if (keyIsDown(LEFT_ARROW) || keyIsDown(A_KEYCODE))  {
            this.rotation -= 0.05;
        }

        if (keyIsDown(RIGHT_ARROW) || keyIsDown(D_KEYCODE)){
            this.rotation += 0.05;
        }

        this.acc = p5.Vector.fromAngle(this.rotation, 0.1)
    }

    update() {

        // if (!(this.pos.x < 0) && (keyIsDown(LEFT_ARROW) || keyIsDown(A_KEYCODE)))  {
        //     this.pos.x -= 5;
        // }

        // if (!(this.pos.x > width) && (keyIsDown(RIGHT_ARROW) || keyIsDown(D_KEYCODE))) {
        //     this.pos.x += 5;
        // }
        const newX = this.pos.x + this.vel.x;
        const newY = this.pos.y + this.vel.y;
        if (newX >= boardSizeX || newX <= -boardSizeX) {
            this.vel.x = 0;
        }
        if (newY >= boardSizeY || newY <= -boardSizeY) {
            this.vel.y = 0;
        }
        this.pos.add(this.vel)
        if ((keyIsDown(UP_ARROW) || keyIsDown(W_KEYCODE))) {
            this.vel.add(this.acc)
            this.vel.limit(5)
        }
        
        
        // if (!(this.pos.y > height) && (keyIsDown(DOWN_ARROW) || keyIsDown(S_KEYCODE))) {
        //     this.pos.y += 5;
        // }
    }

    shoot() {
        if (keyIsDown(SPACE_KEYCODE)) {
            let pos = createVector(this.pos.x + this.size, this.pos.y)
            let vel = createVector(this.vel.x, this.vel.y)
            vel.mag(5)
            let r = 5
            bullets.push(new Bullet(pos, vel, r))
        }
    }

    run() {
        if (this.life <= 0) {
            return
        }
        this.draw()
        this.update()
        this.steer()
        this.shoot()
    }
}   