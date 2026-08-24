# Current responsive composition brief

## Shared world

- Every viewport uses one fixed warm base world. Hero, About, Skills, and
  Contact remain transparent semantic regions inside the same scene.
- The window shadow, portrait, black hole, and environmental words may cross
  semantic boundaries. Structural wrappers do not clip them.
- The header is an interface layer above the depth world. At 960px and below it
  switches to the contained mobile navigation; without JavaScript it presents
  the same destinations as compact normal links.

## Hero and intro

- Three.js owns the camera-space portrait. A matching DOM cutout is the static
  baseline and WebGL fallback.
- The first-visit splash is bounded: it never waits for below-fold art, hash
  destinations bypass it, reduced motion skips it, and the application has an
  independent release failsafe.
- The renderer caps DPR/pixel count and sleeps when pointer and intro motion have
  settled. The large Three dependency is loaded as a separate enhancement
  chunk after the small application shell.
- Phone portrait uses the narrow camera preset; short landscape compacts the
  identity type; desktop and ultrawide retain centered framing without raising
  the framebuffer beyond useful portrait detail.

## About transition

- The black hole is a transition-layer world object, not an About child. Its
  sticky anchor begins 150svh into the world and remains free of section clips.
- About uses a compact reveal/hold/absorption runway. The biography remains live
  DOM text and selectable.
- On reduced motion, Hero identity fades without shrinking into dots, gravity
  travel is removed, the black hole fades before Skills, and all copy remains
  available in a coherent reading state.

## Skills and Contact

- Skills begins in the lower camera field as About releases. Its content is
  visible by default and receives a one-shot staggered reveal only when motion
  enhancement is available.
- Phone layouts use one skill column and content-driven height; desktop uses
  three columns. Neither path keeps a scroll-scrub loop alive.
- Contact is the final semantic invitation in the same warm world. Header links
  navigate to it; the email action remains a direct, keyboard-usable link.

## Required viewport checks

- 360×640 and 390×844 phone portrait
- 667×375 short phone landscape
- 960px and 961px header boundary
- 768×1024 tablet portrait
- 1440×900 desktop
- 1440×900 desktop at 2× DPR
- 2560×1080 ultrawide

At each size verify no horizontal document overflow, no cut world object, a
usable 44px minimum control target, and visible final content under reduced
motion, no WebGL, and no JavaScript.
