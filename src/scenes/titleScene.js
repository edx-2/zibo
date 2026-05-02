import { ACTIONS } from '../engine/input.js';
import { LOGICAL_W, LOGICAL_H } from '../engine/renderer.js';
import { t, setLang, lang } from '../state/i18n.js';

export class TitleScene {
  constructor(app) {
    this.app = app;
    this.t = 0;
    this.sel = 0;
    this.connectStatus = '';
    this.app.audio.playMusic('title');
  }

  items() {
    const arr = [{ id: 'play', label: t('title.play') }];
    if (this.app.controllerAvailable()) arr.push({ id: 'connect', label: t('title.connect') });
    arr.push({ id: 'settings', label: t('title.settings') });
    arr.push({ id: 'lang', label: lang() === 'de' ? 'EN' : 'DE' });
    return arr;
  }

  update(dt) {
    this.t += dt;
    const input = this.app.input;
    const items = this.items();
    if (input.wasPressed(ACTIONS.MOVE_LEFT) || input.wasPressed(ACTIONS.UP)) {
      this.sel = (this.sel + items.length - 1) % items.length;
      this.app.audio.menu();
    }
    if (input.wasPressed(ACTIONS.MOVE_RIGHT) || input.wasPressed(ACTIONS.DOWN)) {
      this.sel = (this.sel + 1) % items.length;
      this.app.audio.menu();
    }
    if (input.wasPressed(ACTIONS.CONFIRM)) {
      const id = items[this.sel].id;
      this.app.audio.confirm();
      if (id === 'play') this.app.gotoLevelSelect();
      else if (id === 'connect') this.app.connectController();
      else if (id === 'settings') this.app.gotoSettings();
      else if (id === 'lang') {
        const next = lang() === 'de' ? 'en' : 'de';
        setLang(next);
        this.app.progress.setSetting('language', next);
      }
    }
  }

  draw(r) {
    const ctx = r.ctx;
    // Animated star background
    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    grad.addColorStop(0, '#0a0428'); grad.addColorStop(1, '#3a1a78');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    for (let i = 0; i < 200; i++) {
      const x = (i * 79 + this.t * 20) % LOGICAL_W;
      const y = (i * 53) % LOGICAL_H;
      const s = 1 + (i % 3);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(this.t * 2 + i) * 0.3})`;
      ctx.fillRect(x, y, s, s);
    }

    // Logo
    r.text("Zibo's Cosmic Quest", LOGICAL_W / 2, 130, { size: 76, align: 'center', color: '#ffd84d', shadow: '#1a0840' });
    r.text(t('title.tagline'), LOGICAL_W / 2, 210, { size: 24, align: 'center', color: '#fff', weight: '500' });

    // Zibo waves (cheering pose hops + raises arms — matches the SPEC §7.1 brief).
    r.drawZibo(LOGICAL_W / 2 - 24, 280, {
      facing: 1,
      frame: Math.floor(this.t * 4),
      cheering: true,
      grounded: true
    });

    // Menu items
    const items = this.items();
    items.forEach((item, i) => {
      const y = 440 + i * 60;
      const sel = i === this.sel;
      const color = sel ? '#ffd84d' : '#fff';
      r.text(item.label, LOGICAL_W / 2, y, { size: 36, align: 'center', color, shadow: '#000' });
      if (sel) {
        const x = LOGICAL_W / 2 - 200 - Math.sin(this.t * 8) * 6;
        r.drawStar(x, y + 18, 14);
      }
    });

    // Controller status
    if (this.connectStatus) {
      r.text(this.connectStatus, LOGICAL_W / 2, LOGICAL_H - 60, { size: 22, align: 'center', color: '#7ed957', shadow: '#000' });
    }
    r.text(t('title.howto'), LOGICAL_W / 2, LOGICAL_H - 28, { size: 18, align: 'center', color: 'rgba(255,255,255,0.6)' });
  }
}
