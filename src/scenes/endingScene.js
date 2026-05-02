import { ACTIONS } from '../engine/input.js';
import { LOGICAL_W, LOGICAL_H } from '../engine/renderer.js';
import { t } from '../state/i18n.js';

export class EndingScene {
  constructor(app, totalStars) {
    this.app = app;
    this.totalStars = totalStars;
    this.t = 0;
    this.confetti = [];
    for (let i = 0; i < 200; i++) {
      this.confetti.push({
        x: Math.random() * LOGICAL_W,
        y: -Math.random() * LOGICAL_H,
        vy: 60 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 80,
        color: ['#ffd84d', '#ff5e5e', '#7ed957', '#5da7ff', '#ff97c4'][Math.floor(Math.random() * 5)],
        rot: Math.random() * 6.28,
        rotV: (Math.random() - 0.5) * 6
      });
    }
    this.app.audio.playMusic('ending');
  }

  update(dt) {
    this.t += dt;
    for (const c of this.confetti) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.rotV * dt;
      if (c.y > LOGICAL_H) { c.y = -10; c.x = Math.random() * LOGICAL_W; }
    }
    if (this.t > 2 && this.app.input.wasPressed(ACTIONS.CONFIRM)) {
      this.app.audio.confirm();
      this.app.gotoTitle();
    }
  }

  draw(r) {
    const ctx = r.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    grad.addColorStop(0, '#0a0428'); grad.addColorStop(1, '#3a1a78');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Stars
    for (let i = 0; i < 200; i++) {
      const x = (i * 79) % LOGICAL_W;
      const y = (i * 53) % LOGICAL_H;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(this.t * 2 + i) * 0.3})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Rocket flying up
    const ry = Math.max(-200, LOGICAL_H * 0.6 - this.t * 80);
    ctx.save();
    ctx.translate(LOGICAL_W / 2, ry);
    ctx.fillStyle = '#e0e6ed';
    ctx.fillRect(-20, -60, 40, 80);
    ctx.fillStyle = '#5da7ff';
    ctx.beginPath(); ctx.arc(0, -50, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5e5e';
    ctx.beginPath(); ctx.moveTo(-20, 20); ctx.lineTo(-32, 40); ctx.lineTo(-20, 40); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(32, 40); ctx.lineTo(20, 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff7e3a';
    ctx.beginPath();
    ctx.moveTo(-12, 22); ctx.lineTo(0, 50 + Math.sin(this.t * 30) * 6); ctx.lineTo(12, 22);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd84d';
    ctx.beginPath();
    ctx.moveTo(-6, 22); ctx.lineTo(0, 40 + Math.sin(this.t * 30) * 4); ctx.lineTo(6, 22);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Confetti
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-6, -3, 12, 6);
      ctx.restore();
    }

    r.text(t('ending.title'), LOGICAL_W / 2, 200, { size: 96, align: 'center', color: '#ffd84d', shadow: '#000' });
    r.text(t('ending.thanks'), LOGICAL_W / 2, 290, { size: 32, align: 'center', color: '#fff', shadow: '#000' });
    const star = this.app.progress.totalStars();
    r.drawStar(LOGICAL_W / 2 - 70, 380, 24);
    r.text(`${star} / 100`, LOGICAL_W / 2 - 30, 360, { size: 36, color: '#fff', shadow: '#000' });

    if (this.t > 2) {
      r.text(t('common.continue'), LOGICAL_W / 2, LOGICAL_H - 80, { size: 24, align: 'center', color: 'rgba(255,255,255,0.7)' });
    }
  }
}
