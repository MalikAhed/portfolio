# Portfolio World — Project Direction

This file is the durable source of truth for all future work in this repository.
Read it before planning, designing, or editing the site.

## Core vision

This portfolio is one continuous cinematic world with depth. It is not a stack
of visually isolated page sections. The visitor should feel as if a camera is
moving through a single environment containing objects at different distances.

The current warm canvas is the fixed base background for the whole experience.
Scenes, artwork, text, cards, particles, shadows, and transitions live above that
shared background. Never introduce a visible section boundary, independent
section background, or accidental seam unless Malik explicitly requests one.

## Continuous-world rule

- Semantic HTML sections are allowed and encouraged for navigation,
  accessibility, and content structure.
- A semantic section must not automatically become a visual viewport, clipping
  container, stacking-context island, or separate scene.
- Visual objects may extend into the viewport before or after the semantic
  content that owns them. This overlap is intentional.
- Do not clip an object at a hero, About, Work, or other section boundary.
- Avoid `overflow: hidden`, `overflow: clip`, masks, containment, isolation, and
  unnecessary stacking contexts on structural wrappers. Use them only when a
  specific visual effect requires clipping and Malik has approved the result.
- Do not solve overflow bugs by globally hiding overflow. Find the element that
  is creating unintended document overflow while preserving intentional visual
  overlap.
- Components that belong to the world should be positioned relative to the
  world/scene coordinate system, not trapped inside a section-sized box.
- UI that must remain usable, such as navigation, menus, dialogs, and editor
  controls, belongs to a separate interface layer above the world.

## Scene architecture

Treat the page as a scene graph with three top-level systems:

1. **Base world** — one fixed, full-viewport canvas/background shared by the
   entire site.
2. **Depth world** — all cinematic objects placed in world space with explicit
   depth, scale, focus behavior, and overlap relationships.
3. **Interface** — semantic navigation, accessible controls, dialogs, and other
   UI that should not inherit camera blur or perspective unless intentionally
   designed to do so.

Create a persistent world-stage wrapper when extending the architecture. Keep
the Three.js canvas stable across the experience rather than mounting a new
renderer for every semantic section. DOM content may be synchronized with the
camera when it needs to remain crisp and accessible.

## Depth model

Every major visual object must have an intentional depth role. Use named depth
tokens or documented scene values instead of arbitrary `z-index` escalation.

Recommended conceptual layers, from farthest to nearest:

- `background`: fixed canvas, distant light, atmospheric texture
- `far`: distant environmental shapes and slow parallax elements
- `world`: primary scene objects and portfolio environments
- `subject`: Malik, featured work, and the current focal object
- `near`: foreground objects that may cross viewport and scene boundaries
- `transition`: temporary objects traveling between focal scenes
- `interface`: navigation and accessible controls
- `system`: splash screen, modal, editor, and emergency status UI

CSS `z-index` is only an ordering tool for DOM layers. Real spatial depth inside
Three.js should come from world coordinates and the camera. Do not mix the two
systems without documenting which one owns the final composition.

## Camera and focus language

Future navigation may be expressed as camera travel, panning, dolly movement,
or a change of focus rather than a conventional section transition.

- The camera may move forward through fixed work cards and environmental
  objects.
- Objects inside the lens focus range should appear sharp.
- Objects too near or too far should progressively blur and lose contrast,
  creating an intentional depth-of-field effect.
- Focus transitions must guide attention to one primary subject at a time.
- Camera paths need deliberate start, focal, and resting states. Never leave the
  world between states after interrupted scrolling or resizing.
- Camera movement should feel weighted, smooth, and cinematic—not floaty or
  endlessly reactive.
- Scroll can drive camera progress, but scroll position is an input to the scene,
  not a reason to create isolated full-screen sections.
- Preserve usable fallbacks for reduced motion. Reduced motion should cut large
  spatial travel while still presenting every piece of content in a coherent
  final state.

