const tearScreen = document.querySelector(".tear-screen");
const canvas = document.querySelector(".tear-canvas");
const openButton = document.querySelector(".open-button");
const portfolio = document.querySelector(".portfolio");
const context = canvas.getContext("2d", { willReadFrequently: true });

let isTearing = false;
let lastPoint = null;
let hasOpened = false;

function drawCover() {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "#f4f0e8";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#25251f";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${Math.min(18, Math.max(14, width * 0.045))}px "Avenir Next", Avenir, sans-serif`;
  context.fillText("rip me", width / 2, height / 2);
  context.fillStyle = "#77756c";
  context.font = "12px " + '"Avenir Next", Avenir, sans-serif';
  context.fillText("drag anywhere", width / 2, height / 2 + 28);
}

function eraseAt(point) {
  context.save();
  context.globalCompositeOperation = "destination-out";
  context.lineWidth = 58;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  if (lastPoint) {
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
  } else {
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.1, point.y + 0.1);
  }
  context.stroke();
  context.restore();
  lastPoint = point;
}

function checkTearProgress() {
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let cleared = 0;
  const sampleStep = 4 * 32;
  for (let index = 3; index < pixels.length; index += sampleStep) {
    if (pixels[index] === 0) cleared += 1;
  }
  const totalSamples = Math.ceil(pixels.length / sampleStep);
  if (cleared / totalSamples > 0.36) openPortfolio();
}

function openPortfolio() {
  if (hasOpened) return;
  hasOpened = true;
  portfolio.hidden = false;
  portfolio.inert = false;
  portfolio.removeAttribute("aria-hidden");
  tearScreen.classList.add("is-opening");
  openButton.disabled = true;
  window.setTimeout(() => tearScreen.remove(), 700);
}

canvas.addEventListener("pointerdown", (event) => {
  isTearing = true;
  lastPoint = null;
  canvas.setPointerCapture(event.pointerId);
  eraseAt({ x: event.clientX, y: event.clientY });
});

canvas.addEventListener("pointermove", (event) => {
  if (!isTearing) return;
  eraseAt({ x: event.clientX, y: event.clientY });
});

canvas.addEventListener("pointerup", () => {
  if (!isTearing) return;
  isTearing = false;
  lastPoint = null;
  checkTearProgress();
});

canvas.addEventListener("pointercancel", () => {
  isTearing = false;
  lastPoint = null;
});

openButton.addEventListener("click", openPortfolio);
window.addEventListener("resize", drawCover);
drawCover();