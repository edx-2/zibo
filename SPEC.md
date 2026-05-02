# Zibo's Cosmic Quest

**Specification Document**
Version: 1.0
Target Audience: Children aged 5+
Platform: Web (HTML5/Canvas or WebGL)
Controller: LEGO Powered Up Remote (88010) via Web Bluetooth API
Working Title: Zibo's Cosmic Quest

---

## 1. Overview

### 1.1 Concept
Zibo's Cosmic Quest is a 2D side-scrolling jump'n'run game designed for young children (5+). The player controls Zibo, a small green alien whose spaceship has crashed across 10 different planets. On each planet, Zibo must collect a rocket part, optionally collect stars, and reach the goal portal to advance.

### 1.2 Design Goals
- **Frustration-free**: No time pressure, generous hitboxes, no permanent failure states
- **Self-explanatory**: Visual symbols instead of text wherever possible
- **Tactile**: Designed around the LEGO Powered Up Remote for hands-on physical control
- **Short sessions**: Each level playable in 2-5 minutes
- **Replayable**: Optional star collection encourages revisiting levels

### 1.3 Non-Goals
- No multiplayer
- No in-game text dialogue (icons only)
- No combat (enemies are obstacles to avoid, not defeat)
- No game over screens; only "Try again?" prompts

---

## 2. Technical Architecture

### 2.1 Stack Recommendation
- **Rendering**: HTML5 Canvas 2D (sufficient for sprite-based 2D platformer)
- **Game Loop**: `requestAnimationFrame` with fixed timestep physics (60 Hz)
- **Audio**: Web Audio API
- **Controller**: Web Bluetooth API targeting LEGO Powered Up Remote (Hub ID 0x42)
- **Asset Format**: PNG sprites, OGG/MP3 audio
- **Persistence**: `localStorage` for progress (level completion, stars collected, settings)

### 2.2 Project Structure
```
zibos-cosmic-quest/
├── index.html
├── src/
│   ├── main.js              # Entry point, game loop
│   ├── engine/
│   │   ├── physics.js       # Collision, gravity
│   │   ├── renderer.js      # Canvas drawing
│   │   ├── audio.js         # Sound effects, music
│   │   └── input.js         # Input abstraction layer
│   ├── controllers/
│   │   ├── keyboard.js      # Fallback for testing
│   │   └── poweredup.js     # LEGO Powered Up Remote via Web Bluetooth
│   ├── entities/
│   │   ├── zibo.js          # Player character
│   │   ├── platform.js
│   │   ├── collectible.js   # Stars, rocket parts
│   │   ├── powerup.js
│   │   └── hazard.js        # Lava drops, jellyfish, etc.
│   ├── levels/
│   │   ├── level01.json     # ... level10.json
│   │   └── loader.js
│   ├── scenes/
│   │   ├── titleScene.js
│   │   ├── levelSelectScene.js
│   │   ├── gameScene.js
│   │   └── endingScene.js
│   └── state/
│       ├── progress.js      # Save/load
│       └── gameState.js
├── assets/
│   ├── sprites/
│   ├── audio/
│   └── levels/
└── SPEC.md
```

### 2.3 Coordinate System
- Origin top-left (Canvas standard)
- Game world units: pixels at logical resolution **1280 × 720** (16:9)
- Canvas scales to fit viewport while preserving aspect ratio (letterboxing)
- Tile size: **64 × 64 px**
- Levels are rectangular, scrolling horizontally; world height = screen height

---

## 3. Controller Integration

### 3.1 LEGO Powered Up Remote Mapping

The Powered Up Remote (88010) has two sides, each with three buttons (+, red center, –) and a green/red center button between them.

| Input | Action | Notes |
|-------|--------|-------|
| Left side `+` (push up) | Move right | Hold to keep moving |
| Left side `–` (push down) | Move left | Hold to keep moving |
| Left side red center | (unused) | Reserved |
| Right side `+` (push up) | Jump | Variable height: longer hold = higher jump (up to 400ms) |
| Right side `–` (push down) | (unused) | Reserved |
| Right side red center | Activate held power-up | Only meaningful if power-up stored |
| Green center button | Pause / Confirm in menus | |

