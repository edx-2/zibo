import { ACTIONS } from '../engine/input.js';
import { moveAndCollide } from '../engine/physics.js';

// Movement constants from SPEC §4.3. Jump velocity bumped from -520 to -640
// so Zibo can clear the "max 2 tiles up between platforms" gap the spec
// specifies — at -520 the bottom-of-body peak only reaches y=480, leaving
// no clearance over a tile-y=7 platform (top y=448). At -640 there's ~18 px
// of forgiveness, which matters for kids.
const WALK_SPEED = 220;
const JUMP_VELOCITY = -640;
const VARIABLE_CUTOFF_MS = 400;
const VARIABLE_CUTOFF_FACTOR = 0.4;
const GRAVITY = 1400;
const MAX_FALL = 700;
const COYOTE_MS = 120;
const JUMP_BUFFER_MS = 150;
const HITBOX_W = 32;
const HITBOX_H = 44;
const SPRITE_W = 48;
const SPRITE_H = 48;
const ACCEL = 1600;
const DECEL_DEFAULT = 1800;

export class Zibo {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = HITBOX_W;
    this.h = HITBOX_H;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = false;
    this.coyoteUntil = 0;
    this.jumpBufferUntil = 0;
    this.jumpHeldUntil = 0;
    this.jumpStartTime = -Infinity;
    this.jumpReleased = true;
    this.hearts = 3;
    this.maxHearts = 3;
    this.invulnUntil = 0;
    this.dead = false;
    this.cheering = false;
    this.frame = 0;
    this.animTime = 0;
    this.deceleration = DECEL_DEFAULT;

    // Power-up state
    this.power = null; // 'feather' | 'shield' | 'starboots' | 'flashlight'
    this.powerUntil = 0;
    this.canDoubleJump = false;
    this.didDoubleJump = false;

    // Physics modifiers (per-level, e.g. underwater, magnet zones)
    this.gravityMul = 1;
    this.jumpMul = 1;
    this.maxFallMul = 1;
    this.gravitySign = 1; // -1 inside red magnet zone

