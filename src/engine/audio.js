// Tiny Web Audio synth engine. No external assets — every sound is generated
// from oscillators + noise so the game ships as a single download.

export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.volumes = { master: 0.8, music: 0.5, sfx: 0.9 };
    this.currentMusic = null;
    this.currentMusicTheme = null;
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volumes.master;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.volumes.music;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.volumes.sfx;
    this.sfxGain.connect(this.master);
  }

  setVolume(channel, value) {
    this.volumes[channel] = value;
    if (!this.ctx) return;
    if (channel === 'master') this.master.gain.value = value;
    if (channel === 'music') this.musicGain.gain.value = value;
    if (channel === 'sfx') this.sfxGain.gain.value = value;
  }

  // ---------- Sound effects ----------
  beep(freq, duration, type = 'sine', vol = 0.4, attack = 0.005, release = 0.1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration + release);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + release + 0.05);
  }

  glide(f1, f2, duration, type = 'square', vol = 0.3) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(f2, t + duration);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  noise(duration, vol = 0.2, lowpass = 4000) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = lowpass;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filt).connect(g).connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration + 0.05);
  }

  jump() { this.glide(360, 720, 0.18, 'square', 0.25); }
  land() { this.noise(0.08, 0.12, 600); }
  star() { this.beep(1320, 0.08, 'triangle', 0.3); setTimeout(() => this.beep(1760, 0.1, 'triangle', 0.3), 60); }
  rocketPart() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => this.beep(f, 0.18, 'triangle', 0.4), i * 90));
  }
  powerUp() {
    [523, 659, 784].forEach((f, i) => setTimeout(() => this.beep(f, 0.12, 'sine', 0.35), i * 60));
  }
  hurt() { this.glide(400, 100, 0.3, 'sawtooth', 0.3); }
  switchClick() { this.beep(1500, 0.04, 'square', 0.25); setTimeout(() => this.beep(900, 0.05, 'square', 0.2), 30); }
  door() { this.glide(220, 110, 0.5, 'sawtooth', 0.2); }
  beam() {
    [880, 660, 440, 220].forEach((f, i) => setTimeout(() => this.beep(f, 0.12, 'sine', 0.25), i * 70));
  }
  bounce() { this.glide(220, 880, 0.15, 'sine', 0.4); }
  menu() { this.beep(660, 0.05, 'sine', 0.25); }
  confirm() { this.beep(880, 0.08, 'triangle', 0.3); setTimeout(() => this.beep(1320, 0.1, 'triangle', 0.3), 50); }

  // ---------- Music: looping synth patterns by theme ----------
  // Each theme is a tiny note sequence keyed to a 16-step grid.
  // We schedule notes one bar ahead in a setInterval; cheap and simple.
  static THEMES = {
    title: { bpm: 90, wave: 'triangle', notes: [60, 64, 67, 64, 65, 69, 72, 69, 67, 64, 60, 55, 57, 60, 64, 60] },
    grassland: { bpm: 100, wave: 'triangle', notes: [60, 64, 67, 72, 67, 64, 60, 64, 65, 69, 72, 69, 65, 64, 60, 67] },
    ice: { bpm: 88, wave: 'sine', notes: [72, 76, 79, 76, 74, 71, 67, 71, 72, 76, 79, 84, 79, 76, 72, 76] },
    desert: { bpm: 96, wave: 'sawtooth', notes: [62, 65, 67, 70, 67, 65, 62, 60, 62, 65, 67, 72, 70, 67, 65, 62] },
    mushroom: { bpm: 104, wave: 'triangle', notes: [64, 68, 71, 68, 64, 68, 71, 76, 73, 71, 68, 64, 68, 71, 68, 64] },
    cave: { bpm: 80, wave: 'sine', notes: [57, 60, 64, 60, 57, 60, 64, 67, 64, 60, 57, 55, 57, 60, 64, 60] },
    water: { bpm: 75, wave: 'sine', notes: [69, 72, 76, 72, 69, 67, 64, 67, 69, 72, 76, 79, 76, 72, 69, 72] },
    candy: { bpm: 110, wave: 'triangle', notes: [72, 76, 79, 84, 79, 76, 72, 76, 74, 77, 81, 86, 81, 77, 74, 77] },
    magnet: { bpm: 105, wave: 'square', notes: [60, 63, 67, 70, 67, 63, 60, 58, 60, 63, 67, 72, 70, 67, 63, 60] },
    volcano: { bpm: 100, wave: 'sawtooth', notes: [55, 58, 62, 65, 62, 58, 55, 53, 55, 58, 62, 67, 65, 62, 58, 55] },
    palace: { bpm: 96, wave: 'triangle', notes: [60, 67, 72, 76, 79, 76, 72, 67, 65, 72, 77, 81, 84, 81, 77, 72] },
    ending: { bpm: 100, wave: 'triangle', notes: [60, 64, 67, 72, 76, 79, 84, 79, 76, 72, 67, 64, 60, 67, 72, 60] }
  };

  playMusic(themeName) {
    if (!this.ctx) return;
    if (this.currentMusicTheme === themeName) return;
    this.stopMusic();
    const theme = Audio.THEMES[themeName];
    if (!theme) return;
    this.currentMusicTheme = themeName;
    const stepDur = 60 / theme.bpm / 2; // 8th notes
    let step = 0;
    const scheduleStep = () => {
      const note = theme.notes[step % theme.notes.length];
      const freq = 440 * Math.pow(2, (note - 69) / 12);
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = theme.wave;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 0.95);
      osc.connect(g).connect(this.musicGain);
      osc.start(t);
      osc.stop(t + stepDur);
      // Soft bass on downbeats.
      if (step % 4 === 0) {
        const bo = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        bo.type = 'sine';
        bo.frequency.value = freq / 4;
        bg.gain.setValueAtTime(0.0001, t);
        bg.gain.linearRampToValueAtTime(0.22, t + 0.04);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 4);
        bo.connect(bg).connect(this.musicGain);
        bo.start(t);
        bo.stop(t + stepDur * 4);
      }
      step++;
    };
    scheduleStep();
    this.currentMusic = setInterval(scheduleStep, stepDur * 1000);
  }

  stopMusic() {
    if (this.currentMusic) clearInterval(this.currentMusic);
    this.currentMusic = null;
    this.currentMusicTheme = null;
  }
}
