// Level data — all 10 planets. Coordinates are in tile units (1 tile = 64 px).
// World height is 12 tiles (768 px) but visible play area is 720 px.
// Floor row is typically y = 9 (top edge at 576 px); ground tiles fill y = 9..11.
//
// REACHABILITY CHEAT-SHEET (with jump v = -640, g = 1400):
//   Floor          → row-7 platform   ✓ single jump (+8 px clearance)
//   Floor          → row-8 platform   ✓ trivial
//   Row N standing → row N-2          ✓ a "two-tile stair" — the standard climb
//   Row N standing → row N-1          ✓ trivial
//   Floor + mushroom (vy = -780) → row-6 platform on descent
//   Star Boots from row-7            → row-4 reachable
//   Feather double-jump from floor   → row-5 reachable
// All rocket parts and goals below have been hand-traced against this table.

const ground = (x, w, y = 9, h = 3, kind = 'ground') => ({ x, y, w, h, kind });
const block = (x, y, w = 1, h = 1, kind = 'block') => ({ x, y, w, h, kind });
const star = (x, y) => ({ x, y });

export const LEVELS = [
  // =============================================================
  // Level 1 — Grassland (TUTORIAL)
  // Goal: walk + jump + mushroom-bounce + collect rocket part.
  // Path: floor → row-7 rocket platform with one jump. Mushrooms are
  // optional — they let the curious kid bounce up to a row-5 star.
  // =============================================================
  {
    id: 1, name: 'Grassland', theme: 'grassland', width: 40, music: 'grassland', bg: 'grassland',
    spawn: { x: 2, y: 7 },
    goal: { x: 38, y: 7 },
    rocketPart: { x: 36, y: 6, kind: 'engine' },
    tiles: [
      ground(0, 14),                  // long opening floor x=0..13
      ground(15, 4),                  // post-1-tile-gap floor x=15..18
      ground(20, 6),                  // floor x=20..25
      ground(28, 12),                 // long final floor x=28..39
      block(17, 7, 2, 1),             // optional star perch (above ground)
      block(23, 7, 2, 1),             // mid stepping platform
      block(30, 7, 2, 1),             // mid stepping platform
      block(34, 7, 4, 1)              // wide rocket platform — one jump from floor
    ],
    mushrooms: [
      { x: 10, y: 8 },                // floor mushroom — bounce up to (12, 4) star
      { x: 26, y: 8 }                 // floor mushroom — bonus
    ],
    hearts: [{ x: 21, y: 7 }],        // tutorial heart pickup, easy to grab
    stars: [
      star(4, 7), star(8, 7),         // walking row
      star(12, 4),                    // up high — reachable via mushroom bounce
      star(17, 6), star(24, 6),       // on optional perches
      star(28, 7), star(31, 6),       // path to the rocket
      star(35, 6),                    // on rocket platform
      star(36, 4),                    // mushroom-bounce reward above platform
      star(38, 7)                     // last one before the goal
    ]
  },

  // =============================================================
  // Level 2 — Ice (slippery surfaces + sequence puzzle)
  // Path: walk along slippery floor → solve 3-block sequence puzzle →
  //       puzzle opens the door → continue right via row-7 stair → grab
  //       rocket on row-7 platform.
  // The Star Boots powerup is a *reward* for solving the puzzle, sitting
  // just past the door, granting bonus reach to high optional stars.
  // =============================================================
  {
    id: 2, name: 'Ice', theme: 'ice', width: 45, music: 'ice', bg: 'ice', slippery: true,
    spawn: { x: 2, y: 7 },
    goal: { x: 43, y: 7 },
    rocketPart: { x: 42, y: 6, kind: 'fin' },
    tiles: [
      ground(0, 12),                  // x=0..11
      block(6, 7, 2, 1),              // row-7 stepping stone
      block(10, 7, 2, 1),              // row-7 stepping stone (was row-5, unreachable)
      ground(13, 5),                   // x=13..17
      block(15, 7, 2, 1),
      ground(20, 25),                  // long ice plain x=20..44 (sequence puzzle + final approach)
      block(35, 7, 2, 1),              // post-door stair
      block(38, 5, 3, 1),              // row-5 (reward area)
      block(41, 7, 3, 1)               // rocket platform (row-7)
    ],
    sequenceBlocks: [
      // Indices 0,1,2 light up in order; player must step in that order.
      { x: 21, y: 8, index: 0 },
      { x: 22, y: 7, index: 2 },
      { x: 23, y: 8, index: 1 }
    ],
    powerUps: [{ x: 28, y: 6, kind: 'starboots' }],   // on a tile-y=7 perch (added below)
    doors: [{ x: 32, y: 4, w: 1, h: 5, color: 'blue', linkId: 'icebar' }],
    // The blue switch is virtual — tucked off-screen so only the puzzle
    // logic (in gameScene.updateSequence) can flip it. Ensures the door
    // can't be opened by walking over the floor.
    switches: [{ x: 22, y: -4, color: 'blue', linkId: 'icebar', holdMs: 999999 }],
    stars: [
      star(4, 7), star(7, 6),
      star(11, 6),                    // on block(10, 7)
      star(16, 6),                    // on block(15, 7)
      star(22, 6),                    // reward for stepping on the centre sequence block
      star(28, 5),                    // by the Star Boots
      star(35, 6), star(39, 4),       // post-door reward (39,4 is the Star-Boots-only star)
      star(41, 6), star(43, 6)        // near the rocket and goal
    ]
  },

  // =============================================================
  // Level 3 — Desert (switches + timed bridges)
  // Path: three pits with three red switches that raise sand bridges for
  // 8 seconds each. Cacti knock Zibo back (no damage). A blue switch +
  // door gates an alcove with a heart and bonus stars. Final approach
  // climbs a sandstone-ruin staircase to the rocket.
  // =============================================================
  {
    id: 3, name: 'Desert', theme: 'desert', width: 50, music: 'desert', bg: 'desert',
    spawn: { x: 2, y: 7 },
    goal: { x: 48, y: 7 },
    rocketPart: { x: 46, y: 4, kind: 'hatch' },
    tiles: [
      ground(0, 8),                   // x=0..7
      ground(11, 4),                  // x=11..14 (gap 8..10)
      ground(18, 4),                  // x=18..21 (gap 15..17)
      ground(25, 8),                  // x=25..32 (gap 22..24)
      // sandstone ruin staircase — row 7 → row 5 → row 3
      block(33, 7, 4, 1),             // ruin level 1, x=33..36
      block(34, 5, 4, 1),             // ruin level 2, x=34..37
      block(35, 3, 3, 1),             // ruin level 3 (top), x=35..37
      ground(38, 12),                 // x=38..49 (final floor)
      block(43, 7, 2, 1),             // stair to rocket
      block(45, 5, 2, 1)              // rocket platform (row-5, top y=320)
    ],
    cacti: [{ x: 13, y: 8 }, { x: 27, y: 8 }, { x: 30, y: 8 }],
    bridges: [
      { x: 8, y: 9, w: 3, linkId: 'sandA' },   // first gap
      { x: 15, y: 9, w: 3, linkId: 'sandB' },  // second gap
      { x: 22, y: 9, w: 3, linkId: 'sandC' }   // third gap (was unbridged before)
    ],
    switches: [
      { x: 5, y: 8, color: 'red', linkId: 'sandA', holdMs: 8000 },
      { x: 12, y: 8, color: 'red', linkId: 'sandB', holdMs: 8000 },
      { x: 19, y: 8, color: 'red', linkId: 'sandC', holdMs: 8000 },
      { x: 26, y: 8, color: 'blue', linkId: 'alcove', holdMs: 999999 }
    ],
    doors: [{ x: 31, y: 6, w: 1, h: 3, color: 'blue', linkId: 'alcove' }],
    hearts: [{ x: 30, y: 7 }],        // post-door reward, on the floor before the ruin
    stars: [
      star(4, 7), star(9, 7),
      star(13, 6),                    // small jump above the cactus
      star(16, 7), star(20, 7),       // bridge stars
      star(28, 7),                    // pre-door
      star(34, 6),                    // on first ruin step
      star(36, 4),                    // on second ruin step
      star(43, 6),                    // on stair-up
      star(45, 4)                     // by the rocket
    ]
  },

  // =============================================================
  // Level 4 — Mushroom (vertical bouncing playground)
  // Path: alternating floor segments connected by floor mushrooms. A
  // dedicated stepping stone leads to the rocket platform on row-6.
  // Plenty of mushrooms means kids can bounce wildly without losing
  // progress; the main path stays simple.
  // =============================================================
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
      block(10, 7, 2, 1),
      block(20, 7, 2, 1),
      block(26, 7, 1, 1),             // stepping stone to rocket platform
      block(28, 6, 4, 1),              // wider rocket platform (row-6, 4 tiles wide)
      block(38, 7, 2, 1),
      block(48, 7, 2, 1)
    ],
    mushrooms: [
      { x: 5, y: 8 },                  // first bouncer — early reward
      { x: 14, y: 8 },                 // bounce over gap to the next ground
      { x: 18, y: 8 },                 // chained bouncing
      { x: 25, y: 8 },                 // launch toward the rocket platform
      { x: 32, y: 8 },                 // mid-level boost
      { x: 41, y: 8 },                 // late-level boost
      { x: 47, y: 8 }                  // final bounce
    ],
    hearts: [{ x: 36, y: 7 }],
    stars: [
      star(6, 6), star(11, 6),
      star(15, 6),                    // floor between platforms
      star(21, 6),                    // on block(20, 7)
      star(30, 5),                    // on rocket platform (left of the rocket)
      star(33, 6),                    // post-rocket
      star(38, 6), star(43, 7),
      star(48, 6), star(52, 7)
    ]
  },

  // =============================================================
  // Level 5 — Cave (limited visibility + flashlight)
  // Path: pick up the Flashlight at the start (radius 250 → 100). Walk
  // through the long cave avoiding two spike pits. Fireflies glow as
  // additional light pools. Hidden alcove (between blocks 13 and 14
  // ceiling stalactites) holds a secret star.
  // =============================================================
  {
    id: 5, name: 'Cave', theme: 'cave', width: 50, music: 'cave', bg: 'cave', dark: true,
    spawn: { x: 2, y: 7 },
    goal: { x: 48, y: 7 },
    rocketPart: { x: 44, y: 8, kind: 'crystal' },
    tiles: [
      ground(0, 50),                   // continuous cave floor
      block(0, 0, 50, 2, 'rock'),     // ceiling
      // ceiling stalactites (decorative + creates "rooms")
      block(8, 7, 2, 1, 'rock'),
      block(16, 5, 3, 1, 'rock'),
      block(22, 3, 4, 1, 'rock'),
      block(30, 6, 2, 1, 'rock'),
      block(36, 4, 3, 1, 'rock'),
      // small alcove pillars — Zibo jumps over the first to drop into a
      // hidden pocket where a star is waiting on the floor between them.
      block(12, 7, 1, 2, 'rock'),
      block(15, 7, 1, 2, 'rock')
    ],
    spikes: [
      { x: 19, y: 9, w: 2 },           // first pit
      { x: 33, y: 9, w: 2 }            // second pit
    ],
    powerUps: [{ x: 4, y: 7, kind: 'flashlight' }],
    fireflies: [
      { x: 11, y: 5 }, { x: 18, y: 4 }, { x: 24, y: 6 }, { x: 28, y: 4 },
      { x: 35, y: 5 }, { x: 40, y: 7 }, { x: 46, y: 4 }
    ],
    hearts: [{ x: 26, y: 8 }],         // mid-cave heart
    stars: [
      star(7, 8),                     // before alcove pillars
      star(13, 8),                    // hidden in the small alcove on the floor
      star(17, 8),                    // before first spike pit
      star(22, 8), star(28, 8),
      star(34, 8),                    // before second spike pit
      star(38, 8), star(42, 8),
      star(46, 8), star(48, 7)
    ]
  },

  // =============================================================
  // Level 6 — Water (low gravity + jellyfish + clamshell)
  // Path: underwater physics (½ gravity, 1.3× jump) means Zibo can leap
  // very high. Three jellyfish bob in fixed paths; their stinger phase is
  // telegraphed by a yellow glow. The rocket part sits inside a clamshell
  // that opens for 3 s, closes for 3 s — time the grab.
  // =============================================================
  {
    id: 6, name: 'Water', theme: 'water', width: 55, music: 'water', bg: 'water', water: true,
    spawn: { x: 2, y: 7 },
    goal: { x: 52, y: 7 },
    rocketPart: { x: 44, y: 6, kind: 'tank' },
    tiles: [
      ground(0, 12),
      block(7, 6, 2, 1, 'coral'),
      block(11, 5, 2, 1, 'coral'),     // changed from row-4 to row-5 for stair
      ground(14, 5),
      block(15, 6, 2, 1, 'coral'),
      ground(22, 6),
      block(24, 5, 3, 1, 'coral'),
      ground(30, 6),
      block(32, 5, 2, 1, 'coral'),     // changed from row-4 to row-5
      ground(38, 6),
      block(40, 5, 4, 1, 'coral'),     // approach to clamshell
      ground(46, 9)
    ],
    jellies: [
      { x: 17, y: 5, range: 60, speed: 1 },
      { x: 28, y: 4, range: 80, speed: 0.8 },
      { x: 36, y: 5, range: 70, speed: 1.2 }
    ],
    clamshells: [{ x: 43, y: 6 }],
    hearts: [{ x: 33, y: 7 }],
    stars: [
      star(4, 7),
      star(8, 5),                     // on coral perch
      star(12, 4),                    // higher up — water physics handles it
      star(18, 4),                    // bait between jellies
      star(25, 4),                    // on big coral platform
      star(28, 7),                    // floor between corals
      star(33, 4),
      star(40, 4),                    // approach to clamshell
      star(48, 7),                    // post-clamshell
      star(51, 5)                     // near goal
    ]
  },

  // =============================================================
  // Level 7 — Candy (reward break, no hazards)
  // Path: lots of candy mushrooms, lots of platforms, no enemies. Final
  // approach climbs a candy-mountain stair (row 7 → 6 → 5 → 4) with the
  // rocket on the top of a "giant cake" platform.
  // =============================================================
  {
    id: 7, name: 'Candy', theme: 'candy', width: 60, music: 'candy', bg: 'candy',
    spawn: { x: 2, y: 7 },
    goal: { x: 58, y: 7 },
    rocketPart: { x: 54, y: 4, kind: 'cone' },     // sits above the row-5 cake-top platform
    tiles: [
      ground(0, 18),
      ground(20, 8),
      ground(30, 8),
      ground(40, 6),
      ground(48, 12),
      block(8, 7, 2, 1),
      block(13, 7, 2, 1),
      block(22, 7, 3, 1),
      block(26, 7, 3, 1),
      block(31, 7, 2, 1),
      block(34, 7, 3, 1),
      block(42, 7, 3, 1),
      // candy-mountain stair (the "giant cake" finale)
      block(50, 7, 3, 1),
      block(52, 6, 3, 1),               // mid-cake
      block(53, 5, 3, 1)                // top tier — rocket sits on this (row-5 top y=320)
    ],
    // All mushrooms on the floor so they're predictable (no mid-air bouncers).
    mushrooms: [
      { x: 16, y: 8 }, { x: 24, y: 8 }, { x: 33, y: 8 },
      { x: 41, y: 8 }, { x: 50, y: 8 }
    ],
    hearts: [{ x: 25, y: 7 }],
    stars: [
      star(4, 7), star(9, 6), star(14, 6),
      star(22, 6), star(28, 6), star(33, 6),
      star(36, 6), star(43, 6),
      star(50, 6), star(56, 7)
    ]
  },

  // =============================================================
  // Level 8 — Magnet (gravity inversion zones)
  // Path: four red magnet zones flip Zibo's gravity upward. He flies
  // up, lands on ceiling pads, walks across, exits the zone, falls back
  // to the next floor. Pickups on the ceiling reward inversion. Feather
  // power-up at start grants a double-jump for safety.
  // Stepping stone leads to the rocket platform on row-5.
  // =============================================================
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
      // ceiling pads (gravity-inverted "floors")
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
    hearts: [{ x: 36, y: 7 }],
    powerUps: [{ x: 4, y: 7, kind: 'feather' }],
    stars: [
      star(4, 7), star(9, 6),
      star(16, 2),                     // ceiling reward in 1st zone (below the pad)
      star(20, 4),
      star(27, 2),                     // ceiling reward in 2nd zone
      star(31, 4),
      star(38, 2),                     // ceiling reward in 3rd zone
      star(43, 4),
      star(50, 2),                     // ceiling reward in 4th zone
      star(55, 4)                      // by the rocket
    ]
  },

  // =============================================================
  // Level 9 — Volcano (hazards, telegraph-heavy)
  // Path: pick up the Bubble Shield at the start (insurance against one
  // hit). Lava drops telegraph for ~0.7 s with a glow before falling.
  // Falling rocks telegraph with a shadow. Spikes are short and easy to
  // jump. A checkpoint pillar at tile (30, 7) saves the player from a
  // total restart (only level with a mid-level checkpoint per SPEC §7.4).
  // =============================================================
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
      // All mid platforms at row-7 (kid-reachable from floor with one jump)
      block(13, 7, 2, 1),
      block(20, 7, 2, 1),
      block(26, 7, 2, 1),
      block(36, 7, 2, 1),
      block(42, 7, 2, 1),
      block(48, 7, 2, 1)
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
    spikes: [
      { x: 19, y: 9, w: 1 },           // narrow — easy to hop
      { x: 30, y: 9, w: 2 },           // wider, in front of checkpoint
      { x: 46, y: 9, w: 1 }
    ],
    hearts: [{ x: 31, y: 6 }],         // checkpoint heart
    stars: [
      star(5, 7), star(11, 6),
      star(17, 7), star(23, 7),
      star(28, 7), star(33, 7),        // around checkpoint
      star(39, 7), star(46, 7),
      star(52, 6), star(57, 7)
    ]
  },

  // =============================================================
  // Level 10 — Star Palace (final, recombination)
  // Path: three "trial rooms" (mushroom-bouncing → switch puzzle → magnet
  // zone) in sequence, ending at a five-step crystal staircase rising to
  // the rocket and goal portal. No new mechanics — pure recombination
  // for a triumphant finale.
  // =============================================================
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
      // ascending crystal staircase (the climactic finale)
      block(58, 8, 2, 1),
      block(60, 7, 2, 1),
      block(62, 6, 2, 1),
      block(64, 5, 2, 1),
      block(66, 4, 4, 1),
      // mid-level platforms (all reachable via simple stair-step jumps)
      block(8, 7, 2, 1),
      block(18, 7, 2, 1),
      block(25, 7, 3, 1),
      // stepping stones up to the switch (floor → row-7 → row-5)
      block(31, 7, 2, 1),
      block(33, 5, 2, 1),              // switch platform
      block(40, 7, 2, 1),
      block(48, 6, 3, 1),
      // ceiling pad inside the magnet zone — catches Zibo when gravity flips
      block(44, 1, 4, 1, 'metal')
    ],
    mushrooms: [
      { x: 11, y: 8 },                 // first trial — bouncing
      { x: 28, y: 8 }                  // second trial approach
    ],
    switches: [{ x: 33, y: 4, color: 'yellow', linkId: 'palace1', holdMs: 999999 }],
    doors: [{ x: 38, y: 6, w: 1, h: 3, color: 'yellow', linkId: 'palace1' }],
    magnetZones: [{ x: 44, y: 0, w: 4, h: 8, color: 'red' }],   // third trial
    hearts: [{ x: 46, y: 1 }],         // ceiling heart inside magnet zone — bonus
    stars: [
      star(4, 7), star(9, 6),
      star(16, 7),                     // floor stars
      star(20, 6), star(27, 6),        // mid-platform stars
      star(33, 4),                     // by the switch
      star(41, 6),                     // post-door
      star(48, 5),                     // on block(48, 6)
      star(56, 6),                     // pre-staircase
      star(67, 2)                      // top of staircase, just past the rocket
    ]
  }
];
