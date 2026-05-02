// All non-player entities. Kept in a single module to keep imports simple.
import { aabb, TILE } from '../engine/physics.js';

let nextId = 1;
const id = () => nextId++;

export class Star {
  constructor(x, y) { this.id = id(); this.x = x; this.y = y; this.w = 28; this.h = 28; this.collected = false; this.t = 0; }
  hitbox() { return { x: this.x - 14, y: this.y - 14, w: 28, h: 28 }; }
  update(dt) { this.t += dt; }
  draw(r) { if (!this.collected) r.drawStar(this.x, this.y + Math.sin(this.t * 3) * 3); }
}

export class HeartPickup {
  constructor(x, y) { this.id = id(); this.x = x; this.y = y; this.w = 32; this.h = 32; this.collected = false; this.t = 0; }
  hitbox() { return { x: this.x - 16, y: this.y - 16, w: 32, h: 32 }; }
  update(dt) { this.t += dt; }
  draw(r) { if (!this.collected) r.drawHeart(this.x, this.y + Math.sin(this.t * 3) * 3); }
}

export class RocketPart {
  constructor(x, y, kind = 'engine') { this.id = id(); this.x = x; this.y = y; this.kind = kind; this.collected = false; this.t = 0; }
  hitbox() { return { x: this.x - 22, y: this.y - 22, w: 44, h: 44 }; }
  update(dt) { this.t += dt; }
  draw(r) { if (!this.collected) r.drawRocketPart(this.x, this.y + Math.sin(this.t * 2.5) * 4, this.kind, performance.now()); }
}

export class PowerUpPickup {
  constructor(x, y, kind) { this.id = id(); this.x = x; this.y = y; this.kind = kind; this.collected = false; this.t = 0; }
  hitbox() { return { x: this.x - 22, y: this.y - 22, w: 44, h: 44 }; }
  update(dt) { this.t += dt; }
  draw(r) { if (!this.collected) r.drawPowerUp(this.x, this.y, this.kind, performance.now()); }
}

