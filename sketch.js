var backID;
var runOnce = false;
var name;
backR = 255;
backG = 255;
backB = 255;

function preload() {
    numPhotos = 11;
    randVar = floor(random(0, numPhotos))
    //randVar = 10.0;
    console.log("Image ID = " + randVar);
    imgLoad = loadImage('img' + randVar + '.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight * 1.5);
    backID = floor(random(0, 15))
    backID = 2.0;
    console.log("backID = " + backID);
    runOnce = false;
}

function draw() {
    //translate(-windowWidth / 2, -windowHeight / 2);
    switch (backID) {
        case 0.0:
            back1();
            break;
        case 1.0:
            back2();
            break;
        case 2.0:
            back3();
            break;
        case 3.0:
            back4();
            break;
        case 4.0:
            back5();
            break;
        case 5.0:
            back6();
            break;
        case 6.0:
            back3();
            break;
        case 7.0:
            back8();
            break;
        case 8.0:
            back9();
            break;
        default:
            back3();
            break;
    }
    fill(backR, backG, backB);
    stroke(0);
    strokeWeight(2);
    rect(width * 0.815, height * 0.185, width * 0.12, height * 0.07, 20);

    textAlign(CENTER);
    noStroke();
    fill(0);
    textSize(map(width * 0.1, 0, 160, 14, 30));
    text(name, width * 0.8, height * 0.195, width * 0.15, height * 0.07)
    textSize(map(width * 0.1, 0, 160, 6, 14));
    text("by Dadmehr Ghasemfar", width * 0.8, height * 0.23, width * 0.15, height * 0.07);
    fill(backR, backG, backB);
    strokeWeight(2);
    stroke(0);
    rect(width * 0.05, height * 0.17, width * 0.24, height * 0.1, 10);
    noStroke();
    fill(0);
    textSize(map(width * 0.1, 0, 160, 8, 20));
    textStyle(ITALIC);
    text("Refresh The Page For Funky Interactive Backgrounds! All custom JavaScript by yours trully", width * 0.05, height * 0.18, width * 0.24, height * 0.1);
    textStyle(NORMAL);

    strokeWeight(5);
    stroke(0);
    line(0, 0, width, 0);
    strokeWeight(2);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight * 1.5 - 100);
}

function back1() {
    background(backR, backG, backB);
    name = "Circles";
    var smallR = 40;
    var cols = floor(windowWidth / smallR);
    var rows = floor(windowHeight / smallR);

    if (runOnce == false) {
        R1 = random(0, 255);
        G1 = random(0, 255);
        B1 = random(0, 255);

        R2 = random(0, 255);
        G2 = random(0, 255);
        B2 = random(0, 255);

        field = new Array(cols * 4);
        for (i = 0; i < cols * 4; i++) {
            field[i] = new Array(rows * 4);
            for (j = 0; j < rows * 4; j++) {
                field[i][j] = random(0, 1);
            }
        }
        runOnce = true;
    } else {
        //console.log("("+R1+", "+G1+", "+B1+")");
        cols = floor(windowWidth / smallR);
        rows = floor(windowHeight / smallR);
        noStroke();
        x = ((mouseX / smallR));
        y = ((mouseY / smallR));
        for (i = 0; i < cols * 2; i++) {
            for (j = 0; j < rows * 2; j++) {
                value = field[i][j];
                dist = 3 / sqrt((i - x) * (i - x) + (j - y) * (j - y));
                fill((R1 + value * 50) * (1 - dist) + R2 * dist, (G1 + value * 50) * (1 - dist) + G2 * dist, (B1 + value * 50) * (1 - dist) + B2 * dist, 100);
                ellipse(i * smallR, j * smallR, smallR * 1.5, smallR * 1.5);
            }
        }
    }
}

