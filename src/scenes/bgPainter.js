// Procedural parallax backgrounds, one per planet theme. Camera-aware so
// distant layers move slower than the foreground.

export function drawBackground(ctx, theme, camX, t) {
  switch (theme) {
    case 'grassland': return drawGrassland(ctx, camX, t);
    case 'ice': return drawIce(ctx, camX, t);
    case 'desert': return drawDesert(ctx, camX, t);
    case 'mushroom': return drawMushroom(ctx, camX, t);
    case 'cave': return drawCave(ctx, camX, t);
    case 'water': return drawWater(ctx, camX, t);
    case 'candy': return drawCandy(ctx, camX, t);
    case 'magnet': return drawMagnet(ctx, camX, t);
    case 'volcano': return drawVolcano(ctx, camX, t);
    case 'palace': return drawPalace(ctx, camX, t);
    default: return drawGrassland(ctx, camX, t);
  }
}

function gradient(ctx, c1, c2) {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
}

function drawClouds(ctx, camX, parallax = 0.3, count = 6, color = '#fff') {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const seed = i * 173;
    const cx = ((seed - camX * parallax) % 1400 + 1400) % 1400 - 100;
    const cy = 80 + ((seed * 31) % 180);
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.arc(cx + 24, cy - 8, 22, 0, Math.PI * 2);
    ctx.arc(cx + 48, cy, 26, 0, Math.PI * 2);
    ctx.arc(cx + 18, cy + 12, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStars(ctx, camX, count, parallax = 0.2) {
  ctx.fillStyle = '#fff';
  for (let i = 0; i < count; i++) {
    const seed = i * 97;
    const x = ((seed - camX * parallax) % 1280 + 1280) % 1280;
    const y = (seed * 13) % 480;
    const s = 1 + ((seed * 17) % 3);
    ctx.fillRect(x, y, s, s);
  }
}

function drawGrassland(ctx, camX, t) {
  gradient(ctx, '#7fcdf6', '#cdf3a3');
  // Sun
  ctx.fillStyle = '#ffec64';
  ctx.beginPath(); ctx.arc(1100 - camX * 0.05, 140, 40, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255, 240, 140, 0.4)';
  ctx.beginPath(); ctx.arc(1100 - camX * 0.05, 140, 60, 0, Math.PI * 2); ctx.fill();
  drawClouds(ctx, camX, 0.2, 5);
  // Distant hills
  ctx.fillStyle = '#86c25c';
  for (let i = -1; i < 6; i++) {
    const cx = i * 280 - (camX * 0.5) % 280;
    ctx.beginPath();
    ctx.ellipse(cx + 140, 580, 220, 100, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#65a843';
  for (let i = -1; i < 6; i++) {
    const cx = i * 220 - (camX * 0.7) % 220;
    ctx.beginPath();
    ctx.ellipse(cx + 110, 620, 180, 90, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIce(ctx, camX, t) {
  gradient(ctx, '#cae6ff', '#e8f4ff');
  drawClouds(ctx, camX, 0.15, 4, '#f5f9ff');
  // Mountains
  ctx.fillStyle = '#a5c1de';
  for (let i = -1; i < 8; i++) {
    const x = i * 200 - (camX * 0.5) % 200;
    ctx.beginPath();
    ctx.moveTo(x, 620);
    ctx.lineTo(x + 100, 320);
    ctx.lineTo(x + 200, 620);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#fff';
  for (let i = -1; i < 8; i++) {
    const x = i * 200 - (camX * 0.5) % 200;
    ctx.beginPath();
    ctx.moveTo(x + 80, 380);
    ctx.lineTo(x + 100, 320);
    ctx.lineTo(x + 120, 380);
    ctx.closePath(); ctx.fill();
  }
  // Snow particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 79 + t * 30) % 1280;
    const y = (i * 41 + t * 60) % 720;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawDesert(ctx, camX, t) {
  gradient(ctx, '#ffb87a', '#ffd3a1');
  // Two suns
  ctx.fillStyle = '#ff7e3a';
  ctx.beginPath(); ctx.arc(900 - camX * 0.05, 130, 50, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd84d';
  ctx.beginPath(); ctx.arc(1050 - camX * 0.05, 200, 30, 0, Math.PI * 2); ctx.fill();
  // Far dunes
  ctx.fillStyle = '#e6a368';
  for (let i = -1; i < 8; i++) {
    const x = i * 260 - (camX * 0.4) % 260;
    ctx.beginPath();
    ctx.ellipse(x + 130, 580, 200, 80, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#c97f4a';
  for (let i = -1; i < 8; i++) {
    const x = i * 200 - (camX * 0.6) % 200;
    ctx.beginPath();
    ctx.ellipse(x + 100, 640, 160, 70, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawMushroom(ctx, camX, t) {
  gradient(ctx, '#5a3a8a', '#b96fc4');
  drawStars(ctx, camX, 60, 0.1);
  // Glowing spores
  for (let i = 0; i < 30; i++) {
    const x = ((i * 53 - camX * 0.2 + t * 20) % 1280 + 1280) % 1280;
    const y = ((i * 31 + t * 30) % 720);
    ctx.fillStyle = `rgba(255, 200, 240, ${0.3 + Math.sin(t + i) * 0.2})`;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Far mushrooms
  for (let i = -1; i < 8; i++) {
    const x = i * 280 - (camX * 0.4) % 280;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 90, 460, 30, 200);
    ctx.fillStyle = '#ff85c2';
    ctx.beginPath(); ctx.ellipse(x + 105, 460, 90, 36, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCave(ctx, camX, t) {
  gradient(ctx, '#1a1538', '#2a2050');
  // Crystals on far walls
  for (let i = 0; i < 30; i++) {
    const x = ((i * 71 - camX * 0.3) % 1280 + 1280) % 1280;
    const y = (i * 23) % 600;
    ctx.fillStyle = '#9b6cff';
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 16); ctx.lineTo(x - 6, y + 16);
    ctx.closePath(); ctx.fill();
  }
}

function drawWater(ctx, camX, t) {
  gradient(ctx, '#3b76b8', '#7ec1e6');
  // Bubbles
  for (let i = 0; i < 50; i++) {
    const x = ((i * 73 - camX * 0.3) % 1280 + 1280) % 1280;
    const y = ((i * 31 + 720 - (t * 30 + i * 7) % 720)) % 720;
    const r = 3 + (i % 4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }
  // Caustic rays
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  for (let i = 0; i < 6; i++) {
    const x = ((i * 220 - camX * 0.2) % 1280 + 1280) % 1280;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x + 200, 720); ctx.lineTo(x + 120, 720);
    ctx.closePath(); ctx.fill();
  }
}

function drawCandy(ctx, camX, t) {
  gradient(ctx, '#ffd3eb', '#ffe7c0');
  drawClouds(ctx, camX, 0.15, 5, '#fff5fa');
  // Lollipops in distance
  for (let i = -1; i < 8; i++) {
    const x = i * 240 - (camX * 0.4) % 240;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 116, 480, 8, 180);
    ctx.fillStyle = '#ff7eb6';
    ctx.beginPath(); ctx.arc(x + 120, 470, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + 110, 460, 6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawMagnet(ctx, camX, t) {
  gradient(ctx, '#1d2a4a', '#3a4f78');
  drawStars(ctx, camX, 80, 0.15);
  // Electric arcs
  ctx.strokeStyle = `rgba(150, 200, 255, ${0.3 + Math.sin(t * 4) * 0.3})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const baseX = i * 320 - (camX * 0.3) % 320;
    ctx.beginPath();
    ctx.moveTo(baseX, 100);
    for (let j = 0; j < 8; j++) {
      ctx.lineTo(baseX + j * 30 + Math.sin(t * 5 + j + i) * 10, 100 + j * 25);
    }
    ctx.stroke();
  }
}

function drawVolcano(ctx, camX, t) {
  gradient(ctx, '#3a0a14', '#a0282d');
  // Distant volcanoes
  for (let i = -1; i < 6; i++) {
    const x = i * 320 - (camX * 0.4) % 320;
    ctx.fillStyle = '#5a1818';
    ctx.beginPath();
    ctx.moveTo(x, 600);
    ctx.lineTo(x + 160, 280);
    ctx.lineTo(x + 320, 600);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5e3a';
    ctx.beginPath();
    ctx.moveTo(x + 140, 290);
    ctx.lineTo(x + 160, 240);
    ctx.lineTo(x + 180, 290);
    ctx.closePath(); ctx.fill();
  }
  // Ash particles
  ctx.fillStyle = 'rgba(60, 30, 30, 0.7)';
  for (let i = 0; i < 60; i++) {
    const x = ((i * 79 - t * 50) % 1280 + 1280) % 1280;
    const y = (i * 41 + t * 30) % 720;
    ctx.fillRect(x, y, 3, 2);
  }
}

function drawPalace(ctx, camX, t) {
  gradient(ctx, '#0a0428', '#3a1a78');
  drawStars(ctx, camX, 120, 0.05);
  // Floating crystal palace silhouettes
  for (let i = -1; i < 5; i++) {
    const x = i * 360 - (camX * 0.3) % 360;
    const y = 200 + Math.sin(t + i) * 8;
    ctx.fillStyle = 'rgba(180, 200, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x + 100, y + 100);
    ctx.lineTo(x + 180, y);
    ctx.lineTo(x + 260, y + 100);
    ctx.lineTo(x + 220, y + 180);
    ctx.lineTo(x + 140, y + 180);
    ctx.closePath(); ctx.fill();
  }
}