**Rationale**: Symmetrical design, each thumb has a clear job. The two `+` buttons are the most important — left thumb to walk, right thumb to jump. This matches Mario-style platformer conventions while staying physically simple.

### 3.2 Web Bluetooth Connection Flow
1. Title screen shows a "Connect Controller" button (large, visual, with controller image)
2. On click: `navigator.bluetooth.requestDevice({ filters: [{ services: [0x1623] }] })`
3. Connect to GATT server, subscribe to characteristic `0x1624` for hub notifications
4. Send port input format setup messages for both ports (0x00 left, 0x01 right) in mode 0 (button events)
5. Parse 4-byte messages: `[port, button_id, +1/-1/0, padding]`
6. Map to abstract input events (`MOVE_LEFT`, `MOVE_RIGHT`, `JUMP_PRESS`, `JUMP_RELEASE`, `ACTION`, `PAUSE`)
7. On disconnect: pause game, return to "reconnect controller" prompt

### 3.3 Keyboard Fallback (Development & Accessibility)
| Key | Action |
|-----|--------|
| `←` `→` | Move |
| `Space` / `↑` | Jump |
| `Shift` | Activate power-up |
| `Esc` | Pause |

---

## 4. Player Character: Zibo

### 4.1 Visual Design
- Small green alien, ~48 px tall (slightly smaller than 1 tile)
- Big white eyes with black pupils (large pupil-to-eye ratio for cuteness)
- Two short antennae with small spheres on top
- Round body, short stubby legs
- White/grey spacesuit boots and gloves

### 4.2 Animation States
- **Idle**: 4-frame loop, antennae sway gently, occasional blink
- **Walking**: 6-frame loop, ~12 fps
- **Jumping**: 1 frame for ascent (legs tucked), 1 for peak, 1 for descent (legs spread)
- **Hurt**: brief flash white, knockback 100 ms
- **Cheering** (level end): hops in place with arms up

### 4.3 Physics & Movement Constants
| Parameter | Value | Notes |
|-----------|-------|-------|
| Walk speed | 220 px/s | |
| Jump initial velocity | -520 px/s | Negative = upward |
| Variable jump cutoff | At 400 ms button release: velocity *= 0.4 | |
| Gravity | 1400 px/s² | |
| Max fall speed | 700 px/s | Terminal velocity |
| Coyote time | 120 ms | Can still jump after walking off ledge |
| Jump buffer | 150 ms | Pressing jump just before landing still triggers it |
| Hitbox | 32 × 44 px (centered, slightly smaller than sprite) | Forgiving |

### 4.4 Health System
- 3 hearts per level, displayed top-left
- Contact with hazard: lose 1 heart, 1 second invulnerability with sprite blink
- 0 hearts: gentle "beam home" animation, level restarts from beginning
- Hearts refill at level start
- Falling into a pit = full restart regardless of hearts (single hit kill on pits)

---

## 5. Game Mechanics

### 5.1 Collectibles

**Stars** (small, floating, sparkling)
- 10 per level (consistent count)
- Optional — do not block progression
- Persistent: collected stars stay collected across attempts within a session
- Counted toward total (max 100 for full game)

**Rocket Parts** (large, glowing, planet-specific shape)
- 1 per level — required to complete level
- Visible from a distance (glow effect)
- Often guarded by a small puzzle, never an unfair jump
- Each part has unique appearance (engine, fin, hatch, etc.)

**Hearts** (rare, pink)
- Restore 1 heart
- 0-2 per level depending on difficulty
- Placed near challenging sections

### 5.2 Power-Ups

| Power-Up | Visual | Effect | Duration |
|----------|--------|--------|----------|
| Feather Helmet 🪶 | Helmet with feather | Enables double jump | 20 s |
| Bubble Shield 🛡️ | Translucent bubble around Zibo | Absorbs one hit | Until hit |
| Star Boots ⭐ | Glowing yellow boots | +30% jump height | 20 s |
| Flashlight 🔦 | Yellow cone | Reveals dark areas | Level-bound (Level 5 only) |

