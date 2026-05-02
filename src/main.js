import { Renderer } from './engine/renderer.js';
import { Input } from './engine/input.js';
import { Audio } from './engine/audio.js';
import { attachKeyboard } from './controllers/keyboard.js';
import { PoweredUpController } from './controllers/poweredup.js';
import { Progress } from './state/progress.js';
import { loadI18n, setLang, t } from './state/i18n.js';
import { TitleScene } from './scenes/titleScene.js';
import { LevelSelectScene } from './scenes/levelSelectScene.js';
import { SettingsScene } from './scenes/settingsScene.js';
import { GameScene } from './scenes/gameScene.js';
import { EndingScene } from './scenes/endingScene.js';

class App {
  constructor() {
    this.canvas = document.getElementById('game');
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.audio = new Audio();
    this.progress = new Progress();
    this.poweredUp = new PoweredUpController(this.input);
    this.scene = null;
    this.lastTime = performance.now();
    this.fixedDt = 1 / 60;
    this.accumulator = 0;
    attachKeyboard(this.input);
  }

  async start() {
    await loadI18n();
    setLang(this.progress.setting('language') || 'de');
    this.audio.init();
    this.audio.setVolume('master', this.progress.setting('volumeMaster'));
    this.audio.setVolume('music', this.progress.setting('volumeMusic'));
    this.audio.setVolume('sfx', this.progress.setting('volumeSfx'));
    this.gotoTitle();
    requestAnimationFrame((t) => this.tick(t));
  }

  controllerAvailable() { return this.poweredUp.isAvailable(); }

  async connectController() {
    try {
      this.poweredUp.onStatus = (s) => {
        if (this.scene && this.scene.connectStatus !== undefined) {
          this.scene.connectStatus =
            s === 'connecting' ? t('controller.connecting') :
            s === 'connected' ? t('controller.connected') :
            t('controller.disconnected');
        }
      };
      await this.poweredUp.connect();
    } catch (e) {
      console.warn('connect failed', e);
      if (this.scene && this.scene.connectStatus !== undefined) {
        this.scene.connectStatus = String(e.message || e);
      }
    }
  }

  gotoTitle() { this.input.reset(); this.scene = new TitleScene(this); }
  gotoLevelSelect() { this.input.reset(); this.scene = new LevelSelectScene(this); }
  gotoSettings() { this.input.reset(); this.scene = new SettingsScene(this); }
  gotoLevel(id) { this.input.reset(); this.scene = new GameScene(this, id); }
  gotoEnding(stars) { this.input.reset(); this.scene = new EndingScene(this, stars); }

  tick(now) {
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    // Fixed-timestep update (60 Hz physics) per SPEC §2.1.
    this.accumulator += dt;
    while (this.accumulator >= this.fixedDt) {
      if (this.scene) this.scene.update(this.fixedDt);
      this.input.endFrame();
      this.accumulator -= this.fixedDt;
    }
    if (this.scene) {
      this.renderer.clear('#000');
      this.scene.draw(this.renderer);
    }
    requestAnimationFrame((t) => this.tick(t));
  }
}

const app = new App();

// Audio context can only start after user gesture. Boot screen handles this.
const boot = document.getElementById('boot');
const bootStart = document.getElementById('bootStart');
bootStart.addEventListener('click', async () => {
  boot.style.display = 'none';
  await app.start();
});
// Also start on Enter key if the user is keyboard-only.
window.addEventListener('keydown', async (e) => {
  if (boot.style.display !== 'none' && (e.code === 'Enter' || e.code === 'Space')) {
    boot.style.display = 'none';
    await app.start();
  }
}, { once: true });
