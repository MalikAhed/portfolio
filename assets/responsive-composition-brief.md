# Portfolio intro composition brief

## Archetype and hierarchy

- Center-stage portrait hero with a full-viewport splash layer.
- Live DOM navigation and title remain above the visual scene.
- Layer order: warm base, glow, portfolio word, transparent window shadow, Three.js portrait, live title/header, splash.

## Intro sequence

1. A critical inline splash shell prevents any unstyled logo flash, then reveals the MA monogram and a nearby rounded progress bar driven by critical-asset readiness.
2. Splash fades and releases only after the portrait texture, lighting images, monogram images, and web fonts resolve, with a long emergency fallback to avoid trapping the page.
3. Three.js camera moves from a close preset to its final `z` position with a fast-start, slow-finish ramp while the portrait follows its own stronger ease-out rise from below.
4. Header controls and title enter with short staggered reveals; the role resolves rapidly letter by letter from blurred, faded positions.
5. Glow and window shadow reveal through one continuous feathered mask from the top-start corner toward the bottom-end corner.

## Responsive states

- Narrow/standard portrait: smaller splash mark, gentler camera travel, mobile menu remains closed during intro.
- Short landscape: compact existing hero type, wide camera preset, splash mark constrained by `svh`.
- Tablet: medium camera travel with the existing balanced portrait composition.
- Desktop/ultrawide: strongest camera travel while retaining the centered portrait and capped typography.
- Reduced motion: splash is skipped, camera uses its final position, all content and lighting are immediately visible.

## Technology decision

- Hybrid 3D/2.5D. Three.js is retained only for the existing portrait plane and the requested real camera travel. Splash, live text, and diagonal lighting use CSS animation for lower cost and accessible fallbacks.
- The WebGL scene is event-driven: it renders at full refresh rate while the intro or pointer easing is active, then sleeps completely at rest. Ambient lighting drift runs on compositor-friendly CSS transforms, and the framebuffer is capped to the source portrait's useful detail so high-DPI laptops do not shade invisible extra pixels.

## About composition

- Center-stage continuous-world composition: the oversized low-contrast `ABOUT` remains environmental type, with a centered live biography returning to the original minimal typographic style.
- The biography is a crisp DOM subject above the shared warm canvas. Its X position, Y position, width, responsive size adjustment, and font weight are centralized in `about-copy-position.json`; the on-page development editor updates those values live and writes accepted positions back to that config through the Vite development server.
- The section remains hybrid 3D/2.5D: Three.js continues to own the persistent camera world, while the semantic About copy uses the DOM because it does not require geometry. Its existing blur/opacity reveal remains tied to the About hold, with a complete static reduced-motion state.
- Hero and About continue to share the fixed warm canvas without a section-local fill or clipping boundary.
- The black hole owns two lightweight SVG orbital systems in the same 2048×1152 local coordinate system as its source image. The Rim tab generates full concentric paths; the Smart Top tab derives continuous upper semicircles with cubic outward flares at both ends, then applies relative X/Y, scale, and height adjustments. Both use smooth, filter-free strokes with independent density, width, opacity, and tint. The top contours remain static for a clean silhouette, while rim animation pauses outside the black hole's focus area, in hidden browser tabs, and under reduced motion. The Object tab controls source-image opacity. The interface panel remains draggable, keyboard-movable, resizable, and persistent without trapping the world object inside a semantic section.

## Contact transition

- The header contact control is a semantic dialog trigger; the email action remains a normal link inside the revealed card.
- The interaction is a DOM-based 2.5D sequence: the paper plane exits the trigger, re-enters from the left at half the viewport width, compresses into a light point, and expands into a centered dark-glass card. Closing reverses the morph, sends the large plane beyond the right edge, then lands a final small plane precisely in the trigger.
- The card width is capped on desktop, nearly full-width on phones, and vertically scrollable on severe short-height viewports. The mobile header retains a compact icon-only contact trigger alongside the menu.
- The modal uses native dialog focus containment, Escape and outside-click dismissal, explicit focus restoration, a large touch target, and a reduced-motion fade that skips all spatial travel.