function back2() {
    background(backR, backG, backB);
    numPoints = 30;
    maxSpeed = random(0.1, 0.75);
    radiusOfVision = random(width * 6, width * 16);
    name = "Satellites";

    if (runOnce == false) {
        R1 = random(0, 255);
        G1 = random(0, 255);
        B1 = random(0, 255);

        R2 = random(0, 255);
        G2 = random(0, 255);
        B2 = random(0, 255);

        points = new Array();
        for (i = 0; i < numPoints; i++) {
            randPoint = {
                x: random(0, windowWidth),
                y: random(0, windowHeight),
                Vx: random(-maxSpeed, maxSpeed),
                Vy: random(-maxSpeed, maxSpeed)
            };
            points = points.concat(randPoint);
        }
        console.log("points array -> " + points);
        runOnce = true;
    } else {
        for (i = 0; i < numPoints; i++) {
            points[i].x += points[i].Vx;
            points[i].y += points[i].Vy;
            if (points[i].x < 0) {
                points[i].x = windowWidth;
            }
            if (points[i].x > windowWidth) {
                points[i].x = 0;
            }
            if (points[i].y < 0) {
                points[i].y = windowHeight;
            }
            if (points[i].y > windowHeight) {
                points[i].y = 0;
            }
            for (j = 0; j < numPoints; j++) {
                if (j == i) {
                    // do nothing
                } else {
                    distanceMouse = (points[i].x - mouseX) * (points[i].x - mouseX) + (points[i].y - mouseY) * (points[i].y - mouseY);
                    if (distanceMouse > (radiusOfVision - 1000)) {
                        //DO NOTHING
                    } else {
                        distStroke = map(distanceMouse, 0, radiusOfVision / 2, 1, 0);
                        strokeWeight(distStroke * 3);
                        //stroke(R1 * distStroke, G1 * distStroke, B1 * distStroke);
                        stroke(R1, G1, B1);
                        line(points[i].x, points[i].y, mouseX, mouseY);

                        distance = (points[i].x - points[j].x) * (points[i].x - points[j].x) + (points[i].y - points[j].y) * (points[i].y - points[j].y);
                        if (distance > (radiusOfVision + 100)) {
                            //do nothing
                        } else {
                            distStroke = map(distance, 0, radiusOfVision, 1, 0);
                            distStroke = max(distStroke, 0.5);
                            strokeWeight(distStroke * 3);
                            stroke(R1, G1, B1);
                            //stroke(R1 * distStroke, G1 * distStroke, B1 * distStroke);
                            line(points[i].x, points[i].y, points[j].x, points[j].y);

                        }
                    }
                }

            }
        }
    }
}

function back3() {
    numCircles = 125;
    radius = random(width * 0.05, width * 0.1);
    name = "Focus";

    if (runOnce == false) {
        background(backR, backG, backB);

        img = imgLoad;
        img.resize(width, img.height * width / img.width);
        //image(img, 0, 0);
        runOnce = true;

    } else {


        noStroke();
        for (i = 0; i <= numCircles; i++) {
            distance = random(0, radius);
            angle = random(0, 6.3);
            xCoor = mouseX + distance * cos(angle);
            yCoor = mouseY + distance * sin(angle);
            c = img.get(xCoor, yCoor);
            fill(c[0], c[1], c[2], 50);
            ellipse(xCoor, yCoor, random(5, 10));
        }
    }
}

function back4() {
    background(backR, backG, backB);

    boxWidth = 20;
    boxHeight = 20;
    name = "Camoflauge";


    if (runOnce == false) {

        t = 0;

        R1 = floor(random(0, 2)) * 255;
        G1 = floor(random(0, 2)) * 255;
        B1 = floor(random(0, 2)) * 255;

        R2 = 0 //random(0, 40);
        G2 = 0 //random(0, 40);
        B2 = 0 //random(0, 40);

        runOnce = true;
    } else {
        noStroke();
        for (let x = -boxWidth; x < width; x += boxWidth) {
            for (let y = -boxHeight; y < height; y += boxHeight) {
                val = noise(x / (width / 10), y / (height / 10), t);
                distance = (x - mouseX) * (x - mouseX) + (y - mouseY) * (y - mouseY);
                if ((x - mouseX) * (x - mouseX) + (y - mouseY) * (y - mouseY) < 9000) {
                    val += map(distance, 0, 9000, 0.25, 0);
                }
                fill((1 - val) * R1 + val * R2, (1 - val) * G1 + val * G2, (1 - val) * B1 + val * B2, 150);
                //rect(x - 1.333 * boxWidth, y - 1.333 * boxWidth, x + 2.333 * boxWidth, y + 2.333 * boxHeight);
                ellipse(x, y, 40, 40);
            }
        }
        t += 0.03;
    }
}

