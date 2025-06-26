let users = [];
let influencers = [];
const userCount = 50;
const influencerCount = 5;
const influenceRadius = 100;
let simulationRunning = false;

function setup() {
    createCanvas(700, 450);
    initUsers();
    noLoop();
}

function initUsers() {
    users = [];
    influencers = [];
    for (let i = 0; i < influencerCount; i++) {
        influencers.push(new Influencer(random(width), random(height), i));
    }
    for (let i = 0; i < userCount; i++) {
        users.push(new User(random(width), random(height), i));
    }
}

function draw() {
    background(240);

    for (let influencer of influencers) {
        influencer.update();
        influencer.show();
    }

    for (let user of users) {
        user.alignWithInfluencers(influencers);
        user.alignWithPeers(users);
        user.update();
        user.show();
    }
}

class Agent {
    constructor(x, y, id) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.acc = createVector(0, 0);
        this.angle = this.vel.heading();
        this.id = id;
    }
    applyForce(force) {
        this.acc.add(force);
    }
    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.angle = this.vel.heading();
        this.acc.mult(0);
        this.edges();
    }
    edges() {
        if (this.pos.x > width) this.pos.x = 0;
        else if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        else if (this.pos.y < 0) this.pos.y = height;
    }
}

class Influencer extends Agent {
    constructor(x, y, id) {
        super(x, y, id);
        this.size = 20;
        this.color = color(255, 100, 0);
        this.maxSpeed = 2.5;
        this.dragging = false;
        this.dragOffset = createVector(0, 0);
    }

    update() {
        if (this.dragging) {
            this.pos.x = mouseX + this.dragOffset.x;
            this.pos.y = mouseY + this.dragOffset.y;
            this.vel.mult(0);
            this.acc.mult(0);
        } else {
            let wanderForce = p5.Vector.random2D().mult(0.15);
            this.applyForce(wanderForce);
            super.update();
        }
    }

    show() {
        fill(this.color);
        stroke(200, 80, 0);
        strokeWeight(3);
        ellipse(this.pos.x, this.pos.y, this.size);
        noStroke();
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(14);
        text(`I${this.id}`, this.pos.x, this.pos.y - 25);
    }

    checkDrag(mx, my) {
        let d = dist(mx, my, this.pos.x, this.pos.y);
        if (d < this.size / 2) {
            this.dragging = true;
            this.dragOffset.set(this.pos.x - mx, this.pos.y - my);
        }
    }

    stopDrag() {
        if (this.dragging) {
            this.dragging = false;
            console.log(`Influencer ${this.id} released at (${this.pos.x.toFixed(1)}, ${this.pos.y.toFixed(1)})`);
        }
    }
}

class User extends Agent {
    constructor(x, y, id) {
        super(x, y, id);
        this.size = 12;
        this.color = color(100, 100, 255);
        this.maxSpeed = 2.2;
        this.opinionAlignment = 0; // 0 to 1, where 1 = perfectly aligned with influencer
    }

    alignWithInfluencers(influencers) {
        let total = 0;
        let avgHeading = createVector(0, 0);
        let totalInfluence = 0;

        for (let inf of influencers) {
            let d = p5.Vector.dist(this.pos, inf.pos);
            if (d < influenceRadius) {
                let influence = map(d, 0, influenceRadius, 1, 0);
                let infHeading = p5.Vector.fromAngle(inf.angle);
                infHeading.mult(influence);
                avgHeading.add(infHeading);
                totalInfluence += influence;
                total++;
            }
        }
        if (total > 0) {
            avgHeading.div(totalInfluence);
            avgHeading.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(avgHeading, this.vel);
            steer.limit(0.1);
            this.applyForce(steer);

            let angleDiff = abs(this.vel.heading() - avgHeading.heading());
            this.opinionAlignment = map(angleDiff, 0, PI, 1, 0);
        } else {
            this.opinionAlignment *= 0.95;
        }
    }

    alignWithPeers(users) {
        let perceptionRadius = 50;
        let total = 0;
        let avgVelocity = createVector(0, 0);

        for (let other of users) {
            if (other === this) continue;
            let d = p5.Vector.dist(this.pos, other.pos);
            if (d < perceptionRadius) {
                avgVelocity.add(other.vel);
                total++;
            }
        }

        if (total > 0) {
            avgVelocity.div(total);
            avgVelocity.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(avgVelocity, this.vel);
            steer.limit(0.05);
            this.applyForce(steer);
        }
    }

    update() {
        super.update();
    }

    show() {
        let c = lerpColor(color(100, 100, 255), color(0, 200, 0), this.opinionAlignment);
        fill(c);
        noStroke();

        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);
        ellipse(0, 0, this.size, this.size * 0.6);

        fill(255, 255, 255, 180);
        triangle(this.size / 2, 0, this.size / 2 - 4, -4, this.size / 2 - 4, 4);
        pop();
    }
}

// Control buttons
function setupControls() {
    select('#startBtn').mousePressed(() => {
        loop();
        simulationRunning = true;
    });
    select('#pauseBtn').mousePressed(() => {
        noLoop();
        simulationRunning = false;
    });
    select('#resetBtn').mousePressed(() => {
        initUsers();
        redraw();
    });
}

function mousePressed() {
    for (let inf of influencers) {
        inf.checkDrag(mouseX, mouseY);
    }
}

function mouseReleased() {
    for (let inf of influencers) {
        inf.stopDrag();
    }
}

function setup() {
    createCanvas(700, 450);
    initUsers();
    setupControls();
    noLoop();
}
