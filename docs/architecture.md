# Portfolio world architecture

The site is one continuous world, not a collection of visual sections. It has
three layers:

1. **Base world** — `.base-world` supplies the fixed warm background.
2. **Depth world** — one persistent Three.js canvas renders the Hero portrait.
   Four lightweight Three.js anchors hold wide project frames at fixed world coordinates. A
   large projected “My Work” marker separates the Hero from the project rail.
   Each projected DOM frame pairs an interactive work view with an alternating
   explainer column.
3. **Interface** — semantic DOM provides the header, contact action, skip link,
   identity copy, project controls, card-transform controls, and startup
   splash.

## Source layout

```text
src/
├── components/
│   ├── site-header/          # Header behavior and styles
│   └── splash/               # Every-load introduction styles
├── lib/dom.js                # Required-element helper
├── sections/hero/            # Hero presentation styles
├── styles/                   # Global tokens and stylesheet entry
├── world/
│   ├── cards.js              # World anchors + projected DOM project views
│   ├── chess-world.js        # Depth-projected StockThink chess-piece sprites
│   ├── ingredient-world.js   # Depth-projected Cube Burger ingredient crops
│   ├── project-frame-editor.js  # Final-frame position, rotation, and size controls
│   ├── project-frame-editor.css # Compact fixed Project Frames panel
│   ├── config.js             # Camera, focus, and responsive world positions
│   ├── journey.css           # Transparent native-scroll distance
│   ├── project-cards.css     # Interactive project-card presentation
│   ├── projects.js           # Temporary files and sandbox preview documents
│   └── world.js              # Renderer, Hero, scroll rail, and lifecycle
└── main.js                   # Small application shell and feature startup
```

## Runtime

- Every full load clears restored hash/scroll state and starts at the Hero.
- The splash plays on every motion-enabled load and releases immediately for
  reduced motion or a failed WebGL startup.
- The Hero reveal gives the identity name a long ease-out arrival, then lets
  the portrait and its tied shadow continue settling more slowly into their
  final position without changing the scroll-driven world motion.
- `main.js` loads the Three.js world as one deferred chunk.
- `world.js` owns the renderer, Hero meshes, native scroll mapping, pointer
  interaction, resize handling, and disposal.
- The v3 Hero uses a firm alpha silhouette and one portrait-relative offset
  mesh with a small Gaussian alpha blur for a soft, controlled depth shadow.
- Camera X/Y and orientation remain fixed. Native scroll maps directly and
  reversibly from Hero Z to the configured end Z.
- The Hero origin uses the same camera-space focus model as the cards. Its
  portrait, tied shadow, identity copy, and backdrop fade and blur together as
  the camera retreats; the header and contact interface remain crisp.
- A bold “My Work” world marker appears after the Hero clears and recedes
  before the first project arrives. Its position lives in `config.js`, and its
  scale, visibility, and blur use the same camera-depth model as the cards.
- The fixed header hides while native scroll moves deeper into the project
  world and returns as soon as scroll reverses toward the Hero. It remains
  visible at the Hero origin and while the mobile navigation is open.
- The WebGL renderer draws the Hero directly without post-processing. Every
  card is a conventional DOM interface aligned from its Three.js anchor's
  projected corners, so the same project frame remains visible before, during,
  and after focus. Every project matches StockThink's large 4:3 desktop work
  surface, alternating left and right beside project context, a contained
  looping technology chain, bulleted highlights, and project links. Frames
  stay hidden while the camera crosses their plane, then every work surface maps
  scroll depth linearly to the same constant-speed horizontal path into place.
  The explainer resolves from blur without a second movement axis. The
  Preview/Code control is one pill toggle, and the Code
  view has an Inspira-style folder tree beside the source pane. Repository paths
  render as real nested, collapsible folders, and the source header repeats the
  active path as a breadcrumb. Its header also exposes the complete work surface
  through the browser Fullscreen API. The
  Project Frames panel may directly change each base position, XYZ rotation,
  frame width, frame height, and scale, plus independent preview-side and
  text-side position, rotation, width, height, and scale. It can copy either
  side or the complete selected project settings for permanent configuration.
  Project surfaces do not tilt on hover, keeping mouse hit targets stable.
  Reset restores the active responsive preset from `config.js`; scrolling moves
  only the camera.
  Text sides are offset 65 CSS pixels away from their paired work surface:
  positive X for left-preview cards and negative X for right-preview cards.
  All explainers share a larger Bricolage Grotesque title system, readable
  22-pixel summaries, consistent highlight spacing, and balanced text widths.
  StockThink's title additionally mirrors its original hero wordmark at weight
  800 with uppercase lettering and the same tight tracking.
  Project header controls remain available throughout the card's clear
  presentation range. Fullscreen uses the browser API when permitted and a
  viewport-filling fallback when an embedded browser denies that API.
