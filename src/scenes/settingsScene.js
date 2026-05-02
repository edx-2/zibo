import { ACTIONS } from '../engine/input.js';
import { LOGICAL_W, LOGICAL_H } from '../engine/renderer.js';
import { t, setLang } from '../state/i18n.js';

export class SettingsScene {
  constructor(app) {
    this.app = app;
    this.sel = 0;
    this.t = 0;
  }

  fields() {
    return [
      { id: 'master', label: t('settings.master'), type: 'slider', get: () => this.app.progress.setting('volumeMaster'), set: v => { this.app.progress.setSetting('volumeMaster', v); this.app.audio.setVolume('master', v); } },
      { id: 'music', label: t('settings.music'), type: 'slider', get: () => this.app.progress.setting('volumeMusic'), set: v => { this.app.progress.setSetting('volumeMusic', v); this.app.audio.setVolume('music', v); } },
      { id: 'sfx', label: t('settings.sfx'), type: 'slider', get: () => this.app.progress.setting('volumeSfx'), set: v => { this.app.progress.setSetting('volumeSfx', v); this.app.audio.setVolume('sfx', v); } },
      { id: 'lang', label: t('settings.language'), type: 'choice', choices: ['de', 'en'], get: () => this.app.progress.setting('language'), set: v => { this.app.progress.setSetting('language', v); setLang(v); } },
      { id: 'easy', label: t('settings.easy'), type: 'toggle', get: () => this.app.progress.setting('easyMode'), set: v => this.app.progress.setSetting('easyMode', v) },
      { id: 'back', label: t('settings.back'), type: 'action', set: () => this.app.gotoTitle() }
    ];
  }

  update(dt) {
    this.t += dt;
    const input = this.app.input;
    const f = this.fields();
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
      const y = 200 + i * 70;
      const sel = i === this.sel;
      r.text(f.label, 360, y, { size: 32, color: sel ? '#ffd84d' : '#fff', shadow: '#000' });
      if (f.type === 'slider') {
        const v = f.get();
        const bx = 760, by = y + 8, bw = 200, bh = 16;
        ctx.fillStyle = '#222'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = sel ? '#ffd84d' : '#7ed957'; ctx.fillRect(bx, by, bw * v, bh);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      } else if (f.type === 'choice') {
        r.text(String(f.get()).toUpperCase(), 760, y, { size: 28, color: sel ? '#ffd84d' : '#fff' });
      } else if (f.type === 'toggle') {
        r.text(f.get() ? 'ON' : 'OFF', 760, y, { size: 28, color: sel ? '#ffd84d' : '#fff' });
      }
    });
  }
}
