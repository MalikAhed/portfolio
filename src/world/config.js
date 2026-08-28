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

/**
 * Static card-world setup.
 *
 * Owner: depth world
 * Depth role: world
 * Shape: interactive 16:9 HTML project simulation
 * Entrance/motion: fixed in world space while scrolling; each card becomes
 * viewable only when the camera retreats past its fixed Z position. Pointer
 * hover adds a temporary local CSS tilt without changing the base transform.
 * Editor: position and Euler XYZ rotation may be changed directly; reset
 * restores the active responsive preset below
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
  aspectRatio: 16 / 9,
  width: 2.4,
  cornerRadius: 0.12,
  worldUnitsPerCssPixel: 0.005,
  hover: Object.freeze({
    maxTilt: Math.PI / 18,
    scale: 1.035,
    response: 12,
  }),
  presets: Object.freeze({
    desktop: [
      { position: [-1.05, 0.32, 7.1], rotation: [0, 0, 0], scale: 0.95 },
      { position: [1.05, -0.32, 12.5], rotation: [0, 0, 0], scale: 0.98 },
      { position: [-0.92, -0.24, 17.9], rotation: [0, 0, 0], scale: 0.92 },
      { position: [0.92, 0.26, 23.3], rotation: [0, 0, 0], scale: 0.95 },
    ],
    mobile: [
      { position: [0, 0.48, 7.1], rotation: [0, 0, 0], scale: 0.72 },
      { position: [0, -0.44, 12.5], rotation: [0, 0, 0], scale: 0.74 },
      { position: [0, -0.34, 17.9], rotation: [0, 0, 0], scale: 0.7 },
      { position: [0, 0.38, 23.3], rotation: [0, 0, 0], scale: 0.72 },
    ],
    short: [
      { position: [-1.08, 0.14, 7.1], rotation: [0, 0, 0], scale: 0.76 },
      { position: [1.12, -0.14, 12.5], rotation: [0, 0, 0], scale: 0.78 },
      { position: [-1, -0.1, 17.9], rotation: [0, 0, 0], scale: 0.72 },
      { position: [1, 0.12, 23.3], rotation: [0, 0, 0], scale: 0.76 },
    ],
    ultrawide: [
      { position: [-1.3, 0.3, 7.1], rotation: [0, 0, 0], scale: 1.08 },
      { position: [1.34, -0.3, 12.5], rotation: [0, 0, 0], scale: 1.12 },
      { position: [-1.2, -0.22, 17.9], rotation: [0, 0, 0], scale: 1.02 },
      { position: [1.18, 0.24, 23.3], rotation: [0, 0, 0], scale: 1.08 },
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
