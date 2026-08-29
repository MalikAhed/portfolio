# Portfolio world architecture

The site is one continuous world, not a collection of visual sections. It has
three layers:

1. **Base world** — `.base-world` supplies the fixed warm background.
2. **Depth world** — one persistent Three.js canvas renders the Hero portrait.
   Four lightweight Three.js anchors hold wide project frames at fixed world coordinates. A
   large projected “My Work” marker separates the Hero from the project rail.
   Each projected DOM frame pairs an interactive work view with an alternating
   explainer column. A projected “And much more” grid and GitHub action close
   the journey after the final featured project.
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
│   ├── cards.js              # Project anchors, projection, and presentation state
│   ├── project-card-elements.js # Reusable project-card DOM controls and marks
│   ├── projected-object-world.js # Shared decorative-object projection lifecycle
│   ├── chess-world.js        # StockThink projected-object configuration
│   ├── ingredient-world.js   # Cube Burger projected-object configuration
│   ├── murajaa-world.js      # Murajaa projected-object configuration
│   ├── learn-world.js        # Full-Stack Quest projected-object configuration
│   ├── journey-scroll.js     # Native-scroll measurement and camera state
│   ├── project-frame-editor.js  # Final-frame position, rotation, and size controls
│   ├── project-frame-editor.css # Compact fixed Project Frames panel
│   ├── learn-object-editor.js   # Full-Stack Quest object XYZ/visibility controls
│   ├── black-hole-camera-editor.js # Live final-camera timing controls
│   ├── warp-lines.js         # Lightweight radial canvas renderer
│   ├── warp-speed.js         # Lazy final-passage and iframe controller
│   ├── ending-composition.css # Responsive final identity and contact overlay
│   ├── config.js             # Camera, focus, and responsive world positions
│   ├── journey.css           # Transparent native-scroll distance
│   ├── project-cards.css     # Interactive project-card presentation
│   ├── projects.js           # Project metadata and compact source previews
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
  The shadow texture is generated once at portrait load, so its mesh needs one
  texture sample per pixel instead of running a multi-sample blur every frame.
- Camera X/Y and orientation remain fixed. Native scroll maps directly and
  reversibly from Hero Z to the configured end Z.
- The Hero origin uses the same camera-space focus model as the cards. Its
  portrait, tied shadow, identity copy, and backdrop fade
  and blur together as the camera retreats; the header and contact interface
  remain crisp.
- A bold “My Work” world marker appears after the Hero clears and recedes
  before the first project arrives. Its position lives in `config.js`, and its
  scale, visibility, and blur use the same camera-depth model as the cards.
- The fixed header hides while native scroll moves deeper into the project
  world and returns as soon as scroll reverses toward the Hero. It remains
  visible at the Hero origin and while the mobile navigation is open. The
  header returns for the final composition and switches its brand, navigation,
  menu, and contact treatment to white against the black world.
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
  Preview loaders wait briefly before appearing, so cached or immediately ready
  content never flashes a spinner. Readiness hides the loader and reveals the
  preview in the same update with no blank frame between them.
  Once loaded, every preview remains mounted and visually present through active
  scrolling, preserving its last application state. A never-opened remote
  preview waits until scrolling settles at its focus band before beginning its
  first navigation, so network and parse work do not enter a fast-scroll frame.
  The large StockThink source listing is imported only when its Code view is
  first opened.
- Project cards occupy one foreground DOM layer above the canvas. Camera depth
  supplies the shared z-order for cards and projected world pieces, so an
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
  Decorative assets for each project begin loading one project interval before
  their world entry rather than all downloading at startup.
- Cube Burger replaces the second placeholder with its live full-width site
  preview. Seven lettuce, tomato, and onion crops reuse the original project's
  ingredient sprite sheet around that card. Their projected anchors occupy
  distinct foreground Z positions, so every crop sharpens, blurs, and fades at
  its own camera distance; the following project naturally crosses in front.
  Its lightweight iframe remains mounted after its first load. No poster or
  freeze-frame artwork covers the real project surface. A shared cream-and-red
  “Preparing preview…” spinner covers a meaningfully slow first load and clears
  on the iframe's load event; later focused visits reveal the already-mounted preview
  immediately. The site can finish its imagery progressively.
- The StockThink preview is one local screenshot captured from the original
  landing hero after its reveal. It remains the sole preview surface throughout
  scrolling, with a shared spinner covering only a meaningfully slow image
  download and no iframe, poster, or fallback frame. The separate
  projected chess-piece sprites around the card remain part of the portfolio
  world.
- Murajaa replaces the third placeholder with its live Arabic-first Tawjihi
  flashcard PWA. The lightweight plain-HTML preview stays mounted after its
  first focus, with the shared loading spinner clearing when its iframe is
  ready and preserving its local study state while avoiding reloads. Four
  generated Murajaa screens surround the frame at distinct foreground depths.
