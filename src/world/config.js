import * as THREE from "three";

/**
 * Shared art-direction data for the first reversible journey prototype.
 *
 * Coordinate contract:
 * - The Hero origin is at Z=0 and the camera begins at Z=5, facing -Z.
 * - Positive Z is the retreat direction.
 * - The camera keeps X=0, Y=0, and a fixed forward-facing orientation.
 * - The scroll mapping is absolute, so decreasing progress retraces the same
 *   Z rail exactly.
 */

export const HERO_CAMERA_Z = 5;
export const JOURNEY_CAMERA_END_Z = 58.5;
export const WORLD_CAMERA_FOV = 45;

/**
 * Typographic world marker between the Hero and the project rail. It stays at
 * this Z coordinate while the same linear camera journey passes through it.
 */
export const WORK_TITLE_WORLD_CONFIG = Object.freeze({
  position: Object.freeze([0, 0, 6]),
});

/** Final depth-world invitation after the fourth featured project. */
export const MORE_WORK_WORLD_CONFIG = Object.freeze({
  position: Object.freeze([0, 0, 43]),
});

/**
 * Scroll-linked light-speed and black-hole passage through the work rail.
 *
 * The portfolio camera continues its one linear Z retreat. The embedded view
 * radial streaks begin subtly as Murajaa enters from a far layer behind every
 * project surface. They stay black against the warm world while the background
 * darkens gradually, then invert to white as the black-hole view fades in. Once
 * that view is established, the radial streaks fade away while the black hole
 * remains fully visible. Its camera retreats at the same constant rate as
 * native scroll through the final position. After the view is established,
 * the finished ray-marched image slides down linearly without moving or
 * rotating its physical camera. This keeps the disk's viewing angle unchanged.
 *
 * Owner: isolated, pointer-inert DOM/WebGL surface
 * Depth role: final world passage above the warm base world
 * Motion trigger: native-scroll camera Z crossing `effectStartCameraZ`
 * Reduced motion: surface remains disabled
 * Disposal: the parent pauses it outside this interval; iframe teardown follows
 * the document lifecycle
 */
export const WARP_SPEED_WORLD_CONFIG = Object.freeze({
  effectStartCameraZ: 29.2,
  effectRevealEndCameraZ: 48,
  simulationStartCameraZ: 54,
  simulationRevealTravelCameraZ: 0.6,
  simulationStartOpacity: 0.18,
  simulationStartBlurPixels: 5.5,
  blackHoleShiftStartCameraZ: 54,
  // Keep the screen-space lift independent of the editable journey endpoint.
  // Four Z units makes the shrink and downward move finish together at Z58 by
  // default, and then hold its final framing through the remaining scroll.
  blackHoleShiftTravelCameraZ: 4,
  endBlackHoleScreenOffset: 0.22,
  // Transparent DOM ending composition above the lower black-hole framing.
  // It fades directly from native camera Z and owns no independent animation.
  endingRevealStartCameraZ: 56.4,
  endingRevealEndCameraZ: 58,
  darknessFadeStartCameraZ: 49,
  darknessFadeEndCameraZ: 54.3,
  lineFadeStartCameraZ: 50,
  lineFadeEndCameraZ: 54.5,
  endCameraZ: JOURNEY_CAMERA_END_Z,
  nearCameraDistance: 2.6,
  farCameraDistance: 12,
  startLineCount: 30,
  endLineCount: 180,
});

/**
 * One fixed focal region in front of the camera. Every DOM card uses this same
 * continuous model for blur, opacity, visibility, and interaction. `fadeBand`
 * is wider than the current card spacing midpoint so neighboring cards overlap
 * softly instead of handing ownership across an empty frame.
 */
export const FOCUS_WORLD_CONFIG = Object.freeze({
  distance: 4.8,
  sharpBand: 0.8,
  fadeBand: 4.4,
  blurPixelsPerWorldUnit: 1.5,
  maxBlurPixels: 9,
  interactionBand: 1.9,
  previewBand: 1.9,
  visibilityThreshold: 0.002,
});

