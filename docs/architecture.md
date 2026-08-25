# Portfolio world architecture

`AGENTS.md` is the durable design direction. This document describes how the
current implementation realizes that direction and where new code belongs.

## Scene graph

The page is one `.world-stage`, not a stack of visual canvases. Its three
top-level systems are:

1. **Base world** — `.base-world` is the single fixed warm canvas and ambient
   light field.
2. **Depth world** — the persistent Three.js Hero canvas, window shadow,
   identity-flight canvas, black hole, and environmental typography share the
   same world-stage coordinate system. Semantic sections provide scroll range
   and accessible content; they do not own independent backgrounds.
3. **Interface** — the site header, mobile navigation, skip link, splash, and
   local scene tools sit above camera-space art and use named depth tokens.

The conceptual depth tokens live in `src/styles/foundation.css`:
`background`, `far`, `world`, `subject`, `near`, `transition`, `interface`, and
`system`. Small z-index values inside an already established component stacking
context are local ordering values, not new world depth roles.

## Source layout

```text
src/
├── components/
│   ├── site-header/          # Accessible navigation and responsive header
│   ├── splash/               # Bounded first-visit intro shell
│   ├── fluid-cursor/         # Development-only visual lab adapter
│   └── scene-state-copy/     # Development-only scene export tool
├── lib/                      # Framework-free shared helpers
├── sections/
│   ├── hero/                 # Persistent Three.js subject and Hero handoff
│   ├── about/                # Gravity narrative and identity flight
│   ├── skills/               # Semantic capability content + one-shot reveal
│   └── contact/              # Semantic invitation and mail action
├── styles/
│   ├── foundation.css        # Tokens, reset, global accessibility states
│   ├── index.css             # Production stylesheet composition order
│   └── scene-editor.css      # Development-only editor styles
└── main.js                   # Feature initialization and cleanup only
```

## Runtime boundaries

- Essential headings, biography, skills, navigation, and contact actions live
  in `index.html`. JavaScript enhances them but never creates their only usable
  representation.
- The Three.js Hero is dynamically imported after the small application shell.
  Its renderer stays mounted for the page lifetime, renders only while its intro
  or pointer interpolation is active, caps pixel count, and disposes resources
  on a real page teardown.
- Hero scroll work runs only while Hero is near the viewport. The gravity
  narrative runs only while Hero/About is near the viewport. Skills use a
  one-shot `IntersectionObserver`, so the long Skills/Contact passage does not
  keep a JavaScript scroll loop alive.
- Runtime-ready images live in `public/assets`. Source plates and editing
  previews live in `assets/source-art`, so Vite does not copy unused
  multi-megabyte files into the deployed artifact.
- The SVG orbit animation runs only while the black hole is visible, the page is
  active, reduced motion is not requested, and the user is not actively
  scrolling. Its path geometry is prepared during browser idle time.
- There is one production WebGL context. The optional Vue fluid experiment is
  available only in the local scene editor, never emitted in a production
  build, and does not mount while disabled.

## Progressive enhancement and failure states

- Static content and the DOM portrait are visible by default. JavaScript adds
  enhancement classes and swaps to the WebGL portrait only after both portrait
  textures resolve.
- A missing WebGL context releases the splash and retains the static portrait.
- If the application module itself cannot load, the bounded inline failsafe
  removes JavaScript-only states and restores the static mobile navigation.
- With JavaScript disabled, the splash is removed, the mobile navigation is
  presented as normal links, and About, Skills, and Contact remain readable.
- Hash navigation bypasses the intro. `#about` resolves to the biography's
  readable focal state rather than the beginning of its pre-reveal runway.
- Reduced motion skips the splash, removes extra Hero travel and text-to-dot
  morphing, stops orbit animation, and preserves all content.

## Development scene tools

Run `npm run dev` to expose the local About/black-hole tools automatically. Add
`?edit=off` for a clean local presentation. They are intentionally absent from
production:

- `vite.config.js` strips the editor HTML block during production builds.
- `main.js` dynamically imports editor modules only in Vite development mode.
- Production always starts from source-controlled scene defaults; visitor
  `localStorage` cannot change the authored composition.
- Cross-origin state transfer copies only the allow-listed portfolio keys and
  never clears unrelated storage.

If the tools grow further, split their remaining controller code out of
`black-hole.js` before adding more controls.

## Adding a world object

Before implementation, record next to its scene configuration:

- top-level owner: base world, depth world, or interface;
- depth role and owner of final ordering (DOM or Three.js);
- world position, scale, focal range, and responsive presets;
- whether it crosses semantic section boundaries;
- entrance, resting, exit, interrupted-scroll, and reduced-motion states;
- resource lifecycle and when its render/update loop sleeps.

Keep meaningful content in the DOM. Use a Three.js plane only when the object
actually participates in camera space. Do not add structural clipping or an
independent section background to solve a local layout issue.

## Validation

- `npm run check` runs formatting verification, ESLint, type checking, and a
  production build.
- `npm run test:browser` runs Chrome smoke scenarios for normal startup, deep
  links, missing WebGL, disabled JavaScript, blocked application modules,
  reduced motion, keyboard navigation, header breakpoints, desktop, high-DPI,
  and ultrawide layouts. It also checks semantic integrity and the renderer's
  framebuffer budget.
- The Pages workflow runs both before deployment.
- Browser smoke tests run against the built preview at the same `/portfolio/`
  base path used by GitHub Pages; the development editor has a separate opt-in
  smoke scenario.
- Responsive QA must include phone portrait, short phone landscape, the header
  breakpoint, desktop at 1× and 2× DPR, and ultrawide, with horizontal overflow
  checked at each.
