// Level data — all 10 planets. Coordinates are in tile units (1 tile = 64 px).
// World height is 12 tiles (768 px) but visible play area is 720 px.
// Floor row is typically y = 9 (top edge at 576 px); ground tiles fill y = 9..11.

// Helpers to keep the data file readable.
const ground = (x, w, y = 9, h = 3, kind = 'ground') => ({ x, y, w, h, kind });
const block = (x, y, w = 1, h = 1, kind = 'block') => ({ x, y, w, h, kind });
const oneWay = (x, y, w = 2, kind = 'block') => ({ x, y, w, h: 1, kind, oneWay: true });
const star = (x, y) => ({ x, y });

export const LEVELS = [
  // -------------------- Level 1 — Grassland --------------------
  {
    id: 1, name: 'Grassland', theme: 'grassland', width: 40, music: 'grassland', bg: 'grassland',
    spawn: { x: 2, y: 7 },
    goal: { x: 38, y: 7 },
    rocketPart: { x: 37, y: 3, kind: 'engine' },
    tiles: [
      ground(0, 14),
      ground(15, 4),
      block(15, 8, 1, 1),
      ground(20, 6),
      block(20, 7, 1, 2),
      block(23, 6, 2, 1),
      ground(28, 12),
      block(30, 7, 2, 1),
      block(34, 6, 3, 1),
      block(36, 4, 3, 2)
    ],
    mushrooms: [
      { x: 16, y: 8 },
      { x: 26, y: 8 },
      { x: 33, y: 8 }
    ],
    stars: [
      star(4, 7), star(8, 7), star(12, 5),
      star(17, 6), star(22, 5), star(24, 4),
      star(29, 7), star(31, 5), star(35, 4),
      star(38, 4)
    ]
  },

  // -------------------- Level 2 — Ice --------------------
  {
    id: 2, name: 'Ice', theme: 'ice', width: 45, music: 'ice', bg: 'ice', slippery: true,
    spawn: { x: 2, y: 7 },
    goal: { x: 43, y: 7 },
    rocketPart: { x: 42, y: 6, kind: 'fin' },
    tiles: [
      ground(0, 12),
      block(6, 7, 2, 1),
      block(10, 5, 2, 1),
      ground(13, 5),
      block(15, 7, 2, 1),
      ground(20, 25),
      block(35, 7, 2, 1),
      block(38, 5, 3, 1),
      block(41, 7, 3, 1)
    ],
    sequenceBlocks: [
      { x: 21, y: 8, index: 0 },
      { x: 22, y: 7, index: 2 },
      { x: 23, y: 8, index: 1 }
    ],
    powerUps: [{ x: 28, y: 8, kind: 'starboots' }],
    doors: [{ x: 32, y: 4, w: 1, h: 5, color: 'blue', linkId: 'icebar' }],
    switches: [{ x: 22, y: -4, color: 'blue', linkId: 'icebar', holdMs: 999999 }],
    stars: [
      star(4, 7), star(7, 6), star(11, 4),
      star(16, 6), star(22, 5), star(26, 5),
      star(30, 5), star(35, 6), star(39, 4), star(44, 4)
    ]
  },

  // -------------------- Level 3 — Desert --------------------
  {
    id: 3, name: 'Desert', theme: 'desert', width: 50, music: 'desert', bg: 'desert',
    spawn: { x: 2, y: 7 },
    goal: { x: 48, y: 7 },
    rocketPart: { x: 46, y: 4, kind: 'hatch' },
    tiles: [
      ground(0, 8),
      ground(11, 4),
      ground(18, 4),
      ground(25, 8),
      // sand ruin
      block(33, 7, 4, 1),
      block(34, 5, 4, 1),
      block(35, 3, 3, 1),
      ground(38, 12),
      block(43, 7, 2, 1),
      block(45, 5, 2, 1)
    ],
    cacti: [{ x: 13, y: 8 }, { x: 27, y: 8 }, { x: 30, y: 8 }],
    bridges: [{ x: 8, y: 9, w: 3, linkId: 'sandA' }, { x: 15, y: 9, w: 3, linkId: 'sandB' }],
    switches: [
      { x: 5, y: 8, color: 'red', linkId: 'sandA', holdMs: 8000 },
      { x: 12, y: 8, color: 'red', linkId: 'sandB', holdMs: 8000 },
      { x: 26, y: 8, color: 'blue', linkId: 'alcove', holdMs: 999999 }
    ],
    doors: [{ x: 31, y: 6, w: 1, h: 3, color: 'blue', linkId: 'alcove' }],
    stars: [
      star(4, 7), star(9, 7), star(13, 6),
      star(20, 6), star(28, 7), star(32, 7),
      star(33, 4), star(38, 4), star(42, 7), star(46, 4)
    ],
    hearts: [{ x: 19, y: 6 }]
  },

  // -------------------- Level 4 — Mushroom --------------------
  {
    id: 4, name: 'Mushroom', theme: 'mushroom', width: 55, music: 'mushroom', bg: 'mushroom',
    spawn: { x: 2, y: 7 },
    goal: { x: 53, y: 7 },
    rocketPart: { x: 29, y: 5, kind: 'antenna' },
    tiles: [
      ground(0, 14),
      ground(16, 6),
      ground(24, 8),
      ground(35, 8),
      ground(45, 10),
      // mid-height stepping platforms (reachable from mushroom bounces)
      block(10, 7, 2, 1),
      block(20, 7, 2, 1),
      block(26, 7, 1, 1),
      block(28, 6, 3, 1),
      block(38, 7, 2, 1),
      block(48, 7, 2, 1)
    ],
    mushrooms: [
      { x: 5, y: 8 },
      { x: 14, y: 8 },
      { x: 18, y: 8 },
      { x: 25, y: 8 },
      { x: 32, y: 8 },
      { x: 41, y: 8 },
      { x: 47, y: 9 }
    ],
    stars: [
      star(6, 6), star(11, 6), star(15, 7),
      star(21, 6), star(31, 5), star(33, 7),
      star(38, 6), star(43, 7), star(48, 6), star(52, 7)
    ]
  },

  // -------------------- Level 5 — Cave --------------------
  {
    id: 5, name: 'Cave', theme: 'cave', width: 50, music: 'cave', bg: 'cave', dark: true,
    spawn: { x: 2, y: 7 },
    goal: { x: 48, y: 7 },
    rocketPart: { x: 44, y: 8, kind: 'crystal' },
    tiles: [
      ground(0, 50),
      block(0, 0, 50, 2, 'rock'),
      // ceiling rocks variation
      block(8, 7, 2, 1, 'rock'),
      block(16, 5, 3, 1, 'rock'),
      block(22, 3, 4, 1, 'rock'),
      block(30, 6, 2, 1, 'rock'),
      block(36, 4, 3, 1, 'rock'),
      // alcove walls
      block(13, 8, 1, 1, 'rock'),
      block(14, 8, 1, 1, 'rock')
    ],
    spikes: [
      { x: 19, y: 9, w: 2 },
      { x: 33, y: 9, w: 2 }
    ],
    powerUps: [{ x: 4, y: 7, kind: 'flashlight' }],
    fireflies: [
      { x: 11, y: 5 }, { x: 18, y: 4 }, { x: 24, y: 6 }, { x: 28, y: 4 },
      { x: 35, y: 5 }, { x: 40, y: 7 }, { x: 46, y: 4 }
    ],
    stars: [
      star(7, 8), star(12, 8), star(17, 4),
      star(23, 2), star(28, 5), star(34, 5),
      star(38, 3), star(42, 6), star(46, 3), star(48, 6)
    ]
  },

  // -------------------- Level 6 — Water --------------------
  {
    id: 6, name: 'Water', theme: 'water', width: 55, music: 'water', bg: 'water', water: true,
    spawn: { x: 2, y: 7 },
    goal: { x: 52, y: 7 },
    rocketPart: { x: 44, y: 6, kind: 'tank' },
    tiles: [
      ground(0, 12),
      block(7, 6, 2, 1, 'coral'), block(11, 4, 2, 1, 'coral'),
      ground(14, 5),
      block(15, 6, 2, 1, 'coral'),
      ground(22, 6),
      block(24, 5, 3, 1, 'coral'),
      ground(30, 6),
      block(32, 4, 2, 1, 'coral'),
      ground(38, 6),
      block(40, 5, 4, 1, 'coral'),
      ground(46, 9)
    ],
    jellies: [
      { x: 17, y: 5, range: 60, speed: 1 },
      { x: 28, y: 4, range: 80, speed: 0.8 },
      { x: 36, y: 5, range: 70, speed: 1.2 }
    ],
    clamshells: [{ x: 43, y: 6 }],
    stars: [
      star(4, 7), star(8, 5), star(12, 3),
      star(19, 4), star(25, 4), star(28, 7),
      star(33, 3), star(40, 4), star(48, 6), star(51, 4)
    ]
  },

  // -------------------- Level 7 — Candy --------------------
  {
    id: 7, name: 'Candy', theme: 'candy', width: 60, music: 'candy', bg: 'candy',
    spawn: { x: 2, y: 7 },
    goal: { x: 58, y: 7 },
    rocketPart: { x: 54, y: 2, kind: 'cone' },
    tiles: [
      ground(0, 18),
      ground(20, 8),
      ground(30, 8),
      ground(40, 6),
      ground(48, 12),
      block(8, 6, 2, 1), block(13, 4, 2, 1),
      block(22, 6, 3, 1), block(26, 4, 3, 1),
      block(31, 6, 2, 1), block(34, 4, 3, 1),
      block(42, 5, 3, 1),
      block(50, 5, 3, 1), block(53, 3, 3, 1) // big cake
    ],
    mushrooms: [
      { x: 16, y: 8 }, { x: 28, y: 7 }, { x: 38, y: 7 }, { x: 46, y: 5 }
    ],
    stars: [
      star(4, 7), star(9, 5), star(14, 3),
      star(22, 5), star(28, 3), star(33, 5),
      star(36, 3), star(43, 4), star(50, 4), star(56, 6)
    ],
    hearts: [{ x: 25, y: 7 }]
  },

  // -------------------- Level 8 — Magnet --------------------
  {
    id: 8, name: 'Magnet', theme: 'magnet', width: 60, music: 'magnet', bg: 'magnet',
    spawn: { x: 2, y: 7 },
    goal: { x: 58, y: 7 },
    rocketPart: { x: 55, y: 4, kind: 'gear' },
    tiles: [
      ground(0, 14),
      ground(18, 6),
      ground(28, 8),
      ground(40, 8),
      ground(52, 8),
      // ceiling pads (used when gravity inverts)
      block(15, 1, 4, 1, 'metal'),
      block(26, 1, 4, 1, 'metal'),
      block(38, 1, 4, 1, 'metal'),
      block(48, 1, 4, 1, 'metal'),
      // mid platforms
      block(20, 5, 3, 1), block(31, 5, 3, 1),
      block(42, 5, 3, 1), block(54, 5, 3, 1),
      // stepping stone to the rocket platform
      block(53, 7, 1, 1)
    ],
    magnetZones: [
      { x: 14, y: 0, w: 4, h: 9, color: 'red' },
      { x: 25, y: 0, w: 4, h: 9, color: 'red' },
      { x: 37, y: 0, w: 4, h: 9, color: 'red' },
      { x: 47, y: 0, w: 4, h: 9, color: 'red' }
    ],
    stars: [
      star(4, 7), star(9, 6), star(16, 1),
      star(20, 4), star(27, 1), star(31, 4),
      star(38, 1), star(43, 4), star(50, 1), star(55, 4)
    ],
    hearts: [{ x: 36, y: 7 }],
    powerUps: [{ x: 4, y: 7, kind: 'feather' }]
  },

  // -------------------- Level 9 — Volcano --------------------
  {
    id: 9, name: 'Volcano', theme: 'volcano', width: 60, music: 'volcano', bg: 'volcano',
    spawn: { x: 2, y: 7 },
    checkpoint: { x: 30, y: 7 },
    goal: { x: 58, y: 7 },
    rocketPart: { x: 55, y: 8, kind: 'panel' },
    tiles: [
      ground(0, 12),
      ground(16, 4),
      ground(22, 4),
      ground(28, 8),
      ground(38, 4),
      ground(44, 4),
      ground(50, 10),
      block(13, 7, 2, 1), block(20, 5, 2, 1),
      block(26, 6, 2, 1), block(36, 5, 2, 1),
      block(42, 6, 2, 1), block(48, 5, 2, 1)
    ],
    powerUps: [{ x: 4, y: 7, kind: 'shield' }],
    lava: [
      { x: 14, y: 0, period: 2200, phase: 0 },
      { x: 18, y: 0, period: 2200, phase: 800 },
      { x: 24, y: 0, period: 2200, phase: 400 },
      { x: 36, y: 0, period: 2400, phase: 0 },
      { x: 42, y: 0, period: 2400, phase: 1200 },
      { x: 47, y: 0, period: 2400, phase: 600 }
    ],
    rocks: [
      { x: 25, y: 0, range: 4, fallY: 9 },
      { x: 41, y: 0, range: 4, fallY: 9 }
    ],
    spikes: [{ x: 19, y: 9, w: 1 }, { x: 30, y: 9, w: 2 }, { x: 46, y: 9, w: 1 }],
    stars: [
      star(5, 7), star(11, 6), star(17, 7),
      star(23, 7), star(28, 4), star(33, 7),
      star(38, 4), star(46, 4), star(52, 6), star(57, 4)
    ],
    hearts: [{ x: 31, y: 6 }]
  },

  // -------------------- Level 10 — Star Palace --------------------
  {
    id: 10, name: 'Palace', theme: 'palace', width: 70, music: 'palace', bg: 'palace',
    spawn: { x: 2, y: 7 },
    goal: { x: 67, y: 4 },
    rocketPart: { x: 67, y: 3, kind: 'wing' },
    tiles: [
      ground(0, 14),
      ground(15, 6),
      ground(22, 6),
      ground(30, 6),
      ground(38, 6),
      ground(45, 8),
      ground(55, 4),
      ground(60, 10),
      // ascending star stairway
      block(58, 8, 2, 1),
      block(60, 7, 2, 1),
      block(62, 6, 2, 1),
      block(64, 5, 2, 1),
      block(66, 4, 4, 1),
      // mid platforms
      block(8, 6, 2, 1), block(18, 5, 2, 1),
      block(25, 4, 3, 1), block(33, 5, 2, 1),
      block(40, 4, 2, 1), block(48, 6, 3, 1)
    ],
    mushrooms: [{ x: 11, y: 8 }, { x: 28, y: 5 }],
    switches: [{ x: 33, y: 4, color: 'yellow', linkId: 'palace1', holdMs: 999999 }],
    doors: [{ x: 38, y: 6, w: 1, h: 3, color: 'yellow', linkId: 'palace1' }],
    magnetZones: [{ x: 44, y: 0, w: 4, h: 8, color: 'red' }],
    stars: [
      star(4, 7), star(10, 5), star(16, 7),
      star(20, 4), star(27, 3), star(34, 4),
      star(41, 3), star(48, 5), star(56, 3), star(64, 2)
    ]
  }
];