export const PROJECT_FRAME_ENTRY_CONFIG = Object.freeze({
  startDepth: 2.8,
  settleDepth: 4.7,
  workHorizontalOffset: 420,
  workVerticalOffset: 0,
});

export function getProjectFrameEntryAtDepth(depth) {
  return THREE.MathUtils.clamp(
    (depth - PROJECT_FRAME_ENTRY_CONFIG.startDepth) /
      (PROJECT_FRAME_ENTRY_CONFIG.settleDepth -
        PROJECT_FRAME_ENTRY_CONFIG.startDepth),
    0,
    1,
  );
}

export function getWorldBlurAtDepth(depth) {
  const defocus = Math.max(
    0,
    Math.abs(depth - FOCUS_WORLD_CONFIG.distance) -
      FOCUS_WORLD_CONFIG.sharpBand,
  );

  return Math.min(
    FOCUS_WORLD_CONFIG.maxBlurPixels,
    defocus * FOCUS_WORLD_CONFIG.blurPixelsPerWorldUnit,
  );
}

export function getWorldVisibilityAtDepth(depth) {
  const focusDistance = Math.abs(depth - FOCUS_WORLD_CONFIG.distance);

  return (
    1 -
    THREE.MathUtils.smoothstep(
      focusDistance,
      FOCUS_WORLD_CONFIG.sharpBand,
      FOCUS_WORLD_CONFIG.fadeBand,
    )
  );
}

export function getWorldExitBlurAtDepth(depth) {
  const recedingDistance = Math.max(
    0,
    depth - (FOCUS_WORLD_CONFIG.distance + FOCUS_WORLD_CONFIG.sharpBand),
  );

  return Math.min(
    FOCUS_WORLD_CONFIG.maxBlurPixels,
    recedingDistance * FOCUS_WORLD_CONFIG.blurPixelsPerWorldUnit,
  );
}

export function getWorldExitVisibilityAtDepth(depth) {
  return (
    1 -
    THREE.MathUtils.smoothstep(
      depth,
      FOCUS_WORLD_CONFIG.distance + FOCUS_WORLD_CONFIG.sharpBand,
      FOCUS_WORLD_CONFIG.distance + FOCUS_WORLD_CONFIG.fadeBand,
    )
  );
}

/**
 * Static card-world setup.
 *
 * Owner: depth world
 * Depth role: world
 * Shape: wide project frame containing an interactive 4:3 work surface and
 * an alternating explainer column. Very wide, short viewports use 3:2 so the
 * work surface and its header remain inside the available height.
 * Entrance/motion: fixed in world space while scrolling; each frame stays
 * hidden as the camera crosses its fixed Z plane, then its work surface slides
 * horizontally along one line and its explainer resolves from blur before the
 * shared focal distance. The DOM surface remains geometrically stable for dependable
 * pointer interaction.
 * Editor: position, Euler XYZ rotation, and scalar size may be changed
 * directly; reset restores the active responsive preset below
 * Rendering: a lightweight Three.js anchor supplies the world transform. Its
 * projected native DOM view remains the visual source at every visible depth;
 * camera-space distance continuously controls blur and opacity, while only the
 * focused card exposes its sandboxed preview and code controls
 * Reduced motion: unchanged geometry; the shortened camera rail may not reach
 * every card
 * Stacking: the projected DOM layer stays above the portrait and future world
 * objects. Camera depth determines card z-order, so an approaching card crosses
 * in front while the preceding card remains visible behind it during the
 * shared blur-and-fade interval.
 */
