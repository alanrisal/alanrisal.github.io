const tearScreen = document.querySelector(".tear-screen");
const canvas = document.querySelector(".tear-canvas");
const openButton = document.querySelector(".open-button");
const portfolio = document.querySelector(".portfolio");
const context = canvas.getContext("2d");

let hasOpened = false;
let pointer = { x: 0, y: 0, down: false, lastX: 0, lastY: 0 };
let draggedNode = null;

const cloth = {
  cols: 18,
  rows: 14,
  spacing: 28,
  gravity: 0.14,
  points: [],
  constraints: [],
  tension: 0.15
};

function createCloth() {
  const { cols, rows, spacing } = cloth;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const startX = (width - (cols - 1) * spacing) / 2;
  const startY = 60;

  cloth.points = [];
  cloth.constraints = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      cloth.points.push({
        x,
        y,
        oldX: x,
        oldY: y,
        pinned: row === 0,
        vx: 0,
        vy: 0
      });
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const point = cloth.points[index];

      if (col < cols - 1) {
        cloth.constraints.push([index, index + 1, spacing]);
      }
      if (row < rows - 1) {
        cloth.constraints.push([index, index + cols, spacing]);
      }
      if (row < rows - 1 && col < cols - 1) {
        cloth.constraints.push([index, index + cols + 1, Math.hypot(spacing, spacing)]);
      }
      if (row < rows - 1 && col > 0) {
        cloth.constraints.push([index, index + cols - 1, Math.hypot(spacing, spacing)]);
      }

      if (row === 0) {
        point.pinned = true;
        point.x = startX + col * spacing;
        point.y = startY + row * spacing;
        point.oldX = point.x;
        point.oldY = point.y;
      }
    }
  }
}

function getPointIndexFromPointer(x, y) {
  let bestPoint = null;
  let bestDistance = Infinity;

  for (const point of cloth.points) {
    const dist = Math.hypot(point.x - x, point.y - y);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestPoint = point;
    }
  }

  return bestDistance < 26 ? bestPoint : null;
}

function applyPointerForce(point, x, y, strength = 1) {
  if (!point) return;
  const dx = x - point.x;
  const dy = y - point.y;
  const dist = Math.hypot(dx, dy) || 0.0001;

  if (dist < 42) {
    const pushX = (dx / dist) * strength * 0.8;
    const pushY = (dy / dist) * strength * 0.8;
    point.x += pushX;
    point.y += pushY;
    point.oldX += pushX;
    point.oldY += pushY;
  }
}

function tearAround(x, y, radius = 30) {
  for (const point of cloth.points) {
    const dist = Math.hypot(point.x - x, point.y - y);
    if (dist < radius) {
      point.pinned = false;
      point.vx = (point.x - point.oldX) * 0.45;
      point.vy = (point.y - point.oldY) * 0.45;
    }
  }

  cloth.constraints = cloth.constraints.filter(([aIndex, bIndex]) => {
    const a = cloth.points[aIndex];
    const b = cloth.points[bIndex];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    return dist < 48 || (a.pinned && b.pinned) || (Math.abs(a.x - x) < 60 && Math.abs(a.y - y) < 60 ? false : true);
  });
}

function updateCloth() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  for (const point of cloth.points) {
    if (point.pinned) continue;

    const vx = (point.x - point.oldX) * 0.98;
    const vy = (point.y - point.oldY) * 0.98 + cloth.gravity;

    point.oldX = point.x;
    point.oldY = point.y;
    point.x += vx;
    point.y += vy;

    if (point.x < 0) point.x = 0;
    if (point.x > width) point.x = width;
    if (point.y > height + 120) point.y = height + 120;
  }

  for (let i = 0; i < 8; i += 1) {
    for (const [aIndex, bIndex, restLength] of cloth.constraints) {
      const a = cloth.points[aIndex];
      const b = cloth.points[bIndex];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.0001;
      const difference = (distance - restLength) / distance;

      if (!a.pinned) {
        a.x += dx * 0.5 * difference;
        a.y += dy * 0.5 * difference;
      }
      if (!b.pinned) {
        b.x -= dx * 0.5 * difference;
        b.y -= dy * 0.5 * difference;
      }
    }
  }

  let freePoints = 0;
  for (const point of cloth.points) {
    if (!point.pinned) freePoints += 1;
  }

  if (freePoints > 70) {
    openPortfolio();
  }
}

function drawCloth() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f4f0e8";
  context.fillRect(0, 0, width, height);

  for (const [aIndex, bIndex] of cloth.constraints) {
    const a = cloth.points[aIndex];
    const b = cloth.points[bIndex];
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.strokeStyle = "rgba(28, 27, 26, 0.9)";
    context.lineWidth = 1.6;
    context.stroke();
  }

  context.save();
  context.fillStyle = "#1c1b1a";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "600 44px 'Avenir Next', Avenir, sans-serif";
  context.fillText("rip me", width / 2, height / 2 - 12);
  context.font = "12px 'Avenir Next', Avenir, sans-serif";
  context.fillStyle = "rgba(28, 27, 26, 0.7)";
  context.fillText("drag, pull, and tear away", width / 2, height / 2 + 26);
  context.restore();
}

function loop() {
  if (!hasOpened) {
    updateCloth();
    drawCloth();
  }
  requestAnimationFrame(loop);
}

function openPortfolio() {
  if (hasOpened) return;
  hasOpened = true;
  portfolio.hidden = false;
  portfolio.inert = false;
  tearScreen.classList.add("is-opening");
  openButton.disabled = true;
  window.setTimeout(() => tearScreen.remove(), 700);
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * ratio);
  canvas.height = Math.round(window.innerHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  createCloth();
}

canvas.addEventListener("pointerdown", (event) => {
  const x = event.clientX;
  const y = event.clientY;
  const hit = getPointIndexFromPointer(x, y);

  if (hit) {
    draggedNode = hit;
    hit.pinned = false;
    hit.x = x;
    hit.y = y;
    hit.oldX = x;
    hit.oldY = y;
  }

  pointer.down = true;
  pointer.x = x;
  pointer.y = y;
  pointer.lastX = x;
  pointer.lastY = y;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  const x = event.clientX;
  const y = event.clientY;
  pointer.x = x;
  pointer.y = y;

  if (pointer.down && draggedNode) {
    draggedNode.x = x;
    draggedNode.y = y;
    draggedNode.oldX = x - (x - pointer.lastX) * 0.2;
    draggedNode.oldY = y - (y - pointer.lastY) * 0.2;
  }

  if (pointer.down) {
    const nearby = getPointIndexFromPointer(x, y);
    if (nearby) {
      applyPointerForce(nearby, x, y, 2.6);
    }
    tearAround(x, y, 32);
  }

  pointer.lastX = x;
  pointer.lastY = y;
});

canvas.addEventListener("pointerup", () => {
  pointer.down = false;
  draggedNode = null;
});

canvas.addEventListener("pointerleave", () => {
  pointer.down = false;
  draggedNode = null;
});

openButton.addEventListener("click", openPortfolio);
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
requestAnimationFrame(loop);