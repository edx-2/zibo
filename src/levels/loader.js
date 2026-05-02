// Levels are defined declaratively as JSON-like objects in `levelData.js`.
// `loadLevel(id)` returns a freshly instantiated set of entities + tiles.

import { TILE } from '../engine/physics.js';
import {
  Star, HeartPickup, RocketPart, PowerUpPickup, Goal,
  Spike, LavaDrop, Cactus, Jellyfish, FallingRock, BouncyMushroom,
  Switch, Door, MagnetZone, Firefly, SequenceBlock, Clamshell, TimedBridge
} from '../entities/entities.js';
import { LEVELS } from './levelData.js';

export function listLevels() { return LEVELS; }

export function loadLevel(id) {
  const def = LEVELS.find(l => l.id === id);
  if (!def) throw new Error('unknown level ' + id);
  const tiles = [];
  for (const t of def.tiles || []) {
    const x = t.x * TILE;
    const y = t.y * TILE;
    const w = (t.w || 1) * TILE;
    const h = (t.h || 1) * TILE;
    tiles.push({ x, y, w, h, kind: t.kind || 'ground', oneWay: !!t.oneWay });
  }

  const stars = (def.stars || []).map(s => new Star(s.x * TILE + TILE / 2, s.y * TILE + TILE / 2));
  const hearts = (def.hearts || []).map(h => new HeartPickup(h.x * TILE + TILE / 2, h.y * TILE + TILE / 2));
  const rocketPart = def.rocketPart ? new RocketPart(def.rocketPart.x * TILE + TILE / 2, def.rocketPart.y * TILE + TILE / 2, def.rocketPart.kind) : null;
  const powerUps = (def.powerUps || []).map(p => new PowerUpPickup(p.x * TILE + TILE / 2, p.y * TILE + TILE / 2, p.kind));
  const goal = new Goal(def.goal.x * TILE + TILE / 2, def.goal.y * TILE + TILE / 2);

  const spikes = (def.spikes || []).map(s => new Spike(s.x * TILE, s.flipped ? s.y * TILE : s.y * TILE - 24, (s.w || 1) * TILE, !!s.flipped));
  const lava = (def.lava || []).map((l, i) => new LavaDrop(l.x * TILE + TILE / 2, l.y * TILE + TILE, l.period || 2000, l.phase ?? i * 600));
  const cacti = (def.cacti || []).map(c => new Cactus(c.x * TILE + 16, c.y * TILE));
  const jellies = (def.jellies || []).map(j => new Jellyfish(j.x * TILE + TILE / 2, j.y * TILE + TILE / 2, j.range || 80, j.speed || 1));
  const rocks = (def.rocks || []).map(r => new FallingRock(r.x * TILE + TILE / 2, r.y * TILE, (r.range || 3) * TILE, r.fallY ? r.fallY * TILE : null));
  const mushrooms = (def.mushrooms || []).map(m => new BouncyMushroom(m.x * TILE, m.y * TILE + TILE / 2, m.mul || 2));
  const switches = (def.switches || []).map(s => new Switch(s.x * TILE, s.y * TILE + TILE - 16, s.color, s.linkId, s.holdMs || 5000));
  const doors = (def.doors || []).map(d => new Door(d.x * TILE, d.y * TILE, (d.w || 1) * TILE, (d.h || 3) * TILE, d.color, d.linkId));
  const magnetZones = (def.magnetZones || []).map(m => new MagnetZone(m.x * TILE, m.y * TILE, m.w * TILE, m.h * TILE, m.color));
  const fireflies = (def.fireflies || []).map(f => new Firefly(f.x * TILE + TILE / 2, f.y * TILE + TILE / 2));
  const sequenceBlocks = (def.sequenceBlocks || []).map(b => new SequenceBlock(b.x * TILE, b.y * TILE, b.index));
  const clamshells = (def.clamshells || []).map(c => new Clamshell(c.x * TILE, c.y * TILE));
  const bridges = (def.bridges || []).map(b => new TimedBridge(b.x * TILE, b.y * TILE, b.w || 4, b.linkId));

  return {
    def,
    tiles,
    spawn: { x: def.spawn.x * TILE, y: def.spawn.y * TILE },
    checkpoint: def.checkpoint ? { x: def.checkpoint.x * TILE, y: def.checkpoint.y * TILE } : null,
    goal,
    stars,
    hearts,
    rocketPart,
    powerUps,
    spikes,
    lava,
    cacti,
    jellies,
    rocks,
    mushrooms,
    switches,
    doors,
    magnetZones,
    fireflies,
    sequenceBlocks,
    clamshells,
    bridges,
    width: (def.width || 50) * TILE,
    height: 720
  };
}
