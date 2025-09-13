let grid = [];
let cols, rows;
let numGrids = 20; // number of grids in each dimension
let grid_res; // computed size of each cell
let start, end;
let grid_mode = "Rectangles";
let algorithm = "A*";
let isDense = false; // connected to toggle
let denseGridNoStroke = 8; // if grid_res < this, draw grid without stroke

// padding values
let padLeft = 10;
let padRight = 10;
let padTop = 0;
let padBottom = 0;

function setup() {
    createCanvas(windowWidth, windowHeight);

    start = createVector(0, 0);
    end = createVector(0, 0);

    // dropdowns
    const dropdown = document.getElementById("gridModeDropdown");
    if (dropdown) {
        dropdown.addEventListener("change", () => {
            grid_mode = dropdown.value;
            createGrid(grid_mode, isDense);
        });
    }

    const algoDropdown = document.getElementById("algorithmDropdown");
    if (algoDropdown) {
        algoDropdown.addEventListener("change", () => {
            algorithm = algoDropdown.value;
        });
    }

    // number of grids input
    const gridNumberInput = document.getElementById("gridNumber");
    if (gridNumberInput) {
        gridNumberInput.addEventListener("change", () => {
            let val = parseInt(gridNumberInput.value) || 20;
            if (val < 5) val = 5;
            gridNumberInput.value = val;
            numGrids = val;
            createGrid(grid_mode, isDense);
        });
    }

    // toggle now controls isDense
    const denseToggle = document.getElementById("obstacleDensity");
    if (denseToggle) {
        denseToggle.addEventListener("change", () => {
            isDense = denseToggle.checked;
            console.log("Dense mode:", isDense);
            createGrid(grid_mode, isDense);
        });
    }

    // calculate button (does not reset grid)
    const calculateBtn = document.getElementById("calculateBtn");
    if (calculateBtn) {
        calculateBtn.addEventListener("click", () => {
            console.log("Would calculate path using:", algorithm);
        });
    }
}

function draw() {
    background(220);

    // compute grid_res based on number of grids
    grid_res = floor(min(width, height) / numGrids);

    cols = numGrids;
    rows = numGrids;

    calculatePadding();

    // reset start/end
    start.set(0, 0);
    end.set(cols - 1, rows - 1);

    // create grid if empty
    if (grid.length !== cols || grid[0]?.length !== rows) {
        createGrid(grid_mode, isDense);
    }

    // draw grid
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid_res < denseGridNoStroke) {
                noStroke();
            } else {
                stroke(200);
            }

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

    // overlay text
    fill(255, 0, 0);
    textSize(32);
    text("** Incomplete - Under Construction **", width / 2 - 200, height / 2 - 50, 400, 100);
}

function mouseDragged() {
    if (grid_mode === "Custom") {
        let brushRadius = max(1, floor(numGrids / 60));
        let iCenter = floor((mouseX - padLeft) / grid_res);
        let jCenter = floor((mouseY - padTop) / grid_res);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let dx = i - iCenter;
                let dy = j - jCenter;
                if (dx * dx + dy * dy <= brushRadius * brushRadius) {
                    grid[i][j] = 1;
                }
            }
        }
    }
}

function mousePressed() {
    if (grid_mode === "Custom") {
        let brushRadius = max(1, floor(numGrids / 50));
        let iCenter = floor((mouseX - padLeft) / grid_res);
        let jCenter = floor((mouseY - padTop) / grid_res);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let dx = i - iCenter;
                let dy = j - jCenter;
                if (dx * dx + dy * dy <= brushRadius * brushRadius) {
                    grid[i][j] = grid[i][j] === 1 ? 0 : 1;
                }
            }
        }
    }
}

function createGrid(mode, isDense) {
    grid = [];
    for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
            grid[i][j] = 0;
        }
    }

    if (mode === "Circle") {
        if (isDense) {
            let circleCount = 12 + floor(random(5)); // more circles
            for (let c = 0; c < circleCount; c++) {
                let cx = floor(random(cols));
                let cy = floor(random(rows));
                let r = floor(random(floor(cols / 30), floor(cols / 15))); // smaller circles
                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        if (dist(i, j, cx, cy) < r) grid[i][j] = 1;
                    }
                }
            }
        } else {
            let cx = floor(cols / 2);
            let cy = floor(rows / 2);
            let r = floor(cols / 4);
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    if (dist(i, j, cx, cy) < r) grid[i][j] = 1;
                }
            }
        }
    } else if (mode === "Rectangles") {
        let rectCount;
        if (numGrids <= 30) {
            rectCount = isDense ? max(1, floor(numGrids / 2)) : max(1, floor(numGrids / 4));
        } else {
            rectCount = isDense ? max(1, floor(numGrids / 4)) : max(1, floor(numGrids / 8));
        }
        let rectSize = max(1, floor(numGrids / 10));
        for (let n = 0; n < rectCount; n++) {
            let rx = floor(random(cols - rectSize));
            let ry = floor(random(rows - rectSize));
            for (let i = rx; i < rx + rectSize && i < cols; i++) {
                for (let j = ry; j < ry + rectSize && j < rows; j++) {
                    grid[i][j] = 1;
                }
            }
        }
    } else if (mode === "L-Shapes") {
        let LMultiplier = isDense ? 3 : 1;
        let armLength = max(1, floor(numGrids * 0.2));
        for (let n = 0; n < 3 * LMultiplier; n++) {
            let rx = floor(random(cols - armLength));
            let ry = floor(random(rows - armLength));
            for (let i = 0; i < armLength; i++) {
                grid[rx + i][ry] = 1;
                grid[rx][ry + i] = 1;
            }
        }
    } else if (mode === "Random") {
        let density = isDense ? 0.3 : 0.05; // updated fill percentages
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (random(1) < density) grid[i][j] = 1;
            }
        }
    }
    // Empty and Custom leave grid blank
}

function calculatePadding() {
    padTop = width < height ? height / 5 : 9 * height / 32;
    padBottom = width < height ? height / 5 : height / 6;

    let gridWidth = cols * grid_res;
    padLeft = max((width - gridWidth) / 2, 10);
    padRight = padLeft;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
