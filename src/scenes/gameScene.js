import { ACTIONS } from '../engine/input.js';
import { aabb, TILE } from '../engine/physics.js';
import { LOGICAL_W, LOGICAL_H } from '../engine/renderer.js';
import { Zibo } from '../entities/zibo.js';
import { loadLevel } from '../levels/loader.js';
import { drawBackground } from './bgPainter.js';
import { drawTiles } from './tilePainter.js';
import { t } from '../state/i18n.js';

export class GameScene {
  constructor(app, levelId) {
    this.app = app;
    this.levelId = levelId;
    this.now = performance.now();
    this.t = 0;
    this.deathCount = 0;
    this.completed = false;
    this.completeTimer = 0;
    this.showSkipPrompt = false;
    this.demoSeqStep = -1;
    this.demoSeqLoops = 0;
    this.demoSeqTimer = 0;
    this.seqProgress = 0;
    this.lastTime = performance.now();
    this.paused = false;
    this.pauseSel = 0;
    this.skipSel = 0;
    this.lastCheckpointSpawn = null;
    this.cam = { x: 0, y: 0 };
    this.particles = [];
    this.load();
  }

  load() {
    const lvl = loadLevel(this.levelId);
    this.level = lvl;
    const spawn = this.lastCheckpointSpawn || lvl.spawn;
    this.zibo = new Zibo(spawn.x, spawn.y);
    if (this.app.progress.setting('easyMode')) {
      this.zibo.maxHearts = 5;
      this.zibo.hearts = 5;
    }
    if (lvl.def.water) {
      this.zibo.gravityMul = 0.5;
      this.zibo.jumpMul = 1.3;
      this.zibo.maxFallMul = 0.6;
    }
    if (lvl.def.slippery) {
      this.zibo.deceleration = 400;
    }
    this.demoSeqStep = -1;
    this.demoSeqLoops = 0;
    this.demoSeqTimer = 0;
    this.seqProgress = 0;
    this.completed = false;
    this.completeTimer = 0;
    this.showSkipPrompt = false;
    this.particles = [];
    this.app.audio.playMusic(lvl.def.music);
  }

