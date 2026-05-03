import { ACTIONS } from '../engine/input.js';
import { LOGICAL_W, LOGICAL_H } from '../engine/renderer.js';
import { t, setLang } from '../state/i18n.js';

const ROW_H = 70;
const ROW_BASE_Y = 200;
const SLIDER_X = 760;
const SLIDER_W = 260;
const SLIDER_H = 22;

export class SettingsScene {
  constructor(app) {
    this.app = app;
    this.sel = 0;
    this.t = 0;
  }

  fields() {
    return [
      { id: 'master', label: t('settings.master'), type: 'slider', get: () => this.app.progress.setting('volumeMaster'), set: v => { this.app.progress.setSetting('volumeMaster', v); this.app.audio.setVolume('master', v); } },
      { id: 'music',  label: t('settings.music'),  type: 'slider', get: () => this.app.progress.setting('volumeMusic'),  set: v => { this.app.progress.setSetting('volumeMusic',  v); this.app.audio.setVolume('music',  v); } },
      { id: 'sfx',    label: t('settings.sfx'),    type: 'slider', get: () => this.app.progress.setting('volumeSfx'),    set: v => { this.app.progress.setSetting('volumeSfx',    v); this.app.audio.setVolume('sfx',    v); } },
      { id: 'lang',   label: t('settings.language'), type: 'choice', choices: ['de', 'en'], get: () => this.app.progress.setting('language'), set: v => { this.app.progress.setSetting('language', v); setLang(v); } },
      { id: 'easy',   label: t('settings.easy'),   type: 'toggle', get: () => this.app.progress.setting('easyMode'), set: v => this.app.progress.setSetting('easyMode', v) },
      { id: 'back',   label: t('settings.back'),   type: 'action', set: () => this.app.gotoTitle() }
    ];
  }

  rowRect(i) {
    return { x: 320, y: ROW_BASE_Y + i * ROW_H - 26, w: 720, h: 56 };
  }

  sliderRect(i) {
    return { x: SLIDER_X, y: ROW_BASE_Y + i * ROW_H - SLIDER_H / 2 + 6, w: SLIDER_W, h: SLIDER_H };
  }

  update(dt) {
    this.t += dt;
    const input = this.app.input;
    const pointer = this.app.pointer;
    const f = this.fields();

    // Hover updates the selected row.
    f.forEach((_, i) => {
      const r = this.rowRect(i);
      if (pointer.hoverIn(r.x, r.y, r.w, r.h)) this.sel = i;
    });

    // Tap on a slider track sets its value to that x position.
    for (let i = 0; i < f.length; i++) {
      const cur = f[i];
      if (cur.type === 'slider') {
        const sr = this.sliderRect(i);
        if (pointer.tappedIn(sr.x - 8, sr.y - 8, sr.w + 16, sr.h + 16)) {
          const v = Math.max(0, Math.min(1, (pointer.x - sr.x) / sr.w));
          cur.set(Number(v.toFixed(2)));
          this.app.audio.menu();
          this.sel = i;
          return;
        }
      } else {
        // Tap anywhere on the row activates it.
        const rr = this.rowRect(i);
        if (pointer.tappedIn(rr.x, rr.y, rr.w, rr.h)) {
          this.sel = i;
          this.activate(cur);
          return;
        }
      }
    }

    if (input.wasPressed(ACTIONS.UP)) { this.sel = (this.sel + f.length - 1) % f.length; this.app.audio.menu(); }
    if (input.wasPressed(ACTIONS.DOWN)) { this.sel = (this.sel + 1) % f.length; this.app.audio.menu(); }
    if (input.wasPressed(ACTIONS.PAUSE)) { this.app.gotoTitle(); return; }
    const cur = f[this.sel];
    const left = input.wasPressed(ACTIONS.MOVE_LEFT);
    const right = input.wasPressed(ACTIONS.MOVE_RIGHT);
    if (cur.type === 'slider' && (left || right)) {
      let v = cur.get() + (right ? 0.1 : -0.1);
      v = Math.max(0, Math.min(1, v));
      cur.set(Number(v.toFixed(2)));
      this.app.audio.menu();
    } else if (cur.type === 'choice' && (left || right)) {
      const idx = cur.choices.indexOf(cur.get());
      const next = cur.choices[(idx + (right ? 1 : cur.choices.length - 1)) % cur.choices.length];
      cur.set(next);
      this.app.audio.menu();
    } else if (cur.type === 'toggle' && (left || right || input.wasPressed(ACTIONS.CONFIRM))) {
      cur.set(!cur.get());
      this.app.audio.menu();
    } else if (cur.type === 'action' && input.wasPressed(ACTIONS.CONFIRM)) {
      this.activate(cur);
    }
  }

  activate(cur) {
    if (cur.type === 'choice') {
      const idx = cur.choices.indexOf(cur.get());
      const next = cur.choices[(idx + 1) % cur.choices.length];
      cur.set(next);
      this.app.audio.menu();
    } else if (cur.type === 'toggle') {
      cur.set(!cur.get());
      this.app.audio.menu();
    } else if (cur.type === 'action') {
      this.app.audio.confirm();
      cur.set();
    }
  }

  draw(r) {
    const ctx = r.ctx;
    ctx.fillStyle = '#0a0428';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    r.text(t('settings.title'), LOGICAL_W / 2, 80, { size: 56, align: 'center', color: '#ffd84d', shadow: '#000' });

    const fields = this.fields();
    fields.forEach((f, i) => {
      const rect = this.rowRect(i);
      const sel = i === this.sel;
      // Row background
      ctx.fillStyle = sel ? 'rgba(255, 216, 77, 0.12)' : 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      const y = rect.y + rect.h / 2;
      r.text(f.label, 360, y, { size: 30, baseline: 'middle', color: sel ? '#ffd84d' : '#fff', shadow: '#000' });
      if (f.type === 'slider') {
        const v = f.get();
        const sr = this.sliderRect(i);
        ctx.fillStyle = '#222'; ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
        ctx.fillStyle = sel ? '#ffd84d' : '#7ed957';
        ctx.fillRect(sr.x, sr.y, sr.w * v, sr.h);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.strokeRect(sr.x, sr.y, sr.w, sr.h);
        // Thumb
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sr.x + sr.w * v, sr.y + sr.h / 2, sr.h / 2 + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (f.type === 'choice') {
        r.text(String(f.get()).toUpperCase(), 760, y, { size: 28, baseline: 'middle', color: sel ? '#ffd84d' : '#fff' });
      } else if (f.type === 'toggle') {
        r.text(f.get() ? 'ON' : 'OFF', 760, y, { size: 28, baseline: 'middle', color: sel ? '#ffd84d' : '#fff' });
      }
    });
  }
}
