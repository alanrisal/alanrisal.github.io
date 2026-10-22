/* Inspired by https://github.com/dissimulate/Tearable-Cloth:
 * Verlet integration, pinned points, and breakable distance constraints.
 * Reimplemented for this portfolio with textured faces and Pointer Events.
 */
(() => {
  const cover = document.querySelector('.tear-screen');
  const canvas = document.querySelector('.tear-canvas');
  const portfolio = document.querySelector('.portfolio');
  const context = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // Keep the portfolio readable without JavaScript, canvas, or animation.
  if (!context || reducedMotion.matches || location.hash) { cover.remove(); return; }
  const texture = document.createElement('canvas');
  const ink = texture.getContext('2d');
  const pointer = { down: false, id: null, x: 0, y: 0, startX: 0, startY: 0, point: null };
  let width, height, columns, rows, stepX, stepY;
  let points = [], links = [], faces = [];
  let broken = 0, travelled = 0, opened = false, releasing = false;
  let frame, lastTime = 0, accumulator = 0, releaseTime = 0;

  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    columns = Math.min(40, Math.ceil(width / 38)); rows = Math.min(32, Math.ceil(height / 38));
    stepX = (width + 24) / columns; stepY = (height + 24) / rows;
    points = []; links = []; faces = []; broken = 0; travelled = 0;
    Object.assign(pointer, { down: false, point: null, id: null });
    document.body.classList.remove('is-pulling');
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) {
        const x = col * stepX - 12, y = row * stepY - 12;
        points.push({ x, y, px: x, py: y, pinned: row === 0 || col === 0 || col === columns || row === rows });
      }
    }
    const across = [], down = [];
    function connect(a, b) {
      const link = { a, b, length: Math.hypot(a.x - b.x, a.y - b.y), active: true };
      links.push(link); return link;
    }
    for (let row = 0; row <= rows; row++) {
      across[row] = []; down[row] = [];
      for (let col = 0; col <= columns; col++) {
        const i = row * (columns + 1) + col;
        if (col < columns) across[row][col] = connect(points[i], points[i + 1]);
        if (row < rows) down[row][col] = connect(points[i], points[i + columns + 1]);
      }
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const i = row * (columns + 1) + col;
        faces.push({ p: [points[i], points[i + 1], points[i + columns + 2], points[i + columns + 1]],
          edges: [across[row][col], down[row][col + 1], across[row + 1][col], down[row][col]],
          x: col * stepX, y: row * stepY });
      }
    }
    texture.width = width + 24; texture.height = height + 24;
    ink.fillStyle = '#eee9de'; ink.fillRect(0, 0, texture.width, texture.height);
    ink.fillStyle = '#282821'; ink.textAlign = 'center'; ink.textBaseline = 'middle';
    const size = Math.min(width * 0.17, 164);
    ink.font = `italic ${size}px Georgia, serif`;
    ink.fillText('Look closer.', width / 2 + 12, height * 0.45 + 12);
    ink.font = '12px "Segoe UI", sans-serif';
    ink.fillText('P U L L   A T   T H E   T H R E A D S', width / 2 + 12, height * 0.45 + size * 0.65 + 12);
    ink.strokeStyle = 'rgba(87, 77, 57, 0.055)'; ink.lineWidth = 0.5; ink.beginPath();
    for (let x = 0; x < texture.width; x += 5) { ink.moveTo(x, 0); ink.lineTo(x, texture.height); }
    for (let y = 0; y < texture.height; y += 5) { ink.moveTo(0, y); ink.lineTo(texture.width, y); }
    ink.stroke();
  }
  function tear(link) { if (link.active) { link.active = false; broken++; } }
  function simulate() {
    for (const p of points) {
      if (p.pinned) continue;
      const vx = (p.x - p.px) * 0.975, vy = (p.y - p.py) * 0.975;
      p.px = p.x; p.py = p.y;
      p.x += Math.max(-45, Math.min(45, vx));
      p.y += Math.max(-45, Math.min(45, vy)) + (releasing ? 1.5 : 0.065);
    }
    for (let pass = 0; pass < 5; pass++) {
      if (pointer.down && pointer.point && !releasing) { pointer.point.x = pointer.x; pointer.point.y = pointer.y; }
      for (const link of links) {
        if (!link.active) continue;
        const { a, b, length } = link;
        const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 0.001;
        if (pointer.down && distance > length * 1.85) { tear(link); continue; }
        const wa = a.pinned || (pointer.down && a === pointer.point) ? 0 : 1;
        const wb = b.pinned || (pointer.down && b === pointer.point) ? 0 : 1;
        if (!wa && !wb) continue;
        const correction = (distance - length) / distance / (wa + wb);
        a.x += dx * correction * wa; a.y += dy * correction * wa;
        b.x -= dx * correction * wb; b.y -= dy * correction * wb;
      }
    }
  }
  // Affine mapping keeps the lettering and weave attached to the moving fabric.
  function triangle(a, b, c, sx, sy, lower) {
    context.save(); context.beginPath();
    // Overlap subpixel clip edges to avoid seams across the printed lettering.
    const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3;
    for (const [i, p] of [a, b, c].entries()) {
      const distance = Math.hypot(p.x - cx, p.y - cy) || 1;
      const x = p.x + (p.x - cx) / distance * 0.65;
      const y = p.y + (p.y - cy) / distance * 0.65;
      if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath(); context.clip();
    const x1 = lower ? b.x - c.x : b.x - a.x;
    const y1 = lower ? b.y - c.y : b.y - a.y;
    const x2 = lower ? c.x - a.x : c.x - b.x;
    const y2 = lower ? c.y - a.y : c.y - b.y;
    context.transform(x1 / stepX, y1 / stepX, x2 / stepY, y2 / stepY, a.x, a.y);
    context.drawImage(texture, sx, sy, stepX, stepY, 0, 0, stepX, stepY);
    context.restore();
  }
  function draw() {
    context.clearRect(0, 0, width, height);
    for (const face of faces) {
      if (face.edges.some(edge => !edge.active)) continue;
      const [a, b, c, d] = face.p;
      context.fillStyle = '#eee9de'; context.beginPath();
      context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.lineTo(c.x, c.y);
      context.lineTo(d.x, d.y); context.closePath(); context.fill();
      triangle(a, b, c, face.x, face.y, false); triangle(a, c, d, face.x, face.y, true);
    }
    context.beginPath();
    for (const link of links) {
      if (link.active) { context.moveTo(link.a.x, link.a.y); context.lineTo(link.b.x, link.b.y); }
    }
    context.strokeStyle = 'rgba(72, 65, 45, 0.13)'; context.lineWidth = 0.65; context.stroke();
  }
  function finish() {
    if (opened) return;
    opened = true; cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize); document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility); reducedMotion.removeEventListener('change', onMotion);
    document.body.classList.remove('intro-active', 'is-pulling');
    portfolio.inert = false; cover.classList.add('is-opening');
    portfolio.focus({ preventScroll: true });
    setTimeout(() => cover.remove(), 550);
  }
  function release() {
    if (releasing || opened) return;
    releasing = true; releaseTime = performance.now(); pointer.down = false; pointer.point = null;
    cover.classList.add('is-torn');
    for (const p of points) { p.pinned = false; p.py = p.y - 4; }
  }
  function animate(now) {
    if (opened) return;
    accumulator += Math.min(now - (lastTime || now), 50); lastTime = now;
    while (accumulator >= 1000 / 60) { simulate(); accumulator -= 1000 / 60; }
    draw();
    if (releasing && now - releaseTime > 800) { finish(); return; }
    frame = requestAnimationFrame(animate);
  }
  canvas.addEventListener('pointerdown', event => {
    if (releasing || pointer.down || (event.pointerType === 'mouse' && event.button !== 0)) return;
    let closest = null, distance = Infinity;
    for (const p of points) {
      if (p.pinned) continue;
      const d = Math.hypot(p.x - event.clientX, p.y - event.clientY);
      if (d < distance) { closest = p; distance = d; }
    }
    if (distance > Math.max(stepX, stepY) * 1.8) return;
    Object.assign(pointer, { down: true, id: event.pointerId, x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY, point: closest });
    canvas.setPointerCapture(event.pointerId); document.body.classList.add('is-pulling');
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointer.down || event.pointerId !== pointer.id || releasing) return;
    const x = event.clientX, y = event.clientY, dx = x - pointer.x, dy = y - pointer.y;
    travelled += Math.hypot(dx, dy);
    // Cut the swept segment so fast mouse and touch drags cannot skip threads.
    if (Math.hypot(x - pointer.startX, y - pointer.startY) > 24) {
      const squared = dx * dx + dy * dy;
      for (const link of links) {
        if (!link.active) continue;
        const mx = (link.a.x + link.b.x) / 2, my = (link.a.y + link.b.y) / 2;
        const t = squared ? Math.max(0, Math.min(1, ((mx - pointer.x) * dx + (my - pointer.y) * dy) / squared)) : 0;
        if (Math.hypot(mx - pointer.x - t * dx, my - pointer.y - t * dy) < Math.min(stepX, stepY) * 0.65) tear(link);
      }
    }
    pointer.x = x; pointer.y = y;
    if (broken >= 12 && travelled > Math.min(width, height) * 0.6) release();
  });
  function stopPointer(event) {
    if (event.pointerId !== pointer.id) return;
    Object.assign(pointer, { down: false, point: null, id: null }); document.body.classList.remove('is-pulling');
  }
  canvas.addEventListener('pointerup', stopPointer); canvas.addEventListener('pointercancel', stopPointer);
  canvas.addEventListener('lostpointercapture', stopPointer);
  function onResize() { if (releasing) finish(); else resize(); }
  function onKey(event) { if (event.key === 'Escape') finish(); }
  function onMotion(event) { if (event.matches) finish(); }
  function onVisibility() {
    cancelAnimationFrame(frame);
    if (!document.hidden && !opened) { lastTime = 0; frame = requestAnimationFrame(animate); }
  }
  document.querySelector('.open-button').addEventListener('click', finish);
  window.addEventListener('resize', onResize); document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility); reducedMotion.addEventListener('change', onMotion);
  resize(); portfolio.inert = true; document.body.classList.add('intro-active');
  frame = requestAnimationFrame(animate);
})();