export const CARD_WORLD_CONFIG = Object.freeze({
  id: "portfolio-cards",
  depthRole: "world",
  width: 8.8,
  height: 3.25,
  cornerRadius: 0.12,
  worldUnitsPerCssPixel: 0.005,
  responsive: Object.freeze({
    authoredScale: 1.12,
    surfaceWidthFraction: 0.64,
    viewportHeightFraction: 0.94,
    viewportWidthFraction: 0.94,
    wideSurfaceAspect: 3 / 2,
  }),
  sideTransforms: Object.freeze({
    preview: Object.freeze({
      position: Object.freeze({ x: 0, y: 0, z: 0 }),
      rotation: Object.freeze({ x: 0, y: 0, z: 0 }),
      width: 1,
      height: 1,
      scale: 1,
    }),
    text: Object.freeze({
      position: Object.freeze({ x: 65, y: 0, z: 0 }),
      rotation: Object.freeze({ x: 0, y: 0, z: 0 }),
      width: 1,
      height: 1,
      scale: 1,
    }),
  }),
  sideTransformOverrides: Object.freeze({
    "cube-burger": Object.freeze({
      text: Object.freeze({
        position: Object.freeze({ x: -65 }),
      }),
    }),
    learn: Object.freeze({
      text: Object.freeze({
        position: Object.freeze({ x: -65 }),
      }),
    }),
  }),
  presets: Object.freeze({
    desktop: [
      { position: [0, 0.06, 11.2], rotation: [0, 0, 0], scale: 1.12 },
      { position: [0, 0.06, 19.2], rotation: [0, 0, 0], scale: 1.12 },
      { position: [0, 0.06, 27.2], rotation: [0, 0, 0], scale: 1.12 },
      { position: [0, 0.06, 35.2], rotation: [0, 0, 0], scale: 1.12 },
    ],
    mobile: [
      { position: [0, 0.12, 11.2], rotation: [0, 0, 0], scale: 0.3 },
      { position: [0, 0.12, 19.2], rotation: [0, 0, 0], scale: 0.3 },
      { position: [0, 0.12, 27.2], rotation: [0, 0, 0], scale: 0.3 },
      { position: [0, 0.12, 35.2], rotation: [0, 0, 0], scale: 0.3 },
    ],
    short: [
      { position: [0, 0.03, 11.2], rotation: [0, 0, 0], scale: 0.68 },
      { position: [0, 0.03, 19.2], rotation: [0, 0, 0], scale: 0.68 },
      { position: [0, 0.03, 27.2], rotation: [0, 0, 0], scale: 0.68 },
      { position: [0, 0.03, 35.2], rotation: [0, 0, 0], scale: 0.68 },
    ],
    ultrawide: [
      { position: [0, 0.06, 11.2], rotation: [0, 0, 0], scale: 1.12 },
      { position: [0, 0.06, 19.2], rotation: [0, 0, 0], scale: 1.12 },
      { position: [0, 0.06, 27.2], rotation: [0, 0, 0], scale: 1.12 },
      { position: [0, 0.06, 35.2], rotation: [0, 0, 0], scale: 1.12 },
    ],
  }),
});

/**
 * Projected chess-piece sprites surrounding StockThink. Their Three.js anchors
 * provide genuine camera-space parallax while DOM images allow foreground
 * pieces to cross the interactive project surface without taking input.
 */
export const STOCKTHINK_CHESS_WORLD_CONFIG = Object.freeze({
  projectPosition: Object.freeze([0, 0.06, 11.2]),
  blurPixelsPerWorldUnit: 4.5,
  maxBlurPixels: 26,
  pieces: Object.freeze([
    Object.freeze({
      asset: "assets/rook.webp",
      fallbackAsset: "assets/rook.png",
      aspect: 1216 / 1294,
      position: Object.freeze([-3.55, -1.5, 13.5]),
      height: 2.05,
      rotation: -17,
      flip: false,
      opacity: 1,
    }),
    Object.freeze({
      asset: "assets/bishiop.webp",
      fallbackAsset: "assets/bishiop.png",
      aspect: 1022 / 1538,
      position: Object.freeze([0.85, 1.25, 12.4]),
      height: 1.58,
      rotation: 58,
      flip: true,
      opacity: 1,
    }),
    Object.freeze({
      asset: "assets/kight.webp",
      fallbackAsset: "assets/kight.png",
      aspect: 1024 / 1536,
      position: Object.freeze([3.82, -0.08, 14.5]),
      height: 2.05,
      rotation: 7,
      flip: true,
      opacity: 1,
    }),
  ]),
});

