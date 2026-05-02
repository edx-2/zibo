// Canvas 2D renderer. Letterboxes a 1280x720 logical canvas to the viewport
// and exposes drawing primitives + procedural sprite painters used everywhere.

export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.scale = 1;
    this.offset = { x: 0, y: 0 };
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aspect = LOGICAL_W / LOGICAL_H;
    let cw = vw, ch = vw / aspect;
    if (ch > vh) { ch = vh; cw = vh * aspect; }
    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    this.canvas.width = Math.floor(LOGICAL_W * dpr);
    this.canvas.height = Math.floor(LOGICAL_H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  }

  rect(x, y, w, h, color) { this.ctx.fillStyle = color; this.ctx.fillRect(x, y, w, h); }
  stroke(x, y, w, h, color, lw = 2) { this.ctx.strokeStyle = color; this.ctx.lineWidth = lw; this.ctx.strokeRect(x, y, w, h); }
  circle(x, y, r, color) { this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(x, y, r, 0, Math.PI * 2); this.ctx.fill(); }
  text(text, x, y, opts = {}) {
    const { size = 24, color = '#fff', align = 'left', baseline = 'top', font = 'system-ui', weight = '700', shadow = null } = opts;
    this.ctx.font = `${weight} ${size}px ${font}`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    if (shadow) {
      this.ctx.fillStyle = shadow;
      this.ctx.fillText(text, x + 3, y + 3);
    }
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  // ------ Procedural sprites ------
  drawZibo(x, y, opts = {}) {
    const { facing = 1, frame = 0, hurt = false, blink = false, cheering = false } = opts;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) { ctx.translate(48, 0); ctx.scale(-1, 1); }

    const skin = hurt ? '#ffffff' : '#7ed957';
    const skinDark = hurt ? '#cccccc' : '#4ea83a';
    const eyeY = 22 + (frame % 2) * 1;
    const bodyBob = cheering ? Math.sin(performance.now() / 80) * 3 : Math.sin(performance.now() / 220) * 1.2;

    // Antennae
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 14 + bodyBob);
    ctx.quadraticCurveTo(12, 4 + bodyBob, 14, -4 + bodyBob);
    ctx.moveTo(32, 14 + bodyBob);
    ctx.quadraticCurveTo(36, 4 + bodyBob, 34, -4 + bodyBob);
    ctx.stroke();
    ctx.fillStyle = '#ffd84d';
    ctx.beginPath(); ctx.arc(14, -5 + bodyBob, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(34, -5 + bodyBob, 3.5, 0, Math.PI * 2); ctx.fill();

    // Body
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(24, 24 + bodyBob, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.ellipse(24, 32 + bodyBob, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(18, eyeY + bodyBob, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(30, eyeY + bodyBob, 6, 0, Math.PI * 2); ctx.fill();
    if (!blink) {
      ctx.fillStyle = '#1a0a30';
      ctx.beginPath(); ctx.arc(19, eyeY + 1 + bodyBob, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(31, eyeY + 1 + bodyBob, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(20, eyeY + bodyBob, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(32, eyeY + bodyBob, 1.2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = '#1a0a30';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, eyeY + bodyBob); ctx.lineTo(22, eyeY + bodyBob);
      ctx.moveTo(26, eyeY + bodyBob); ctx.lineTo(34, eyeY + bodyBob);
      ctx.stroke();
    }

    // Mouth
    ctx.strokeStyle = '#1a0a30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (cheering) { ctx.arc(24, 32 + bodyBob, 3, 0, Math.PI); }
    else { ctx.moveTo(20, 33 + bodyBob); ctx.quadraticCurveTo(24, 36 + bodyBob, 28, 33 + bodyBob); }
    ctx.stroke();

    // Boots
    const legPhase = (frame % 6) / 6;
    const legA = Math.sin(legPhase * Math.PI * 2) * 2;
    ctx.fillStyle = '#ddd';
    ctx.fillRect(14, 38 + legA + bodyBob, 8, 8);
    ctx.fillRect(26, 38 - legA + bodyBob, 8, 8);
    ctx.fillStyle = '#999';
    ctx.fillRect(14, 44 + legA + bodyBob, 8, 2);
    ctx.fillRect(26, 44 - legA + bodyBob, 8, 2);
    ctx.restore();
  }

  drawStar(x, y, r = 14, color = '#ffd84d', glow = true) {
    const ctx = this.ctx;
    if (glow) {
      ctx.fillStyle = 'rgba(255, 216, 77, 0.18)';
      ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a2) * r * 0.45, y + Math.sin(a2) * r * 0.45);
    }
    ctx.closePath();
    ctx.fill();
  }

  drawHeart(x, y, r = 14, filled = true) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = filled ? '#ff5ea1' : 'rgba(255, 94, 161, 0.25)';
    ctx.strokeStyle = '#a8205c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.4);
    ctx.bezierCurveTo(-r, -r * 0.3, -r * 0.6, -r, 0, -r * 0.3);
    ctx.bezierCurveTo(r * 0.6, -r, r, -r * 0.3, 0, r * 0.4);
    ctx.bezierCurveTo(r * 0.4, r * 0.7, r * 0.6, r * 0.5, 0, r);
    ctx.bezierCurveTo(-r * 0.6, r * 0.5, -r * 0.4, r * 0.7, 0, r * 0.4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawRocketPart(x, y, kind = 'engine', t = 0) {
    const ctx = this.ctx;
    const glow = 18 + Math.sin(t / 200) * 4;
    ctx.fillStyle = 'rgba(255, 216, 77, 0.28)';
    ctx.beginPath(); ctx.arc(x, y, glow + 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 240, 140, 0.5)';
    ctx.beginPath(); ctx.arc(x, y, glow, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#e0e6ed';
    ctx.strokeStyle = '#5b6772';
    ctx.lineWidth = 2;
    if (kind === 'engine') {
      ctx.fillRect(-14, -10, 28, 18);
      ctx.strokeRect(-14, -10, 28, 18);
      ctx.fillStyle = '#ff7e3a';
      ctx.beginPath();
      ctx.moveTo(-10, 8); ctx.lineTo(0, 22); ctx.lineTo(10, 8);
      ctx.fill();
    } else if (kind === 'fin') {
      ctx.beginPath();
      ctx.moveTo(-16, 14); ctx.lineTo(0, -16); ctx.lineTo(16, 14); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (kind === 'hatch') {
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7fd3ff'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'antenna') {
      ctx.fillRect(-2, -16, 4, 24);
      ctx.beginPath(); ctx.arc(0, -18, 6, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'panel') {
      ctx.fillRect(-18, -10, 36, 20);
      ctx.strokeRect(-18, -10, 36, 20);
      ctx.fillStyle = '#5da7ff';
      for (let i = 0; i < 4; i++) ctx.fillRect(-16 + i * 9, -8, 7, 16);
    } else if (kind === 'cone') {
      ctx.beginPath();
      ctx.moveTo(-14, 12); ctx.lineTo(0, -16); ctx.lineTo(14, 12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (kind === 'gear') {
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        ctx.fillRect(Math.cos(a) * 14 - 3, Math.sin(a) * 14 - 3, 6, 6);
      }
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (kind === 'tank') {
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9d3dc';
      ctx.beginPath(); ctx.arc(-4, -4, 4, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'wing') {
      ctx.beginPath();
      ctx.moveTo(-18, 8); ctx.lineTo(18, -10); ctx.lineTo(18, 10); ctx.lineTo(-10, 14);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (kind === 'crystal') {
      ctx.fillStyle = '#a3f0ff';
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(12, 0); ctx.lineTo(6, 16); ctx.lineTo(-6, 16); ctx.lineTo(-12, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  drawPowerUp(x, y, kind, t = 0) {
    const ctx = this.ctx;
    const bob = Math.sin(t / 300) * 3;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    if (kind === 'feather') {
      ctx.fillStyle = '#dbe6ff'; ctx.beginPath();
      ctx.ellipse(0, 4, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7ed957'; ctx.fillRect(-4, -16, 8, 4);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(8, -4, 12, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'shield') {
      ctx.strokeStyle = '#7fd3ff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(127, 211, 255, 0.4)';
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'starboots') {
      ctx.fillStyle = '#ffd84d';
      ctx.fillRect(-12, -2, 10, 14);
      ctx.fillRect(2, -2, 10, 14);
      ctx.fillStyle = '#fff8c5';
      ctx.fillRect(-12, 10, 12, 4);
      ctx.fillRect(0, 10, 12, 4);
    } else if (kind === 'flashlight') {
      ctx.fillStyle = '#ffd84d';
      ctx.beginPath();
      ctx.moveTo(-10, 10); ctx.lineTo(-6, -10); ctx.lineTo(6, -10); ctx.lineTo(10, 10);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff8c5'; ctx.fillRect(-7, -12, 14, 4);
    }
    ctx.restore();
  }

  drawCheckpoint(x, y, t, active) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = active ? 'rgba(255, 216, 77, 0.4)' : 'rgba(120, 120, 160, 0.3)';
    ctx.beginPath(); ctx.arc(0, 0, 30 + Math.sin(t / 200) * 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = active ? '#ffd84d' : '#aaa';
    ctx.fillRect(-6, -40, 12, 60);
    ctx.fillStyle = active ? '#ff8' : '#ddd';
    ctx.beginPath(); ctx.arc(0, -40, 9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