**Pickup Behavior**:
- Power-ups apply immediately (no inventory)
- Exception: Bubble Shield, which sits visibly around Zibo until consumed
- HUD shows active power-up icon top-right with timer ring

### 5.3 Puzzles & Switches

**Color-coded buttons**: floor switch (red, blue, green, yellow) opens door of matching color. Door closes after 5 s if not passed through.

**Pressure plates**: must be standing on it for a platform/bridge to remain solid. Often paired with a moveable block to weigh it down.

**Sequence puzzles** (Level 2): jump on 3 ice blocks in correct order indicated by flashing animation that loops three times before allowing input.

**Magnet switches** (Level 8): toggle gravity direction for Zibo within marked zones (red zone = pull up, blue zone = pull down).

### 5.4 Hazards (Non-Combat)

| Hazard | Behavior | Damage |
|--------|----------|--------|
| Pits | Bottomless | Instant restart |
| Lava drops | Drip from ceiling on a 2 s cycle, telegraphed by glow | 1 heart |
| Spikes | Static, on ground or ceiling | 1 heart |
| Jellyfish (L6) | Float in fixed pattern, glow before stinging phase | 1 heart |
| Falling rocks (L9) | Trigger when Zibo enters area, shadow telegraphs landing | 1 heart |
| Cactus (L3) | Static obstacle, knockback only, no damage | 0 hearts |

All hazards have a **0.5 s telegraph** (glow, animation, sound) before they become dangerous — gives kids reaction time.

---

## 6. Level Specifications

Each level uses tile-based design with logical width given in tiles (1 tile = 64 px). Standard level width is ~50 tiles (3200 px); harder levels may extend to 70.

### Level 1 – Grassland Planet 🌱

**Theme**: Soft green hills, fluffy white clouds in background, sun
**Width**: 40 tiles
**Difficulty**: Tutorial
**Music**: Soft acoustic, upbeat, ~100 BPM

**Layout**:
- Tutorial signs (with pictograms: arrows, jump icon)
- 5 grass platforms at varying heights (max 2 tiles up between them)
- 3 bouncy mushrooms that auto-launch Zibo upward
- No enemies, no pits, no hazards
- Stars: 10 placed along main path, all visible
- Rocket Part: At end, on a small hill, glowing brightly

**Mechanics introduced**: Walking, jumping, collecting

**Critical path checks**: Every jump is reachable without precision; landing zones are at least 2 tiles wide.

---

### Level 2 – Ice Planet ❄️

**Theme**: Snowy mountains, blue/white palette, ice crystals
**Width**: 45 tiles
**Difficulty**: Easy
**Music**: Twinkly bells, slightly slower

**Layout**:
- Slightly slippery platforms (deceleration reduced from 800 to 400 px/s²)
- Ice cave section in middle (background changes to dark blue)
- Sequence puzzle: 3 ice blocks light up in order, Zibo must jump on them in matching sequence to lower a barrier
- 1 Star Boots power-up halfway through
- Stars: 10, two require the Star Boots to reach
- Rocket Part: Behind sequence-puzzle barrier

**Mechanics introduced**: Slippery surfaces, simple sequence puzzle, first power-up

**Note**: Slipperiness must be very mild — kids find it frustrating quickly.

---

### Level 3 – Desert Planet 🏜️

**Theme**: Sand dunes, two suns in sky, sandstone ruins
**Width**: 50 tiles
**Difficulty**: Easy
**Music**: Slightly mysterious, percussion-based

**Layout**:
- Wide gaps (3-tile jumps) requiring committed jumps
- Cactus obstacles (knockback only, no damage) to teach timing
- First switch puzzle: red button activates a sand bridge (rises from below) that stays for 8 s
- Second switch: blue button opens a door to a small alcove with extra stars
- Stars: 10, with 3 in optional alcove
- Rocket Part: At top of a sandstone ruin, requires 2 sequential jumps

**Mechanics introduced**: Switches, bridges, knockback obstacles

---

### Level 4 – Mushroom Planet 🍄

**Theme**: Giant colorful mushrooms, purple sky, glowing spores
**Width**: 55 tiles
**Difficulty**: Easy-Medium
**Music**: Whimsical, playful, woodwinds

