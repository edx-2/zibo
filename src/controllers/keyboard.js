import { ACTIONS } from '../engine/input.js';

const KEY_MAP = {
  ArrowLeft: ACTIONS.MOVE_LEFT,
  ArrowRight: ACTIONS.MOVE_RIGHT,
  ArrowUp: ACTIONS.UP,
  ArrowDown: ACTIONS.DOWN,
  KeyA: ACTIONS.MOVE_LEFT,
  KeyD: ACTIONS.MOVE_RIGHT,
  KeyW: ACTIONS.UP,
  KeyS: ACTIONS.DOWN,
  Space: ACTIONS.JUMP,
  ShiftLeft: ACTIONS.ACTION,
  ShiftRight: ACTIONS.ACTION,
  Escape: ACTIONS.PAUSE,
  Enter: ACTIONS.CONFIRM
};

export function attachKeyboard(input) {
  const onDown = (e) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    if (action === ACTIONS.UP) {
      input.press(ACTIONS.JUMP);
      input.press(ACTIONS.UP);
      input.press(ACTIONS.CONFIRM);
    } else if (action === ACTIONS.JUMP) {
      input.press(ACTIONS.JUMP);
      input.press(ACTIONS.CONFIRM); // Space doubles as confirm in menus.
    } else {
      input.press(action);
    }
  };
  const onUp = (e) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    if (action === ACTIONS.UP) {
      input.release(ACTIONS.JUMP);
      input.release(ACTIONS.UP);
      input.release(ACTIONS.CONFIRM);
    } else if (action === ACTIONS.JUMP) {
      input.release(ACTIONS.JUMP);
      input.release(ACTIONS.CONFIRM);
    } else {
      input.release(action);
    }
  };
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', () => input.reset());
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
  };
}
