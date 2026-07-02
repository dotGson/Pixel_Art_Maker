const canvas = document.getElementById("pixel-canvas");
const ctx = canvas.getContext("2d");

let gridSize = 16;
let cellSize = 0;
let grid = [];

let currentColor = "#000000";
let currentTool = "pen";
let isDrawing = false;
let hoveredCell = null;

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ff8800",
  "#8800ff",
  "#888888",
  "#553322",
  "#ff6688",
  "#88ff66",
  "#6688ff",
  "#ffcc00",
];

// Initialize the grid and canvas
function init() 
{
  grid = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill("#ffffff"),
  );

  cellSize = Math.floor(480 / gridSize);
  canvas.width = gridSize * cellSize;
  canvas.height = gridSize * cellSize;

  render();
}

// Render the grid onto the canvas
function render() 
{
  for (let row = 0; row < gridSize; row++) 
  {
    for (let col = 0; col < gridSize; col++) 
    {
      // Grid cells
      ctx.fillStyle = grid[row][col];
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

      // Grid intersection cell lines
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 0.2;
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);      
    }    
  }

  if (hoveredCell && !isDrawing) 
  {
    // Gets current cell position
    const { row, col } = hoveredCell;
    const previewColor = currentTool === "eraser" ? "#ffffff" : currentColor;

    // Sets cell color to preview color
    ctx.fillStyle = previewColor;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    ctx.globalAlpha = 1.0;
  }
}

// Map mouse position to grid cell
function getCellFromMouse(e) 
{
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);

  if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) 
  {
    return { row, col };
  }
  return null;
}

// Paint a single cell
function paintCell(row, col) 
{
  if (currentTool === "pen") 
  {
    grid[row][col] = currentColor;
  }
  else if (currentTool === "eraser") 
  {
    grid[row][col] = "#ffffff";
  }

  render();
}

// Mouse event handlers
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const cell = getCellFromMouse(e);
  if (cell) 
  {
    if (currentTool === "fill") 
    {
      floodFill(cell.row, cell.col, currentColor);
    } 
    else 
    {
      paintCell(cell.row, cell.col);
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  const cell = getCellFromMouse(e);
  hoveredCell = cell;
  if (isDrawing && currentTool !== "fill" && cell) 
  {
    paintCell(cell.row, cell.col);
  }
  else
  {
    render();
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  hoveredCell = null;
  render();
});

// Tactile event handlers
canvas.addEventListener("touchstart", (e) => {
  isDrawing = true;
  const cell = getCellFromMouse(e);
  if (cell) 
  {
    if (currentTool === "fill") 
    {
      floodFill(cell.row, cell.col, currentColor);
    } 
    else 
    {
      paintCell(cell.row, cell.col);
    }
  }
});

canvas.addEventListener("touchmove", (e) => {
  const cell = getCellFromMouse(e);
  hoveredCell = cell;
  if (isDrawing && currentTool !== "fill" && cell) 
  {
    paintCell(cell.row, cell.col);
  }
  else
  {
    render();
  }
});

canvas.addEventListener("touchend", () => {
  isDrawing = false;
});

function floodFill(row, col, newColor) 
{
  const targetColor = grid[row][col];
  if (targetColor === newColor) return;

  const stack = [[row, col]];
  while (stack.length > 0) 
  {
    const [r, c] = stack.pop();
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue;
    if (grid[r][c] !== targetColor) continue;

    grid[r][c] = newColor;

    stack.push([r - 1, c]);
    stack.push([r + 1, c]);
    stack.push([r, c - 1]);
    stack.push([r, c + 1]);
  }

  render();
}

function buildPalette() 
{
  // Build the color palette
  const palette = document.getElementById("color-palette");
  PRESET_COLORS.forEach((color) => {
    const swatch = document.createElement("div");
    swatch.classList.add("color-swatch");

    if (color === currentColor) swatch.classList.add("active");

    swatch.style.backgroundColor = color;

    swatch.addEventListener("click", () => {
      currentColor = color;
      document.getElementById("custom-color").value = color;
      document
        .querySelectorAll(".color-swatch")
        .forEach((s) => s.classList.remove("active"));
      swatch.classList.add("active");
    });
    palette.appendChild(swatch);
  });
}

// Custom color picker
document.getElementById("custom-color").addEventListener("input", (e) => {
  currentColor = e.target.value;
  document
    .querySelectorAll(".color-swatch")
    .forEach((s) => s.classList.remove("active"));
});

// Tool button switching
document.querySelectorAll(".tool-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentTool = btn.dataset.tool; 
    document
      .querySelectorAll(".tool-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Grid size switching
document.getElementById("grid-size").addEventListener("change", (e) => {
  const confirmed = confirm(
    "Changing grid size will clear your canvas. Continue?",
  );
  if (confirmed) {
    gridSize = parseInt(e.target.value);
    init();
  } else {
    e.target.value = gridSize;
  }
}); 

buildPalette();

//  PNG export
document.getElementById("export-btn").addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  const exportCtx = exportCanvas.getContext("2d");
  const exportCellSize = Math.max(16, Math.floor(512 / gridSize));
  exportCanvas.width = gridSize * exportCellSize;
  exportCanvas.height = gridSize * exportCellSize;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      exportCtx.fillStyle = grid[row][col];
      exportCtx.fillRect(
        col * exportCellSize,
        row * exportCellSize,
        exportCellSize,
        exportCellSize,
      );
    }
  }

  const link = document.createElement("a");
  link.download = "pixel-art.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});

// --- Step 7: Start the app! ---

init();
