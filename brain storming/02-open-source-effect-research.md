# Open-source effect research and stack fit

Research date: 25 August 2026

## Important integration finding

This project is Vite + semantic HTML + mostly vanilla JavaScript with Three.js
already installed. Vue exists in the dependency graph, but the current page is
not structured as a Vue application. Inspira UI is an MIT-licensed Vue/Nuxt
copy-source collection, not a zero-cost visual layer that should be mounted
wholesale. Its own repository describes the components as code to copy,
customize, and adapt: [Inspira UI GitHub](https://github.com/unovue/inspira-ui).

The best approach is:

- Borrow component math, shader ideas, and interaction timing.
- Port the selected idea into the existing scene architecture.
- Keep one persistent Three.js renderer.
- Do not add a second OGL/WebGL canvas for one gallery.
- Do not import Tailwind or create Vue islands merely to reproduce a 30-line
  effect that fits the existing DOM/Three implementation.
- Preserve licenses and credits for copied source.

## Recommended source shortlist

| Source/effect                                                                                          | What it provides                                | Best use here                                    | Stack fit                                           | License/status   | Verdict                                    |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- | ---------------- | ------------------------------------------ |
| [Inspira 3D Carousel](https://inspira-ui.com/docs/en/components/visualization/carousal-3d)             | Three.js + Motion-V rotating/drag carousel      | P2 project orbit; study layout and drag settling | Medium: Three fits, component is Vue/Motion-V       | Inspira repo MIT | **Adapt**, do not paste unchanged          |
| [Inspira Orbit](https://inspira-ui.com/docs/en/components/visualization/orbit)                         | Items moving on configurable circular paths     | S1 capability ring timing/placement              | High for concept; trivial to port to SVG/Three      | Inspira repo MIT | **Adopt the logic**                        |
| [Inspira Progressive Blur](https://inspira-ui.com/docs/en/components/special-effects/progressive-blur) | Layered directional backdrop blur               | CSS/mobile approximation of depth of field       | High for DOM overlays                               | Inspira repo MIT | **Adopt selectively**                      |
| [Inspira Morphing Text](https://inspira-ui.com/docs/en/components/text-animations/morphing-text)       | SVG threshold + blur morph between words        | One S4 verb handoff                              | Medium: easy to port; continuous loop is unsuitable | Inspira repo MIT | **Adapt to scroll and stop at rest**       |
| [Inspira Scroll Swap Text](https://inspira-ui.com/docs/en/components/text-animations/scroll-swap-text) | Reversible text swaps tied to scroll            | Alternative to an autoplay morph                 | Medium: Motion-V source, simple underlying idea     | Inspira repo MIT | **Adapt**                                  |
| [Inspira Animated Beam](https://inspira-ui.com/docs/en/components/special-effects/animated-beam)       | Animated SVG connections                        | S1 evidence connection or S3 build path          | High if only active paths animate                   | Inspira repo MIT | **Adopt sparingly**                        |
| [Inspira Card Stack](https://inspira-ui.com/docs/en/components/cards/card-stack)                       | Cards scale into a focused stack on scroll      | P4 Evidence Stack                                | High concept fit; port Motion-V timeline            | Inspira repo MIT | **Strong fallback**                        |
| [Inspira Floating Card](https://inspira-ui.com/docs/en/components/cards/floating-card)                 | Pointer-tracked 3D tilt and glare               | One focal project or C3 contact card             | High if transform limits are reduced                | Inspira repo MIT | **Use on one object only**                 |
| [Inspira Fey Cards](https://inspira-ui.com/docs/en/components/cards/fey-cards)                         | Layered image swap and cinematic heading reveal | P4 top-card treatment                            | Medium                                              | Inspira repo MIT | **Reference, not core system**             |
| [Inspira Bending Gallery](https://inspira-ui.com/docs/en/components/visualization/bending-gallery)     | Curved WebGL gallery using OGL                  | P3 contact-sheet curve                           | Low direct fit because it introduces OGL            | Inspira repo MIT | **Port the curve math to Three.js**        |
| [Inspira Image Trail Cursor](https://inspira-ui.com/docs/en/components/cursors/image-trail-cursor)     | Project images emitted along pointer movement   | P3 project-title previews on desktop             | Medium; requires strict scene-local lifecycle       | Inspira repo MIT | **Optional, never global**                 |
| [Inspira Ripple](https://inspira-ui.com/docs/en/components/backgrounds/ripple)                         | Concentric one-source ripple                    | C1 email focus echo                              | High; can be plain CSS/SVG                          | Inspira repo MIT | **Use once per interaction**               |
| [Inspira Path Marquee](https://inspira-ui.com/docs/en/components/miscellaneous/path-marquee)           | Content traveling on an SVG path                | C2 single plane/signal path                      | Medium; do not use repeated marquee content         | Inspira repo MIT | **Borrow path-following logic**            |
| [Inspira Particle Image](https://inspira-ui.com/docs/en/components/special-effects/particle-image)     | Image assembles/disperses as particles          | One Skills→Projects materialization beat         | Medium; another canvas may be wasteful              | Inspira repo MIT | **Reference only unless in main renderer** |
| [Inspira Liquid Logo](https://inspira-ui.com/docs/en/components/visualization/liquid-logo)             | WebGL logo distortion                           | Very brief Contact→Hero monogram echo            | Low-medium; visually easy to overuse                | Inspira repo MIT | **Optional micro-moment only**             |

## Closest production-ready technical references

### 1. Atmospheric Depth Gallery

- [Tutorial](https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/)
- [MIT-licensed source](https://github.com/houmahani/codrops-depth-gallery)

Why it matters: it uses Vite, vanilla JavaScript, Three.js, and GLSL—the closest
match to this repository. Its core architecture separates engine, gallery,
scroll, and background, positions image planes on Z, uses scroll velocity as a
small motion signal, and lets each image influence atmosphere. This is the best
starting reference for P1, with two major changes:

1. Keep the portfolio's one warm base instead of replacing it with separate
   project backgrounds.
2. Add crisp semantic DOM metadata and stable focal holds.

### 2. Horizontal Parallax Gallery

- [Tutorial](https://tympanus.net/codrops/2026/02/19/creating-a-smooth-horizontal-parallax-gallery-from-dom-to-webgl/)
- [MIT-licensed source](https://github.com/davidfaure/horizontal-parallax-gallery-codrops)

Why it matters: it demonstrates DOM-to-WebGL measurement synchronization and a
Three.js-only GPU gallery. It is a good basis for P3 or a mobile/desktop project
media system. Do not copy its clipped section wrapper into the portfolio's
top-level world; clipping is acceptable only inside an individual media frame
where the parallax image specifically requires it.

### 3. Scroll-revealed WebGL gallery and shared media transition

- [Tutorial](https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/)
- [MIT-licensed source](https://github.com/J0SUKE/gsap-threejs-codrops)

Why it matters: the selected image visually travels from gallery to detail
without a jump. The source stack is heavier than this portfolio and includes
Astro, Barba, and GSAP, so the architecture should not be copied wholesale. The
shared-element idea can be recreated with the existing renderer plus the native
View Transition API for DOM elements.

### 4. Cinematic restraint case study

- [Podium: Building a Website Where Running Becomes Storytelling](https://tympanus.net/codrops/2026/06/23/podium-building-a-website-where-running-becomes-storytelling/)

Why it matters: this is a design/process reference rather than source to copy.
Its most useful lesson is that the selected project media itself can carry a
page transition, and that pacing, typography, and restraint can be stronger than
an extra transition effect. That principle directly informed P1 and C1.

## Core technical primitives

| Primitive                                                                                                                     | Why it is useful                                                                 | License/support                                      | Recommendation                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Three.js EffectComposer](https://threejs.org/docs/pages/EffectComposer.html)                                                 | Chains post-processing passes in the renderer already used by the site           | Part of Three.js                                     | Only create it if the visual return justifies the extra render targets           |
| [Three.js BokehPass](https://threejs.org/docs/pages/BokehPass.html)                                                           | True depth-of-field with runtime focus/aperture/max-blur controls                | Part of Three.js                                     | Desktop quality tier; benchmark at reduced resolution                            |
| [Motion](https://github.com/motiondivision/motion)                                                                            | MIT JS/Vue animation library with springs, timelines, gestures, and scroll tools | MIT                                                  | Optional for DOM; native WAAPI may already be enough                             |
| [Lenis](https://github.com/darkroomengineering/lenis)                                                                         | Smooth-scroll signal designed to synchronize with WebGL                          | MIT                                                  | Optional only after native scroll feels insufficient; never required for content |
| [gl-transitions](https://github.com/gl-transitions/gl-transitions)                                                            | Collection/spec for shader transitions between two textures                      | MIT collection; individual shader headers may differ | Pick one restrained shader and verify its header before use                      |
| [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)                                   | Same- and cross-document shared-element style transitions with fallbacks         | Native web API; support varies by feature/version    | Progressive enhancement for project details                                      |
| [CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)              | Ties CSS animation progress to scroll/view progress without a JS scroll listener | Native CSS with feature detection needed             | Good for lightweight DOM layers and fallback states                              |
| [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion) | Detects the user's request to reduce/replace non-essential motion                | Widely available                                     | Mandatory branch in every scene                                                  |

## Source-by-scene adoption plan

### About → Skills

- Existing black-hole object and current scene state remain the visual owner.
- Orbit math inspired by Inspira Orbit.
- Optional Three.js Bokeh/EffectComposer only after the core transition is
  smooth without post-processing.
- CSS progressive blur for DOM/fallback depth.
- No new background component.

### Skills

- One central Three.js/SVG orbit system.
- Live DOM labels and evidence.
- Animated Beam only for the selected dependency.
- A single scroll-controlled Morphing Text or Scroll Swap moment.
- No Icon Cloud; no automatically rotating logo sphere.

### Skills → Projects

- Custom geometry/state morph in the existing renderer.
- Particle Image may inspire the timing, but a new particle canvas should not be
  mounted.
- Crossfade can hide the exact geometry swap while the shared edge remains
  visible.

### Projects

- Atmospheric Depth Gallery is the main technical reference.
- Progressive Blur is the fallback and DOM-layer focus aid.
- View Transition API or a render-target plane handles project detail.
- Floating Card behavior applies only to the focal plane and at reduced angles.
- Lenis is evaluated, not assumed.

### Projects → Contact

- Custom project-plane alignment in Three.js.
- Plain SVG/CSS path and ripple for the contact signal.
- Motion or WAAPI for the magnetic action.
- No shader-heavy contact background.

## Effects worth studying but not adding directly

### Inspira Infinite Grid

[Infinite Grid](https://inspira-ui.com/docs/en/components/visualization/infinite-grid)
is visually polished, but it is OGL-based and naturally wants to become its own
world/background. A full infinite grid would weaken the current warm canvas and
compete with the persistent Three.js renderer. Borrow only subtle grid
perspective or velocity ideas if S2 is selected.

### Inspira Icon Cloud

[Icon Cloud](https://inspira-ui.com/docs/en/components/visualization/icon-cloud)
is ready-made but too generic for the main Skills scene. If used at all, it
could appear as a tiny no-motion fallback illustration; the real direction
should communicate relationships and proof.

### Inspira Black Hole Background / Cosmic Portal / Particle Whirlpool

These duplicate an object and visual language the portfolio already owns. The
current transparent black hole is more brand-specific. Adding a ready-made
cosmic background would create a second black hole system, a separate section
background, extra GPU cost, and a visible stylistic seam.

### Liquid glass, glare, glow borders, neon borders

These can make a demo card look expensive but would conflict with the existing
warm paper/graphite/window-light material language when used globally. A faint
surface reflection on one focal card is enough.

### Fluid and image-trail cursors

The repository already has a fluid-cursor implementation. Running it together
with an image trail or WebGL ribbon would create competing pointer feedback and
multiple continuously updating buffers. Choose one scene-local behavior and
turn it off everywhere else.

## License checklist before implementation

1. Record the exact source file/repository used, not just the documentation
   page.
2. Preserve the MIT copyright/license notice where required.
3. Check media licenses separately; source-code licenses do not grant rights to
   demo photographs, videos, models, fonts, or generated assets.
4. For `gl-transitions`, inspect the header of the chosen individual transition
   because the collection explicitly allows per-transition licenses.
5. Do not copy a visual identity, branded asset, or site-specific project cover
   from an inspiration example.
6. Replace all demo media with Malik's real work or newly approved original
   assets.

## Performance review before accepting any effect

An effect is accepted only if all are true:

- It advances the identity/capability/evidence/invitation story.
- It can share the existing renderer or is cheaper as DOM/SVG.
- It has a readable static and reduced-motion state.
- It does not require hover to expose content.
- It can reverse or resolve safely after fast scroll and resize.
- It stops rendering when settled or hidden.
- It preserves a normal keyboard focus order.
- Its code and all media have known licenses.
- It survives portrait mobile and short landscape without clipping world
  objects at semantic boundaries.

If an effect fails any of these, it remains a reference—not a dependency.
