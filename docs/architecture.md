# Portfolio world architecture

The site is one continuous world, not a collection of visual sections. It has
three layers:

1. **Base world** — `.base-world` supplies the fixed warm background.
2. **Depth world** — one persistent Three.js canvas renders the Hero portrait.
   Four lightweight Three.js anchors hold the project cards at fixed world
   coordinates, and their normal DOM project interfaces are projected into
   screen space above the canvas.
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
│   ├── card-editor.js        # Live position and rotation controls
│   ├── card-editor.css       # Compact fixed Cards panel
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
- The WebGL renderer draws the Hero directly without post-processing. Every
  card is a conventional DOM interface aligned from its Three.js anchor's
  projected corners, so the same card content remains visible before, during,
  and after focus. The Code view has an Inspira-style folder tree beside the
  source pane. The Cards panel may directly change each base position and XYZ
  rotation, while pointer hover changes only the focused DOM surface. Reset
  restores the active responsive preset from `config.js`; scrolling moves only
  the camera.
- Project cards occupy one foreground DOM layer above the canvas. Camera depth
  supplies their internal z-order, so an approaching card crosses in front of
  the preceding card without removing either surface.
- One fixed focal model is defined in `config.js`. Camera-space distance drives
  continuous DOM opacity and Gaussian blur for every registered project; the
  nearest card becomes interactive only inside the sharp band. Nearly invisible
  or off-screen cards are hidden and inert, and additional `PROJECTS` entries
  inherit the same behavior without pair-specific handoff logic.
- Rendering sleeps when the scene is settled or the page is hidden. Native
  scroll, resize, pointer motion, or editor changes render the required output.
  WebGL pixel count is capped. Only cards with a meaningful on-screen opacity
  are painted, just one card is interactive, and pointer tilt reads layout once
  on entry before batching style updates to animation frames.

## Progressive enhancement

- Identity and contact content exist in HTML before JavaScript runs.
- The DOM portrait stays visible until the WebGL portrait texture loads.
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