    // Beam-home state for soft death.
    this.beaming = false;
    this.beamProgress = 0;
  }

  reset(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.hearts = this.maxHearts;
    this.invulnUntil = 0;
    this.dead = false;
    this.cheering = false;
    this.beaming = false;
    this.beamProgress = 0;
    this.power = null;
    this.canDoubleJump = false;
    this.didDoubleJump = false;
    this.gravitySign = 1;
  }

  spriteX() { return this.x - (SPRITE_W - HITBOX_W) / 2; }
  spriteY() { return this.y - (SPRITE_H - HITBOX_H); }

  applyPower(kind, levelDuration = 20000) {
    if (kind === 'shield') {
      this.power = 'shield';
      this.powerUntil = Infinity;
    } else if (kind === 'feather') {
      this.power = 'feather';
      this.powerUntil = performance.now() + levelDuration;
      this.canDoubleJump = true;
    } else if (kind === 'starboots') {
      this.power = 'starboots';
      this.powerUntil = performance.now() + levelDuration;
    } else if (kind === 'flashlight') {
      this.power = 'flashlight';
      this.powerUntil = Infinity;
    }
  }

  update(dt, input, solids, audio, now) {
    if (this.cheering || this.beaming) {
      this.animTime += dt;
      this.frame = Math.floor(this.animTime * 12);
      if (this.beaming) this.beamProgress += dt;
      return;
    }

    // Power-up expiry
    if (this.power && now > this.powerUntil) {
      if (this.power === 'feather') this.canDoubleJump = false;
      this.power = null;
    }

    // Horizontal input
    let targetVX = 0;
    if (input.isDown(ACTIONS.MOVE_LEFT)) { targetVX -= WALK_SPEED; this.facing = -1; }
    if (input.isDown(ACTIONS.MOVE_RIGHT)) { targetVX += WALK_SPEED; this.facing = 1; }
    const accel = (Math.sign(targetVX) === Math.sign(this.vx) || this.vx === 0) ? ACCEL : this.deceleration;
    if (this.vx < targetVX) this.vx = Math.min(targetVX, this.vx + accel * dt);
    else if (this.vx > targetVX) this.vx = Math.max(targetVX, this.vx - accel * dt);
    if (targetVX === 0) {
      if (this.vx > 0) this.vx = Math.max(0, this.vx - this.deceleration * dt);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + this.deceleration * dt);
    }

    // Jump buffering
    if (input.wasPressed(ACTIONS.JUMP)) {
      this.jumpBufferUntil = now + JUMP_BUFFER_MS;
      this.jumpReleased = false;
    }
    if (input.wasReleased(ACTIONS.JUMP)) {
      this.jumpReleased = true;
    }

    const canCoyote = now <= this.coyoteUntil;
    const jumpQueued = now <= this.jumpBufferUntil;
    if (jumpQueued && (this.grounded || canCoyote)) {
      const boost = (this.power === 'starboots') ? 1.3 : 1.0;
      this.vy = JUMP_VELOCITY * boost * this.jumpMul * this.gravitySign;
      this.grounded = false;
      this.coyoteUntil = 0;
      this.jumpBufferUntil = 0;
      this.jumpStartTime = now;
      this.didDoubleJump = false;
      audio?.jump();
    } else if (jumpQueued && !this.grounded && this.canDoubleJump && !this.didDoubleJump && this.jumpReleased) {
      const boost = (this.power === 'starboots') ? 1.3 : 1.0;
      this.vy = JUMP_VELOCITY * boost * this.jumpMul * this.gravitySign * 0.92;
      this.didDoubleJump = true;
      this.jumpBufferUntil = 0;
      audio?.jump();
    }

    // Variable jump cutoff: if the player releases within 400ms, scale velocity.
    if (input.wasReleased(ACTIONS.JUMP) && this.vy * this.gravitySign < 0 && now - this.jumpStartTime < VARIABLE_CUTOFF_MS) {
      this.vy *= VARIABLE_CUTOFF_FACTOR;
    }

    // Gravity
    const g = GRAVITY * this.gravityMul * this.gravitySign;
    this.vy += g * dt;
    const maxFall = MAX_FALL * this.maxFallMul;
    if (this.gravitySign > 0) this.vy = Math.min(this.vy, maxFall);
    else this.vy = Math.max(this.vy, -maxFall);

    // Move + collide
    const wasGrounded = this.grounded;
    const dx = this.vx * dt;
    const dy = this.vy * dt;
    const hit = moveAndCollide(this, dx, dy, solids);
    if (hit.hitRight || hit.hitLeft) this.vx = 0;
    // Floor depends on gravity direction: normal gravity → bottom hit grounds,
    // inverted gravity → top hit grounds.
    const groundHit = this.gravitySign > 0 ? hit.hitBottom : hit.hitTop;
    const ceilingHit = this.gravitySign > 0 ? hit.hitTop : hit.hitBottom;
    if (groundHit) {
      this.grounded = true;
      this.vy = 0;
      this.coyoteUntil = now + COYOTE_MS;
      this.didDoubleJump = false;
      if (!wasGrounded) audio?.land();
    } else if (ceilingHit) {
      this.vy = 0;
      this.grounded = false;
    } else {
      if (wasGrounded) this.coyoteUntil = now + COYOTE_MS;
      this.grounded = false;
    }

    // Animation
    this.animTime += dt;
    if (Math.abs(this.vx) > 10) this.frame = Math.floor(this.animTime * 12) % 6;
    else this.frame = Math.floor(this.animTime * 4) % 4;
  }

  takeHit(now, audio) {
    if (now < this.invulnUntil) return false;
    if (this.power === 'shield') {
      this.power = null;
      this.invulnUntil = now + 600;
      audio?.hurt();
      return true;
    }
    this.hearts -= 1;
    this.invulnUntil = now + 1000;
    audio?.hurt();
    if (this.hearts <= 0) this.beam(audio);
    return true;
  }

  beam(audio) {
    this.beaming = true;
    this.beamProgress = 0;
    audio?.beam();
  }

  cheer() { this.cheering = true; this.vx = 0; }
}