function back5() {

    numPoints = 40;
    name = "Orbits";
    strokeWeight(1);

    if (runOnce == false) {
        background(backR, backG, backB);

        R1 = random(0, 255);
        G1 = random(0, 255);
        B1 = random(0, 255);

        points = new Array();
        for (i = 0; i < numPoints; i++) {
            randPoint = {
                x: random(0, windowWidth),
                y: random(0, windowHeight),
                Vx: 0,
                Vy: 0,
                oldX: 0,
                oldY: 0,
                tail: new Array(),
                m: random(0.01, 0.005),
                color: random(-60, 60)
            };
            points = points.concat(randPoint);
        }
        console.log("points array -> " + points);
        runOnce = true;
    } else {
        for (i = 0; i < numPoints; i++) {
            points[i].oldX = points[i].x
            points[i].oldY = points[i].y

            points[i].Vx += (mouseX - points[i].x) * points[i].m;
            points[i].Vy += (mouseY - points[i].y) * points[i].m;

            points[i].Vx *= 0.95;
            points[i].Vy *= 0.95;

            points[i].x += points[i].Vx;
            points[i].y += points[i].Vy;

            stroke(R1 + points[i].color, G1 + points[i].color, B1 + points[i].color, 100);
            line(points[i].x, points[i].y, points[i].oldX, points[i].oldY);

        }
    }
}

function back6() {
    background(backR, backG, backB);
    numPoints = 60;
    name = "Memory";

    if (runOnce == false) {
        R1 = random(0, 255);
        G1 = random(0, 255);
        B1 = random(0, 255);

        R2 = random(0, 255);
        G2 = random(0, 255);
        B2 = random(0, 255);

        points = new Array();
        for (i = 0; i < numPoints; i++) {
            randPoint = {
                x: random(0, windowWidth),
                y: random(0, windowHeight),
                time: 0,
            }
            points[i] = (randPoint);
        }
        stage = 0;
        runOnce = true;
    } else {
        stage++;
        for (i = 0; i < numPoints; i++) {
            points[i].time++;
            t = map(points[i].time, 1, 100, 0, 1);
            fill(R1 * t + R2 * (1 - t), G1 * t + G2 * (1 - t), B1 * t + B2 * (1 - t), 150);
            noStroke();
            ellipse(points[i].x, points[i].y, windowWidth / 5, windowWidth / 5);
        }
        if (stage == 4) {
            stage = 0;
            for (i = 0; i < numPoints - 1; i++) {
                points[i] = points[i + 1];
            }
            randPoint = {
                x: mouseX,
                y: mouseY,
                time: 0,
            }
            points[numPoints - 1] = (randPoint);
        }
    }
}

function back7() {
    background(backR, backG, backB);
    name = "Polar";

    if (runOnce == false) {
        R1 = random(0, 255);
        G1 = random(0, 255);
        B1 = random(0, 255);

        runOnce = true;
    } else {
        background(backR, backG, backB);
        a = map(mouseX, 0, windowWidth, 0, 2);
        b = map(mouseY, 0, windowHeight, 0, 2);
        console.log("a" + a)
        console.log("b" + b)

        noFill();
        strokeWeight(5);
        stroke(R1, G1, B1);
        beginShape();
        for (i = 0; i <= 6.293 * 10; i += 0.1) {
            radius = i * 10 + 10 * a * sin(i * a * 10 / 6.283) + 3 * b * sin(i * b * 50 / 6.283);
            x = radius * cos(i) + windowWidth / 2;
            y = radius * sin(i) + windowHeight / 2;
            curveVertex(x, y);
        }
        endShape();

        noFill();
        strokeWeight(5);
        stroke(R1 + 50, G1 + 50, B1 + 50);
        beginShape();
        for (i = 0; i <= 6.293 * 10; i += 0.1) {
            radius = i * 10 + 10 * a * sin(i * (a + 0) * 10 / 6.283) + 3 * b * sin(i * (b + 0) * 50 / 6.283);
            x = -1 * radius * sin(i) + windowWidth / 2;
            y = radius * cos(i) + windowHeight / 2;
            curveVertex(x, y);
        }
        endShape();

        noFill();
        strokeWeight(5);
        stroke(R1 - 50, G1 - 50, B1 - 50);
        beginShape();
        for (i = 0; i <= 6.293 * 10; i += 0.1) {
            radius = i * 10 + 10 * a * sin(i * (a + 0) * 10 / 6.283) + 3 * b * sin(i * (b + 0) * 50 / 6.283);
            x = -1 * radius * sin(i) + windowWidth / 2;
            y = -1 * radius * cos(i) + windowHeight / 2;
            curveVertex(x, y);
        }
        endShape();

        noFill();
        strokeWeight(5);
        stroke(B1, G1, R1);
        beginShape();
        for (i = 0; i <= 6.293 * 10; i += 0.1) {
            radius = i * 10 + 10 * a * sin(i * (a + 0) * 10 / 6.283) + 3 * b * sin(i * (b + 0) * 50 / 6.283);
            x = radius * sin(i) + windowWidth / 2;
            y = -1 * radius * cos(i) + windowHeight / 2;
            curveVertex(x, y);
        }
        endShape();

    }
}