  update(dt) {
    const now = performance.now();
    this.now = now;
    this.t += dt;
    const input = this.app.input;

    if (input.wasPressed(ACTIONS.PAUSE)) {
      if (this.completed) return;
      this.paused = !this.paused;
      this.app.audio.menu();
    }

    if (this.showSkipPrompt) {
      this.handleSkipPrompt(input);
      return;
    }
    if (this.paused) {
      this.handlePauseMenu(input);
      return;
    }

    // ----- World update -----
    const { level, zibo } = this;

    // Bridges contribute solid tiles when active.
    const dynamicSolids = [];
    for (const b of level.bridges) {
      if (b.isActive(level.switches, now)) {
        dynamicSolids.push({ x: b.x, y: b.y, w: b.w, h: b.h });
      }
    }
    // Doors contribute solid tiles when closed.
    for (const d of level.doors) {
      if (!d.isOpen(level.switches, now)) {
        dynamicSolids.push({ x: d.x, y: d.y, w: d.w, h: d.h });
      }
    }
    // Mushrooms are one-way solids — Zibo lands on them, then the bounce
    // launches him on the next frame.
    for (const m of level.mushrooms) {
      dynamicSolids.push({ x: m.x, y: m.y, w: m.w, h: m.h, oneWay: true });
    }
    // Sequence-puzzle ice blocks (Level 2) are full solids.
    for (const b of level.sequenceBlocks) {
      dynamicSolids.push({ x: b.x, y: b.y, w: b.w, h: b.h });
    }
    const solids = level.tiles.concat(dynamicSolids);

    // Magnet zone effect on Zibo: red zone inverts gravity while inside.
    let gravitySign = 1;
    let gravityMul = level.def.water ? 0.5 : 1;
    for (const z of level.magnetZones) {
      if (z.contains(zibo)) {
        if (z.color === 'red') gravitySign = -1;
        else if (z.color === 'blue') gravityMul *= 1.6;
      }
    }
    zibo.gravitySign = gravitySign;
    zibo.gravityMul = gravityMul;

    zibo.update(dt, input, solids, this.app.audio, now);

    // Bouncy mushrooms — landing on top with downward velocity launches.
    for (const m of level.mushrooms) {
      m.update(dt);
      // Detect landing this frame: Zibo's bottom inside top of mushroom and falling.
      const ziboBottom = zibo.y + zibo.h;
      const onTop = aabb({ x: zibo.x, y: zibo.y + zibo.h - 6, w: zibo.w, h: 12 }, m.hitbox());
      if (onTop && zibo.vy >= 0 && Math.abs(ziboBottom - m.y) < 20) {
        zibo.vy = -780 * (zibo.power === 'starboots' ? 1.15 : 1) * zibo.gravitySign * (zibo.gravityMul < 1 ? 0.85 : 1);
        zibo.grounded = false;
        zibo.didDoubleJump = false;
        m.trigger();
        this.app.audio.bounce();
      }
    }

    // Switches — press by stepping on.
    for (const s of level.switches) {
      const overlap = aabb({ x: zibo.x, y: zibo.y + zibo.h - 6, w: zibo.w, h: 10 }, s.hitbox());
      if (overlap && !s.isActive(now)) {
        s.press(now);
        this.app.audio.switchClick();
      }
    }

    // Sequence puzzle (Level 2) state.
    if (level.sequenceBlocks.length > 0) {
      this.updateSequence(dt, now);
    }

    // Star pickup
    for (const star of level.stars) {
      if (star.collected) continue;
      star.update(dt);
      if (aabb(zibo, star.hitbox())) {
        star.collected = true;
        this.app.audio.star();
        this.spark(star.x, star.y, '#ffd84d');
      }
    }

    // Heart pickup
    for (const h of level.hearts) {
      if (h.collected) continue;
      h.update(dt);
      if (aabb(zibo, h.hitbox()) && zibo.hearts < zibo.maxHearts) {
        h.collected = true;
        zibo.hearts = Math.min(zibo.maxHearts, zibo.hearts + 1);
        this.app.audio.powerUp();
        this.spark(h.x, h.y, '#ff5ea1');
      }
    }

    // Power-up pickup
    for (const p of level.powerUps) {
      if (p.collected) continue;
      p.update(dt);
      if (aabb(zibo, p.hitbox())) {
        p.collected = true;
        zibo.applyPower(p.kind);
        this.app.audio.powerUp();
        this.spark(p.x, p.y, '#fff');
      }
    }

    // Rocket part — gated by clamshell open state if it's nestled in one.
    if (level.rocketPart && !level.rocketPart.collected) {
      level.rocketPart.update(dt);
      const rp = level.rocketPart;
      const insideClam = level.clamshells.find(c => Math.abs(c.x + 48 - rp.x) < 80 && Math.abs(c.y + 48 - rp.y) < 80);
      const reachable = !insideClam || insideClam.isOpen();
      if (reachable && aabb(zibo, rp.hitbox())) {
        rp.collected = true;
        this.app.audio.rocketPart();
        for (let i = 0; i < 14; i++) this.spark(rp.x, rp.y, '#ffd84d');
      }
    }

    // Spikes & cacti
    for (const s of level.spikes) if (aabb(zibo, s.hitbox())) zibo.takeHit(now, this.app.audio);
    for (const c of level.cacti) {
      const hb = c.hitbox();
      if (aabb(zibo, hb)) {
        // knockback only; no damage. Push Zibo away from cactus center.
        const sign = (zibo.x + zibo.w / 2) < (hb.x + hb.w / 2) ? -1 : 1;
        zibo.vx = sign * 320;
        zibo.vy = Math.min(zibo.vy, -260);
      }
    }

    // Lava
    for (const l of level.lava) {
      l.update(dt);
      const hb = l.hitbox();
      if (hb && aabb(zibo, hb)) zibo.takeHit(now, this.app.audio);
    }

    // Jellyfish
    for (const j of level.jellies) {
      j.update(dt);
      if (aabb(zibo, j.hitbox()) && j.damages()) zibo.takeHit(now, this.app.audio);
    }

    // Falling rocks
    for (const r of level.rocks) {
      r.update(dt, zibo);
      const hb = r.hitbox();
      if (hb && aabb(zibo, hb)) zibo.takeHit(now, this.app.audio);
    }

    // Clamshells (Level 6) — when open, the rocket part inside is reachable.
    for (const c of level.clamshells) {
      c.update(dt);
      if (level.rocketPart && c.isOpen()) {
        const rb = level.rocketPart.hitbox();
        if (aabb({ x: c.x + 10, y: c.y + 30, w: 76, h: 50 }, rb)) {
          // already collected via rocket-part overlap above
        }
      }
    }

    for (const f of level.fireflies) f.update(dt);

    // Pit fall — bottomless. Anything below world height is instant restart.
    if (zibo.y > LOGICAL_H + 100 && !zibo.beaming && !zibo.cheering) {
      zibo.beam(this.app.audio);
      zibo.hearts = 0;
    }

    // Beam home animation
    if (zibo.beaming) {
      if (zibo.beamProgress > 1.4) {
        this.deathCount++;
        if (this.deathCount >= 3 && !this.level.def.checkpoint) this.showSkipPrompt = true;
        const spawn = this.lastCheckpointSpawn || level.spawn;
        zibo.reset(spawn.x, spawn.y);
        if (this.app.progress.setting('easyMode')) { zibo.maxHearts = 5; zibo.hearts = 5; }
        // Re-apply level-wide modifiers (water buoyancy, slippery decel).
        if (level.def.water) { zibo.jumpMul = 1.3; zibo.maxFallMul = 0.6; }
        if (level.def.slippery) zibo.deceleration = 400;
      }
    }

    // Checkpoint
    if (level.checkpoint) {
      const cp = level.checkpoint;
      if (!this.lastCheckpointSpawn && Math.abs(zibo.x - cp.x) < 40 && Math.abs(zibo.y - cp.y) < 80) {
        this.lastCheckpointSpawn = { x: cp.x, y: cp.y };
        this.app.audio.confirm();
      }
    }

    // Goal — needs rocket part.
    if (!this.completed && level.rocketPart && level.rocketPart.collected) {
      if (aabb(zibo, level.goal.hitbox())) this.complete();
    }

    // Camera follow
    const camTargetX = Math.max(0, Math.min(level.width - LOGICAL_W, zibo.x - LOGICAL_W / 2 + zibo.w / 2));
    this.cam.x += (camTargetX - this.cam.x) * Math.min(1, dt * 6);

    // Particles
    for (const p of this.particles) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt;
    }
    this.particles = this.particles.filter(p => p.t < 0.7);