**Layout**:
- Gameplay heavy on bouncy mushrooms (gives 2x normal jump height when landed on)
- Small open-area "maze" with 3 paths, all leading to the same exit, but middle path has the rocket part
- Glowing arrow signs as direction hints
- Stars: 10, several requiring mushroom-bouncing
- Rocket Part: On central giant mushroom cap

**Mechanics introduced**: Vertical exploration, multiple paths

**Design note**: Layout encourages wandering without getting lost. Camera should pan slightly upward when Zibo bounces high.

---

### Level 5 – Cave Planet 🔦

**Theme**: Underground caverns, dim purple-blue lighting
**Width**: 50 tiles
**Difficulty**: Medium
**Music**: Atmospheric, slight echo, calm

**Layout**:
- **Lighting effect**: World renders darkened (alpha 0.6 over a dark blue overlay) except within radius around Zibo
- Flashlight power-up at start expands lit radius from 100 px to 250 px
- Friendly fireflies provide small light sources scattered around, hint at paths
- 1-2 spike pits that need to be jumped over
- Hidden alcoves with stars, only visible when illuminated
- Rocket Part: In a large cavern with sparkles surrounding it (highly visible)

**Mechanics introduced**: Limited visibility, exploration with reduced sight

**Design note**: Despite "scary" theme, music and friendly fireflies keep it cozy. Never fully dark.

---

### Level 6 – Water Planet 💧

**Theme**: Underwater coral reef, soft blue water, bubbles rising
**Width**: 55 tiles
**Difficulty**: Medium
**Music**: Calm, harp-driven, slow

**Layout**:
- Modified physics: gravity reduced by 50%, jump height increased by 30%, max fall speed -40%
- Coral platforms in varying patterns
- Jellyfish hazards: float in fixed paths, glow yellow when about to sting (2 s warning)
- One section requires waiting for jellyfish patterns to align
- Stars: 10
- Rocket Part: In a large clamshell that opens periodically (3 s open, 3 s closed)

**Mechanics introduced**: Modified physics, timing-based hazards

**Design note**: The "swimming" feel is achieved purely by physics changes — no separate swim animation needed.

---

### Level 7 – Candy Planet 🍭

**Theme**: Pink/pastel everything, lollipop trees, chocolate rivers, gumdrop hills
**Width**: 60 tiles
**Difficulty**: Easy (intentional break)
**Music**: Most upbeat track, music-box style

**Layout**:
- Pure reward level after Levels 5-6
- Lots of stars (could include 12-15 instead of 10 as a treat — TBD; keep 10 for consistency)
- No hazards
- Lots of bouncy gumdrops, candy trampolines
- Wide open spaces, scenic
- Rocket Part: On top of a giant cake at the end

**Mechanics introduced**: None — recombines existing mechanics in low-stress setting

**Design note**: This is the "candy break". After potentially struggling with cave/water levels, the player gets a big confidence boost.

---

### Level 8 – Magnet Planet 🧲

**Theme**: Metallic blue/red planet, floating debris, electric arcs in background
**Width**: 60 tiles
**Difficulty**: Medium-Hard
**Music**: Electronic, slightly more intense, but still kid-friendly

**Layout**:
- Magnetic zones marked with red (pull up) or blue (pull down) glowing borders
- Within a zone, gravity inverts or doubles
- 2-3 switches toggle nearby magnetic fields between red/blue/off
- Puzzle structure: figure out which zone setting allows reaching the next platform
- Stars: 10, several in zones requiring specific magnet states
- Rocket Part: In a final chamber requiring two switches set correctly

**Mechanics introduced**: Gravity manipulation, multi-switch puzzles

**Design note**: Hardest puzzle level. Solutions should be deducible by 5-year-old via trial and error. Switches reset cleanly; nothing gets permanently broken.

---

### Level 9 – Volcano Planet 🌋

