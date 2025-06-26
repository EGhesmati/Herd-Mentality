// Rumorspread.js
let people = [];
let rumorHistory = [];
let draggingPerson = null;

function setup() {
    createCanvas(700, 450);
    for (let i = 0; i < 100; i++) {
        people.push(new Person());
    }
    let starter = random(people);
    starter.becomeSpreader();
    console.log("Rumor started by person at:", starter.x, starter.y);
    createSomeConnections();
    noLoop(); // Pause until Start is pressed
}

function draw() {
    background(30);

    for (let person of people) {
        person.move();
        person.update();
        person.display();
    }

    for (let person of people) {
        person.checkSpread(people);
    }

    if (frameCount % 600 === 0) {
        console.log("Rumor spread events:", rumorHistory.length);
    }
}

function mousePressed() {
    for (let person of people) {
        let d = dist(mouseX, mouseY, person.x, person.y);
        if (d < person.r) {
            draggingPerson = person;
            break;
        }
    }
}

function mouseDragged() {
    if (draggingPerson) {
        draggingPerson.x = mouseX;
        draggingPerson.y = mouseY;
    }
}

function mouseReleased() {
    draggingPerson = null;
}

function createSomeConnections() {
    for (let i = 0; i < people.length * 0.1; i++) {
        let p1 = random(people);
        let p2 = random(people);
        if (p1 !== p2) {
            p1.connections.push(p2);
            p2.connections.push(p1);
        }
    }
}

class Person {
    constructor() {
        this.x = random(width);
        this.y = random(height);
        this.state = "ignorant";
        this.r = 8;
        this.timer = 0;
        this.connections = [];
        this.interest = random(0.5, 1);
        this.spreadChance = random(0.05, 0.15);
        this.spreadRange = random(15, 25);
    }

    move() {
        if (draggingPerson === this) return;

        if (this.state === "spreader") {
            this.x += random(-2, 2);
            this.y += random(-2, 2);
        } else {
            this.x += random(-1.5, 1.5);
            this.y += random(-1.5, 1.5);
        }

        this.x = constrain(this.x, this.r, width - this.r);
        this.y = constrain(this.y, this.r, height - this.r);
    }

    update() {
        if (this.state === "spreader") {
            this.timer--;
            if (this.timer <= 0) {
                this.state = "stifler";
                console.log("Spreader became stifler at:", this.x, this.y);
            }
        }
    }

    display() {
        if (this.state === "ignorant") fill(200);
        else if (this.state === "spreader") fill(255, 80, 80);
        else if (this.state === "stifler") fill(80, 150, 255);

        stroke(255, 100);
        strokeWeight(1);
        ellipse(this.x, this.y, this.r * 2);

        if (this.state === "spreader") {
            stroke(255, 0, 0, 50);
            for (let conn of this.connections) {
                line(this.x, this.y, conn.x, conn.y);
            }
        }
    }

    checkSpread(others) {
        if (this.state !== "spreader") return;

        for (let other of others) {
            if (other === this) continue;

            let d = dist(this.x, this.y, other.x, other.y);
            let isConnection = this.connections.includes(other);

            if (d < this.spreadRange || isConnection) {
                if (other.state === "ignorant" && random() < this.spreadChance * other.interest) {
                    other.becomeSpreader();
                    rumorHistory.push({
                        from: {x: this.x, y: this.y},
                        to: {x: other.x, y: other.y},
                        frame: frameCount
                    });
                } else if (other.state === "spreader" && random() < 0.02) {
                    if (random() < 0.5) this.state = "stifler";
                    else other.state = "stifler";
                }
            }
        }
    }

    becomeSpreader() {
        this.state = "spreader";
        this.timer = 600 + random(-100, 100);
    }
} // end Person class



