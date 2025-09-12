let grid = [];
let cols, rows;
let grid_res = 20;
let start, end;
let grid_mode = "Rectangles";
let algorithm = "A*";
let obstacleLevel = "Low";

// padding values
let padLeft = 10;
let padRight = 10;
let padTop = 0;
let padBottom = 0;

function setup() {
    createCanvas(windowWidth, windowHeight);

    start = createVector(0, 0);
    end = createVector(0, 0);

    // hook into HTML dropdown
    const dropdown = document.getElementById("gridModeDropdown");
    if (dropdown) {
        dropdown.addEventListener("change", () => {
            grid_mode = dropdown.value;
            createGrid(grid_mode);
        });
    }

    const algoDropdown = document.getElementById("algorithmDropdown");
    if (algoDropdown) {
        algoDropdown.addEventListener("change", () => {
            algorithm = algoDropdown.value;
            // Here you can call a function if you want to react immediately
            // e.g., updateAlgorithm(algorithm);
        });
    }

    const obstacleToggle = document.getElementById("obstacleToggle");

    if (obstacleToggle) {
        obstacleToggle.addEventListener("change", () => {
            obstacleLevel = obstacleToggle.checked ? "High" : "Low";
            console.log("Obstacle level:", obstacleLevel);
            // Optionally, update your grid generation logic here
        });
    }
}

function draw() {
    background(220);

    // recalc padding and grid size dynamically
    calculatePadding();
    cols = floor((width - padLeft - padRight) / grid_res);
    rows = floor((height - padTop - padBottom) / grid_res);

    // reset start/end if needed
    start.set(0, 0);
    end.set(cols - 1, rows - 1);

    // create grid if empty (first frame or after resize)
    if (grid.length !== cols || grid[0]?.length !== rows) {
        createGrid(grid_mode);
    }

    // draw grid
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            stroke(200);
            if (grid[i][j] === 1) {
                fill(0); // obstacle
            } else if (grid[i][j] === 2) {
                fill(255, 0, 0); // path
            } else {
                fill(255); // free
            }
            rect(padLeft + i * grid_res, padTop + j * grid_res, grid_res, grid_res);
        }
    }

    // draw start and end
    fill(0, 255, 0);
    rect(padLeft + start.x * grid_res, padTop + start.y * grid_res, grid_res, grid_res);
    fill(0, 0, 255);
    rect(padLeft + end.x * grid_res, padTop + end.y * grid_res, grid_res, grid_res);

    fill(255, 0, 0);
    textSize(32);
    text("** Incomplete - Under Construction **", width / 2 - 200, height / 2 - 50, 400, 100);
}

function mouseDragged() {
    if (grid_mode === "Custom") {
        let i = floor((mouseX - padLeft) / grid_res);
        let j = floor((mouseY - padTop) / grid_res);
        if (i >= 0 && i < cols && j >= 0 && j < rows) {
            grid[i][j] = 1;
        }
    }
}

function createGrid(mode) {
    grid = [];
    for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
            grid[i][j] = 0;
        }
    }

    if (mode === "Circle") {
        let cx = floor(cols / 2);
        let cy = floor(rows / 2);
        let r = min(cols, rows) / 4;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let d = dist(i, j, cx, cy);
                if (d < r) grid[i][j] = 1;
            }
        }
    } else if (mode === "Rectangles") {
        for (let n = 0; n < 5; n++) {
            let rx = floor(random(cols - 5));
            let ry = floor(random(rows - 5));
            let rw = floor(random(3, 6));
            let rh = floor(random(3, 6));
            for (let i = rx; i < rx + rw && i < cols; i++) {
                for (let j = ry; j < ry + rh && j < rows; j++) {
                    grid[i][j] = 1;
                }
            }
        }
    } else if (mode === "L-Shapes") {
        for (let n = 0; n < 3; n++) {
            let rx = floor(random(cols - 6));
            let ry = floor(random(rows - 6));
            for (let i = 0; i < 5; i++) {
                grid[rx + i][ry] = 1;
                grid[rx][ry + i] = 1;
            }
        }
    } else if (mode === "Random") {
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (random(1) < 0.2) grid[i][j] = 1;
            }
        }
    }
    // Empty and Custom leave grid blank
}

// calculate padding dynamically and center grid horizontally
function calculatePadding() {
    let gridWidth, gridHeight;

    if (width < height) {
        // vertical
        padTop = height / 5;
        padBottom = height / 5;
    } else {
        // horizontal → add more top padding
        padTop = 9 * height / 32; // increased from height/4
        padBottom = height / 6;
    }

    cols = floor((width - 20) / grid_res);
    rows = floor((height - padTop - padBottom) / grid_res);

    gridWidth = cols * grid_res;
    gridHeight = rows * grid_res;

    padLeft = (width - gridWidth) / 2;
    padRight = padLeft;

    if (padLeft < 10) padLeft = 10;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
