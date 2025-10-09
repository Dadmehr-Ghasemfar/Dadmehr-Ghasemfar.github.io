let grid = [];
let cols, rows;
let numGrids = 20; // number of grids in each dimension
let grid_res; // computed size of each cell
let start, end;
let grid_mode = "Rectangles";
let algorithm = "A*";
let isDense = false; // connected to toggle
let denseGridNoStroke = 8; // if grid_res < this, draw grid without stroke

// A* algorithm variables
let openSet = [];
let closedSet = [];
let path = [];
let isSolving = false;
let noSolution = false;

// padding values
let padLeft = 10;
let padRight = 10;
let padTop = 0;
let padBottom = 0;

// Cell class for A* algorithm
class Cell {
    constructor(i, j) {
        this.i = i;
        this.j = j;
        this.f = 0; // total cost
        this.g = 0; // cost from start
        this.h = 0; // heuristic to end
        this.neighbors = [];
        this.previous = null;
        this.wall = false;
    }

    addNeighbors(grid) {
        let i = this.i;
        let j = this.j;

        // 4-direction movement (up, down, left, right)
        if (i < cols - 1) this.neighbors.push(grid[i + 1][j]);
        if (i > 0) this.neighbors.push(grid[i - 1][j]);
        if (j < rows - 1) this.neighbors.push(grid[i][j + 1]);
        if (j > 0) this.neighbors.push(grid[i][j - 1]);

        // 8-direction movement (add diagonals)
        if (i < cols - 1 && j < rows - 1) this.neighbors.push(grid[i + 1][j + 1]); // SE
        if (i < cols - 1 && j > 0) this.neighbors.push(grid[i + 1][j - 1]); // NE
        if (i > 0 && j < rows - 1) this.neighbors.push(grid[i - 1][j + 1]); // SW
        if (i > 0 && j > 0) this.neighbors.push(grid[i - 1][j - 1]); // NW
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    start = createVector(0, 0);
    end = createVector(0, 0);

    // dropdowns
    const dropdown = document.getElementById("gridModeDropdown");
    if (dropdown) {
        dropdown.addEventListener("change", () => {
            grid_mode = dropdown.value;
            resetSolving();
            createGrid(grid_mode, isDense);
        });
    }

    const algoDropdown = document.getElementById("algorithmDropdown");
    if (algoDropdown) {
        algoDropdown.addEventListener("change", () => {
            algorithm = algoDropdown.value;
            resetSolving();
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
            resetSolving();
            createGrid(grid_mode, isDense);
        });
    }

    // toggle now controls isDense
    const denseToggle = document.getElementById("obstacleDensity");
    if (denseToggle) {
        denseToggle.addEventListener("change", () => {
            isDense = denseToggle.checked;
            console.log("Dense mode:", isDense);
            resetSolving();
            createGrid(grid_mode, isDense);
        });
    }

    // calculate button - NOW SOLVES THE GRID
    const calculateBtn = document.getElementById("calculateBtn");
    if (calculateBtn) {
        calculateBtn.addEventListener("click", () => {
            console.log("Calculating path using:", algorithm);
            resetSolving();
            if (algorithm === "A*") {
                solveAStar();
            }
            // Add other algorithms here later
        });
    }
}

function draw() {
    background(220);

    let availableHeight = height - 350; // Reserve space for bottom controls
    let availableWidth = width - 40; // Reserve some side padding
    grid_res = floor(min(availableWidth, availableHeight) / numGrids);

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

    drawGrid();

    // If solving with A*, continue the algorithm step by step
    if (isSolving && algorithm === "A*") {
        if (!stepAStar()) {
            isSolving = false;
            if (path.length === 0) {
                noSolution = true;
                console.log("No solution found!");
            }
        }
    }
}

function solveAStar() {
    // Convert grid to A* cells
    let aStarGrid = [];
    for (let i = 0; i < cols; i++) {
        aStarGrid[i] = [];
        for (let j = 0; j < rows; j++) {
            let cell = new Cell(i, j);
            cell.wall = (grid[i][j] === 1); // obstacles are walls
            aStarGrid[i][j] = cell;
        }
    }

    // Add neighbors to each cell
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            aStarGrid[i][j].addNeighbors(aStarGrid);
        }
    }

    // Initialize open and closed sets
    openSet = [];
    closedSet = [];
    path = [];

    let startCell = aStarGrid[start.x][start.y];
    let endCell = aStarGrid[end.x][end.y];

    // CRITICAL FIX: Calculate heuristic for start cell
    startCell.h = heuristic(startCell, endCell);
    startCell.f = startCell.g + startCell.h; // g=0, so f = h

    openSet.push(startCell);
    isSolving = true;
    noSolution = false;

    // Store the A* grid for the step function
    window.aStarGrid = aStarGrid;
    window.endCell = endCell;
}