- Project cards occupy one foreground DOM layer above the canvas. Camera depth
  supplies the shared z-order for cards and projected chess pieces, so an
  approaching card crosses in front of every earlier card and piece at the
  correct world depth without removing either surface. Cards enter fully opaque
  but blurred, switch to a true filter-free presentation at their focal depth
  for crisp iframe and text rendering, and only blur and fade after receding.
- StockThink is surrounded by three fully opaque foreground chess-piece sprites
  registered to Three.js anchors at distinct world Z positions. Projected DOM
  images let them cross the interactive surface. A section-entry gate prevents
  them from leaking into the preceding world. Every piece appears fully opaque
  but blurred at its own camera-space entry, sharpens independently at focus,
  then blurs and fades after receding. Piece sprites use a stronger blur range
  than cards so the effect remains legible on their large silhouettes. They
  remain pointer-inert and introduce no independent motion under reduced motion.
- Cube Burger replaces the second placeholder with its live full-width site
  preview. Seven lettuce, tomato, and onion crops reuse the original project's
  ingredient sprite sheet around that card. Their projected anchors occupy
  distinct foreground Z positions, so every crop sharpens, blurs, and fades at
  its own camera distance; the following project naturally crosses in front.
  Its lightweight iframe remains mounted after its first load instead of
  flashing to a blank surface during scroll, while its preview fallback uses
  the site's own cream. A cream-and-red Cube Burger splash starts the iframe as
  soon as the card becomes active and clears on the project's first rendered
  DOM content instead of waiting for every large image. The preview remains
  mounted and can finish its imagery progressively. StockThink retains its dark
  loading curtain and focused paint lifecycle because its WebGL preview is
  substantially heavier.
- The StockThink preview uses a staged load. After the portfolio finishes, its
  document and entry bundles are prefetched at idle priority without creating
  an iframe or WebGL context. Pausing in StockThink's focus band starts the real
  iframe behind a matching branded loading curtain. On the deployed same-origin
  site, that curtain stays until StockThink's own loader reports completion.
  Once initialized, the iframe keeps its state but is hidden outside Preview
  focus so it is not painted while the visitor continues through the world.
  Its iframe retains a full 1440-pixel website viewport and scales that complete
  viewport into the available preview panel, so the website's full desktop
  width remains visible instead of collapsing to the card width.
- One fixed focal model is defined in `config.js`. Projects enter fully opaque
  by sliding from alternating sides into their exact authored positions, then
  camera-space distance drives their exit opacity and Gaussian blur; the
  nearest card becomes interactive only inside the sharp band. Nearly invisible
  or off-screen cards are hidden and inert, and additional `PROJECTS` entries
  inherit the same behavior without pair-specific handoff logic.
- Focused frames retain their authored dimensions and editor scale, then apply
  a projection-only viewport fit so fullscreen and ultrawide windows keep the
  complete left/right composition visible. Very wide, short windows use a 3:2
  work surface instead of 4:3 to preserve that vertical fit. Resizing within
  one preset updates the fit without resetting editor changes.
- Rendering sleeps when the scene is settled or the page is hidden. During
  active native scrolling, the camera, DOM projection state, and WebGL portrait
  update together so the cutout and its tied shadow retain one continuous
  transform; the StockThink iframe remains hidden until scrolling settles.
  Resize, pointer motion, or editor changes otherwise render the required
  output. WebGL pixel count is capped.
  Only cards with a meaningful on-screen opacity are painted, and just one
  card's main content is interactive. Project cards do not run hover animation
  frames.

## Progressive enhancement

- Identity and contact content exist in HTML before JavaScript runs.
- The DOM portrait stays visible until the WebGL portrait texture loads.
- During active native scrolling, the persistent WebGL portrait remains the
  visual source and follows the shared Hero depth transform, blur, and fade.
  The DOM portrait remains the fallback only for loading or missing WebGL.
- Missing WebGL, texture failure, or blocked modules leave the static Hero
  usable and release the splash.
- Reduced motion skips large startup travel and disables pointer-driven scene
  motion without removing content.

## Assets and dependencies

Only files referenced by the live page belong in `public/assets`. The runtime
dependencies are Three.js and the three local font packages. Vite is the build
tool; no framework or parallel editor runtime is present.
The Hero portrait and foreground chess cutouts use full-resolution, high-quality
WebP with preserved alpha. Chess images retain their original PNGs as runtime
fallbacks for preview environments that fail to resolve the optimized files.
Cube Burger keeps its compact indexed-PNG ingredient sprite because a WebP
replacement is larger; its photographic site assets use high-quality WebP in
the source project.

## Validation

`npm run check` runs Prettier verification, ESLint, and a production Vite build.
The Pages workflow runs the same command before deployment.

When adding an object, document its world position, scale, responsive preset,
depth relationship, motion trigger, reduced-motion behavior, and disposal path
in or next to `src/world/config.js`.
