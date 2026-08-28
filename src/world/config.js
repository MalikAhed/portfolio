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
export const JOURNEY_CAMERA_END_Z = 28.2;

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
  interactionBand: 1.15,
  visibilityThreshold: 0.002,
});

export const PROJECT_FRAME_ENTRY_CONFIG = Object.freeze({
  startDepth: 2.8,
  settleDepth: 4.7,
  workHorizontalOffset: 420,
  workVerticalOffset: 220,
});

export function getProjectFrameEntryAtDepth(depth) {
  return THREE.MathUtils.smoothstep(
    depth,
    PROJECT_FRAME_ENTRY_CONFIG.startDepth,
    PROJECT_FRAME_ENTRY_CONFIG.settleDepth,
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

/**
 * Static card-world setup.
 *
 * Owner: depth world
 * Depth role: world
 * Shape: wide project frame containing an interactive 16:9 work surface and
 * an alternating explainer column
 * Entrance/motion: fixed in world space while scrolling; each frame stays
 * hidden as the camera crosses its fixed Z plane, then its work surface slides
 * in and its explainer resolves upward from blur before the shared focal
 * distance. Pointer hover adds a temporary local CSS tilt without changing the
 * base transform.
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
  aspectRatio: 2,
  width: 7,
  cornerRadius: 0.12,
  worldUnitsPerCssPixel: 0.005,
  hover: Object.freeze({
    maxTilt: Math.PI / 18,
    scale: 1.035,
    response: 12,
  }),
  presets: Object.freeze({
    desktop: [
      { position: [0, 0.06, 7.1], rotation: [0, 0, 0], scale: 1 },
      { position: [0, -0.05, 12.5], rotation: [0, 0, 0], scale: 1 },
      { position: [0, -0.03, 17.9], rotation: [0, 0, 0], scale: 1 },
      { position: [0, 0.04, 23.3], rotation: [0, 0, 0], scale: 1 },
    ],
    mobile: [
      { position: [0, 0.12, 7.1], rotation: [0, 0, 0], scale: 0.3 },
      { position: [0, -0.1, 12.5], rotation: [0, 0, 0], scale: 0.3 },
      { position: [0, -0.06, 17.9], rotation: [0, 0, 0], scale: 0.3 },
      { position: [0, 0.08, 23.3], rotation: [0, 0, 0], scale: 0.3 },
    ],
    short: [
      { position: [0, 0.03, 7.1], rotation: [0, 0, 0], scale: 0.68 },
      { position: [0, -0.03, 12.5], rotation: [0, 0, 0], scale: 0.68 },
      { position: [0, -0.02, 17.9], rotation: [0, 0, 0], scale: 0.68 },
      { position: [0, 0.03, 23.3], rotation: [0, 0, 0], scale: 0.68 },
    ],
    ultrawide: [
      { position: [0, 0.06, 7.1], rotation: [0, 0, 0], scale: 1.12 },
      { position: [0, -0.05, 12.5], rotation: [0, 0, 0], scale: 1.12 },
      { position: [0, -0.03, 17.9], rotation: [0, 0, 0], scale: 1.12 },
      { position: [0, 0.04, 23.3], rotation: [0, 0, 0], scale: 1.12 },
    ],
  }),
});

export function getJourneyPreset(width, height) {
  const aspect = width / Math.max(1, height);
  if (height < 560 && aspect > 1.25) return "short";
  if (aspect < 0.78) return "mobile";
  if (aspect > 2) return "ultrawide";
  return "desktop";
}

export function getCameraZAtProgress(progress) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return (
    HERO_CAMERA_Z + (JOURNEY_CAMERA_END_Z - HERO_CAMERA_Z) * clampedProgress
  );
}

export function getCardPreset(preset) {
  return CARD_WORLD_CONFIG.presets[preset] ?? CARD_WORLD_CONFIG.presets.desktop;
}
