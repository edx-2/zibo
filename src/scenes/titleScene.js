import { ACTIONS } from '../engine/input.js';
import { LOGICAL_W, LOGICAL_H } from '../engine/renderer.js';
import { t, setLang, lang } from '../state/i18n.js';

const ITEM_W = 460;
const ITEM_H = 50;
const ITEM_BASE_Y = 440;
const ITEM_SPACING = 60;

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

  itemRect(i) {
    return {
      x: LOGICAL_W / 2 - ITEM_W / 2,
      y: ITEM_BASE_Y + i * ITEM_SPACING - ITEM_H / 2,
      w: ITEM_W,
      h: ITEM_H
    };
  }

  activate(id) {
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

  update(dt) {
    this.t += dt;
    const input = this.app.input;
    const pointer = this.app.pointer;
    const items = this.items();

    // Hover updates highlighted item — useful on desktop, harmless on touch.
    items.forEach((_, i) => {
      const r = this.itemRect(i);
      if (pointer.hoverIn(r.x, r.y, r.w, r.h)) this.sel = i;
    });

    // Taps directly activate the item under them.
    for (let i = 0; i < items.length; i++) {
      const r = this.itemRect(i);
      if (pointer.tappedIn(r.x, r.y, r.w, r.h)) {
        this.sel = i;
        this.activate(items[i].id);
        return;
      }
    }

    if (input.wasPressed(ACTIONS.MOVE_LEFT) || input.wasPressed(ACTIONS.UP)) {
      this.sel = (this.sel + items.length - 1) % items.length;
      this.app.audio.menu();
    }
    if (input.wasPressed(ACTIONS.MOVE_RIGHT) || input.wasPressed(ACTIONS.DOWN)) {
      this.sel = (this.sel + 1) % items.length;
      this.app.audio.menu();
    }
    if (input.wasPressed(ACTIONS.CONFIRM)) {
      this.activate(items[this.sel].id);
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

    // Menu items — drawn with a subtle pill background so they look tappable.
    const items = this.items();
    items.forEach((item, i) => {
      const rect = this.itemRect(i);
      const sel = i === this.sel;
      // Tap target background
      ctx.fillStyle = sel ? 'rgba(255, 216, 77, 0.14)' : 'rgba(255, 255, 255, 0.06)';
      this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
      ctx.fill();
      ctx.strokeStyle = sel ? 'rgba(255, 216, 77, 0.7)' : 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
      ctx.stroke();
      const color = sel ? '#ffd84d' : '#fff';
      r.text(item.label, LOGICAL_W / 2, rect.y + ITEM_H / 2, {
        size: 32, align: 'center', baseline: 'middle', color, shadow: '#000'
      });
      if (sel) {
        const x = rect.x + 18 - Math.sin(this.t * 8) * 4;
        r.drawStar(x, rect.y + ITEM_H / 2, 12);
      }
    });

    // Controller status
    if (this.connectStatus) {
      r.text(this.connectStatus, LOGICAL_W / 2, LOGICAL_H - 60, { size: 22, align: 'center', color: '#7ed957', shadow: '#000' });
    }
    r.text(t('title.howto'), LOGICAL_W / 2, LOGICAL_H - 28, { size: 18, align: 'center', color: 'rgba(255,255,255,0.6)' });
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