function back8() {
    background(backR, backG, backB);
    numPoints = 60;
    name = "Woosh";

    if (runOnce == false) {
        R1 = random(0, 255);
        G1 = random(0, 255);
        B1 = random(0, 255);

        R2 = random(0, 255);
        G2 = random(0, 255);
        B2 = random(0, 255);

        points = new Array();
        for (i = 0; i < numPoints; i++) {
            randPoint = {
                x: random(0, windowWidth),
                y: random(0, windowHeight),
                Vx: random(-4, 4),
                Vy: random(-7, -5),
                time: floor(random(0, 50)),
                x3: this.x,
                y3: this.y,
                x2: this.x,
                y2: this.y,
                x1: this.x,
                y1: this.y,
            }
            points[i] = (randPoint);
        }
        runOnce = true;
    } else {
        for (i = 0; i < numPoints; i++) {
            strokeWeight(3);
            stroke(R1, G1, B1);
            points[i].time++;
            line(points[i].x, points[i].y, points[i].x1, points[i].y1);
            line(points[i].x1, points[i].y1, points[i].x2, points[i].y2);
            line(points[i].x2, points[i].y2, points[i].x3, points[i].y3);
            noStroke();
            fill(R2, G2, B2);
            ellipse(points[i].x, points[i].y, 10);

            if (points[i].time % 5 == 0) {
                points[i].x3 = points[i].x2;
                points[i].y3 = points[i].y2;

                points[i].x2 = points[i].x1;
                points[i].y2 = points[i].y1;

                points[i].x1 = points[i].x;
                points[i].y1 = points[i].y;
            }

            points[i].x += points[i].Vx;
            points[i].y += points[i].Vy;
            points[i].Vy += 0.3;

            if (points[i].time > 100) {
                randPoint = {
                    x: mouseX,
                    y: mouseY,
                    Vx: random(-4, 4),
                    Vy: random(-7, -5),
                    time: floor(random(0, 25)),
                    x3: this.x,
                    y3: this.y,
                    x2: this.x,
                    y2: this.y,
                    x1: this.x,
                    y1: this.y,
                }
                points[i] = randPoint;
            }
        }
    }
}

function back9() {
    background(backR, backG, backB);
    name = "Bubbles";
    ageLim = 400

    if (runOnce == false) {
        R1 = random(0, 255);
        G1 = random(0, 255);
        B1 = random(0, 255);

        points = new Array();

        for (i = 0; i < 3; i++) {
            randPoint = {
                x: random(0, windowWidth),
                y: random(0, windowHeight),
                growth: random(0, 1),
                radius: 0,
                R: random(-30, 30),
                G: random(-30, 30),
                B: random(-30, 30),
                age: 0
            }
            points[i] = (randPoint);
        }

        runOnce = true;
    } else {
        for (i = 0; i < points.length; i++) {
            point = points[i];
            noStroke();
            fill(R1 + point.R, G1 + point.G, B1 + point.B, 255 * (ageLim - point.age - 5) / ageLim);

            point.radius += point.growth
            point.age++
            ellipse(point.x, point.y, 2 * point.radius);

            for (j = 0; j < points.length; j++) {
                otherPoint = points[j]
                if ((i != j) && ((point.radius + otherPoint.radius) >= sqrt((point.x - otherPoint.x) * (point.x - otherPoint.x) + (point.y - otherPoint.y) * (point.y - otherPoint.y)))) {
                    point.growth = 0.0
                    otherPoint.growth = 0.0
                    points[i] = point
                    points[j] = otherPoint
                }
            }
            if (point.age >= ageLim) {
                points.splice(i, 1);
            }
        }

        randPoint = {
            x: mouseX + random(-50, 50),
            y: mouseY + random(-50, 50),
            growth: random(0, 5),
            radius: 0,
            R: random(-30, 30),
            G: random(-30, 30),
            B: random(-30, 30),
            age: 0
        }
        points.push(randPoint)
    }
}