**Theme**: Red/orange rocky terrain, glowing lava, ash particles in air
**Width**: 60 tiles
**Difficulty**: Hard (relative to game's overall difficulty)
**Music**: Dramatic but not scary, drums + horns

**Layout**:
- Bubble Shield power-up at start (insurance)
- Lava drops from ceiling at intervals (telegraphed with red glow 1 s before drop)
- Moving rock platforms across lava pools (slow, predictable)
- Falling rock telegraphs with shadow on ground 1.5 s before impact
- 1 mid-level checkpoint (despite spec saying restart-from-start; this single exception is justified — see §7.4)
- Stars: 10
- Rocket Part: In a small cavern past the final lava pool

**Mechanics introduced**: Multiple coordinated hazards, mid-level checkpoint

**Design note**: This is the "boss level" of the game in terms of intensity, but still fair. The Bubble Shield ensures one mistake doesn't restart everything.

---

### Level 10 – Star Palace 👑

**Theme**: Floating crystal palace among stars, golden trim, glowing crystals
**Width**: 70 tiles
**Difficulty**: Medium (final level should feel triumphant, not punishing)
**Music**: Triumphant, orchestral, builds across the level

**Layout**:
- Mixes mechanics from previous levels: bouncy pads, switches, brief magnet zone, one short dark passage
- No new mechanics introduced
- Three "trial" rooms each themed after an earlier planet, but easier
- Final ascent up a stairway of star platforms
- Final platform has the rocket — Zibo places all 10 parts in a cinematic sequence
- Confetti burst, cheering sound, ending screen

**Mechanics introduced**: None — celebratory recombination

**Ending sequence** (auto-plays after rocket part placed):
1. Zibo cheers, music swells
2. Rocket assembles itself (3 s)
3. Zibo climbs in
4. Rocket launches with smoke and stars
5. "The End" with star count summary and Zibo waving from window
6. Returns to title screen with new "★ Completed" badge

---

## 7. Game Flow & Scenes

### 7.1 Title Scene
- "Zibo's Cosmic Quest" logo with Zibo waving
- Big "Play" button
- "Connect Controller" button (with Bluetooth icon)
- Settings (gear icon): volume, controller mapping, language toggle (DE/EN)
- Background: animated stars

### 7.2 Level Select Scene
- Galaxy map with 10 planet icons in a constellation pattern
- Locked planets shown as silhouettes with padlock
- Completed planets get a star stamp (full or partial based on stars collected: 10/10 = gold, 5+/10 = silver, <5 = bronze)
- Press jump on a planet to enter
- Total star count displayed at top: "★ 73 / 100"

### 7.3 Game Scene HUD
- **Top-left**: Hearts (3 max, hollow when lost)
- **Top-center**: Star count for current level (e.g., "★ 4 / 10")
- **Top-right**: Active power-up icon with circular timer
- **Bottom-left**: Pause button (also via green center button on remote)
- HUD elements should be **large, simple, and use no text**

### 7.4 Failure & Retry
- On 0 hearts or pit: 1 s "beam home" animation (Zibo dissolves into sparkles)
- Screen fades to black, then back into level start
- Mid-level checkpoint exception only on Level 9, marked with a glowing pillar
- No "game over" text. Retry is automatic and instant.
- After 3 deaths in same level: optional "Skip level?" prompt (returns to map; level not marked complete but not blocked either)

### 7.5 Pause Menu
- Triggered by green center button
- Shows: Resume, Restart Level, Quit to Map
- Pauses music, dims background

---

## 8. Audio Design

### 8.1 Music
- 10 tracks (one per level theme), looping seamlessly
- 1 title theme
- 1 ending theme (triumphant)
- All tracks 60-110 BPM, instrumental, kid-appropriate
- Crossfade between menu and level music

### 8.2 Sound Effects
| Event | Description |
|-------|-------------|
| Jump | Cartoon "boing", short |
| Land | Soft thud |
| Star collected | High-pitched "pling" |
| Rocket part collected | Triumphant fanfare (1 s) |
| Power-up collected | Magical chime |
| Heart lost | Sad "whoop" (not scary) |
| Switch pressed | Mechanical click |
| Door opens | Stone slide |
| Beam home | Dissolving sparkle |
| Bouncy mushroom | "Sproing!" |
| Menu navigate | Soft beep |
| Menu confirm | Pleasant chime |

### 8.3 Audio Settings
- Master, music, SFX volume sliders independently
- Mute toggle large and accessible
- All audio gracefully handles AudioContext autoplay restrictions (initialize on first user input)

---

## 9. Persistence (localStorage)

```json
{
  "version": 1,
  "progress": {
    "levelsCompleted": [1, 2, 3],
    "starsPerLevel": {
      "1": 10, "2": 8, "3": 7
    },
    "totalStars": 25
  },
  "settings": {
    "volumeMaster": 0.8,
    "volumeMusic": 0.7,
    "volumeSfx": 0.9,
    "language": "de"
  }
}
```

Save triggers:
- On level completion
- On settings change
- On pause/quit

---

## 10. Accessibility & Inclusivity

- Color-blind safe palettes for puzzles (use shapes alongside colors: red button has triangle, blue button has square)
- All key information conveyed visually AND audibly
- No flashing strobes; bright effects capped at 4 Hz
- Sound is supplementary, never required to play
- Optional "Even easier" mode in settings: 5 hearts instead of 3, 50% slower hazards
- Pause is always 1 button press away

---

## 11. Localization

Initial languages: **German (default)** and **English**.

Strings are minimal due to icon-first design. Localized strings include:
- Menu labels: Play, Settings, Resume, Quit
- Settings labels
- "The End" / "Ende"
- Star summary text
- Tutorial pictogram captions (where present)

Strings stored in `i18n/de.json` and `i18n/en.json`.

---

## 12. Performance Targets

- 60 fps on mid-range tablets (iPad 8th gen, Galaxy Tab A8) and modern laptops
- < 5 s initial load time on broadband
- < 50 MB total asset size
- Sprite atlas used for all character animations to minimize draw calls

---

## 13. Testing Plan

### 13.1 Functional
- Each level completable within target time (2-5 min)
- Each star reachable
- Each rocket part reachable
- All puzzles solvable with intended solution
- Controller disconnect/reconnect handled gracefully

### 13.2 Playtesting
- 3-5 children aged 4-7 should complete the game
- Watch for: frustration points, controls confusion, scared by any visuals, stuck spots
- Adjust difficulty curve based on feedback
- Specifically check Level 8 (magnet) and Level 9 (volcano) for over-difficulty

### 13.3 Device Testing
- Chrome/Edge desktop (full Web Bluetooth support)
- Android Chrome (Web Bluetooth support)
- iOS Safari: Bluetooth fallback message — recommend keyboard or external app (no Web Bluetooth on iOS as of spec date)

---

## 14. Implementation Phases

### Phase 1 – Engine & Tutorial (MVP)
- Game loop, physics, rendering
- Keyboard input
- Level 1 fully playable
- Title and level-select scenes

### Phase 2 – Controller & Core Levels
- Powered Up Remote integration
- Levels 2-4 implemented
- Save/load
- Audio system

### Phase 3 – Mid-Game Levels
- Levels 5-7 (cave, water, candy)
- Power-ups complete
- HUD finalized

### Phase 4 – Advanced Levels & Polish
- Levels 8-10
- Pause menu
- Settings persistence
- Ending sequence

### Phase 5 – Testing & Localization
- Playtest with target audience
- Localization (DE/EN)
- Performance optimization
- Accessibility pass

---

## 15. Open Questions

1. Should Level 7 (Candy) have 15 stars instead of 10 for variety, or keep consistent count? *Recommendation: keep 10.*
2. Should there be an "extra hard" mode unlocked after completing the game? *Recommendation: skip for v1.*
3. Should the controller pairing remember the device for next session? *Recommendation: yes, store device ID in localStorage; user must still actively reconnect on each session per Web Bluetooth security model.*
4. Should level-select map have a Zibo sprite that walks between planets? *Recommendation: yes, charming detail, low cost.*

---

## 16. Reference Specifications

- LEGO Powered Up Protocol: https://lego.github.io/lego-ble-wireless-protocol-docs/
- Web Bluetooth API: https://webbluetoothcg.github.io/web-bluetooth/
- Canvas 2D Reference: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

*End of specification.*
