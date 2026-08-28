# Portfolio world architecture

The site is one continuous world, not a collection of visual sections. It has
three layers:

1. **Base world** — `.base-world` supplies the fixed warm background.
2. **Depth world** — one persistent Three.js canvas renders the Hero portrait
   and the procedural chess pieces surrounding StockThink. Four lightweight
   Three.js anchors hold wide project frames at fixed world coordinates. Each
   projected DOM frame pairs a large interactive work view with an alternating
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
│   ├── chess-pieces.js        # Procedural StockThink depth decoration
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
- The fixed header hides while native scroll moves deeper into the project
  world and returns as soon as scroll reverses toward the Hero. It remains
  visible at the Hero origin and while the mobile navigation is open.
- The WebGL renderer draws the Hero directly without post-processing. Every
  card is a conventional DOM interface aligned from its Three.js anchor's
  projected corners, so the same project frame remains visible before, during,
  and after focus. Its large 4:3 desktop work surface alternates left and right beside
  project context, a contained looping technology chain, bulleted highlights,
  and project links. Frames stay hidden while the camera crosses their
  plane, then the work surface slides into place and the explainer resolves
  upward from blur. The Preview/Code control is one pill toggle, and the Code
  view has an Inspira-style folder tree beside the source pane. Its header also
  exposes the complete work surface through the browser Fullscreen API. The
  Project Frames panel may directly change each base position, XYZ rotation,
  frame width, frame height, and scale, plus independent preview-side and
  text-side position, rotation, width, height, and scale. It can copy either
  side or the complete selected project settings for permanent configuration.
  Project surfaces do not tilt on hover, keeping mouse hit targets stable.
  Reset restores the active responsive preset from `config.js`; scrolling moves
  only the camera.
  StockThink's configured text-side default is offset 65 CSS pixels to the
  right. Project header controls remain available throughout the card's clear
  presentation range. Fullscreen uses the browser API when permitted and a
  viewport-filling fallback when an embedded browser denies that API.
- Project cards occupy one foreground DOM layer above the canvas. Camera depth
  supplies their internal z-order, so an approaching card crosses in front of
  the preceding card without removing either surface.
- The StockThink preview uses a staged load. After the portfolio finishes, its
  document and entry bundles are prefetched at idle priority without creating
  an iframe or WebGL context. Pausing in StockThink's focus band starts the real
  iframe behind a matching branded loading curtain. On the deployed same-origin
  site, that curtain stays until StockThink's own loader reports completion.
  Once initialized, the iframe keeps its state but is hidden outside Preview
  focus so it is not painted while the visitor continues through the world.
- One fixed focal model is defined in `config.js`. Camera-space distance drives
  continuous DOM opacity and Gaussian blur for every registered project; the
  nearest card becomes interactive only inside the sharp band. Nearly invisible
  or off-screen cards are hidden and inert, and additional `PROJECTS` entries
  inherit the same behavior without pair-specific handoff logic.
- Focused frames retain their authored dimensions and editor scale, then apply
  a projection-only viewport fit so fullscreen and ultrawide windows keep the
  complete left/right composition visible. Very wide, short windows use a 3:2
  work surface instead of 4:3 to preserve that vertical fit. Resizing within
  one preset updates the fit without resetting editor changes.
- Rendering sleeps when the scene is settled or the page is hidden. During
  active native scrolling, camera and DOM projection state update without a
  WebGL draw, chess animation, or visible StockThink iframe; the static Hero
  surrogate prevents a stale portrait or chess frame from leaking through.
  One settled frame resumes the renderer after scrolling stops. Chess pieces
  remain hidden while crossing the camera plane, then share the StockThink
  frame's entrance and focal visibility. Resize, pointer motion, or editor
  changes otherwise render the required output. WebGL pixel count is capped.
  Only cards with a meaningful on-screen opacity are painted, and just one
  card's main content is interactive. Project cards do not run hover animation
  frames.

## Progressive enhancement

- Identity and contact content exist in HTML before JavaScript runs.
- The DOM portrait stays visible until the WebGL portrait texture loads.
- During active native scrolling, that same DOM portrait temporarily stands in
  for the sleeping WebGL canvas. It inherits the shared Hero depth transform,
  blur, and fade, so the cutout and its shadow continue to recede without a GPU
  draw. The canvas returns on the settled frame.
- Missing WebGL, texture failure, or blocked modules leave the static Hero
  usable and release the splash.
- Reduced motion skips large startup travel and disables pointer-driven scene
  motion without removing content.

## Assets and dependencies

Only files referenced by the live page belong in `public/assets`. The runtime
dependencies are Three.js and the three local font packages. Vite is the build
tool; no framework or parallel editor runtime is present.

## Validation

`npm run check` runs Prettier verification, ESLint, and a production Vite build.
The Pages workflow runs the same command before deployment.

When adding an object, document its world position, scale, responsive preset,
depth relationship, motion trigger, reduced-motion behavior, and disposal path
in or next to `src/world/config.js`.