/**
 * Original ingredient-sprite crops surrounding the Cube Burger card. Each
 * crop owns a distinct foreground Z so camera distance controls its blur and
 * the following project naturally crosses in front of the complete scene.
 */
export const CUBE_BURGER_INGREDIENT_WORLD_CONFIG = Object.freeze({
  asset: "assets/cube-burger-ingredients.png",
  projectPosition: Object.freeze([0, 0.06, 19.2]),
  blurPixelsPerWorldUnit: 4.5,
  maxBlurPixels: 26,
  pieces: Object.freeze([
    Object.freeze({
      name: "lettuce-top",
      aspect: 380 / 330,
      backgroundSize: "404% 310%",
      backgroundPosition: "1.7% 2.9%",
      position: Object.freeze([-4.55, 1.55, 20.4]),
      height: 1.55,
      rotation: -18,
    }),
    Object.freeze({
      name: "tomato-left",
      aspect: 310 / 250,
      backgroundSize: "495% 410%",
      backgroundPosition: "0 45.2%",
      position: Object.freeze([-1.3, -1.25, 19.95]),
      height: 1.25,
      rotation: 10,
    }),
    Object.freeze({
      name: "lettuce-bottom",
      aspect: 340 / 230,
      backgroundSize: "452% 445%",
      backgroundPosition: "1.7% 75.6%",
      position: Object.freeze([-3.65, -1.65, 17.65]),
      height: 1.15,
      rotation: 8,
    }),
    Object.freeze({
      name: "onion-top",
      aspect: 330 / 310,
      backgroundSize: "465% 330%",
      backgroundPosition: "86.2% 12.6%",
      position: Object.freeze([4.3, 1.3, 19.6]),
      height: 1.35,
      rotation: 82,
    }),
    Object.freeze({
      name: "lettuce-right",
      aspect: 256 / 270,
      backgroundSize: "600% 379%",
      backgroundPosition: "100% 39.8%",
      position: Object.freeze([2.7, -0.35, 22.05]),
      height: 1.18,
      rotation: 12,
    }),
    Object.freeze({
      name: "onion-bottom",
      aspect: 330 / 264,
      backgroundSize: "465% 388%",
      backgroundPosition: "70.5% 100%",
      position: Object.freeze([2.65, -1.7, 23]),
      height: 1.15,
      rotation: 16,
    }),
  ]),
});

/**
 * Generated Murajaa screens projected around the third project. Each screen
 * has its own foreground Z, so native camera travel supplies the parallax,
 * focus blur, and crossing order while the live app remains in the frame.
 */
export const MURAJAA_SCREEN_WORLD_CONFIG = Object.freeze({
  projectPosition: Object.freeze([0, 0.06, 27.2]),
  blurPixelsPerWorldUnit: 4.5,
  maxBlurPixels: 26,
  screens: Object.freeze([
    Object.freeze({
      name: "welcome",
      asset: "assets/murajaa-welcome.png",
      position: Object.freeze([-1.05, 1.12, 26]),
      height: 1.42,
      rotation: -9,
    }),
    Object.freeze({
      name: "study-card",
      asset: "assets/murajaa-study-card.png",
      position: Object.freeze([4.7, 1.08, 27.4]),
      height: 1.38,
      rotation: 8,
    }),
    Object.freeze({
      name: "progress",
      asset: "assets/murajaa-progress.png",
      position: Object.freeze([-3.05, -1.08, 28.7]),
      height: 1.34,
      rotation: 7,
    }),
    Object.freeze({
      name: "answer-card",
      asset: "assets/murajaa-answer-card.png",
      position: Object.freeze([2.85, -0.15, 30.8]),
      height: 1.42,
      rotation: -8,
    }),
  ]),
});