function stepAStar() {
    if (openSet.length > 0) {
        // Find cell with lowest f cost
        let winner = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[winner].f) {
                winner = i;
            }
        }
        let current = openSet[winner];

        // Check if we reached the end
        if (current === window.endCell) {
            console.log("Path found!");
            let temp = current;
            path = [];
            while (temp.previous) {
                path.push(temp);
                temp = temp.previous;
            }
            return false;
        }

        openSet.splice(winner, 1);
        closedSet.push(current);

        let neighbors = current.neighbors;
        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];

            if (closedSet.includes(neighbor) || neighbor.wall) {
                continue;
            }

            // Calculate cost - diagonals cost more (√2 ≈ 1.4)
            let isDiagonal = (abs(neighbor.i - current.i) + abs(neighbor.j - current.j)) === 2;
            let tempG = current.g + (isDiagonal ? 1.4 : 1);

            let newPath = false;
            if (openSet.includes(neighbor)) {
                if (tempG < neighbor.g) {
                    neighbor.g = tempG;
                    newPath = true;
                }
            } else {
                neighbor.g = tempG;
                newPath = true;
                openSet.push(neighbor);
            }

            if (newPath) {
                neighbor.h = heuristic(neighbor, window.endCell);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.previous = current;
            }
        }
        return true;
    } else {
        console.log("No solution!");
        return false;
    }
}

function heuristic(a, b) {
    // Manhattan distance
    return abs(a.i - b.i) + abs(a.j - b.j);
}

function resetSolving() {
    isSolving = false;
    noSolution = false;
    openSet = [];
    closedSet = [];
    path = [];
    window.aStarGrid = null;
    window.endCell = null;
}

function mouseDragged() {
    if (grid_mode === "Custom") {
        resetSolving();
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
        resetSolving();
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
    } else {
        // NEW: Handle start/end placement in all modes except when actively drawing
        let i = floor((mouseX - padLeft) / grid_res);
        let j = floor((mouseY - padTop) / grid_res);

        // Check if click is within grid bounds
        if (i >= 0 && i < cols && j >= 0 && j < rows && grid[i][j] !== 1) {
            resetSolving();

            if (keyIsPressed && keyCode === SHIFT) {
                // Shift+click to set end point
                end.set(i, j);
            } else {
                // Regular click to set start point
                start.set(i, j);
            }
        }
    }
}

function createGrid(mode, isDense) {
    resetSolving();
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

function drawGrid() {
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
            } else if (isSolving && window.aStarGrid) {
                // Show algorithm progress
                let cell = window.aStarGrid[i][j];
                if (closedSet.includes(cell)) {
                    fill(255, 100, 100); // checked cells - light red
                } else if (openSet.includes(cell)) {
                    fill(100, 255, 100); // cells to check - light green
                } else {
                    fill(255); // free
                }
            } else {
                fill(255); // free
            }
            rect(padLeft + i * grid_res, padTop + j * grid_res, grid_res, grid_res);
        }
    }

    // draw path if found
    if (path.length > 0) {
        fill(255, 0, 0); // red for path
        for (let i = 0; i < path.length; i++) {
            let cell = path[i];
            rect(padLeft + cell.i * grid_res, padTop + cell.j * grid_res, grid_res, grid_res);
        }
    }

    // draw start and end
    fill(0, 255, 0); // green for start
    rect(padLeft + start.x * grid_res, padTop + start.y * grid_res, grid_res, grid_res);
    fill(0, 0, 255); // blue for end
    rect(padLeft + end.x * grid_res, padTop + end.y * grid_res, grid_res, grid_res);

    // Show no solution message
    if (noSolution) {
        fill(255, 0, 0);
        textSize(24);
        text("No Path Found!", width / 2 - 80, padTop - 30);
    }

    // overlay text
    fill(255, 0, 0);
    textSize(32);
    //text("** Incomplete - Under Construction **", width / 2 - 200, height / 2 - 50, 400, 100);
}

function calculatePadding() {
    padTop = width < height ? height / 5 : 9 * height / 32;
    padBottom = width < height ? height / 3 : height / 4;

    let gridWidth = cols * grid_res;
    padLeft = max((width - gridWidth) / 2, 10);
    padRight = padLeft;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