    // Level-end timer (cheer, then transition)
    if (this.completed) {
      this.completeTimer += dt;
      if (this.completeTimer > 2.5) {
        const stars = level.stars.filter(s => s.collected).length;
        this.app.progress.recordLevel(this.levelId, stars);
        if (this.levelId === 10) this.app.gotoEnding(stars);
        else this.app.gotoLevelSelect();
      }
    }
  }

  updateSequence(dt, now) {
    // Demo loop: flash blocks 0,1,2,... in index order three times before accepting input.
    this.demoSeqTimer += dt;
    if (this.demoSeqLoops < 3) {
      const phase = this.demoSeqTimer % 1.5;
      const stepIndex = Math.floor(phase / 0.5);
      this.demoSeqStep = stepIndex < 3 ? stepIndex : -1;
      if (this.demoSeqTimer >= 1.5) {
        this.demoSeqTimer = 0;
        this.demoSeqLoops++;
      }
    } else {
      this.demoSeqStep = -1;
      // Player input: detect Zibo landing on a block (top contact + downward velocity zeroed).
      for (const b of this.level.sequenceBlocks) {
        const onTop = aabb({ x: this.zibo.x, y: this.zibo.y + this.zibo.h - 4, w: this.zibo.w, h: 8 }, b.hitbox());
        if (onTop && this.zibo.grounded) {
          if (b.flash <= 0) {
            b.flash = 0.3;
            if (b.index === this.seqProgress) {
              this.seqProgress++;
              this.app.audio.confirm();
              b.activated = true;
              if (this.seqProgress >= this.level.sequenceBlocks.length) {
                // Find a switch labelled "icebar" linkId and toggle it on permanently.
                const sw = this.level.switches.find(s => s.linkId === 'icebar');
                if (sw) sw.press(now);
                this.app.audio.door();
              }
            } else {
              this.app.audio.hurt();
              this.seqProgress = 0;
              for (const block of this.level.sequenceBlocks) block.activated = false;
            }
          }
        }
        if (b.flash > 0) b.flash -= dt * 2;
      }
    }
  }

  spark(x, y, color) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 1) * 200,
        color,
        t: 0
      });
    }
  }

  complete() {
    this.completed = true;
    this.zibo.cheer();
    this.app.audio.rocketPart();
  }

  handlePauseMenu(input) {
    const items = ['resume', 'restart', 'quit'];
    if (input.wasPressed(ACTIONS.MOVE_LEFT)) { this.pauseSel = (this.pauseSel + items.length - 1) % items.length; this.app.audio.menu(); }
    if (input.wasPressed(ACTIONS.MOVE_RIGHT)) { this.pauseSel = (this.pauseSel + 1) % items.length; this.app.audio.menu(); }
    if (input.wasPressed(ACTIONS.CONFIRM)) {
      const sel = items[this.pauseSel];
      this.app.audio.confirm();
      if (sel === 'resume') this.paused = false;
      else if (sel === 'restart') { this.lastCheckpointSpawn = null; this.deathCount = 0; this.paused = false; this.load(); }
      else if (sel === 'quit') this.app.gotoLevelSelect();
    }
  }

  handleSkipPrompt(input) {
    const items = ['retry', 'skip'];
    if (input.wasPressed(ACTIONS.MOVE_LEFT)) { this.skipSel = (this.skipSel + 1) % 2; this.app.audio.menu(); }
    if (input.wasPressed(ACTIONS.MOVE_RIGHT)) { this.skipSel = (this.skipSel + 1) % 2; this.app.audio.menu(); }
    if (input.wasPressed(ACTIONS.CONFIRM)) {
      this.app.audio.confirm();
      if (items[this.skipSel] === 'retry') { this.deathCount = 0; this.showSkipPrompt = false; }
      else { this.app.gotoLevelSelect(); }
    }
  }

  draw(r) {
    const ctx = r.ctx;
    drawBackground(ctx, this.level.def.bg, this.cam.x, this.t);

    // World transform
    ctx.save();
    ctx.translate(-Math.floor(this.cam.x), 0);

    // Tiles
    drawTiles(ctx, this.level.tiles, this.level.def.theme);

    // Bridges (drawn behind decorative items but in front of bg)
    for (const b of this.level.bridges) b.draw(r, b.isActive(this.level.switches, this.now));

    // Doors
    for (const d of this.level.doors) d.draw(r, d.isOpen(this.level.switches, this.now));

    // Magnet zones (translucent)
    for (const z of this.level.magnetZones) z.draw(r);

    // Sequence blocks
    for (const b of this.level.sequenceBlocks) b.draw(r, this.demoSeqStep);

    // Bouncy mushrooms
    for (const m of this.level.mushrooms) m.draw(r);

    // Cacti
    for (const c of this.level.cacti) c.draw(r);

    // Spikes
    for (const s of this.level.spikes) s.draw(r);

    // Switches
    for (const s of this.level.switches) s.draw(r);

    // Clamshells
    for (const c of this.level.clamshells) c.draw(r);

    // Fireflies
    for (const f of this.level.fireflies) f.draw(r);

    // Power-ups, hearts, stars
    for (const p of this.level.powerUps) p.draw(r);
    for (const h of this.level.hearts) h.draw(r);
    for (const s of this.level.stars) s.draw(r);

    // Rocket part (only if not in clamshell or if shell open)
    if (this.level.rocketPart && !this.level.rocketPart.collected) {
      const rp = this.level.rocketPart;
      const insideClam = this.level.clamshells.find(c => Math.abs(c.x + 48 - rp.x) < 80 && Math.abs(c.y + 48 - rp.y) < 80);
      if (!insideClam || insideClam.isOpen()) rp.draw(r);
    }

    // Falling rocks
    for (const rk of this.level.rocks) rk.draw(r);

    // Lava drops
    for (const l of this.level.lava) l.draw(r);

    // Jellyfish
    for (const j of this.level.jellies) j.draw(r);

    // Checkpoint
    if (this.level.checkpoint) r.drawCheckpoint(this.level.checkpoint.x, this.level.checkpoint.y, this.t * 1000, !!this.lastCheckpointSpawn);

    // Goal
    this.level.goal.draw(r, this.level.rocketPart && this.level.rocketPart.collected);

    // Zibo
    this.drawZibo(r);

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - p.t / 0.7);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // Dark overlay for cave
    if (this.level.def.dark) this.drawDarkOverlay(r);

    // HUD
    this.drawHUD(r);

    // Pause / skip overlays
    if (this.paused) this.drawPauseMenu(r);
    if (this.showSkipPrompt) this.drawSkipPrompt(r);
    if (this.completed) this.drawComplete(r);
  }

  drawZibo(r) {
    const z = this.zibo;
    const flicker = z.invulnUntil > this.now && Math.floor(this.now / 80) % 2 === 0;
    if (flicker) return;
    const moving = Math.abs(z.vx) > 10;
    const opts = {
      facing: z.facing,
      frame: z.frame,
      hurt: z.invulnUntil > this.now,
      cheering: z.cheering,
      vy: z.vy,
      grounded: z.grounded,
      moving
    };
    if (z.beaming) {
      const ctx = r.ctx;
      const a = Math.max(0, 1 - z.beamProgress / 1.4);
      ctx.globalAlpha = a;
      r.drawZibo(z.spriteX(), z.spriteY(), opts);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 8; i++) {
        const a2 = z.beamProgress + i * 0.1;
        const px = z.x + 24 + Math.cos(a2 * 6) * (a2 * 30);
        const py = z.y + 22 + Math.sin(a2 * 6) * (a2 * 30) - z.beamProgress * 60;
        ctx.fillStyle = `rgba(180, 220, 255, ${Math.max(0, 1 - a2)})`;
        ctx.fillRect(px, py, 3, 3);
      }
      return;
    }
    if (z.power === 'shield') {
      const ctx = r.ctx;
      const t = performance.now();
      ctx.strokeStyle = `rgba(127, 211, 255, ${0.6 + Math.sin(t / 200) * 0.2})`;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(z.x + z.w / 2, z.y + z.h / 2, 36, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(127, 211, 255, 0.18)';
      ctx.beginPath(); ctx.arc(z.x + z.w / 2, z.y + z.h / 2, 36, 0, Math.PI * 2); ctx.fill();
    }
    r.drawZibo(z.spriteX(), z.spriteY(), opts);
  }

  drawDarkOverlay(r) {
    const ctx = r.ctx;
    const lightR = (this.zibo.power === 'flashlight') ? 260 : 110;
    const zx = this.zibo.x + this.zibo.w / 2 - this.cam.x;
    const zy = this.zibo.y + this.zibo.h / 2;
    // Single radial gradient: transparent at Zibo, fading to dark at light radius.
    const grad = ctx.createRadialGradient(zx, zy, 0, zx, zy, Math.max(LOGICAL_W, LOGICAL_H));
    grad.addColorStop(0, 'rgba(8, 4, 30, 0)');
    grad.addColorStop(lightR / Math.max(LOGICAL_W, LOGICAL_H), 'rgba(8, 4, 30, 0.55)');
    grad.addColorStop(1, 'rgba(8, 4, 30, 0.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Firefly halos on top — punch out a softer hole at each light.
    for (const f of this.level.fireflies) {
      const l = f.light();
      const lx = l.x - this.cam.x;
      const ly = l.y;
      const fg = ctx.createRadialGradient(lx, ly, 0, lx, ly, l.r);
      fg.addColorStop(0, 'rgba(255, 240, 140, 0.35)');
      fg.addColorStop(1, 'rgba(255, 240, 140, 0)');
      ctx.fillStyle = fg;
      ctx.fillRect(lx - l.r, ly - l.r, l.r * 2, l.r * 2);
    }
  }

  drawHUD(r) {
    const ctx = r.ctx;
    // Hearts
    for (let i = 0; i < this.zibo.maxHearts; i++) {
      r.drawHeart(40 + i * 40, 36, 16, i < this.zibo.hearts);
    }
    // Star count
    const totalStars = this.level.stars.length;
    const collected = this.level.stars.filter(s => s.collected).length;
    r.drawStar(LOGICAL_W / 2 - 60, 36, 18);
    r.text(`${collected} / ${totalStars}`, LOGICAL_W / 2 - 30, 22, { size: 28, color: '#fff', shadow: '#000' });

    // Power-up indicator (top-right)
    if (this.zibo.power) {
      const px = LOGICAL_W - 70;
      const py = 36;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath(); ctx.arc(px, py, 28, 0, Math.PI * 2); ctx.fill();
      r.drawPowerUp(px, py, this.zibo.power, performance.now());
      // timer ring
      if (this.zibo.power !== 'shield' && this.zibo.power !== 'flashlight') {
        const remaining = Math.max(0, this.zibo.powerUntil - performance.now()) / 20000;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining);
        ctx.stroke();
      }
    }

    // Pause icon hint
    r.text('II', LOGICAL_W - 40, LOGICAL_H - 36, { size: 24, color: 'rgba(255,255,255,0.5)' });
  }

  drawPauseMenu(r) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    r.text(t('pause.title'), LOGICAL_W / 2, 200, { size: 64, align: 'center', color: '#ffd84d', shadow: '#000' });
    const items = [t('pause.resume'), t('pause.restart'), t('pause.quit')];
    items.forEach((label, i) => {
      const y = 320 + i * 70;
      const sel = i === this.pauseSel;
      r.text(label, LOGICAL_W / 2, y, { size: 36, align: 'center', color: sel ? '#ffd84d' : '#fff', shadow: '#000' });
    });
  }

  drawSkipPrompt(r) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    r.text(t('level.skip'), LOGICAL_W / 2, 240, { size: 48, align: 'center', color: '#fff', shadow: '#000' });
    const items = [t('level.tryAgain'), t('common.continue')];
    items.forEach((label, i) => {
      const x = LOGICAL_W / 2 - 200 + i * 400;
      const sel = i === this.skipSel;
      r.text(label, x, 380, { size: 36, align: 'center', color: sel ? '#ffd84d' : '#fff', shadow: '#000' });
    });
  }

  drawComplete(r) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    r.text(t('level.complete'), LOGICAL_W / 2, 280, { size: 80, align: 'center', color: '#ffd84d', shadow: '#000' });
    const collected = this.level.stars.filter(s => s.collected).length;
    r.text(`★ ${collected} / ${this.level.stars.length}`, LOGICAL_W / 2, 380, { size: 40, align: 'center', color: '#fff', shadow: '#000' });
  }
}
