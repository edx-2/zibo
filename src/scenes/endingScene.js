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

    // Rocket flying up — with smoke trail, body details, and Zibo waving
    // from the porthole. Centred horizontally; the rocket lifts off slowly
    // before zooming out of the top of the screen.
    const ry = Math.max(-260, LOGICAL_H * 0.6 - this.t * 80);
    const flicker = Math.sin(this.t * 30);
    const sway = Math.sin(this.t * 2) * 3;        // gentle side-to-side
    const cx = LOGICAL_W / 2 + sway;

    // ----- Smoke trail (drawn before rocket so it's behind the flame) -----
    for (let i = 0; i < 14; i++) {
      const age = (this.t * 1.5 + i * 0.18) % 2.5;
      const sy = ry + 60 + age * 70;
      if (sy > LOGICAL_H + 40) continue;
      const sx = cx + Math.sin(age * 4 + i) * (8 + age * 6);
      const sr = 6 + age * 18;
      ctx.fillStyle = `rgba(220, 220, 235, ${Math.max(0, 0.5 - age * 0.18)})`;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }

    ctx.save();
    ctx.translate(cx, ry);

    // ----- Twin flame exhaust (orange outer, yellow core, white hot tip) -----
    const flameLen = 50 + flicker * 8;
    const flameLen2 = 36 + Math.sin(this.t * 25 + 1) * 6;
    // Outer plume
    ctx.fillStyle = '#ff7e3a';
    ctx.beginPath();
    ctx.moveTo(-14, 22);
    ctx.bezierCurveTo(-10, 36, -4, 50, 0, 22 + flameLen);
    ctx.bezierCurveTo(4, 50, 10, 36, 14, 22);
    ctx.closePath(); ctx.fill();
    // Inner plume (yellow)
    ctx.fillStyle = '#ffd84d';
    ctx.beginPath();
    ctx.moveTo(-7, 22);
    ctx.bezierCurveTo(-5, 30, -2, 40, 0, 22 + flameLen2);
    ctx.bezierCurveTo(2, 40, 5, 30, 7, 22);
    ctx.closePath(); ctx.fill();
    // White-hot core
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 28, 3, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // ----- Side fins (drawn behind body) -----
    const finColour = '#cc3333';
    const finStroke = '#7a1818';
    ctx.fillStyle = finColour;
    ctx.strokeStyle = finStroke;
    ctx.lineWidth = 2;
    // Left fin
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.bezierCurveTo(-22, 14, -28, 22, -30, 30);
    ctx.lineTo(-14, 30);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Right fin
    ctx.beginPath();
    ctx.moveTo(14, 4);
    ctx.bezierCurveTo(22, 14, 28, 22, 30, 30);
    ctx.lineTo(14, 30);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // ----- Body (capsule) -----
    const body = ctx.createLinearGradient(-22, 0, 22, 0);
    body.addColorStop(0, '#aab4c0');
    body.addColorStop(0.4, '#fafcff');
    body.addColorStop(0.85, '#cdd5df');
    body.addColorStop(1, '#7d8794');
    ctx.fillStyle = body;
    ctx.strokeStyle = '#5b6772';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, 22);                          // bottom-left
    ctx.lineTo(-18, -28);                         // up the left side
    ctx.quadraticCurveTo(-18, -54, 0, -64);       // round into nose cone left
    ctx.quadraticCurveTo(18, -54, 18, -28);       // round into nose cone right
    ctx.lineTo(18, 22);                           // down the right side
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // ----- Nose cone (red striped tip) -----
    ctx.fillStyle = '#dc3a3a';
    ctx.beginPath();
    ctx.moveTo(-18, -28);
    ctx.quadraticCurveTo(-18, -54, 0, -64);
    ctx.quadraticCurveTo(18, -54, 18, -28);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7a1818';
    ctx.stroke();
    // White stripes around the cone
    ctx.fillStyle = '#fff';
    [-50, -42, -34].forEach(yy => {
      const w = Math.max(2, (yy + 60) * 0.4 + 6);
      ctx.fillRect(-w / 2, yy, w, 3);
    });
    // Highlight gloss along the nose
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-7, -42, 2.5, 12, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // ----- Body panel lines + rivets -----
    ctx.strokeStyle = 'rgba(91, 103, 114, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-18, -8); ctx.lineTo(18, -8);
    ctx.moveTo(-18, 14); ctx.lineTo(18, 14);
    ctx.stroke();
    ctx.fillStyle = '#5b6772';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(-14 + i * 9, -8, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-14 + i * 9, 14, 0.9, 0, Math.PI * 2); ctx.fill();
    }

    // ----- "Z" decal on the side -----
    ctx.fillStyle = '#ffd84d';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Z', 0, 4);
    ctx.strokeStyle = '#aa7a00';
    ctx.lineWidth = 0.8;
    ctx.strokeText('Z', 0, 4);

    // ----- Porthole with Zibo waving -----
    const portY = -22;
    // Rim (metal)
    ctx.fillStyle = '#7d8794';
    ctx.beginPath(); ctx.arc(0, portY, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5b6772'; ctx.lineWidth = 1.5;
    ctx.stroke();
    // Glass
    const glass = ctx.createRadialGradient(-2, portY - 2, 1, 0, portY, 9);
    glass.addColorStop(0, '#e8f5ff');
    glass.addColorStop(1, '#3a96d5');
    ctx.fillStyle = glass;
    ctx.beginPath(); ctx.arc(0, portY, 8.5, 0, Math.PI * 2); ctx.fill();
    // Tiny Zibo head peeking out
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, portY, 8, 0, Math.PI * 2);
    ctx.clip();
    // Zibo body silhouette
    ctx.fillStyle = '#7ed957';
    ctx.beginPath(); ctx.ellipse(0, portY + 4, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Zibo eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-2, portY + 2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, portY + 2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a0a30';
    ctx.beginPath(); ctx.arc(-1.7, portY + 2.3, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.3, portY + 2.3, 0.7, 0, Math.PI * 2); ctx.fill();
    // Smile
    ctx.strokeStyle = '#1a0a30';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(0.2, portY + 4.5, 1.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Waving hand
    const wave = Math.sin(this.t * 6);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(4 + wave * 0.5, portY - 2 - Math.abs(wave) * 1, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Glass reflection sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-3, portY - 3, 2, 4, -0.4, 0, Math.PI * 2); ctx.fill();

    // ----- Tiny antenna on top of nose cone -----
    ctx.strokeStyle = '#5b6772';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -64); ctx.lineTo(0, -72);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 200, 80, ${0.7 + Math.sin(this.t * 8) * 0.3})`;
    ctx.beginPath(); ctx.arc(0, -74, 2.5, 0, Math.PI * 2); ctx.fill();

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
