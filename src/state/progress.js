// localStorage-backed progress and settings. Schema per SPEC §9.

const KEY = 'zibo.save.v1';

const DEFAULT = {
  version: 1,
  progress: {
    levelsCompleted: [],
    starsPerLevel: {},
    totalStars: 0
  },
  settings: {
    volumeMaster: 0.8,
    volumeMusic: 0.5,
    volumeSfx: 0.9,
    language: 'de',
    easyMode: false
  }
};

export class Progress {
  constructor() {
    this.data = this.load();
  }
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULT);
      const parsed = JSON.parse(raw);
      return { ...structuredClone(DEFAULT), ...parsed,
        progress: { ...DEFAULT.progress, ...(parsed.progress || {}) },
        settings: { ...DEFAULT.settings, ...(parsed.settings || {}) }
      };
    } catch (e) {
      console.warn('save load failed', e);
      return structuredClone(DEFAULT);
    }
  }
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {}
  }
  isUnlocked(level) {
    if (level <= 1) return true;
    return this.data.progress.levelsCompleted.includes(level - 1);
  }
  isCompleted(level) { return this.data.progress.levelsCompleted.includes(level); }
  starsFor(level) { return this.data.progress.starsPerLevel[level] || 0; }
  totalStars() {
    return Object.values(this.data.progress.starsPerLevel).reduce((a, b) => a + b, 0);
  }
  recordLevel(level, stars) {
    const completed = this.data.progress.levelsCompleted;
    if (!completed.includes(level)) completed.push(level);
    completed.sort((a, b) => a - b);
    const prev = this.data.progress.starsPerLevel[level] || 0;
    if (stars > prev) this.data.progress.starsPerLevel[level] = stars;
    this.data.progress.totalStars = this.totalStars();
    this.save();
  }
  setSetting(key, value) { this.data.settings[key] = value; this.save(); }
  setting(key) { return this.data.settings[key]; }

  allCompleted() { return this.data.progress.levelsCompleted.length >= 10; }
}
