# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build tools, bundler, or dependencies. Pure ES6 modules served directly to the browser.

**Run locally:** Requires a local HTTP server (browsers block ES module imports from `file://`).
```bash
npx serve .
```
Then open http://localhost:3000.

**Deployed at:** https://ruehof.github.io/asteroids/ (GitHub Pages, serves from `master` branch root)

## Architecture

Classic game-loop architecture using HTML5 Canvas 2D and ES modules. Single entry point `index.html` loads `js/game.js` which imports all other modules.

**Module dependency graph:**
```
game.js  →  input.js (keyboard state)
         →  ship.js → utils.js
         →  bullet.js → utils.js
         →  asteroid.js → utils.js
         →  particles.js → utils.js
         →  utils.js (collision detection)
```

**Game class (game.js)** owns the entire game state and loop:
- State machine: `title` → `playing` → `gameover` (transitions on Space/Enter)
- `requestAnimationFrame` loop calls `update()` then `render()` each frame
- Manages all entity arrays (bullets, asteroids) and handles collision resolution
- Level progression: spawns `4 + (level-1)*2` large asteroids per level

**Entity pattern:** Each entity class (Ship, Bullet, Asteroid) follows the same interface: constructor sets position/velocity, `update(canvas)` advances physics + wraps at edges, `draw(ctx)` renders with neon glow via `shadowBlur`/`shadowColor`.

**Collision:** Circle-based (`circleCollision` in utils.js). Ship hitbox is 60% of visual radius for fairness.

**Asteroids split:** large (magenta, 20pts) → 2 medium (orange, 50pts) → 2 small (green, 100pts). Sizes, speeds, and colors are defined in `SIZE_CONFIG` in asteroid.js.

## Visual Style

Neon-glow aesthetic: black background, all objects rendered as strokes with Canvas `shadowBlur` + `shadowColor`. Ship=cyan, asteroids=color-by-size, bullets=white/yellow, explosions=matching entity color. Asteroids have procedurally generated jagged outlines (7-12 random vertices).