- Full-Stack Quest replaces the final placeholder with the deployed real
  learning application, including its sixteen biome backgrounds, 112-lesson
  path, navigation, league rank, streak, lesson views, XP, and challenge UI.
  The shared loading spinner covers its first iframe download. Original project
  artwork supplies the separate book, flame, and rank objects distributed
  around the frame at distinct world depths. The camera rail
  continues beyond this final frame so it can recede naturally before the
  native scroll range ends.
- A final projected “And much more” composition follows Full-Stack Quest. Its
  compact grid summarizes additional work areas and links to the complete
  public repository list without adding another featured-project frame.
- As Murajaa enters, a lightweight canvas layer begins revealing black radial
  light-speed streaks from the far depth layer, above only the warm base and
  behind the Three.js world, project surfaces, and final composition. The world
  renderer clears those streaks beneath each visible project explainer and the
  final composition, so transparent copy areas occlude them like the opaque
  preview surfaces without introducing a section background. The world
  darkens after the remaining work recedes and is almost fully black before the
  black hole appears; during that transition, the streaks invert to white.
  Malik's Schwarzschild ray-marched line-path simulation then uses a brief,
  stronger blur-and-opacity entrance in that full-screen, pointer-inert surface.
  Both clear linearly within a short camera-Z interval, masking the cached ray
  map's first rim pixels while the view is still very close. Its camera distance, line count,
  orbit speed, and downward framing use the same short linear camera-Z interval
  beginning at the chosen movement start, without an eased slowdown or hold.
  The physical camera then remains fixed for the rest of the journey. Its live
  camera panel exposes only the final scroll Z and the Z position where the
  black hole starts moving down.
  Changing the final scroll Z updates the endpoint of the same native-scroll
  linear camera rail. Once the black-hole view is established, the
  radial light-speed streaks fade away independently. During the remaining
  scroll, the black hole shrinks and its completed ray-marched image slides down
  together at a constant rate over a short, fixed camera-Z interval, then holds
  that framing through the end of the journey. The interval is independent of
  the editable scroll endpoint, so extending the journey cannot slow the move.
  The physical observer keeps the simulation's fixed inclination and view
  rotation, preventing an overhead view while leaving clear space above the
  disk. The Black Hole Camera panel can
  capture the current camera Z as the exact movement start and copy both live
  values for permanent configuration. The black-hole surface
  remains fully visible and alive at the end of the rail instead of fading back
  to the warm base. The embedded renderer runs only while the passage is
  visible, never takes over native scrolling, and is disabled under reduced
  motion. Its document is not requested at startup: it initializes during an
  idle pause after the featured project rail recedes, with a bounded near-scene
  fallback for a visitor who scrolls continuously. The embedded path omits the standalone
  stats, GUI, and orbit-control modules and uses the same capability-based pixel
  budget as the parent world. Moving views use a smaller temporary ray map and
  restore the unchanged full-quality map after settling. Software WebGL
  renderers receive an additional framebuffer cap so the fallback cannot
  saturate the CPU with the ray map.
- A fixed semantic ending composition fades in linearly as the black hole
  settles into its lower framing. Malik's compact identity statement occupies
  the clear space above, while Gaza, age, and full-stack details sit opposite a
  single GitHub action around the black hole. The composition has no background or clipping,
  becomes interactive only when almost fully visible, reverses directly with
  native scroll, and is reset with the world lifecycle.
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
- Rendering sleeps when the scene is settled or the page is hidden. Native
  scroll events are coalesced into at most one camera, DOM projection, and
  renderer update per animation frame. During active scrolling, large changing
  card shadows are suspended while opacity, projection, entry motion, and
  Gaussian depth blur remain exactly scroll-linked. Loaded preview iframes keep
  their last visible state during that interval, while new iframe navigations
  wait for scroll settlement and only the visible active card runs its
  technology-chain animation. The WebGL renderer clears once and sleeps completely after the
  Hero portrait leaves view because the remaining Three.js objects are transform
  anchors only. Resize work is frame-coalesced as well. WebGL pixel count,
  device pixel ratio, and texture anisotropy use a smaller capability-based
  budget on memory-, processor-, or data-constrained devices.
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

Only files referenced by the live page belong in `public/assets`. Large
project-world screenshots and transparent progression artwork use optimized
WebP; Murajaa screens are also sized to the maximum useful projected density.
The runtime dependencies are Three.js and the locally bundled font packages.
Only the used Latin WOFF2 font files are emitted. Vite is the build tool; no
framework or parallel editor runtime is present.
The Hero portrait and foreground chess cutouts use full-resolution, high-quality
WebP with preserved alpha. Chess images retain their original PNGs as runtime
fallbacks for preview environments that fail to resolve the optimized files.
Cube Burger keeps its compact indexed-PNG ingredient sprite because a WebP
replacement is larger; its photographic site assets use high-quality WebP in
the source project. The Full-Stack Quest Objects editor exposes independent XYZ
placement and visibility for every projected progression object and can copy
the complete authored configuration.

## Validation

`npm run check` runs Prettier verification, ESLint, and a production Vite build.
The Pages workflow runs the same command before deployment.

When adding an object, document its world position, scale, responsive preset,
depth relationship, motion trigger, reduced-motion behavior, and disposal path
in or next to `src/world/config.js`.
