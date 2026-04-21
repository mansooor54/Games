# 🏰 هروب من المتاهة - Maze Escape

A feature-rich maze escape game built entirely in a single HTML file with no external dependencies.

## How to Play

Open `maze-escape.html` in any modern browser.

### Controls

| Action | Player 1 | Player 2 | Gamepad | Touch |
|--------|----------|----------|---------|-------|
| Move | WASD | Arrow Keys | Left Stick / D-Pad | Direction buttons |
| Shoot | Space | Enter | A button | 🔫 button |
| Switch Weapon | Q | / | Y button | 🔄 button |
| Ultimate | E | . | LB button | ⚡ button |
| Fullscreen | F | F | — | 🔲 button |

## Features

### Graphics & Appearance
- **Minimap** — Top-right corner showing explored areas, player, monsters, and boss positions
- **Dynamic Lighting** — Flashlight effect with fog of war covering unexplored areas
- **Sound Effects** — Procedural audio via Web Audio API (shooting, monster death, pickups, damage, win/lose)
- **Smooth Animations** — Death animations, shield/speed visual effects, bobbing items, pulsing exits
- **Screen Shake** — Camera shake effect when taking damage
- **Blood/Spark Particles** — Dramatic particle trails when monsters are hit
- **Cinematic Transitions** — Fade in/out between levels
- **3D Wall Shadows** — Darker edges on walls for depth illusion

### Gameplay
- **4 Monster Types**
  - Normal (red) — basic enemy
  - Fast (green) — double speed, less health
  - Tank (purple) — slow, takes 3 hits, has health bar
  - Shooter (orange) — fires projectiles at the player
- **3 Weapons**
  - Pistol — default, medium fire rate
  - Shotgun — 5 spread pellets, slow fire rate
  - Rapid Fire — fast fire rate, less damage
- **Collectible Items**
  - ❤️ Health — restores 1 life
  - 🛡️ Shield — temporary invulnerability
  - ⚡ Speed Boost — temporary speed increase
  - 💰 Coin — adds 50 score
- **Doors & Keys** — Colored doors (red, blue, green) block paths; find matching keys to unlock them
- **Shop** — Buy upgrades between levels (extra lives, weapons, permanent speed boost)
- **Floor Traps**
  - Spikes (gray) — deal damage on contact
  - Lava (orange/red) — deal damage and slow player
  - Ice (cyan) — make player slide in current direction
- **Pressure Buttons** — Floor buttons that open secret passages and hidden walls
- **Rescue NPCs** — Friendly characters trapped in dead ends; rescue them for bonus points and buffs
- **Ultimate Ability** — Charges by killing monsters; freezes all enemies and damages nearby ones

### Game Modes
- **Story Mode** — Progress through levels with increasing difficulty and boss fights
- **Survival Mode** — Endless waves of monsters in an arena, track wave count and kills
- **2-Player Local** — Two players on the same screen (P1: WASD+Space, P2: Arrows+Enter)
- **Level Editor** — Create custom mazes with walls, traps, monsters, and items; save and play them

### Progression
- **High Score** saved to localStorage
- **Level Timer** with time bonus on completion
- **Boss Fights** every 3 levels — large monster with special attack patterns and health bar
- **4 Level Themes**
  - Levels 1–3: Dungeon (dark blue/gray)
  - Levels 4–6: Cave (brown/orange)
  - Levels 7–9: Forest (green)
  - Levels 10+: Castle (purple/gold)
- **World Map** — Visual grid showing level progress with completed/current/locked states
- **Achievement System** (7 achievements):
  - 🗡️ القاتل — Kill 100 monsters
  - 🛡️ لا يُقهر — Complete a level without damage
  - ⚡ سريع — Complete a level under 30 seconds
  - 💰 ثري — Accumulate 1000 score
  - 👑 صياد الزعماء — Defeat 3 bosses
  - 💙 المنقذ — Rescue 10 NPCs
  - 🏆 الناجي — Survive 10 waves in survival mode

### UX
- **Settings** — Toggle sound on/off, select difficulty (easy/normal/hard)
- **Story** — Short narrative text before each level
- **Leaderboard** — Top 5 scores stored locally with dates
- **Fullscreen** — Toggle with F key or button (Fullscreen API)
- **Gamepad Support** — Full controller support with stick/dpad and buttons
- **PWA** — Installable as an app, works offline

## Tech Stack

- Single HTML file (~2500 lines)
- Vanilla JavaScript, HTML5 Canvas
- Web Audio API for procedural sound generation
- Gamepad API for controller support
- Fullscreen API
- localStorage for persistence (scores, achievements, custom levels, settings)
- PWA with inline manifest and service worker
- Zero external dependencies

## License

Free to use and modify.
