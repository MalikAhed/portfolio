# Awwwards-level cinematic directions

## Executive decision

The strongest direction is not “more effects.” It is one readable story with a
controlled intensity curve:

> **Identity → Gravity → Capability → Evidence → Invitation**

- Hero establishes Malik as the subject.
- About explains the force that drives him and ends by absorbing the world.
- Skills reveal the system inside that compressed identity.
- Projects prove what the system can produce.
- Contact becomes a calm, confident invitation rather than another spectacle.

This protects usability while still being distinctive. Awwwards' published
scorecards place more weight on design and usability than creativity alone, and
their developer reviews separately inspect animation, accessibility,
performance, responsive behavior, semantics, and metadata. See the example
[Awwwards scorecard](https://www.awwwards.com/sites/proof-1). That is why this
document treats restraint, content, mobile, and reduced motion as part of the
creative idea—not cleanup work for later.

## What already exists and must carry forward

The current build already supplies the most important narrative handoff:

- Hero identity and portrait occupy the first camera-space focal layer.
- The title and role compress into moving dots.
- Those dots collide and form the black hole.
- About becomes readable around that object.
- The About statement, biography, oversized word, and window-shadow world are
  finally pulled into it.

The next scene should therefore begin with the result of that absorption. A
normal fade into a skills layout would throw away the strongest part of the
existing site.

The warm canvas stays fixed throughout. Temporary occlusion by a near object is
allowed, but Skills, Projects, and Contact must not introduce their own visible
section backgrounds.

---

# The recommended master cut

## World title: “Ideas with gravity”

This is not literal outer space. It is Malik's warm editorial world behaving
according to gravity. Paper, graphite, glass, ink, screens, type, and light can
orbit, focus, compress, and pass the camera without turning the site into a
generic galaxy template.

### Scene 1 — Hero: the person

Keep the current portrait, identity, shadow, reflection, and subtle pointer
response. The hero should remain the cleanest scene. Its purpose is recognition,
not feature demonstration.

### Scene 2 — About: the force

Keep the current black-hole formation and absorption concept. The readable hold
before absorption is important; it gives the visitor content before spectacle.

### Transition A — About to Skills: cross the event horizon

After About is completely absorbed, the black hole remains the owner of the
frame. Its dark center grows just beyond the screen diagonal. This is a
temporary foreground occluder, not a new black background. The camera crosses
it, and the far side is still the same warm canvas. The orbit lines lag behind,
stretch into fine graphite curves, and settle as the architecture of Skills.

The visitor should feel that Skills were inside the identity, not placed below
About.

### Scene 3 — Skills: Capability Orbits

Four useful capability systems—rather than a cloud of logos—occupy four depth
rings. Each ring combines tools that actually work together. A focal ring is
sharp; near/far rings soften and lose contrast. The camera makes short,
weighted focus moves rather than continuously floating.

Suggested capability groups, to replace with Malik's real stack:

- **Shape** — product thinking, UI, accessibility, interaction.
- **Build** — HTML/CSS/JavaScript, Vue, component systems.
- **Connect** — APIs, server logic, databases, authentication.
- **Ship** — Git, testing, performance, deployment.

No percentages and no unsupported “expert” claims. Each group should link to a
real project where the capability is visible.

### Transition B — Skills to Projects: capability becomes evidence

At the last Skills focal state, the active orbital ellipse slowly tilts from a
face-on ring to an edge-on line. Its labels slide into alignment along the line.
The line thickens, its corners resolve, and it becomes the edge of the first
project plane. The remaining rings flatten behind it as future project planes.
The camera then changes from rotating focus to forward dolly.

The message is immediate: these tools became this work.

### Scene 4 — Projects: Proof in Depth

Project covers are large physical planes placed at deliberate Z positions, not
a section-local grid. Scroll advances the camera toward one project at a time.
Only the focal project is sharp and high contrast. Its semantic DOM title,
role, year, short result, and “Open case study” action stay crisp above the
world.

Each project gets a different X/Y composition and a subtle palette influence,
but all keep the same warm environmental light and material response. Scroll
velocity may add a tiny trailing skew or depth lag, then settle completely at
each focal stop.

Opening a project uses the selected plane itself as the transition object. It
expands into the case-study hero while the route or dialog changes underneath.
There should be no unrelated wipe, loader, or new card flying in.

### Transition C — Projects to Contact: motion earns silence

After the final project has had a readable hold, its plane drifts to the center
and turns edge-on. The other project planes align behind it until the entire
gallery becomes a single thin horizon. Scroll velocity drops to zero, depth of
field clears, and the horizon emits one small moving signal.

The signal draws the underline of the contact sentence. Everything else becomes
still. The sudden calm is the final effect.

### Scene 5 — Contact: The Quiet Horizon

One large invitation, one email action, a short availability/status line, and
social links. The contact action has a magnetic influence of only a few pixels;
the horizon bends toward it and releases a single ripple when focused or
hovered. No constant glow, no fake terminal, and no giant form unless there is a
real submission endpoint.

A small version of the black hole can rest in the far distance. Choosing “Back
to top” lets it contract into Malik's monogram before returning to the hero,
closing the loop without pretending the whole page is an infinite scroll.

---

# Full transition choreography

These are normalized beats, not implementation values. They should become
central scene configuration rather than scattered constants.

## About → Skills

| Progress  | Composition                                           | Focus and motion                            | Content state                                                        |
| --------- | ----------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| 0.00–0.14 | Completed About absorption holds                      | Camera fully settled                        | About is gone; no Skills copy yet                                    |
| 0.14–0.42 | Black-hole center grows toward the camera             | Orbit lines trail 8–14 px behind the scale  | Skills heading exists semantically but is visually withheld          |
| 0.42–0.58 | Dark center covers the screen                         | Brief near-field blur; never a flash        | Interface remains usable above the transition                        |
| 0.58–0.78 | Camera exits through the far side                     | Warm canvas returns from the center outward | “Capabilities” or “How I build” appears as the first crisp DOM label |
| 0.78–1.00 | Stretched orbit lines settle into four authored rings | One weighted overshoot, then absolute rest  | First capability group becomes readable                              |

Reverse scroll must reverse the ownership exactly: Skills rings stretch back
into orbit lines, the black occluder covers the frame, and the completed About
black hole returns. Do not restart a time-based intro while reversing.

### Reduced-motion version

The black hole scales only slightly, then cross-dissolves into a static orbital
diagram on the same warm canvas. All Skills content is present in its final
readable arrangement; no simulated camera crossing occurs.

## Skills → Projects

| Progress  | Composition                                    | Focus and motion                                | Content state                                             |
| --------- | ---------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| 0.00–0.24 | Final skill ring remains active                | All ambient rotation stops                      | Evidence line names the projects using this capability    |
| 0.24–0.52 | Ring tilts toward 90°                          | Focus follows the near edge                     | Non-active rings soften and move deeper                   |
| 0.52–0.76 | Ellipse resolves into a rectangular plane edge | Camera shifts from orbit focus to forward dolly | Skills heading moves out on the same perspective vector   |
| 0.76–1.00 | First project cover rotates 6–10° into view    | Focal distance lands on its surface             | Project 01 metadata enters only after the plane is stable |

The transform should preserve a recognizable edge from beginning to end. A
crossfade can hide technical swaps, but it must not be the visible idea.

### Reduced-motion version

The final static skill diagram fades to low contrast while the first project
cover appears in front of it. No large rotation or forward travel.

## Projects → Contact

| Progress  | Composition                               | Focus and motion                                | Content state                                                  |
| --------- | ----------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| 0.00–0.26 | Last project rests at its focus point     | No motion for a readable pause                  | Last case-study action remains usable                          |
| 0.26–0.56 | All project planes align in depth         | Small, damped movement; no acceleration gimmick | Project metadata leaves line by line                           |
| 0.56–0.76 | Planes turn edge-on into one horizon      | Depth blur reduces to zero                      | Contact eyebrow appears above the line                         |
| 0.76–0.90 | A single signal travels along the horizon | Signal uses one authored ease                   | Main invitation resolves word by word                          |
| 0.90–1.00 | Signal becomes the email underline/dot    | Complete stillness                              | Email, availability, socials, and back-to-top are fully usable |

### Reduced-motion version

The final project settles, then the contact content appears below it with a
simple opacity/contrast change. The horizon is static.

## Project list → project detail

1. Freeze the world at the selected focal state.
2. Duplicate or snapshot only the selected project media.
3. Move that exact media from its world-space bounds to the detail hero bounds.
4. Fade/blur the other planes by depth; do not throw them off screen.
5. Change route or reveal semantic detail content underneath the traveling
   media.
6. Land the media, restore focus to the project heading, and update history.
7. On close/back, run the exact inverse and return to the same camera and scroll
   state.

The [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
can provide a progressive enhancement for DOM snapshots. If the media remains
inside Three.js, a render-target plane can perform the same shared-element idea.
Unsupported browsers should switch immediately with no broken halfway state.

---

# Skills — four creative directions

## S1. Capability Orbits — recommended

### Core idea

The black hole's orbit system becomes a legible map of how Malik builds. Skills
are relationships, not isolated badges.

### Visual composition

- Four elliptical rings occupy distinct Z bands: far, world, subject, near.
- Each ring has one category title and 3–5 real tools or practices.
- Typography is monochrome graphite/ink, not colorful vendor logos.
- Thin lines can feel drawn with technical pencil on the warm canvas.
- The large ghosted word **SKILLS** may exist far behind the rings, but it must
  be partially occluded and participate in depth rather than sit like a section
  heading.
- A crisp DOM evidence card near the active ring says what Malik uses that
  capability for and points to a project.

### Entrance

The existing black-hole orbit lines stretch through the event horizon and
reconfigure into the four rings. A few particles resolve into punctuation dots
and category labels. Nothing materializes from nowhere.

### Resting motion

Only the far rings drift, at an almost imperceptible rate. The active ring is
still. Pointer movement offsets depth by a maximum of roughly 4–8 CSS pixels
and eases back to zero. Keyboard focus produces the same state without pointer
motion.

### Interaction

- Scroll changes the active capability group and focal distance.
- Hover/focus on a skill brightens only its connecting path and evidence link.
- Selecting a tool reveals one sentence such as “Used to build the real-time
  editor in Project 02,” not a tooltip that merely repeats its name.
- Arrow keys may move between items when the ring behaves as a composite
  widget; normal Tab order must still reach every link.
- Touch users swipe only as an optional shortcut. Vertical page scroll remains
  sufficient.

### Exit

The final ring tilts edge-on and becomes the first project plane. Its active
evidence link becomes Project 01's metadata, preserving content as well as
shape.

### Useful source effects

- [Inspira UI Orbit](https://inspira-ui.com/docs/en/components/visualization/orbit)
  for orbit timing and layout logic.
- [Inspira UI Progressive Blur](https://inspira-ui.com/docs/en/components/special-effects/progressive-blur)
  for the CSS fallback depth bands.
- [Three.js BokehPass](https://threejs.org/docs/pages/BokehPass.html) for a
  carefully budgeted desktop depth-of-field option.
- [Inspira UI Animated Beam](https://inspira-ui.com/docs/en/components/special-effects/animated-beam)
  for the concept of selective connections, not dozens of permanent lasers.

### Needed assets

- A consistent monochrome SVG mark for each skill, or simply well-set live
  text. Do not mix unrelated official logo colors.
- Optional: **an image of a warm off-white technical drawing sheet with faint
  graphite orbital construction lines, photographed under the same window-light
  direction as the Hero**.
- Optional: **a transparent image of one thin etched graphite/metal ring with
  imperfect handmade edges**. Procedural SVG/Three.js curves are preferable if
  they look as good.

### Main risk

A generic icon cloud would cheapen this. The originality comes from showing an
actual build pipeline and evidence, not from placing framework logos on a
sphere.

## S2. The Focus Stack / X-ray workbench

### Core idea

Skills are transparent layers of one complete product. The camera behaves like
a focus microscope moving through the stack.

### Visual composition

- Four large translucent planes float at different Z positions.
- Plane 1: product sketch and accessibility notes.
- Plane 2: interface/component wireframe.
- Plane 3: API/data-flow diagram.
- Plane 4: deployment/testing map.
- When visually aligned, all four layers form one complete system drawing.
- The active plane sharpens while the others blur progressively.

This fits the existing analog-code-workbench language: paper, ruler markings,
etched lines, black tape, and screen fragments can occupy real depth without
turning each semantic section into a separate collage.

### Entrance

The black-hole center flattens into a circular lens. Looking through it reveals
the first layer. The lens expands beyond the viewport and disappears behind the
camera, leaving the layer in place.

### Interaction

- Scroll pulls focus through the layers while moving the camera only a short
  distance.
- Hover/focus isolates a subsystem and draws its dependencies.
- A compact, live-text rail names the active category and lists the real tools.
- The full stack can be toggled into an “assembled” view, but that state is not
  required to continue scrolling.

### Exit

All layers converge into the assembled system. The outer browser/screen frame
of that system becomes the first project cover.

### Useful source effects

- [Atmospheric Depth Gallery](https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/)
  for Z-stacked planes and focus/mood architecture.
- [Inspira UI Progressive Blur](https://inspira-ui.com/docs/en/components/special-effects/progressive-blur)
  for non-WebGL planes.
- [Inspira UI Focus text](https://inspira-ui.com/docs/en/components/text-animations/focus)
  for the active-copy idea, used once rather than on every sentence.

### Needed assets

- **An image of a hand-drawn product brief on warm paper with restrained notes
  and arrows**.
- **A transparent image of an interface wireframe layer**.
- **A transparent image of an API and database flow layer**.
- **A transparent image of a deployment/testing topology layer**.

All four must align when overlaid and share one line weight and perspective.

### Main risk

If the layer art is generic, the scene becomes decoration. Each layer must be
derived from Malik's real workflow or a real project.

## S3. The Build Constellation

### Core idea

A dependency graph answers a practical question: how does an idea travel from
concept to shipped product?

### Visual composition

- Nodes are meaningful stages—idea, interface, state, API, data, test, ship.
- Tools sit beside the stage they enable rather than floating independently.
- Connections curve around the remaining black-hole gravity field.
- The active path is dark and sharp; unused paths become faint construction
  lines.
- Tiny project stills can appear at outcome nodes, foreshadowing Projects.

### Entrance

As the About world is absorbed, a handful of retained points fail to disappear.
They pull back out as the graph's major nodes. Lines grow between them like ink
following gravitational paths.

### Interaction

- Scrolling plays four real build paths, each ending at one project.
- Hover/focus on a node reveals its responsibility and an honest skill list.
- Selecting a project outcome highlights the exact chain that produced it.
- Pointer influence bends a connection very slightly, then returns to rest.

### Exit

The active paths straighten and become the top/bottom edges of project frames;
the outcome thumbnails expand into the real project planes.

### Useful source effects

- [Inspira UI Animated Beam](https://inspira-ui.com/docs/en/components/special-effects/animated-beam)
  for path timing.
- [Inspira UI Orbit](https://inspira-ui.com/docs/en/components/visualization/orbit)
  for curved placement.
- [Inspira UI Particle Image](https://inspira-ui.com/docs/en/components/special-effects/particle-image)
  only for the brief node-to-thumbnail assembly moment.

### Needed assets

- Small, optimized crops of real project screens for outcome nodes.
- A single authored SVG path map for each responsive preset.

### Main risk

An always-moving network is noisy and expensive. Only the current path should
animate; completed and future paths should be still.

## S4. The Verb Engine / kinetic manifesto

### Core idea

Skills are introduced through four verbs—**shape, build, connect, ship**—that
morph into one another and leave physical typographic slabs behind in depth.

### Visual composition

- One huge live-text verb owns the focal plane.
- Supporting skills appear as small technical annotations around it.
- As the visitor advances, the current word changes and the previous word moves
  backward as a pale, dimensional slab.
- At the end, all slabs are visible at different depths like a typographic
  tunnel.

### Entrance

The black-hole silhouette contracts into the counter of a giant letter. The
rest of the first word draws outward from that counter.

### Interaction

- The morph is scroll-controlled and reversible. It never auto-cycles while
  the visitor tries to read.
- Hover/focus on a supporting skill gives the relevant letters a tiny variable
  weight response; no glitch effect.
- A persistent DOM list makes every skill readable without relying on the
  morph.

### Exit

The final verb, **ship**, grows until its letter shapes become a mask revealing
the first project. The word then moves behind that project as far-depth type.

### Useful source effects

- [Inspira UI Morphing Text](https://inspira-ui.com/docs/en/components/text-animations/morphing-text)
  for the threshold-blur technique.
- [Inspira UI Scroll Swap Text](https://inspira-ui.com/docs/en/components/text-animations/scroll-swap-text)
  for reversible scroll ownership.
- [Inspira UI Variable Text](https://inspira-ui.com/docs/en/components/text-animations/variable-text)
  for a restrained local response.

### Needed assets

No raster asset is required. This direction depends on excellent type sizing,
responsive line breaks, and accessible live DOM.

### Main risk

The threshold blur used by morphing-text demos can look muddy on long words and
lower-end mobile devices. Use it for one focal word at a time, cap blur, and
provide a simple swap fallback.

## Skills choice matrix

| Direction              | Narrative fit | Originality               | Mobile resilience           | Build risk  | Verdict                                         |
| ---------------------- | ------------- | ------------------------- | --------------------------- | ----------- | ----------------------------------------------- |
| S1 Capability Orbits   | Excellent     | High when evidence-driven | Good with a vertical preset | Medium      | **Choose**                                      |
| S2 Focus Stack         | Excellent     | High                      | Good if planes simplify     | Medium-high | Strong alternative                              |
| S3 Build Constellation | Very good     | High                      | Medium                      | Medium-high | Use if workflow content is strong               |
| S4 Verb Engine         | Good          | Medium-high               | Excellent                   | Medium      | Use as an S1 text moment, not the whole section |

---

# Projects — four creative directions

## P1. Proof in Depth / project corridor — recommended

### Core idea

Projects are fixed objects in world space; the camera approaches their focus
zones. This directly realizes the repository's continuous-world direction.

### Visual composition

- 3–6 project planes are spaced along Z with authored X/Y offsets.
- The previous project remains as a near, blurred edge; the next appears far
  away, creating anticipation.
- Each cover may have 2–3 depth layers for subtle parallax: environment,
  interface/product, and foreground accent.
- The active project owns the strongest contrast. All other projects lose
  contrast as well as sharpness.
- A crisp DOM metadata block contains project number, title, role, problem,
  result, technologies, and a real case-study link.
- A small progress rail describes position as `01 / 04` and is clickable and
  keyboard accessible.

### Entrance

The final skill orbit turns edge-on and resolves into the first plane. Its
evidence copy becomes the project metadata, so the transition carries meaning
and not just geometry.

### Scroll behavior

- Each project has approach, focus, readable hold, and departure states.
- Scroll is an input to target camera progress; a damped system catches up and
  settles. Do not force-snap the page or trap the wheel.
- Velocity may create a maximum 1–2° plane lean and a small shader displacement.
  It returns to exactly zero at rest.
- The camera never stops between projects after resize, anchor navigation, or a
  fast scroll jump.

### Pointer and keyboard behavior

- Pointer movement creates only local surface parallax on the focal project.
- Hover/focus reveals “View case study” by moving existing type, not adding a
  glowing pill over the image.
- Enter opens the case study; Escape or Back returns to the exact focal state.
- Arrow shortcuts are optional and advertised. Tab order remains conventional.

### Project-detail transition

The chosen plane is the shared element. It grows to the case-study hero while
the remaining corridor falls out of focus. The detail content scrolls normally,
and the world renderer can remain mounted behind it at rest. Returning reverses
the plane to its saved world transform.

### Exit to Contact

After the last project's hold, all planes align, turn edge-on, and form the
quiet contact horizon.

### Useful source effects

- [Atmospheric Depth Gallery article](https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/)
  and its [MIT-licensed source](https://github.com/houmahani/codrops-depth-gallery)
  are unusually close to this repository's Vite + vanilla JS + Three.js stack.
- [Three.js BokehPass](https://threejs.org/docs/pages/BokehPass.html) for
  desktop focus pulls.
- [Inspira UI Progressive Blur](https://inspira-ui.com/docs/en/components/special-effects/progressive-blur)
  for DOM/mobile depth bands.
- [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
  for progressively enhanced detail transitions.

### Needed assets

For every project:

- **An image of the project's strongest final interface or product moment,
  composed as a clean editorial cover without a generic laptop/phone mockup**.
- Optional transparent depth layers: **the real UI/product subject cut out from
  its background**, **a restrained foreground texture/object**, and **a soft
  contact shadow matching the Hero light direction**.
- A short 1–2 second optimized loop only when motion is essential to understand
  the project. Never turn every card into an autoplay video wall.
- Real case-study content: challenge, Malik's role, decisions, engineering
  detail, result, and live/source links where available.

### Main risk

Without strong project covers and content, even perfect WebGL will feel like a
template. Project art direction is the highest-priority asset task in the site.

## P2. The Gravitational Carousel

### Core idea

A refined version of the linked 3D carousel: project planes orbit the remaining
gravity center on a wide horizontal ellipse. It should feel like a physical
archive, not an autoplay slider.

### Visual composition

- One large active project crosses the subject focal plane.
- Neighboring projects wrap into the distance on both sides.
- The black hole is faint and far behind, explaining the curved path.
- Cards use warm reflections, consistent shadows, and slight perspective—not
  neon glass.
- Active project copy sits in live DOM and does not rotate with the card.

### Interaction

- Vertical scroll advances one authored segment of the orbit.
- Pointer/touch drag can preview rotation, then settles at the nearest project.
- No infinite automatic rotation. The visitor always knows which project is
  active and how many remain.
- A selected card can tilt locally by a few degrees, borrowing the physical
  response of a floating card.

### Entrance and exit

Skills orbit rings widen and gain surfaces to become the carousel. At the end,
the carousel slows, cards stack in depth, and the stack turns edge-on into the
contact horizon.

### Useful source effects

- [Inspira UI 3D Carousel](https://inspira-ui.com/docs/en/components/visualization/carousal-3d)
  for layout and drag behavior.
- [Inspira UI Floating Card](https://inspira-ui.com/docs/en/components/cards/floating-card)
  for a restrained focal-card response.
- [Inspira UI Progressive Blur](https://inspira-ui.com/docs/en/components/special-effects/progressive-blur)
  for non-WebGL fallbacks.

### Needed assets

The same real project covers and case-study content required by P1.

### Main risk

The carousel is visually familiar. It becomes portfolio-specific only if the
Skills orbit literally transforms into it and the project content is excellent.
Copying the component unchanged would not be award-level.

## P3. Contact-sheet time machine

### Core idea

The portfolio's photographic qualities become a moving contact sheet. Project
media behaves like frames held in one continuous beam of warm light.

### Visual composition

- Oversized project frames travel horizontally while the page still scrolls
  vertically.
- Frames sit at staggered depths and bend slightly around a broad curve.
- Each active frame can scrub a very short project loop based on pointer X or
  scroll position.
- Frame numbers, dates, and roles look like restrained contact-sheet markings.
- The existing window shadow crosses multiple frames, reinforcing that this is
  one world.

### Entrance

Skill labels gather into tiny contact-sheet annotations; the final orbit opens
into a strip of project frames.

### Interaction

- Scroll drives the strip; pointer movement provides small local parallax.
- Hovering a project title may emit a short trail of that project's actual
  frames, but only inside the Projects scene.
- Clicking a frame uses a subtle displacement/exposure change as it expands
  into the case study.

### Exit

The final frame overexposes to the warm canvas. Its lower edge remains as the
contact horizon; the contact invitation appears as if typed beneath the last
frame.

### Useful source effects

- [Horizontal Parallax Gallery article](https://tympanus.net/codrops/2026/02/19/creating-a-smooth-horizontal-parallax-gallery-from-dom-to-webgl/)
  and [MIT source](https://github.com/davidfaure/horizontal-parallax-gallery-codrops).
- [Inspira UI Bending Gallery](https://inspira-ui.com/docs/en/components/visualization/bending-gallery)
  for curved gallery behavior; port the idea to the existing Three.js renderer
  rather than mounting a second OGL renderer.
- [Inspira UI Image Trail Cursor](https://inspira-ui.com/docs/en/components/cursors/image-trail-cursor)
  for a scene-local title preview.
- [gl-transitions](https://github.com/gl-transitions/gl-transitions) for a
  carefully selected image transition, after checking the header license of the
  individual shader.

### Needed assets

- 4–8 stills per project if the image-trail preview is used.
- One extremely short, compressed interaction loop per project at most.
- A consistent contact-sheet numbering/annotation system.

### Main risk

Horizontal galleries are common and can be awkward on mobile. The portrait
mobile preset should become a vertical depth strip rather than simulate a tiny
desktop film reel.

## P4. Evidence Stack / passing through cases

### Core idea

Project covers assemble as a physical stack. Each scroll beat lifts the top
case, gives it a readable focal hold, then lets it pass the camera to reveal the
next.

### Visual composition

- The stack rests off-center so the next 2–3 projects are always visible.
- Different paper/screen thicknesses can indicate project type without changing
  the global material language.
- Each top card reveals a short evidence strip: problem, responsibility,
  outcome.
- A large far-depth **PROJECTS** word is progressively occluded by the stack.

### Entrance

The Skills focus plates compress into the project stack. The top plate flips
from “capability” to Project 01's cover.

### Interaction

- Scroll lifts and scales one card through the camera.
- Hover/focus separates its depth layers by only a few pixels.
- Clicking opens the shared-element detail transition.
- The animation is finite; the stack never loops and never hides the visitor's
  position.

### Exit

The empty final backing card rotates and becomes the Contact business card or
flattens into the quiet horizon.

### Useful source effects

- [Inspira UI Card Stack](https://inspira-ui.com/docs/en/components/cards/card-stack)
  for scroll-driven stacking.
- [Inspira UI Fey Cards](https://inspira-ui.com/docs/en/components/cards/fey-cards)
  for layered image swapping and heading behavior.
- [Inspira UI Floating Card](https://inspira-ui.com/docs/en/components/cards/floating-card)
  for limited depth response.

### Needed assets

Project covers plus, optionally, **an image of a warm, thick-edged archival card
with subtle paper fibers and a realistic contact shadow**.

### Main risk

If cards fly past too quickly, the work becomes unreadable. Each focal hold must
be longer than the transition, and the DOM content must never be attached to a
distorted texture.

## Projects choice matrix

| Direction                     | Narrative fit | Shows work clearly          | Mobile resilience       | Build risk  | Verdict                                           |
| ----------------------------- | ------------- | --------------------------- | ----------------------- | ----------- | ------------------------------------------------- |
| P1 Proof in Depth             | Excellent     | Excellent                   | Good with simpler depth | Medium-high | **Choose**                                        |
| P2 Gravitational Carousel     | Excellent     | Good                        | Medium-good             | Medium      | Best direct use of linked 3D carousel             |
| P3 Contact-sheet Time Machine | Good          | Excellent with strong media | Medium                  | High        | Strong if photography becomes core brand language |
| P4 Evidence Stack             | Very good     | Very good                   | Excellent               | Medium      | Safest premium alternative                        |

---

# Contact — four creative directions

## C1. The Quiet Horizon — recommended

### Core idea

The most impressive final move is to stop moving. After a depth-heavy project
journey, Contact becomes a precise field of warm negative space and one living
line.

### Visual composition

- The aligned project edges form a horizon across part of the viewport.
- A large invitation sits above or intersects that horizon.
- Email is the dominant action; availability and social links are secondary.
- The black hole is now a tiny, distant dot or eclipse—gravity controlled rather
  than overwhelming.
- The oversized far-depth word **CONTACT** can appear at 3–5% contrast, but only
  if it helps framing.

### Entrance

A signal travels along the project horizon and draws the email underline. The
main sentence resolves in two deliberate lines. No other object enters.

### Interaction

- Hover/focus bends the horizon toward the email by a few pixels.
- A single ripple travels outward on focus/hover and then stops.
- Copy-email can confirm with a quiet label change such as “Copied,” exposed to
  assistive technology with an appropriate live region.
- `mailto:` remains a normal link. Do not delay navigation for a long send
  animation.
- “Back to top” contracts the distant dot into the monogram and then performs a
  normal anchor move to the Hero's stable state.

### Copy directions

Pick one voice and refine it; these are starting points only:

- “Have an idea with gravity?” / “Let’s build it.”
- “Bring the difficult idea.” / “I’ll help make it real.”
- “The next world starts with a message.”
- Calm alternative: “Available for thoughtful digital work.”

### Useful source effects

- [Inspira UI Ripple](https://inspira-ui.com/docs/en/components/backgrounds/ripple)
  for the one-shot focus echo—not a permanent background.
- [Inspira UI Underline Text](https://inspira-ui.com/docs/en/components/text-animations/underline-text)
  for the signal-to-underline handoff.
- [Motion](https://github.com/motiondivision/motion) or native Web Animations
  for the magnetic CTA and copy confirmation.

### Needed assets

No raster asset is necessary. The horizon, signal, typography, and tiny eclipse
can all be procedural.

### Main risk

The section will fail if it is treated as “empty.” Spacing, typography, copy,
focus states, and the exact pause after Projects must be immaculate.

## C2. The Signal / paper-plane closure

### Core idea

The tiny plane already present in the Hero contact action becomes a recurring
world object and finally delivers the invitation.

### Visual composition

- A thin flight path crosses behind the Contact headline.
- The plane is a small black-paper or line-art object, never a cartoon.
- Its trail briefly reveals fragments of contact copy, then disappears.
- The final resting point is the email arrow/submit icon.

### Entrance

The last project plane folds along two lines and reduces into the paper plane,
or a small fragment detaches from it. The plane follows a weighted Bézier arc
and lands beside the email.

### Interaction

- Hover/focus lets the plane lean toward the pointer by a few degrees.
- Activating copy-email sends one short echo down the path.
- If there is a real contact form, successful submission—not button press—may
  release the plane. Failure must keep the message and inputs intact.

### Useful source effects

- The existing site's identity-flight curve logic can inspire the path without
  adding a new dependency.
- [Inspira UI Path Marquee](https://inspira-ui.com/docs/en/components/miscellaneous/path-marquee)
  for motion along an SVG path; use a single object, not repeated marquee text.
- [Inspira UI Sleek Line Cursor](https://inspira-ui.com/docs/en/components/cursors/sleek-line-cursor)
  only as a reference for springy line settling.

### Needed assets

- Optional: **a transparent image of a tiny folded black-paper plane with
  realistic paper fibers and the site's top-right light direction**.
- SVG is preferable if it preserves the desired silhouette.

### Main risk

Folding a full project card into a plane can look gimmicky or technically fake.
The safer version detaches a small corner/fragment and keeps the project plane's
exit simple.

## C3. Living business card

### Core idea

The empty backing card from Projects becomes a physical contact card floating
in the world.

### Visual composition

- Front: Malik's monogram and one-line positioning.
- Back: email, availability, location/time-zone if Malik wants it, and socials.
- Card material is warm stock with ink/letterpress detail, not generic glass.
- A very soft reflection ties it to the Hero portrait's material language.

### Entrance

The final project cover passes the camera and reveals the blank card behind it.
The card rotates once to show contact details and then settles.

### Interaction

- Pointer tilt is limited and uses a damped return.
- Keyboard focus triggers a fixed accessible state, not a 3D flip that hides
  focused links.
- Copying the email creates one blind-embossed ripple in the card surface.
- “Back to top” rotates the card front-on; the monogram expands into the splash
  mark before the normal return.

### Useful source effects

- [Inspira UI Floating Card](https://inspira-ui.com/docs/en/components/cards/floating-card).
- [Inspira UI Flip Card](https://inspira-ui.com/docs/en/components/cards/flip-card),
  with semantic content kept available regardless of face.
- [Inspira UI Liquid Logo](https://inspira-ui.com/docs/en/components/visualization/liquid-logo)
  only for a 300–500 ms monogram response, not permanent liquid motion.

### Needed assets

- **An image of a premium warm letterpress business card with Malik's monogram,
  subtle blind embossing, and realistic contact shadow**.
- Prefer layered/transparent versions if the card needs real surface depth.

### Main risk

The card can feel like a Dribbble mockup unless the contact information remains
immediately usable and the material clearly belongs to the world.

## C4. Connection composer

### Core idea

A short real contact form becomes a small constellation: each completed field
adds one node, and successful submission connects the final path.

### Visual composition

- Only essential inputs: name, reply email, short message.
- Live DOM fields remain large, conventional, labeled, and autofill-friendly.
- Decorative nodes sit behind the form and connect as valid fields complete.
- The form never becomes a fake terminal or asks the visitor to decode an
  interaction.

### Entrance

Project metadata lines drift into the labels of the three fields. The last
project horizon becomes the form baseline.

### Interaction and states

- Validation is textual and inline; color/motion are supplementary.
- Completing a field draws one connection.
- Submit shows a real pending state.
- Only a confirmed success completes the constellation and contracts it into
  the monogram.
- Failure leaves the entered content untouched and provides a direct email
  fallback.

### Useful source effects

- [Inspira UI Animated Beam](https://inspira-ui.com/docs/en/components/special-effects/animated-beam)
  for completed-field connections.
- [Inspira UI Placeholders and Vanish Input](https://inspira-ui.com/docs/en/components/input-and-forms/placeholders-and-vanish-input)
  only as inspiration; permanent labels must remain.

### Needed assets

None. A real serverless/contact endpoint, spam strategy, and privacy copy are
required before choosing this direction.

### Main risk

Do not build the spectacle before the submission system exists. A reliable
email link is better than a beautiful form that loses messages.

## Contact choice matrix

| Direction               | Narrative fit | Conversion clarity | Mobile resilience | Build risk       | Verdict                   |
| ----------------------- | ------------- | ------------------ | ----------------- | ---------------- | ------------------------- |
| C1 Quiet Horizon        | Excellent     | Excellent          | Excellent         | Low-medium       | **Choose**                |
| C2 Signal / Plane       | Very good     | Very good          | Good              | Medium           | Add one small beat to C1  |
| C3 Living Business Card | Good          | Good               | Good              | Medium           | Strong visual alternative |
| C4 Connection Composer  | Good          | Excellent if real  | Excellent         | Medium + backend | Only with a real endpoint |

---

# Recommended combination and two alternates

## Cut A — recommended: cinematic and authored

- Skills: **S1 Capability Orbits** with one S4 morphing-verb moment.
- Projects: **P1 Proof in Depth**.
- Contact: **C1 Quiet Horizon** with the single moving signal from C2.

Why it wins: the same visual grammar—gravity, orbit, depth, focus, and
materialization—changes meaning in every scene. It also has an intentional
intensity curve: quiet Hero, dramatic About, analytical Skills, cinematic
Projects, quiet Contact.

## Cut B — more editorial and tactile

- Skills: **S2 Focus Stack**.
- Projects: **P3 Contact-sheet Time Machine**.
- Contact: **C3 Living Business Card**.

Why choose it: best if Malik wants paper, photography, and workbench material to
be the dominant identity. It needs the most custom art and project media.

## Cut C — clearer and lower risk

- Skills: **S4 Verb Engine** with a static evidence list.
- Projects: **P4 Evidence Stack**.
- Contact: **C1 Quiet Horizon**.

Why choose it: still premium, far easier to make excellent on mobile, and less
dependent on true depth of field or complex camera choreography.

Do not mix one scene from every visual genre merely because each demo is
beautiful. Choose one cut, then borrow at most one micro-interaction from
another.

---

# Content that the effects need in order to matter

## Skills content model

Every capability should provide:

- Category title.
- One plain-language sentence about what Malik can do.
- 3–5 truthful tools/practices.
- One proof link to a project.
- Optional “currently exploring” item, clearly separated from practiced skills.

Avoid progress bars, arbitrary percentages, years-of-experience counters, and a
wall of logos. They communicate less than a specific proof sentence.

## Project content model

Every project should provide:

- Title and one-sentence outcome.
- Context/problem.
- Malik's exact role.
- Constraints.
- Key design/engineering decisions.
- Stack, but only after the decision story.
- Result: metric, user outcome, learning, or honest current state.
- High-quality cover and supporting media.
- Live site/source links when public.
- Accessible alt text based on what the image demonstrates.

Three excellent projects are stronger than eight shallow cards.

## Contact content model

- One confident invitation.
- Direct email.
- Honest availability or response expectation, if Malik wants to publish it.
- Relevant social/code links.
- Optional location/time-zone.
- Back-to-top control.
- A form only if submission, validation, spam handling, privacy, and failure
  fallback are real.

---

# Global interaction system

## Navigation

- Eventually show only About, Skills, Projects, and Contact.
- The interface layer stays crisp and above camera blur.
- Selecting an anchor drives the world to a documented stable camera target.
- Interrupted anchor travel resolves to the closest valid state.
- A tiny progress mark can move along one line in the header; it must not become
  another animated centerpiece.
- Mobile menu can present a miniature static map of the five scene stops. The
  current world remains visible behind it; avoid a visually unrelated menu
  background.

## Cursor

- Keep the ordinary system cursor for precision.
- Any fluid/trail effect should be scene-local and purposeful.
- Best use: the existing fluid stream briefly bends toward the black hole during
  About absorption, then disappears. Do not run a rainbow fluid cursor across
  Skills, Projects, and Contact.
- Project-hover media trails belong only to P3 and only on fine-pointer devices.
- Disable decorative pointer systems for touch and reduced motion.

## Typography

- Use live DOM for every meaningful heading, project title, skill, and action.
- One focal morph or blur-reveal per scene is enough.
- Text enters only after its supporting world object has settled.
- Use contrast and focus, not constant character scrambling.
- Decorative oversized words live at far depth and can cross semantic
  boundaries; they should not create clipped section backdrops.

## Motion grammar

Use a small family:

- **Travel:** weighted ease-out with a long deceleration.
- **Focus:** shorter symmetrical ease-in-out.
- **Magnet/pointer:** damped spring with no perpetual oscillation.
- **Signal/orbit:** linear only when the object physically travels a path.
- **Reveal:** opacity plus modest contrast/blur; never blur alone for essential
  content.

Suggested perceived durations:

- Micro response: 160–240 ms.
- Copy/metadata reveal: 420–700 ms.
- Focal camera change: 700–1200 ms equivalent, driven by scroll progress.
- Major occlusion/handoff: roughly 900–1600 ms equivalent.
- Readable hold: longer than the transition on both sides.

Scroll-linked state should remain deterministic and reversible. Short settling
springs may be time-based after input stops, but the scene must always know its
target state.

## Optional sound

Sound can add award-level polish only if it is opt-in and restrained:

- One low, soft absorption tone at the event horizon.
- Tiny paper/air movement between project focal stops.
- One contact signal tone.

Default muted, visible control, remembers preference, never required for
meaning. Skip sound entirely if the samples and mix are not exceptional.

---

# Responsive world presets

## Wide desktop

- Full 3D depth and optional half-resolution DOF.
- Asymmetric project X positions can be generous.
- Skills rings may occupy 60–75% of viewport width.
- DOM copy uses the negative space beside the focal object.

## Ultrawide

- Do not scale everything up to fill width.
- Keep a maximum cinematic composition width and use the sides for near/far
  objects entering early.
- Project plane spacing can widen, but focal media remains readable.
- Preserve the same focal distance and apparent subject scale.

## Portrait mobile

- Capability rings become one vertical/oblique ring at a time or a static
  orbital diagram with a conventional list.
- Project planes form a vertical depth corridor with smaller Z travel.
- Metadata appears below/over a safe empty area, never as tiny texture text.
- Contact remains almost identical to desktop; this is a strength of C1.
- No effect may require hover or horizontal drag to reveal content.

## Short landscape

- Reduce camera travel and project height.
- Put metadata in a compact side column.
- Avoid large pinned holds that consume many wheel gestures.
- Keep all controls clear of browser chrome and safe areas.

## Reduced motion

- Preserve scene order and final compositions.
- Replace event-horizon travel with a short dissolve.
- Show Skills as a static diagram/list.
- Show Projects as a clear vertical editorial list with modest contrast changes.
- Open details immediately or with a short opacity transition.
- Keep the Contact horizon static.
- Remove autoplay orbit, parallax, pointer trails, depth zoom, and large scale
  changes.

`prefers-reduced-motion` is widely available and is specifically intended to
remove, reduce, or replace non-essential motion; see
[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion).

---

# Performance and accessibility guardrails

## Renderer and depth

- Extend toward one persistent Three.js renderer/world stage. Do not mount an
  OGL carousel, a second Three renderer, and a cursor canvas simultaneously.
- Reuse project geometry/materials and swap textures as needed.
- Preload the current and next project only; lazily decode the rest.
- Cap device pixel ratio and the total pixel budget.
- Run Bokeh/DOF only in a capable desktop quality tier, ideally at reduced
  resolution. CSS depth bands are the fallback.
- Suspend rendering at rest, when offscreen, and while the page is hidden.
- Rebuild responsive positions from named presets, then settle to a valid focal
  state after resize.

## Semantic ownership

- Meaningful Skills and Projects content stays in semantic HTML.
- Three.js planes may mirror images, but they are not the only copy of the
  content.
- Decorative world objects use `aria-hidden="true"` and never intercept pointer
  access to interface controls.
- Focus order follows reading order, not visual Z order.
- Opening/closing a case study restores focus and the previous project position.
- Every interaction has keyboard, touch, and no-JavaScript/readable fallbacks.

## Motion safety

- Avoid rapid full-screen zooms, repeated flashes, high-frequency flicker, and
  uncontrolled camera roll.
- The event-horizon occlusion is one slow scale passage, not a tunnel strobe.
- Focus blur never affects navigation or live copy.
- Do not hijack the scrollbar, block wheel input, or force a visitor through an
  unskippable intro on every visit.

---

# Asset brief

No image should be generated until a direction and project list are approved.
If Cut A is chosen, the likely asset list is:

1. One strong editorial cover image per project, based on the real work.
2. Optional 2–3 transparent depth layers per featured project.
3. One consistent monochrome SVG/text system for skills.
4. Optional **image of a warm technical orbital drawing under the same window
   light as the Hero**.
5. Optional **transparent image of a small black-paper plane** for the Contact
   signal variation.
6. A tiny seamless monochrome grain texture, if the existing base world does not
   already provide enough material texture.
7. Optional opt-in sound samples: low absorption, paper/air pass, single signal.

Avoid generated “fake app” imagery. Project covers must be built from real
screens, code, photos, or artifacts of Malik's projects.

---

# Ideas intentionally rejected

- A different animated background for every semantic section.
- A literal starfield, neon cyberpunk portal, or purple galaxy behind the black
  hole; these would fight the warm editorial identity.
- A generic rotating sphere of framework logos.
- Autoplay 3D carousel that moves while the visitor reads.
- Skill proficiency percentages.
- Constant glitch, chromatic aberration, liquid-glass, rainbow fluid, and mouse
  trails all at once.
- A giant custom cursor that obscures links.
- Project cards trapped and clipped inside a section-sized carousel.
- Scroll-jacking or mandatory drag navigation.
- A contact animation that pretends a message was sent before a real endpoint
  confirms it.
- Loading every project video and texture during the splash.
- Using blur to hide weak project art direction.

---

# Suggested approval sequence before implementation

1. Choose Cut A, B, or C.
2. Confirm the real skill categories and tool list.
3. Choose the 3–6 projects and write their evidence/outcome lines.
4. Art-direct one project cover at desktop and mobile sizes.
5. Prototype only About → Skills → first Project with gray boxes.
6. Test that prototype on mobile, keyboard, reduced motion, and a mid-range GPU.
7. Approve the camera/focus grammar.
8. Produce the remaining project assets.
9. Build the complete Projects and Contact scenes.
10. Tune transitions and micro-interactions only after content and performance
    are stable.

The first prototype should prove continuity and readability—not polish every
particle.
