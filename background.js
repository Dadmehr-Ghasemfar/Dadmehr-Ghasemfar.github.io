var canvas;

function setup() {
    canvas = createCanvas(windowWidth, windowHeight * 5);
    canvas.position(0, 0);
    canvas.style('z-index', '-1')

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


    tails = new Array();
    num_tails = map(windowWidth, 0, 2000, 0, 70);
    for (i = 0; i < num_tails; i++) {
        random_tail = create_random_tail();
        tails = tails.concat(random_tail);
    }
}

function draw() {
    background(Cback.r, Cback.g, Cback.b);
    noStroke();

    for (i = 0; i < tails.length; i++) {
        t = tails[i]
        strokeWeight(t.width);

        stroke(t.r, t.g, t.b, 250);
        line(t.x, t.y, t.x, t.y - t.tail_len * 0.333);

        stroke(t.r, t.g, t.b, 150);
        line(t.x, t.y, t.x, t.y - t.tail_len * 0.666);

        stroke(t.r, t.g, t.b, 50);
        line(t.x, t.y, t.x, t.y - t.tail_len * 0.999);

        t.y += t.velocity
        if (t.y > windowHeight * 5.5) {
            random_tail = create_random_tail();
            tails[i] = (random_tail);
        }
    }



}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight * 5);
}

function create_random_tail() {
    random_tail = {
        x: random(0, windowWidth),
        y: -50,
        width: random() * 20 + 10,
        velocity: random() * 5 + 0.5,
        color_indx: random(),
        r: 0,
        g: 0,
        b: 0,
        tail_len: random() * 200 + 100,
    };

    if (random_tail.color_indx <= 0.25) {
        random_tail.r = C1.r
        random_tail.g = C1.g
        random_tail.b = C1.b
    } else if (random_tail.color_indx <= 0.50) {
        random_tail.r = C2.r
        random_tail.g = C2.g
        random_tail.b = C2.b
    } else if (random_tail.color_indx <= 0.75) {
        random_tail.r = C3.r
        random_tail.g = C3.g
        random_tail.b = C3.b
    } else if (random_tail.color_indx <= 0.999) {
        random_tail.r = C4.r
        random_tail.g = C4.g
        random_tail.b = C4.b
    }
    
    return random_tail;
}
