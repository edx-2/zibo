// Input abstraction. Controllers (keyboard, poweredup) feed in abstract events.
// Game code reads `state` (held buttons) and listens to one-shot edge events.

export const ACTIONS = {
  MOVE_LEFT: 'MOVE_LEFT',
  MOVE_RIGHT: 'MOVE_RIGHT',
  JUMP: 'JUMP',
  ACTION: 'ACTION',
  PAUSE: 'PAUSE',
  CONFIRM: 'CONFIRM',
  UP: 'UP',
  DOWN: 'DOWN'
};

export class Input {
  constructor() {
    this.held = new Set();
    this.pressedThisFrame = new Set();
    this.releasedThisFrame = new Set();
    this.listeners = new Set();
  }

  press(action) {
    if (!this.held.has(action)) {
      this.pressedThisFrame.add(action);
      this.held.add(action);
      for (const fn of this.listeners) fn({ type: 'press', action });
    }
  }

  release(action) {
    if (this.held.has(action)) {
      this.releasedThisFrame.add(action);
      this.held.delete(action);
      for (const fn of this.listeners) fn({ type: 'release', action });
    }
  }

  isDown(action) { return this.held.has(action); }
  wasPressed(action) { return this.pressedThisFrame.has(action); }
  wasReleased(action) { return this.releasedThisFrame.has(action); }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  endFrame() {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }

  // Reset for scene transitions to avoid carrying held state into menus.
  reset() {
    this.held.clear();
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }
}
