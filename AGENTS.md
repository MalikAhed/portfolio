# Portfolio World

Read `docs/architecture.md` before changing the site. It is the source of truth
for the current implementation.

## Current scope

This repository is intentionally small: one persistent Three.js world with a
Hero portrait and four blank floating cards. A lightweight DOM shell provides
the splash, identity, contact action, accessible navigation, and card-transform
controls.

Do not restore retired About, Skills, Contact-section, black-hole, fluid-cursor,
scene-editor, Framer/Vue, particle, or experimental post-processing ideas unless
Malik explicitly asks for them.

## Architecture rules

- Keep one warm, fixed base background and one persistent Three.js renderer.
- The camera moves only on Z, mapped linearly to native scroll. Do not add scrub,
  easing, snapping, pinning, or momentum.
- Keep the Hero at the zero-scroll origin. The portrait, identity, and backdrop
  recede together without per-object opacity or blur.
- The v3 portrait uses a firm silhouette plus one soft, right-offset shadow
  mesh for depth. Keep that shadow tied to the portrait's world transform.
- Keep the four cards fixed at their configured world coordinates unless the
  Card editor changes a base position or rotation. Scroll moves the camera, not
  the cards. Pointer hover may tilt, scale, and move card glare independently.
- Render the world directly with Three.js. Do not add post-processing or a
  scene-effects editor unless Malik explicitly asks for one.
- Keep interface controls in semantic DOM above the world canvas.
- Do not add visual section boundaries, section backgrounds, or structural
  clipping. Intentional scene overlap must remain possible.
- Respect reduced motion and retain the static portrait when WebGL is missing.

## Keep it lean

- Add a dependency, abstraction, folder, or tool only when the live site needs
  it now.
- Remove superseded implementations instead of storing experiments in the repo.
- Keep only runtime assets referenced by the live site.
- Do not add test suites, generated logs, local backups, design dumps, or guides
  for retired features without an explicit request.
- Centralize world coordinates in `src/world/config.js`.
- Prefer plain HTML, CSS, and JavaScript for UI; use Three.js only for objects
  that participate in camera space.

## Before handing off

Run `npm run check`. It verifies formatting, linting, and the production build.
