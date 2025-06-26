let followers = [];
let leaders = [];
let simulationRunning = false;
const followerCount = 40;
const leaderCount = 2;
const separationDistance = 20;

function setup() {
    createCanvas(700, 450);
    initAgents();
    noLoop();
}

function initAgents() {
    followers = [];
    leaders = [];
    for (let i = 0; i < leaderCount; i++) {
        leaders.push(new Leader(random(width), random(height), i));
    }
    for (let i = 0; i < followerCount; i++) {
        followers.push(new Follower(random(width), random(height), i));
    }
}

function draw() {
    background(245);

    for (let leader of leaders) {
        leader.update();
        leader.show();
    }

    for (let follower of followers) {
        follower.separate(followers);
        follower.follow(leaders);
        follower.update();
        follower.show();
    }
}

class Agent {
    constructor(x, y, id) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.acc = createVector(0, 0);
        this.id = id;
    }
    applyForce(force) {
        this.acc.add(force);
    }
    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
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

class Leader extends Agent {
    constructor(x, y, id) {
        super(x, y, id);
        this.color = color(255, 50, 50);
        this.size = 18;
        this.maxSpeed = 3.5;
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
            let wanderForce = p5.Vector.random2D().mult(0.1);
            this.applyForce(wanderForce);
            super.update();
        }
    }

    show() {
        fill(this.color);
        stroke(200, 0, 0);
        strokeWeight(2);
        ellipse(this.pos.x, this.pos.y, this.size);
        noStroke();
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(12);
        text(`L${this.id}`, this.pos.x, this.pos.y - 20);
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
            console.log(`Leader ${this.id} released at (${this.pos.x.toFixed(1)}, ${this.pos.y.toFixed(1)})`);
        }
    }
}

class Follower extends Agent {
    constructor(x, y, id) {
        super(x, y, id);
        this.color = color(0, 100, 255, 200);
        this.size = 10;
        this.maxSpeed = 2.5;
    }

    follow(leaders) {
        let nearestLeader = null;
        let minDist = Infinity;
        for (let leader of leaders) {
            let d = p5.Vector.dist(this.pos, leader.pos);
            if (d < minDist) {
                minDist = d;
                nearestLeader = leader;
            }
        }
        if (nearestLeader) {
            let desired = p5.Vector.sub(nearestLeader.pos, this.pos);
            desired.setMag(this.maxSpeed);

            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(0.15);
            this.applyForce(steer);

            if (frameCount % 60 === 0) {
                console.log(`Follower ${this.id} moving toward Leader ${nearestLeader.id} (Dist: ${minDist.toFixed(1)})`);
            }
        }
    }

    separate(followers) {
        let steer = createVector(0, 0);
        let total = 0;
        for (let other of followers) {
            if (other === this) continue;
            let d = p5.Vector.dist(this.pos, other.pos);
            if (d < separationDistance && d > 0) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                total++;
            }
        }
        if (total > 0) {
            steer.div(total);
            steer.setMag(this.maxSpeed);
            steer.sub(this.vel);
            steer.limit(0.2);
            this.applyForce(steer);
        }
    }

    show() {
        fill(this.color);
        noStroke();
        ellipse(this.pos.x, this.pos.y, this.size);
        stroke(0, 150);
        strokeWeight(1);
        line(this.pos.x, this.pos.y, this.pos.x + this.vel.x * 10, this.pos.y + this.vel.y * 10);
    }
}

function mousePressed() {
    for (let leader of leaders) {
        leader.checkDrag(mouseX, mouseY);
    }
}
function mouseReleased() {
    for (let leader of leaders) {
        leader.stopDrag();
    }
}

document.getElementById('startBtn').onclick = () => {
    if (!simulationRunning) {
        loop();
        simulationRunning = true;
        console.log("Simulation started");
    }
};

document.getElementById('pauseBtn').onclick = () => {
    if (simulationRunning) {
        noLoop();
        simulationRunning = false;
        console.log("Simulation paused");
    }
};

document.getElementById('resetBtn').onclick = () => {
    noLoop();
    simulationRunning = false;
    initAgents();
    clear();
    redraw();
    console.clear();
    console.log("Simulation reset");
};
