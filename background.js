var background_ID = localStorage.getItem("backgroundMode") || "stripes";
var window_height_factor = 3;
var canvas;
var run_once = false;

backR = 255;
backG = 255;
backB = 255;

function setup() {
    canvas = createCanvas(windowWidth, windowHeight * window_height_factor);
    canvas.position(0, 0);
    canvas.style("z-index", "-1");

    Cback = {
        r: 255,
        g: 255,
        b: 255
    };

    C1 = {
        r: 71,
        g: 122,
        b: 145
    };

    C2 = {
        r: 169,
        g: 205,
        b: 212
    };

    C3 = {
        r: 214,
        g: 170,
        b: 88
    };

    C4 = {
        r: 225,
        g: 235,
        b: 240
    };
}

function draw() {
    switch (background_ID) {
        case "stripes":
            background_1();
            break;
        case "focus":
            background_2();
            break;
        case "bubbles":
            background_3();
            break;
        default:
            background_1();
            break;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight * window_height_factor);
}

function background_1() {
    background(backR, backG, backB);
    noStroke();

    if (run_once == false) {
        points = new Array();
        num_points = map(windowWidth, 0, 2000, 0, 70);
        for (i = 0; i < num_points; i++) {
            random_point = create_random_points();
            points = points.concat(random_point);
        }
        run_once = true;

    } else {
        for (i = 0; i < points.length; i++) {
            t = points[i];
            strokeWeight(t.radius);

            stroke(t.r, t.g, t.b, 250);
            line(t.x, t.y, t.x, t.y - t.tail_len * 0.333);

            stroke(t.r, t.g, t.b, 150);
            line(t.x, t.y, t.x, t.y - t.tail_len * 0.666);

            stroke(t.r, t.g, t.b, 50);
            line(t.x, t.y, t.x, t.y - t.tail_len * 0.999);

            t.y += t.velocity;
            if (t.y > windowHeight * window_height_factor) {
                random_point = create_random_points();
                points[i] = random_point;
            }
        }
    }
}

function background_2() {
    if (run_once == false) {
        background(backR, backG, backB);
        numCircles = 200;
        max_radius_circle = map(windowWidth, 100, 2000, 50, 100);

        let isVertical = windowHeight / windowWidth > 1;
        let numPhotos = 7;
        let randVar = floor(random(1, numPhotos + 1));

        let imagePath;
        if (isVertical) {
            imagePath = 'images/img_vert' + randVar + '.jpg';
        } else {
            imagePath = 'images/img_hor' + randVar + '.jpg';
        }

        console.log("Image: " + imagePath);

        img = loadImage(imagePath);
        run_once = true;
        frame_count = 0;
    } else {
        noStroke();
        frame_count++;
        let scale, newWidth, newHeight;
        let isVertical = windowHeight / windowWidth > 1;

        if (isVertical) {
            scale = 1.2 * windowHeight / img.height;
        } else {
            scale = 1.2 * windowWidth / img.width;
        }
        newWidth = img.width * scale;
        newHeight = img.height * scale;

        let xOffset = (windowWidth - newWidth) / 2;
        let yOffset = (windowHeight - newHeight) / 2;

        radius_circle = max(map(frame_count, 0, 1400, max_radius_circle, 10), 10);
        console.log("radius_circle = " + radius_circle);

        for (let i = 0; i <= numCircles; i++) {
            let xCoor = random(windowWidth * 2) - 200;
            let yCoor = random(windowHeight * 3.5) - 200;

            let sampleX = map(xCoor - xOffset, 0, newWidth, 0, img.width);
            let sampleY = map(yCoor - yOffset, 0, newHeight, 0, img.height);

            if (
                sampleX >= 0 && sampleX < img.width &&
                sampleY >= 0 && sampleY < img.height
            ) {
                let c = img.get(sampleX, sampleY);
                fill(c[0], c[1], c[2], 50);
                ellipse(xCoor, yCoor, random(3, radius_circle));
            }
        }
    }
}


function background_3() {
    background(backR, backG, backB);

    if (run_once == false) {
        ageLim = 900;
        R1 = random(0, 255);
        G1 = random(0, 255);
        B1 = random(0, 255);

        points = new Array();
        for (i = 0; i < 40; i++) {
            random_point = {
                x: random(0, windowWidth),
                y: random(0, windowHeight),
                growth: random(0, 1),
                radius: 0,
                R: 0,
                G: 0,
                B: 0,
                age: 0,
                color_indx: random()
            }
            random_color = pick_color_random(random_point.color_indx);
            random_point.R = random_color[0];
            random_point.G = random_color[1];
            random_point.B = random_color[2];
            points[i] = (random_point);
        }

        run_once = true;
    } else {
        for (i = 0; i < points.length; i++) {
            point = points[i];
            noStroke();
            fill(point.R, point.G, point.B, 255 * (ageLim - point.age - 5) / ageLim);

            point.radius += point.growth;
            point.age++;
            ellipse(point.x, point.y, 2 * point.radius);

            for (j = 0; j < points.length; j++) {
                otherPoint = points[j];
                if ((i != j) && ((point.radius + otherPoint.radius) >= sqrt((point.x - otherPoint.x) * (point.x - otherPoint.x) + (point.y - otherPoint.y) * (point.y - otherPoint.y)))) {
                    point.growth = 0.0;
                    otherPoint.growth = 0.0;
                    points[i] = point;
                    points[j] = otherPoint;
                }
            }
            if (point.age >= ageLim) {
                points.splice(i, 1);
            }
        }

        //theta = random(0, 6.28318);
        //cursor_radius = random(0, 100);
        random_point = {
            x: random(0, width), //mouseX + cursor_radius * Math.cos(theta),
            y: random(0, height), //mouseY + cursor_radius * Math.sin(theta),
            growth: random(0, 0.2),
            radius: 0,
            R: 0,
            G: 0,
            B: 0,
            age: 0,
            color_indx: random()
        }
        random_color = pick_color_random(random_point.color_indx);
        random_point.R = random_color[0];
        random_point.G = random_color[1];
        random_point.B = random_color[2];
        points.push(random_point);

    }
}

function create_random_points() {
    random_point = {
        x: random(0, windowWidth),
        y: -50,
        radius: random() * 20 + 10,
        velocity: random() * 0.85 + 0.15,
        color_indx: random(),
        r: 0,
        g: 0,
        b: 0,
        tail_len: random() * 200 + 100
    };
    random_color = pick_color_random(random_point.color_indx);
    random_point.r = random_color[0];
    random_point.g = random_color[1];
    random_point.b = random_color[2];

    return random_point;
}

function pick_color_random(color_indx) {
    if (color_indx <= 0.25) {
        return [C1.r, C1.g, C1.b];
    } else if (color_indx <= 0.5) {
        return [C2.r, C2.g, C2.b];
    } else if (color_indx <= 0.75) {
        return [C3.r, C3.g, C3.b];
    } else if (color_indx <= 1.0) {
        return [C4.r, C4.g, C4.b];
    }
}

function setBackgroundMode(mode) {
    if (mode == "stripes" || mode == "bubbles" || mode == "focus") {
        localStorage.setItem("backgroundMode", mode);
        background_ID = mode;
        run_once = false;
        console.log("Background changed to " + mode);
    }
}

function toggleDropdown() {
    document.getElementById("dropdownMenu").classList.toggle("show");
}

window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.remove("show");
        }
    }
};
