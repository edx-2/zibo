import { ACTIONS } from '../engine/input.js';
import { LOGICAL_W, LOGICAL_H } from '../engine/renderer.js';
import { t } from '../state/i18n.js';
import { listLevels } from '../levels/loader.js';

// Constellation positions for the 10 planets — laid out in a loose arc.
const POSITIONS = [
  { x: 140, y: 540 }, { x: 280, y: 420 }, { x: 420, y: 500 },
  { x: 560, y: 360 }, { x: 700, y: 460 }, { x: 840, y: 320 },
  { x: 970, y: 440 }, { x: 1080, y: 290 }, { x: 1180, y: 420 },
  { x: 1240, y: 220 }
];

const COLORS = {
  grassland: '#7ed957', ice: '#cae6ff', desert: '#e6c673', mushroom: '#bb6dd9',
  cave: '#6a4dc2', water: '#5db8c9', candy: '#ffb1d9', magnet: '#7a90b8',
  volcano: '#e84a3a', palace: '#ffd84d'
};

const PLANET_RADIUS = 50;        // tap-target radius (a bit larger than the visual planet)
const BACK_BUTTON = { x: 30, y: 30, w: 110, h: 50 };

export class LevelSelectScene {
  constructor(app) {
    this.app = app;
    this.t = 0;
    this.sel = 0;
    // Default selection: first uncompleted unlocked level.
    const levels = listLevels();
    for (let i = 0; i < levels.length; i++) {
      if (this.app.progress.isUnlocked(levels[i].id) && !this.app.progress.isCompleted(levels[i].id)) {
        this.sel = i;
        break;
      }
    }
    this.zSpriteX = POSITIONS[this.sel].x;
    this.zSpriteY = POSITIONS[this.sel].y;
    this.app.audio.playMusic('title');
  }

  update(dt) {
    this.t += dt;
    const input = this.app.input;
    const pointer = this.app.pointer;
    const levels = listLevels();

    // Hover over a planet selects it.
    levels.forEach((_, i) => {
      const p = POSITIONS[i];
      if (pointer.hoverAtCircle(p.x, p.y, PLANET_RADIUS)) this.sel = i;
    });

    // Tap on a planet enters the level (if unlocked).
    for (let i = 0; i < levels.length; i++) {
      const p = POSITIONS[i];
      if (pointer.tappedAtCircle(p.x, p.y, PLANET_RADIUS)) {
        const lvl = levels[i];
        this.sel = i;
        if (this.app.progress.isUnlocked(lvl.id)) {
          this.app.audio.confirm();
          this.app.gotoLevel(lvl.id);
        } else {
          this.app.audio.hurt();
        }
        return;
      }
    }
    // Tap on the back button returns to title.
    if (pointer.tappedIn(BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h)) {
      this.app.audio.menu();
      this.app.gotoTitle();
      return;
    }

    if (input.wasPressed(ACTIONS.MOVE_LEFT)) { this.advance(-1); }
    if (input.wasPressed(ACTIONS.MOVE_RIGHT)) { this.advance(1); }
    if (input.wasPressed(ACTIONS.PAUSE)) { this.app.gotoTitle(); }
    if (input.wasPressed(ACTIONS.CONFIRM)) {
      const lvl = levels[this.sel];
      if (this.app.progress.isUnlocked(lvl.id)) {
        this.app.audio.confirm();
        this.app.gotoLevel(lvl.id);
      } else {
        this.app.audio.hurt();
      }
    }
    // Zibo walks toward selected planet.
    const target = POSITIONS[this.sel];
    this.zSpriteX += (target.x - this.zSpriteX) * Math.min(1, dt * 4);
    this.zSpriteY += (target.y - this.zSpriteY) * Math.min(1, dt * 4);
  }

  advance(dir) {
    const levels = listLevels();
    let i = this.sel;
    do {
      i = (i + dir + levels.length) % levels.length;
      if (this.app.progress.isUnlocked(levels[i].id)) break;
    } while (i !== this.sel);
    if (i !== this.sel) { this.sel = i; this.app.audio.menu(); }
  }

