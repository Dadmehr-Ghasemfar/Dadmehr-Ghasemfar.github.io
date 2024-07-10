var canvas;

function setup() {
    canvas = createCanvas(windowWidth, windowHeight*5);
    canvas.position(0, 0);
    canvas.style('z-index', '-1')
    R1 = 150;
    G1 = 198;
    B1 = 217;
    color_dev = 30;

    points = new Array();
    numPoints = 30;
    for (i = 0; i < numPoints; i++) {
        randPoint = {
            x: random(0, windowWidth),
            y: random(0, windowHeight*3),
            r: 0,
            rMax: random(300, 800),
            rV: random(1, 4),
            R: R1 + random(-color_dev, color_dev),
            G: G1 + random(-color_dev, color_dev),
            B: B1 + random(-color_dev, color_dev),
            t: 0,
            tMax: random(100,300)
        };
        points = points.concat(randPoint);
    }
}

function draw() {
    background(R1, G1, B1);
    noStroke();

    for (i = 0; i < points.length; i++) {
        fill(points[i].R, points[i].G, points[i].B, map(points[i].r, 0, points[i].rMax, 300, 0));
        ellipse(points[i].x, points[i].y, points[i].r);
        points[i].r += points[i].rV;

        points[i].t++;
        if (points[i].t > points[i].tMax) {
            randPoint = {
                x: random(0, windowWidth),
                y: random(0, windowHeight*5),
                r: 0,
                rMax: random(50, 400),
                rV: random(1, 4),
                R: R1 + random(-color_dev, color_dev),
                G: G1 + random(-color_dev, color_dev),
                B: B1 + random(-color_dev, color_dev),
                t: 0,
                tMax: random(100, 300)
            };
            points[i] = (randPoint);
        }
    }



}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight*5);
}