/** Original Full-Stack Quest progression art projected around its card. */
export const LEARN_OBJECT_WORLD_CONFIG = Object.freeze({
  projectPosition: Object.freeze([0, 0.06, 35.2]),
  blurPixelsPerWorldUnit: 4.5,
  maxBlurPixels: 26,
  objects: Object.freeze([
    Object.freeze({
      name: "code-book",
      asset: "assets/learn-code-book.png",
      aspect: 807 / 846,
      position: Object.freeze([-1.1, -2.05, 37.55]),
      height: 1.6,
      rotation: -12,
    }),
    Object.freeze({
      name: "bronze-rank",
      asset: "assets/learn-rank-bronze.png",
      aspect: 1,
      position: Object.freeze([-3.1, -0.55, 32.6]),
      height: 1.5,
      rotation: 8,
    }),
    Object.freeze({
      name: "streak",
      asset: "assets/learn-streak-flame.png",
      aspect: 700 / 886,
      position: Object.freeze([-4.25, 1.6, 36.3]),
      height: 1.6,
      rotation: 10,
    }),
    Object.freeze({
      name: "rank-nine",
      asset: "assets/learn-rank-9.png",
      aspect: 1,
      position: Object.freeze([4.25, 1.6, 35.5]),
      height: 1.45,
      rotation: -9,
    }),
    Object.freeze({
      name: "rank-sixteen",
      asset: "assets/learn-rank-16.png",
      aspect: 1,
      position: Object.freeze([3.45, -0.3, 38.3]),
      height: 1.35,
      rotation: 4,
    }),
  ]),
});

/**
 * Preserve the editor's authored scale while fitting the complete frame at
 * its focal depth. Projection is height-based, so using one fixed desktop
 * scale makes the same card overflow at common fullscreen aspect ratios.
 */
export function getResponsiveCardScale(
  viewportWidth,
  viewportHeight,
  cardWidth,
  authoredScale,
) {
  const focusWorldHeight =
    2 *
    Math.tan(THREE.MathUtils.degToRad(WORLD_CAMERA_FOV / 2)) *
    FOCUS_WORLD_CONFIG.distance;
  const widthFitScale =
    ((viewportWidth * CARD_WORLD_CONFIG.responsive.viewportWidthFraction) /
      Math.max(1, viewportHeight)) *
    (focusWorldHeight / cardWidth);
  const heightFitScale =
    (CARD_WORLD_CONFIG.responsive.viewportHeightFraction *
      focusWorldHeight *
      CARD_WORLD_CONFIG.responsive.wideSurfaceAspect) /
    (cardWidth * CARD_WORLD_CONFIG.responsive.surfaceWidthFraction);
  const responsiveFactor = Math.min(
    1,
    Math.min(widthFitScale, heightFitScale) /
      CARD_WORLD_CONFIG.responsive.authoredScale,
  );

  return authoredScale * responsiveFactor;
}

export function getJourneyPreset(width, height) {
  const aspect = width / Math.max(1, height);
  if (height < 560 && aspect > 1.25) return "short";
  if (aspect < 0.78) return "mobile";
  if (aspect > 2) return "ultrawide";
  return "desktop";
}

export function getCameraZAtProgress(
  progress,
  journeyEndCameraZ = JOURNEY_CAMERA_END_Z,
) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return HERO_CAMERA_Z + (journeyEndCameraZ - HERO_CAMERA_Z) * clampedProgress;
}

export function getCardPreset(preset) {
  return CARD_WORLD_CONFIG.presets[preset] ?? CARD_WORLD_CONFIG.presets.desktop;
}
