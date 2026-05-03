// Pointer (mouse + touch) input. Translates browser pointer events to the
// 1280×720 logical coordinate space so scenes can hit-test their UI rects.
//
// Usage: scenes call pointer.tappedIn(x, y, w, h) to consume a tap that fell
// inside a rectangle, or pointer.tappedAtCircle(cx, cy, r) for circular
// targets like level-select planets. Untapped state is cleared at end of
// frame so taps never leak across frames.

import { LOGICAL_W, LOGICAL_H } from './renderer.js';

export class Pointer {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = -1;
    this.y = -1;
    this.tap = null;       // { x, y } if a fresh tap is waiting to be consumed
    this.down = false;
    this.attach();
  }

  attach() {
    const onDown = (e) => {
      const p = this.toLogical(e);
      this.x = p.x; this.y = p.y;
      this.down = true;
      this.tap = { x: p.x, y: p.y };
      // Prevent the browser from treating the tap as a scroll/zoom gesture,
      // and from synthesising a duplicate `mousedown` after `touchstart`.
      if (e.cancelable) e.preventDefault();
    };
    const onUp = (e) => {
      this.down = false;
      if (e.cancelable) e.preventDefault();
    };
    const onMove = (e) => {
      const p = this.toLogical(e);
      this.x = p.x; this.y = p.y;
    };
    const onLeave = () => { this.x = -1; this.y = -1; };

    // Pointer Events unify mouse, touch and pen across modern browsers.
    this.canvas.addEventListener('pointerdown', onDown);
    this.canvas.addEventListener('pointerup', onUp);
    this.canvas.addEventListener('pointermove', onMove);
    this.canvas.addEventListener('pointerleave', onLeave);
    this.canvas.addEventListener('pointercancel', onUp);
  }

  toLogical(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width * LOGICAL_W;
    const cy = (e.clientY - rect.top) / rect.height * LOGICAL_H;
    return { x: cx, y: cy };
  }

  // Hit tests --------------------------------------------------------------
  tappedIn(x, y, w, h) {
    if (!this.tap) return false;
    const t = this.tap;
    if (t.x >= x && t.x <= x + w && t.y >= y && t.y <= y + h) {
      this.tap = null;     // consume — first match wins
      return true;
    }
    return false;
  }

  tappedAtCircle(cx, cy, r) {
    if (!this.tap) return false;
    const t = this.tap;
    const dx = t.x - cx, dy = t.y - cy;
    if (dx * dx + dy * dy <= r * r) {
      this.tap = null;
      return true;
    }
    return false;
  }

  hoverIn(x, y, w, h) {
    if (this.x < 0) return false;
    return this.x >= x && this.x <= x + w && this.y >= y && this.y <= y + h;
  }

  hoverAtCircle(cx, cy, r) {
    if (this.x < 0) return false;
    const dx = this.x - cx, dy = this.y - cy;
    return dx * dx + dy * dy <= r * r;
  }

  endFrame() {
    // Drop unconsumed taps so they don't leak into the next frame's logic.
    this.tap = null;
  }
}
