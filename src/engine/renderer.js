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
    const {
      facing = 1, frame = 0, hurt = false, blink = false, cheering = false,
      vy = 0, grounded = true, moving = false
    } = opts;
    const ctx = this.ctx;
    const t = performance.now();

    // Pose state — jump stretches, fall squashes, idle breathes, cheer hops.
    let bodyBob, squashY;
    if (cheering) {
      bodyBob = -Math.abs(Math.sin(t / 90)) * 6;
      squashY = 1 + Math.sin(t / 90) * 0.06;
    } else if (!grounded) {
      bodyBob = 0;
      squashY = vy < -50 ? 1.12 : (vy > 200 ? 0.92 : 1);
    } else if (moving) {
      bodyBob = Math.sin(t / 90) * 1.2;
      squashY = 1 + Math.sin(t / 90) * 0.04;
    } else {
      bodyBob = Math.sin(t / 380) * 1.6;
      squashY = 1 + Math.sin(t / 380) * 0.03;
    }

    // Auto-blink every ~4s for ~140ms (independent of the invuln blink upstream).
    const blinkPhase = (t % 4200) / 4200;
    const autoBlink = blinkPhase > 0.97;
    const eyesClosed = blink || autoBlink;

    // Drop shadow on ground.
    ctx.save();
    ctx.translate(x, y);
    if (grounded && !cheering) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(24, 49, 18, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (facing < 0) { ctx.translate(48, 0); ctx.scale(-1, 1); }

    const skin = hurt ? '#ffffff' : '#7ed957';
    const skinDark = hurt ? '#bbbbbb' : '#3e8a30';
    const skinLight = hurt ? '#f4f4f4' : '#a8e878';
    const belly = hurt ? '#e0e0e0' : '#d8f5b3';

    // ---------- Antennae ----------
    const antA = Math.sin(t / 240) * 1.8;
    const antB = Math.sin(t / 240 + 0.4) * 1.8;
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(17, 14 + bodyBob);
    ctx.bezierCurveTo(13 + antA, 4 + bodyBob, 12 + antA, -6 + bodyBob, 13 + antA * 1.4, -10 + bodyBob);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(31, 14 + bodyBob);
    ctx.bezierCurveTo(35 + antB, 4 + bodyBob, 36 + antB, -6 + bodyBob, 35 + antB * 1.4, -10 + bodyBob);
    ctx.stroke();
    // Glowing spheres at the tips.
    const aGlow = 0.35 + Math.sin(t / 180) * 0.15;
    ctx.fillStyle = `rgba(255, 220, 100, ${aGlow})`;
    ctx.beginPath(); ctx.arc(13 + antA * 1.4, -10 + bodyBob, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(35 + antB * 1.4, -10 + bodyBob, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd84d';
    ctx.beginPath(); ctx.arc(13 + antA * 1.4, -10 + bodyBob, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(35 + antB * 1.4, -10 + bodyBob, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8c5';
    ctx.beginPath(); ctx.arc(12 + antA * 1.4, -11 + bodyBob, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(34 + antB * 1.4, -11 + bodyBob, 1.6, 0, Math.PI * 2); ctx.fill();

    // ---------- Body with squash/stretch + shading ----------
    const bw = 18 / Math.sqrt(squashY);
    const bh = 16 * squashY;
    // Outline
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(24, 24 + bodyBob, bw, bh, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Belly patch (lighter oval, lower-front)
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.ellipse(24, 30 + bodyBob, bw * 0.65, bh * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Top-left highlight
    ctx.fillStyle = skinLight;
    ctx.beginPath();
    ctx.ellipse(17, 18 + bodyBob, 4, 7, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // ---------- Arms (small stubs) ----------
    const armPhase = (frame % 6) / 6 * Math.PI * 2;
    const armSwing = (moving && grounded) ? Math.sin(armPhase) * 3 : 0;
    const armUp = cheering ? -16 : 0;
    ctx.fillStyle = skin;
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 1.5;
    if (cheering) {
      // Arms raised in V
      ctx.beginPath();
      ctx.ellipse(7, 14 + bodyBob, 3, 8, 0.35, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(41, 14 + bodyBob, 3, 8, -0.35, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(5, 8 + bodyBob, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(43, 8 + bodyBob, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#aaa'; ctx.beginPath(); ctx.arc(5, 8 + bodyBob, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(43, 8 + bodyBob, 4, 0, Math.PI * 2); ctx.stroke();
    } else {
      // Resting arms with tiny walk swing
      ctx.beginPath();
      ctx.ellipse(8, 27 + bodyBob - armSwing, 3.2, 6, 0.25, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(40, 27 + bodyBob + armSwing, 3.2, 6, -0.25, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // Gloves
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(8, 32 + bodyBob - armSwing, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(40, 32 + bodyBob + armSwing, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#aaa';
      ctx.beginPath(); ctx.arc(8, 32 + bodyBob - armSwing, 3.5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(40, 32 + bodyBob + armSwing, 3.5, 0, Math.PI * 2); ctx.stroke();
    }

    // ---------- Eyes ----------
    const eyeY = 22 + bodyBob;
    // Whites
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(18, eyeY, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(30, eyeY, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(18, eyeY, 6.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(30, eyeY, 6.5, 0, Math.PI * 2); ctx.stroke();

    if (!eyesClosed) {
      // Pupils — drift toward facing/motion direction.
      const lookX = (moving && grounded) ? 1.2 : 0;
      const lookY = !grounded ? (vy < 0 ? -1 : 1) : 0;
      ctx.fillStyle = '#1a0a30';
      ctx.beginPath(); ctx.arc(18 + lookX, eyeY + 1 + lookY, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(30 + lookX, eyeY + 1 + lookY, 3.4, 0, Math.PI * 2); ctx.fill();
      // Primary sparkles
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(19.5 + lookX, eyeY + lookY, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(31.5 + lookX, eyeY + lookY, 1.5, 0, Math.PI * 2); ctx.fill();
      // Secondary sparkles
      ctx.beginPath(); ctx.arc(17 + lookX, eyeY + 2.5 + lookY, 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(29 + lookX, eyeY + 2.5 + lookY, 0.7, 0, Math.PI * 2); ctx.fill();
    } else {
      // Happy closed eyes — curved arcs.
      ctx.strokeStyle = '#1a0a30';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(18, eyeY + 1, 5, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(30, eyeY + 1, 5, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }

    // ---------- Cheek blush ----------
    ctx.fillStyle = `rgba(255, 130, 165, ${cheering ? 0.65 : 0.42})`;
    ctx.beginPath(); ctx.arc(11, 30 + bodyBob, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(37, 30 + bodyBob, 2.6, 0, Math.PI * 2); ctx.fill();

    // ---------- Mouth ----------
    ctx.strokeStyle = '#1a0a30';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    if (cheering) {
      // Wide open smile with tongue.
      ctx.fillStyle = '#3a1a4a';
      ctx.beginPath();
      ctx.ellipse(24, 34 + bodyBob, 5.5, 3.5, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ff6b94';
      ctx.beginPath();
      ctx.ellipse(24, 35.5 + bodyBob, 3, 1.5, 0, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(24, 34 + bodyBob, 5.5, 0, Math.PI);
      ctx.stroke();
    } else if (!grounded) {
      // Surprised "o" mouth.
      ctx.fillStyle = '#3a1a4a';
      ctx.beginPath();
      ctx.ellipse(24, 34 + bodyBob, 1.8, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (hurt) {
      ctx.beginPath();
      ctx.moveTo(20, 36 + bodyBob);
      ctx.quadraticCurveTo(24, 33 + bodyBob, 28, 36 + bodyBob);
      ctx.stroke();
    } else {
      // Relaxed smile.
      ctx.beginPath();
      ctx.moveTo(20, 33 + bodyBob);
      ctx.quadraticCurveTo(24, 36.5 + bodyBob, 28, 33 + bodyBob);
      ctx.stroke();
    }

    // ---------- Boots ----------
    const legPhase = (frame % 6) / 6 * Math.PI * 2;
    let legA, legB;
    if (cheering) {
      legA = -3 + Math.sin(t / 90) * 1.5;
      legB = legA;
    } else if (!grounded) {
      // Legs tucked when ascending, spread on descent.
      legA = vy < -50 ? -3 : (vy > 200 ? 5 : 0);
      legB = legA;
    } else if (moving) {
      legA = Math.sin(legPhase) * 4;
      legB = -legA;
    } else {
      legA = 0; legB = 0;
    }
    // Boot bodies — rounded with cuff.
    const drawBoot = (cx, dy) => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 4, 36 + dy + bodyBob, 8, 4); // sock cuff
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 4, 36 + dy + bodyBob, 8, 4);
      ctx.fillStyle = '#e0e6ed';
      ctx.beginPath();
      ctx.ellipse(cx, 42 + dy + bodyBob, 5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5b6772';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#5b6772';
      ctx.fillRect(cx - 5, 45 + dy + bodyBob, 10, 1.8);
    };
    drawBoot(16, legA);
    drawBoot(32, legB);

    ctx.restore();
  }

  // Brief running-dust puff. Caller decides when to spawn (e.g. on landing).
  drawDust(x, y, age) {
    const ctx = this.ctx;
    const a = Math.max(0, 1 - age / 0.4);
    ctx.fillStyle = `rgba(220, 220, 230, ${a * 0.6})`;
    const r = 3 + age * 14;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  drawStar(x, y, r = 14, color = '#ffd84d', glow = true) {
    const ctx = this.ctx;
    const t = performance.now();
    if (glow) {
      const pulse = 0.18 + Math.sin(t / 220 + x * 0.01) * 0.08;
      ctx.fillStyle = `rgba(255, 216, 77, ${pulse})`;
      ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    // Slow rotation makes pickups feel alive.
    const rot = Math.sin(t / 700 + x * 0.002) * 0.15;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
    }
    ctx.closePath();
    ctx.fill();
    // Inner shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.3, r * 0.18, r * 0.35, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawHeart(x, y, r = 14, filled = true) {
    const ctx = this.ctx;
    const t = performance.now();
    const beat = filled ? 1 + Math.sin(t / 360) * 0.06 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(beat, beat);

    // Heart path — reused for fill and stroke.
    const heartPath = () => {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.4);
      ctx.bezierCurveTo(-r, -r * 0.3, -r * 0.6, -r, 0, -r * 0.3);
      ctx.bezierCurveTo(r * 0.6, -r, r, -r * 0.3, 0, r * 0.4);
      ctx.bezierCurveTo(r * 0.4, r * 0.7, r * 0.6, r * 0.5, 0, r);
      ctx.bezierCurveTo(-r * 0.6, r * 0.5, -r * 0.4, r * 0.7, 0, r * 0.4);
    };

    if (filled) {
      // Solid pink heart with a glint.
      ctx.fillStyle = '#ff5ea1';
      heartPath();
      ctx.fill();
      ctx.strokeStyle = '#a8205c';
      ctx.lineWidth = 2;
      heartPath();
      ctx.stroke();
      // Highlight glint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.2, r * 0.18, r * 0.28, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Empty heart: clearly hollow — faded shape, no warm colour.
      // A faint inner shadow gives it definition against any background
      // without resorting to a "broken" slash that would look harsh in a
      // kids' game.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      heartPath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 200, 220, 0.55)';
      ctx.lineWidth = 2;
      heartPath();
      ctx.stroke();
    }

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