True depth of field may use a carefully budgeted Three.js post-processing pass.
If performance is insufficient, approximate it with depth-banded layers and
controlled CSS/WebGL blur. In either case, focal distance and blur behavior must
be part of the scene design rather than decoration added afterward.

## Three.js decision

Three.js is intentional in this project. It is the foundation for the continuous
world, camera movement, spatial depth, parallax, focus range, and future passage
through portfolio objects. Do not remove it merely because the current scene
contains 2D cutout assets.

Use the lightest suitable implementation inside that architecture:

- HTML/CSS for accessible copy, navigation, buttons, forms, and simple flat UI
- transparent images or DOM layers for art that must retain exact source shape
- Three.js planes for 2D artwork that participates in camera depth
- Three.js geometry, shaders, and post-processing only when they materially add
  spatial behavior or the requested cinematic finish

Do not create a complex 3D implementation for an object that never participates
in camera space. Conversely, do not trap a world object in section-local CSS
when it needs to cross boundaries or respond to camera depth.

## Composition and overlays

- Overlays are global scene layers by default, not section decorations.
- An overlay may enter early, remain through multiple content beats, and leave
  after its semantic owner has passed.
- Preserve transparent edges and the exact silhouette of supplied raster assets.
- The black hole and future similar objects must be free to travel beyond the
  top and bottom bounds of About, Hero, or any neighboring content region.
- Never add clipping simply to keep a composition tidy at one viewport size.
- Define responsive world positions, camera framing, and focal targets for
  portrait, landscape, short-height, desktop, and ultrawide states.
- Maintain one coherent lighting direction, shadow language, contrast range,
  motion curve family, and sense of scale across all scenes.

## Animation and transitions

- Every transition should feel like a change inside the same world.
- Prefer camera movement, depth change, focus pull, parallax, occlusion, light,
  or an object crossing the frame over generic section fades.
- Motion must have a narrative purpose: reveal depth, redirect focus, connect
  scenes, or confirm interaction.
- Use a small, consistent set of easing curves and durations.
- Avoid simultaneous unrelated motion that weakens the focal subject.
- Pointer motion should be subtle and should settle at rest; do not render
  continuously when nothing is changing.
- Loading and resizing must never expose an empty canvas, broken camera state,
  or objects stuck at zero opacity.

## Performance and accessibility

- Keep live text and controls in semantic DOM whenever practical.
- The visual world must never block keyboard navigation or pointer access to UI.
- Cap device pixel ratio and post-processing cost to a sensible visual return.
- Suspend rendering when the scene is static or the page is hidden.
- Reuse textures, geometry, materials, render targets, and one renderer where
  possible. Dispose resources that are genuinely removed.
- Provide static or simplified fallbacks when WebGL is unavailable.
- Respect `prefers-reduced-motion` without removing content.
- Decorative objects should be hidden from assistive technology; meaningful
  work and project content must remain readable outside the 3D presentation.

## Editing rules

Before changing the composition, identify:

- which top-level system owns the element: base world, depth world, or interface
- its depth role and focal behavior
- whether it may cross semantic boundaries
- whether it needs DOM accessibility or true camera-space behavior
- its entrance, resting, transition, and reduced-motion states

When adding a new scene object, document its world position, depth, scale,
responsive presets, focus range, stacking relationship, and motion trigger near
its implementation. Prefer centralized scene configuration over scattered magic
numbers.

Do not redesign existing brand elements, remove Three.js, flatten depth, add
section clipping, or split the shared background without explicit approval.

## Current direction

- The warm base background is the persistent world background.
- The hero portrait is the first camera-space subject and establishes the visual
  quality bar for depth, shadow, reflection, and motion.
- The oversized About word belongs to the continuous environment.
- The transparent black hole is a world object, not an About-section asset. Its
  editor should eventually control world position/depth and must not be limited
  by section bounds.
- Future work cards may remain positioned in world space while the camera moves
  toward and through their focus zones.

When a new request conflicts with this document, the newest explicit instruction
from Malik wins. Update this file when the long-term direction changes.