export class Goal {
  // Portal that completes the level (must have collected the rocket part to activate).
  constructor(x, y) { this.id = id(); this.x = x; this.y = y; this.t = 0; }
  // Generous hitbox per SPEC §1.2 (frustration-free). Spans well below the
  // visual portal so Zibo standing on the ground reliably triggers it.
  hitbox() { return { x: this.x - 40, y: this.y - 60, w: 80, h: 160 }; }
  update(dt) { this.t += dt; }
  draw(r, partsCollected) {
    const ctx = r.ctx;
    const t = performance.now();
    ctx.save();
    ctx.translate(this.x, this.y);
    const ringR = 36 + Math.sin(t / 200) * 4;
    ctx.fillStyle = partsCollected ? 'rgba(120, 220, 255, 0.4)' : 'rgba(120, 120, 120, 0.3)';
    ctx.beginPath(); ctx.ellipse(0, -20, ringR * 0.8, ringR, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = partsCollected ? '#7fd3ff' : '#777';
    ctx.beginPath(); ctx.ellipse(0, -20, ringR * 0.6, ringR * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = partsCollected ? '#1a3050' : '#222';
    ctx.beginPath(); ctx.ellipse(0, -20, ringR * 0.45, ringR * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    if (partsCollected) {
      for (let i = 0; i < 6; i++) {
        const a = t / 300 + i;
        const px = Math.cos(a) * 30;
        const py = -20 + Math.sin(a) * 40;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(a * 2) * 0.3})`;
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
}

export class Spike {
  constructor(x, y, w = TILE, flipped = false) { this.id = id(); this.x = x; this.y = y; this.w = w; this.h = 24; this.flipped = flipped; }
  hitbox() { return { x: this.x + 4, y: this.flipped ? this.y : this.y + 4, w: this.w - 8, h: this.h - 4 }; }
  update() {}
  draw(r) {
    const ctx = r.ctx;
    ctx.fillStyle = '#aaa';
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    const count = Math.floor(this.w / 16);
    for (let i = 0; i < count; i++) {
      const sx = this.x + i * 16 + 1;
      ctx.beginPath();
      if (!this.flipped) {
        ctx.moveTo(sx, this.y + this.h);
        ctx.lineTo(sx + 7, this.y);
        ctx.lineTo(sx + 14, this.y + this.h);
      } else {
        ctx.moveTo(sx, this.y);
        ctx.lineTo(sx + 7, this.y + this.h);
        ctx.lineTo(sx + 14, this.y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
}

export class LavaDrop {
  // Drips from a fixed ceiling x at intervals; resets when off-screen.
  constructor(x, ceilY, period = 2000, phase = 0) {
    this.id = id();
    this.spawnX = x;
    this.spawnY = ceilY;
    this.x = x; this.y = ceilY;
    this.w = 16; this.h = 24;
    this.period = period;
    this.phase = phase;
    this.t = 0;
    this.falling = false;
  }
  hitbox() { return this.falling ? { x: this.x - 8, y: this.y - 12, w: 16, h: 24 } : null; }
  update(dt) {
    this.t += dt * 1000;
    if (!this.falling) {
      const progress = ((this.t + this.phase) % this.period) / this.period;
      if (progress > 0.7) this.falling = true;
    } else {
      this.y += 600 * dt;
      if (this.y > this.spawnY + 800) {
        this.y = this.spawnY;
        this.falling = false;
        this.t = 0;
      }
    }
  }
  draw(r) {
    const ctx = r.ctx;
    if (!this.falling) {
      // Telegraph: glow that grows.
      const progress = ((this.t + this.phase) % this.period) / this.period;
      const glow = progress * 12;
      ctx.fillStyle = `rgba(255, 80, 0, ${0.3 + progress * 0.4})`;
      ctx.beginPath(); ctx.arc(this.spawnX, this.spawnY, 4 + glow, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff7e3a';
      ctx.beginPath(); ctx.arc(this.spawnX, this.spawnY, 4 + progress * 3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#ff7e3a';
      ctx.beginPath(); ctx.ellipse(this.x, this.y, 7, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd84d';
      ctx.beginPath(); ctx.ellipse(this.x, this.y - 2, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

export class Cactus {
  // Knockback only — no damage. Specified for Level 3.
  constructor(x, y) { this.id = id(); this.x = x; this.y = y; this.w = 32; this.h = 64; }
  hitbox() { return { x: this.x, y: this.y, w: 32, h: 64 }; }
  update() {}
  draw(r) {
    const ctx = r.ctx;
    ctx.fillStyle = '#5a8a3a';
    ctx.strokeStyle = '#2f5a1c';
    ctx.lineWidth = 2;
    ctx.fillRect(this.x + 8, this.y, 16, 64);
    ctx.fillRect(this.x, this.y + 12, 8, 24);
    ctx.fillRect(this.x + 24, this.y + 16, 8, 28);
    ctx.strokeRect(this.x + 8, this.y, 16, 64);
    ctx.strokeRect(this.x, this.y + 12, 8, 24);
    ctx.strokeRect(this.x + 24, this.y + 16, 8, 28);
    // Spines
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) ctx.fillRect(this.x + 14, this.y + 6 + i * 12, 4, 1);
  }
}

export class Jellyfish {
  // Bobs along a fixed path. Glows then deals damage during the sting phase.
  constructor(x, y, range = 100, speed = 1) {
    this.id = id();
    this.cx = x; this.cy = y;
    this.x = x; this.y = y;
    this.range = range; this.speed = speed;
    this.t = Math.random() * 4;
    this.stingPhase = false;
    this.stingTimer = 0;
  }
  hitbox() {
    const r = this.stingPhase ? 28 : 22;
    return { x: this.x - r, y: this.y - r, w: r * 2, h: r * 2 };
  }
  damages() { return this.stingPhase; }
  update(dt) {
    this.t += dt;
    this.y = this.cy + Math.sin(this.t * this.speed) * this.range;
    this.x = this.cx + Math.cos(this.t * this.speed * 0.6) * this.range * 0.3;
    this.stingTimer += dt;
    if (this.stingTimer > 4) { this.stingPhase = true; }
    if (this.stingTimer > 6) { this.stingPhase = false; this.stingTimer = 0; }
  }
  draw(r) {
    const ctx = r.ctx;
    const pre = !this.stingPhase && this.stingTimer > 2;
    const color = this.stingPhase ? '#ffec64' : (pre ? '#ffe48f' : '#ff97c4');
    ctx.fillStyle = `rgba(255, 200, 240, ${this.stingPhase ? 0.6 : 0.3})`;
    ctx.beginPath(); ctx.arc(this.x, this.y, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(this.x, this.y, 22, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x + i * 6, this.y);
      ctx.quadraticCurveTo(this.x + i * 6 + Math.sin(this.t * 3 + i) * 5, this.y + 14, this.x + i * 6, this.y + 28);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(this.x - 6, this.y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x + 6, this.y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

export class FallingRock {
  // Triggered when Zibo enters a horizontal range. Telegraphs with shadow.
  constructor(x, ceilY, triggerRange = 200, fallY = null) {
    this.id = id();
    this.x = x;
    this.startY = ceilY;
    this.y = ceilY;
    this.triggerX = x;
    this.triggerRange = triggerRange;
    this.fallY = fallY ?? ceilY + 600;
    this.state = 'idle'; // idle | telegraph | falling | landed
    this.t = 0;
    this.w = 40; this.h = 40;
  }
  hitbox() {
    if (this.state === 'falling') return { x: this.x - 20, y: this.y - 20, w: 40, h: 40 };
    return null;
  }
  update(dt, zibo) {
    this.t += dt;
    if (this.state === 'idle' && Math.abs(zibo.x + zibo.w / 2 - this.triggerX) < this.triggerRange) {
      this.state = 'telegraph';
      this.t = 0;
    } else if (this.state === 'telegraph') {
      if (this.t > 1.5) { this.state = 'falling'; this.t = 0; }
    } else if (this.state === 'falling') {
      this.y += 700 * dt;
      if (this.y >= this.fallY) { this.state = 'landed'; this.y = this.fallY; }
    }
  }
  draw(r) {
    const ctx = r.ctx;
    if (this.state === 'telegraph') {
      const a = (Math.sin(this.t * 12) + 1) / 2;
      ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + a * 0.3})`;
      ctx.beginPath(); ctx.ellipse(this.triggerX, this.fallY + 18, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (this.state === 'idle' || this.state === 'telegraph') return;
    ctx.fillStyle = '#774234';
    ctx.strokeStyle = '#3a1a14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x - 18, this.y + 4);
    ctx.lineTo(this.x - 6, this.y - 18);
    ctx.lineTo(this.x + 12, this.y - 16);
    ctx.lineTo(this.x + 18, this.y + 6);
    ctx.lineTo(this.x + 6, this.y + 18);
    ctx.lineTo(this.x - 14, this.y + 14);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
}

export class BouncyMushroom {
  constructor(x, y, multiplier = 2) { this.id = id(); this.x = x; this.y = y; this.w = 64; this.h = 32; this.multiplier = multiplier; this.t = 0; this.bouncing = 0; }
  hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  update(dt) { this.t += dt; if (this.bouncing > 0) this.bouncing -= dt; }
  trigger() { this.bouncing = 0.25; }
  draw(r) {
    const ctx = r.ctx;
    const squash = this.bouncing > 0 ? 1 - this.bouncing * 1.5 : 1;
    const h = 32 * (1 + (1 - squash) * 0.4);
    const yo = 32 - h;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x + 12, this.y + h, 40, 32 - h + 32);
    ctx.fillStyle = '#ff5e5e';
    ctx.beginPath();
    ctx.ellipse(this.x + 32, this.y + 16 + yo, 32, 16 + (1 - squash) * 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(this.x + 22, this.y + 12 + yo, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x + 42, this.y + 14 + yo, 3, 0, Math.PI * 2); ctx.fill();
  }
}

// Switch pad. Color-coded; pressing it opens linked door for `holdMs`.
export class Switch {
  constructor(x, y, color = 'red', linkId = null, holdMs = 5000) {
    this.id = id(); this.x = x; this.y = y; this.w = 64; this.h = 16;
    this.color = color; this.linkId = linkId; this.holdMs = holdMs;
    this.pressedUntil = 0;
  }
  hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  isActive(now) { return now < this.pressedUntil; }
  press(now) { this.pressedUntil = now + this.holdMs; }
  draw(r) {
    const colors = { red: '#ff5e5e', blue: '#5da7ff', green: '#7ed957', yellow: '#ffd84d' };
    const c = colors[this.color] || '#fff';
    const ctx = r.ctx;
    ctx.fillStyle = '#222';
    ctx.fillRect(this.x, this.y + 8, this.w, 8);
    ctx.fillStyle = c;
    const pressed = this.pressedUntil > performance.now();
    ctx.fillRect(this.x + 4, this.y + (pressed ? 8 : 2), this.w - 8, pressed ? 6 : 12);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x + 4, this.y + (pressed ? 8 : 2), this.w - 8, pressed ? 6 : 12);
    // shape badge alongside color (accessibility)
    ctx.fillStyle = '#000';
    if (this.color === 'red') {
      ctx.beginPath();
      ctx.moveTo(this.x + 28, this.y + 4);
      ctx.lineTo(this.x + 36, this.y + 4);
      ctx.lineTo(this.x + 32, this.y + 11);
      ctx.closePath(); ctx.fill();
    } else if (this.color === 'blue') {
      ctx.fillRect(this.x + 28, this.y + 4, 8, 8);
    } else if (this.color === 'green') {
      ctx.beginPath(); ctx.arc(this.x + 32, this.y + 8, 4, 0, Math.PI * 2); ctx.fill();
    } else if (this.color === 'yellow') {
      ctx.beginPath();
      ctx.moveTo(this.x + 32, this.y + 3);
      ctx.lineTo(this.x + 38, this.y + 8);
      ctx.lineTo(this.x + 32, this.y + 13);
      ctx.lineTo(this.x + 26, this.y + 8);
      ctx.closePath(); ctx.fill();
    }
  }
}

// Door that's solid until its switch is pressed.
export class Door {
  constructor(x, y, w, h, color = 'red', linkId = null) {
    this.id = id(); this.x = x; this.y = y; this.w = w; this.h = h;
    this.color = color; this.linkId = linkId;
  }
  isOpen(switches, now) {
    const sw = switches.find(s => s.linkId === this.linkId);
    return sw ? sw.isActive(now) : false;
  }
  draw(r, open) {
    const colors = { red: '#ff5e5e', blue: '#5da7ff', green: '#7ed957', yellow: '#ffd84d' };
    const ctx = r.ctx;
    if (open) {
      ctx.fillStyle = colors[this.color] + '40';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    } else {
      ctx.fillStyle = colors[this.color];
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.w, this.h);
      // chevrons
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      for (let i = 0; i < this.h / 16; i++) {
        ctx.fillRect(this.x + 4, this.y + 4 + i * 16, this.w - 8, 4);
      }
    }
  }
}

// Magnet zone (Level 8). Inside its bounds Zibo's gravity flips (red) or doubles (blue).
export class MagnetZone {
  constructor(x, y, w, h, color = 'red') {
    this.id = id(); this.x = x; this.y = y; this.w = w; this.h = h;
    this.color = color;
    this.active = true;
  }
  contains(zibo) {
    return aabb({ x: zibo.x, y: zibo.y, w: zibo.w, h: zibo.h }, this);
  }
  draw(r) {
    if (!this.active) return;
    const ctx = r.ctx;
    const c = this.color === 'red' ? 'rgba(255, 80, 80, 0.20)' : 'rgba(80, 160, 255, 0.20)';
    const cBorder = this.color === 'red' ? '#ff5e5e' : '#5da7ff';
    ctx.fillStyle = c;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = cBorder;
    ctx.setLineDash([12, 8]);
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x + 1, this.y + 1, this.w - 2, this.h - 2);
    ctx.setLineDash([]);
    // Arrow indicating direction
    ctx.fillStyle = cBorder;
    const ax = this.x + this.w / 2;
    const dir = this.color === 'red' ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      const ay = this.y + 30 + i * 40 + Math.sin(performance.now() / 300 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(ax - 12, ay);
      ctx.lineTo(ax + 12, ay);
      ctx.lineTo(ax, ay + 16 * dir);
      ctx.closePath(); ctx.fill();
    }
  }
}

export class Firefly {
  constructor(x, y) { this.id = id(); this.x = x; this.y = y; this.t = Math.random() * 6; this.amp = 16 + Math.random() * 14; }
  update(dt) { this.t += dt; }
  draw(r) {
    const ctx = r.ctx;
    const px = this.x + Math.cos(this.t * 0.7) * this.amp;
    const py = this.y + Math.sin(this.t * 0.5) * this.amp * 0.6;
    ctx.fillStyle = 'rgba(255, 240, 120, 0.4)';
    ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffec64';
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
  }
  light() {
    return { x: this.x + Math.cos(this.t * 0.7) * this.amp, y: this.y + Math.sin(this.t * 0.5) * this.amp * 0.6, r: 80 };
  }
}

// Sequence-puzzle ice block (Level 2). Lights up in a pattern; Zibo must
// jump on each in order. Wrong = reset.
export class SequenceBlock {
  constructor(x, y, index) {
    this.id = id(); this.x = x; this.y = y; this.w = 64; this.h = 64; this.index = index;
    this.activated = false;
    this.flash = 0; // visual
  }
  hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  draw(r, demoIndex) {
    const ctx = r.ctx;
    const isDemo = demoIndex === this.index;
    const flashAlpha = this.flash > 0 ? this.flash : (isDemo ? 0.7 : 0);
    ctx.fillStyle = '#9bdfff';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = '#3a8acc';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.w, this.h);
    if (this.activated) {
      ctx.fillStyle = 'rgba(127, 255, 200, 0.5)';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    ctx.fillStyle = '#1a3a55';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(this.index + 1), this.x + this.w / 2, this.y + this.h / 2);
  }
}

// Clamshell (Level 6) — opens/closes on cycle. Holds the rocket part.
export class Clamshell {
  constructor(x, y, contains = null) {
    this.id = id(); this.x = x; this.y = y; this.w = 96; this.h = 96; this.t = 0;
    this.contains = contains; // RocketPart placed inside
  }
  isOpen() { return Math.floor(this.t / 3) % 2 === 0; }
  update(dt) { this.t += dt; }
  hitbox() { return null; }
  draw(r) {
    const ctx = r.ctx;
    const open = this.isOpen();
    const angle = open ? 0.7 : 0;
    ctx.fillStyle = '#ff97c4';
    ctx.strokeStyle = '#a8205c';
    ctx.lineWidth = 3;
    // Lower shell
    ctx.beginPath(); ctx.ellipse(this.x + 48, this.y + 70, 48, 28, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    // Upper shell — pivots up when open
    ctx.save();
    ctx.translate(this.x + 48, this.y + 70);
    ctx.rotate(-angle);
    ctx.beginPath(); ctx.ellipse(0, 0, 48, 28, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

// Sand bridge (Level 3) — appears when the linked switch is active, hides
// otherwise. Its tiles are added to the solid set only while active.
export class TimedBridge {
  constructor(x, y, tilesWide = 4, linkId = null) {
    this.id = id();
    this.x = x; this.y = y;
    this.w = tilesWide * TILE; this.h = 16;
    this.linkId = linkId;
  }
  isActive(switches, now) {
    const sw = switches.find(s => s.linkId === this.linkId);
    return sw ? sw.isActive(now) : false;
  }
  draw(r, active) {
    if (!active) {
      // Faint outline so the player can see where the bridge will appear.
      r.ctx.strokeStyle = 'rgba(255, 220, 130, 0.35)';
      r.ctx.setLineDash([8, 6]);
      r.ctx.lineWidth = 2;
      r.ctx.strokeRect(this.x, this.y, this.w, this.h);
      r.ctx.setLineDash([]);
      return;
    }
    const ctx = r.ctx;
    ctx.fillStyle = '#e6c673';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#a88944';
    ctx.fillRect(this.x, this.y + this.h - 4, this.w, 4);
  }
}