  draw(r) {
    const ctx = r.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    grad.addColorStop(0, '#0a0428'); grad.addColorStop(1, '#1a1538');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Stars
    for (let i = 0; i < 220; i++) {
      const x = (i * 79) % LOGICAL_W;
      const y = (i * 53) % LOGICAL_H;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(this.t * 2 + i * 0.1) * 0.3})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Back button (tappable)
    const backHovered = this.app.pointer.hoverIn(BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h);
    ctx.fillStyle = backHovered ? 'rgba(255, 216, 77, 0.18)' : 'rgba(255, 255, 255, 0.08)';
    this.roundRect(ctx, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h, 12);
    ctx.fill();
    ctx.strokeStyle = backHovered ? '#ffd84d' : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h, 12);
    ctx.stroke();
    r.text('◀ ' + (t('settings.back') || 'Back'), BACK_BUTTON.x + BACK_BUTTON.w / 2, BACK_BUTTON.y + BACK_BUTTON.h / 2, {
      size: 22, align: 'center', baseline: 'middle', color: '#fff', shadow: '#000'
    });

    r.text(t('select.title'), LOGICAL_W / 2, 60, { size: 42, align: 'center', color: '#ffd84d', shadow: '#000' });
    const total = this.app.progress.totalStars();
    r.drawStar(LOGICAL_W - 240, 60, 16);
    r.text(`${total} / 100`, LOGICAL_W - 220, 50, { size: 28, color: '#fff', shadow: '#000' });

    const levels = listLevels();

    // Connecting lines between unlocked planets
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    for (let i = 0; i < levels.length - 1; i++) {
      const a = POSITIONS[i], b = POSITIONS[i + 1];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    levels.forEach((lvl, i) => {
      const p = POSITIONS[i];
      const unlocked = this.app.progress.isUnlocked(lvl.id);
      const completed = this.app.progress.isCompleted(lvl.id);
      const stars = this.app.progress.starsFor(lvl.id);
      const sel = i === this.sel;
      // Glow when selected
      if (sel) {
        ctx.fillStyle = 'rgba(255, 216, 77, 0.25)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 60 + Math.sin(this.t * 4) * 4, 0, Math.PI * 2); ctx.fill();
      }
      // Planet
      ctx.fillStyle = unlocked ? (COLORS[lvl.theme] || '#fff') : '#444';
      ctx.beginPath(); ctx.arc(p.x, p.y, 38, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 38, 0, Math.PI * 2); ctx.stroke();
      // Number
      r.text(String(lvl.id), p.x, p.y - 4, { size: 28, align: 'center', baseline: 'middle', color: '#000' });
      // Lock
      if (!unlocked) {
        r.text('🔒', p.x, p.y - 4, { size: 28, align: 'center', baseline: 'middle' });
      } else if (completed) {
        // Star stamp
        const tier = stars >= 10 ? '#ffd84d' : (stars >= 5 ? '#cccccc' : '#cd7f32');
        r.drawStar(p.x + 28, p.y - 28, 14, tier);
      }
      // Label
      r.text(t(`level.${lvl.id}`), p.x, p.y + 56, { size: 18, align: 'center', color: '#fff', shadow: '#000' });
    });

    // Zibo walking on the map
    const target = POSITIONS[this.sel];
    const dx = target.x - this.zSpriteX;
    const facing = Math.abs(dx) > 4 ? Math.sign(dx) : 1;
    const moving = Math.abs(dx) > 4;
    r.drawZibo(this.zSpriteX - 24, this.zSpriteY - 80, {
      facing,
      frame: Math.floor(this.t * 12),
      moving,
      grounded: true
    });

    r.text('← →   ✓   /   ' + (t('controls.tap') || 'Tap'),
      LOGICAL_W / 2, LOGICAL_H - 30, { size: 18, align: 'center', color: 'rgba(255,255,255,0.5)' });
  }

  roundRect(ctx, x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
