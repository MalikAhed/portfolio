import { createScrollIdentityFlight } from "./identity-flight.js";
import {
  DEFAULT_FLUID_SETTINGS,
  loadFluidSettings,
  publishFluidSettings,
  saveFluidSettings,
} from "../../components/fluid-cursor/fluid-settings.js";

// v4 makes this authored checkpoint authoritative on origins that may still
// contain the earlier, incorrect v3 browser state.
const STORAGE_KEY = "portfolio-black-hole-v4";
const EDITOR_STORAGE_KEY = "portfolio-black-hole-editor-v2";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const ELLIPSE_BEZIER_FACTOR = 0.5522847498;
const ORBIT_PATH_LENGTH = 1000;
const ORBIT_GRAVITY_BANDS = 1;
const ORBIT_BASE_DURATIONS = Object.freeze({
  rim: Object.freeze({ clockwise: 7.5, counter: 9 }),
  top: Object.freeze({ clockwise: 8.1, counter: 9.6 }),
});
/* The identity formation completes when About takes the camera center and the
   black-hole anchor reaches its authored 50svh resting line. */
const JOURNEY_SCROLL_RATIO = 1;

/*
 * About absorption beat (depth-world / transition layer)
 *
 * The About composition remains pinned while scroll advances through these
 * normalized world states. The values intentionally leave a readable pause
 * after the biography appears before gravity takes ownership of the frame.
 */
const ABOUT_SETTLE_END = 0.24;
const ABOUT_BIO_START = 0.16;
const ABOUT_BIO_END = 0.38;
const ABOUT_ABSORPTION_START = 0.44;
const ABOUT_ABSORPTION_FADE_START = 0.12;
const ABOUT_ABSORPTION_FADE_END = 0.78;
const ABOUT_BLACK_HOLE_FINAL_SCALE = Object.freeze({
  mobile: 1.4,
  desktop: 1.5,
  ultrawide: 1.6,
});

const DEFAULT_STATE = Object.freeze({
  x: -11,
  y: 126,
  depth: 0,
  size: 1.08,
  rotation: 0,
  order: 35,
  orbitX: 42,
  orbitY: -20,
  orbitScale: 1.14,
  orbitHeight: 0.25,
  orbitColor: "#000000",
  orbitSpeed: 0.4,
  lineDensity: 10,
  lineWidth: 5.25,
  lineOpacity: 1,
  lineInnerColor: "#000000",
  lineOuterColor: "#000000",
  lineMaterialVersion: 3,
  glowStrength: 1.4,
  glowRadius: 0.5,
  glowThreshold: 0,
  glowExposure: 1,
  topX: -15,
  topY: -50,
  topScale: 0.45,
  topHeight: 2.5,
  topDensity: 6,
  topWidth: 1,
  topOpacity: 0.74,
  topColor: "#000000",
  blackHoleOpacity: 0.78,
  blackHoleBrightness: 0.72,
  blackHoleContrast: 1.08,
});

const DEFAULT_EDITOR_LAYOUT = Object.freeze({
  x: 7.9852213859558105,
  y: 7.9852213859558105,
  width: 343.98907470703125,
  height: 287.9884338378906,
});

const STATE_LIMITS = Object.freeze({
  x: [-10000, 10000],
  y: [-10000, 10000],
  depth: [-1400, 1200],
  size: [0.01, 20],
  rotation: [-3600, 3600],
  order: [1, 39],
  orbitX: [-600, 600],
  orbitY: [-400, 400],
  orbitScale: [0.35, 2.5],
  orbitHeight: [0.25, 3.8],
  orbitSpeed: [0.25, 2.5],
  lineDensity: [1, 18],
  lineWidth: [0.5, 20],
  lineOpacity: [0.05, 1],
  glowStrength: [0, 3],
  glowRadius: [0, 1],
  glowThreshold: [0, 1],
  glowExposure: [0.1, 2],
  topX: [-400, 400],
  topY: [-300, 300],
  topScale: [0.4, 2],
  topHeight: [0.4, 2.5],
  topDensity: [1, 12],
  topWidth: [0.5, 14],
  topOpacity: [0.02, 1],
  blackHoleOpacity: [0, 1],
  blackHoleBrightness: [0, 1.5],
  blackHoleContrast: [0.5, 2],
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function easeInOut(value) {
  return value * value * (3 - 2 * value);
}

function orbitNoise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function createOrbitDashPattern(index, kind, fine, semicircle = false) {
  const seed = index + (kind === "top" ? 37 : 11);
  const lengthFactor = fine ? 0.56 : semicircle ? 0.74 : 1;
  const first = Math.round(
    (kind === "top" ? 178 : 224) *
      (0.72 + orbitNoise(seed + 1) * 0.5) *
      lengthFactor,
  );
  const firstGap = Math.round(42 + orbitNoise(seed + 2) * 78);
  const second = Math.round(
    (kind === "top" ? 116 : 142) *
      (0.68 + orbitNoise(seed + 3) * 0.58) *
      lengthFactor,
  );
  const secondGap = Math.round(48 + orbitNoise(seed + 4) * 92);
  const third = Math.round(
    (kind === "top" ? 72 : 94) *
      (0.65 + orbitNoise(seed + 5) * 0.62) *
      lengthFactor,
  );
  const finalGap = Math.max(
    80,
    ORBIT_PATH_LENGTH - first - firstGap - second - secondGap - third,
  );

  return `${first} ${firstGap} ${second} ${secondGap} ${third} ${finalGap}`;
}

function getOrbitPhase(index, kind) {
  const seed = index + (kind === "top" ? 71 : 19);
  return -Math.round(35 + orbitNoise(seed) * 890);
}

function loadState() {
  let saved = {};

  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    saved = {};
  }

  const predatesImageMaterialControls =
    !Number.isFinite(Number(saved.blackHoleBrightness)) ||
    !Number.isFinite(Number(saved.blackHoleContrast));
  const acceptsSavedLineMaterial = saved.lineMaterialVersion === 3;
  const state = {};
  Object.entries(STATE_LIMITS).forEach(([property, [minimum, maximum]]) => {
    const savedValue = Number(saved[property]);
    const fallback = DEFAULT_STATE[property];
    const acceptsSavedValue =
      Number.isFinite(savedValue) &&
      !(property === "blackHoleOpacity" && predatesImageMaterialControls);
    state[property] = clamp(
      acceptsSavedValue ? savedValue : fallback,
      minimum,
      maximum,
    );
  });
  state.orbitColor = /^#[0-9a-f]{6}$/i.test(saved.orbitColor)
    ? saved.orbitColor
    : DEFAULT_STATE.orbitColor;
  state.topColor = /^#[0-9a-f]{6}$/i.test(saved.topColor)
    ? saved.topColor
    : DEFAULT_STATE.topColor;
  if (!acceptsSavedLineMaterial) {
    state.lineDensity = DEFAULT_STATE.lineDensity;
    state.topDensity = DEFAULT_STATE.topDensity;
    state.glowStrength = DEFAULT_STATE.glowStrength;
  }
  state.lineInnerColor =
    acceptsSavedLineMaterial && /^#[0-9a-f]{6}$/i.test(saved.lineInnerColor)
      ? saved.lineInnerColor
      : DEFAULT_STATE.lineInnerColor;
  state.lineOuterColor =
    acceptsSavedLineMaterial && /^#[0-9a-f]{6}$/i.test(saved.lineOuterColor)
      ? saved.lineOuterColor
      : DEFAULT_STATE.lineOuterColor;
  state.lineMaterialVersion = DEFAULT_STATE.lineMaterialVersion;
  return state;
}

function loadEditorLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(EDITOR_STORAGE_KEY));
    if (
      saved &&
      [saved.x, saved.y, saved.width, saved.height].every(Number.isFinite)
    ) {
      return saved;
    }
  } catch {
    // A missing or stale editor layout should not affect the scene controls.
  }
  return { ...DEFAULT_EDITOR_LAYOUT };
}

export function initBlackHole() {
  const stage = document.querySelector(".black-hole-stage");
  const flow = stage?.closest(".hero-about-flow");
  const anchor = stage?.querySelector(".black-hole-anchor");
  const object = stage?.querySelector(".black-hole-object");
  const image = stage?.querySelector(".black-hole-image");
  const orbits = stage?.querySelector(".black-hole-orbits");
  const orbitMotion = orbits?.querySelector(".black-hole-orbits__motion");
  const orbitShape = orbits?.querySelector(".black-hole-orbits__shape");
  const canvas = flow?.querySelector(".identity-flight-canvas");
  const hero = flow?.querySelector(".hero");
  const about = flow?.querySelector(".about");
  const statement = flow?.querySelector(".about__statement");
  const bio = flow?.querySelector("[data-about-bio]");
  const backdrop = flow?.querySelector(".about__backdrop");
  const title = flow?.querySelector(".hero__identity h1");
  const role = flow?.querySelector(".hero__identity .hero__role");
  const statementWords = Array.from(
    flow?.querySelectorAll("[data-about-statement-word]") ?? [],
  );
  const editorEnabled =
    import.meta.env.DEV &&
    document.documentElement.classList.contains("has-scene-editor");
  const editor = editorEnabled
    ? document.querySelector(".black-hole-editor")
    : null;
  if (
    !stage ||
    !flow ||
    !anchor ||
    !object ||
    !image ||
    !orbits ||
    !orbitMotion ||
    !orbitShape ||
    !canvas ||
    !hero ||
    !about ||
    !statement ||
    !bio ||
    !backdrop ||
    !title ||
    !role ||
    statementWords.length === 0
  ) {
    return () => {};
  }

  const toggle = editor?.querySelector(".black-hole-editor__toggle");
  const panel = editor?.querySelector(".black-hole-editor__panel");
  const close = editor?.querySelector(".black-hole-editor__close");
  const editorHandle = editor?.querySelector(".black-hole-editor__drag-handle");
  const reset = editor?.querySelector("[data-black-hole-reset]");
  const tabs = Array.from(
    editor?.querySelectorAll("[data-black-hole-tab]") ?? [],
  );
  const tabPanels = Array.from(
    editor?.querySelectorAll("[data-black-hole-panel]") ?? [],
  );
  const controls = Object.fromEntries(
    Array.from(
      editor?.querySelectorAll("[data-black-hole-property]") ?? [],
      (input) => [input.dataset.blackHoleProperty, input],
    ),
  );
  const outputs = Object.fromEntries(
    Array.from(
      editor?.querySelectorAll("[data-black-hole-output]") ?? [],
      (output) => [output.dataset.blackHoleOutput, output],
    ),
  );
  const fluidControls = Object.fromEntries(
    Array.from(
      editor?.querySelectorAll("[data-fluid-property]") ?? [],
      (input) => [input.dataset.fluidProperty, input],
    ),
  );
  const fluidOutputs = Object.fromEntries(
    Array.from(
      editor?.querySelectorAll("[data-fluid-output]") ?? [],
      (output) => [output.dataset.fluidOutput, output],
    ),
  );
  const authoredOrbitLines = Array.from(
    orbitShape.querySelectorAll(".black-hole-orbit-line"),
  );
  const densityOrbitGroup = document.createElementNS(SVG_NAMESPACE, "g");
  densityOrbitGroup.classList.add("black-hole-orbits__density-lines");
  densityOrbitGroup.setAttribute("aria-hidden", "true");
  orbitShape.append(densityOrbitGroup);
  const topOrbitGroup = document.createElementNS(SVG_NAMESPACE, "g");
  topOrbitGroup.classList.add("black-hole-orbits__top-lines");
  topOrbitGroup.setAttribute("aria-hidden", "true");
  orbitMotion.append(topOrbitGroup);
  authoredOrbitLines.forEach((line) => line.setAttribute("display", "none"));
  let state = editorEnabled ? loadState() : { ...DEFAULT_STATE };
  let fluidState = editorEnabled ? loadFluidSettings() : null;
  let editorLayout = editorEnabled ? loadEditorLayout() : null;
  let orbitDrag = null;
  let editorDrag = null;
  let editorResizeActive = false;
  let renderedLineDensity = 0;
  let renderedTopDensity = 0;
  let orbitsInView = false;
  let blackHoleWorldVisible = true;
  let narrativeInRange = true;
  let orbitScrollActive = false;
  let orbitScrollIdleTimer = 0;
  let orbitWarmupHandle = 0;
  let orbitWarmupUsesIdleCallback = false;
  let bloomWarmupHandle = 0;
  let bloomWarmupUsesIdleCallback = false;
  let bloomWarmupDelayHandle = 0;
  let bloomIsWarmed = false;
  let frame = 0;
  let objectReady = false;
  let disposed = false;
  let flightController = null;
  let bloomController = null;
  let journeyDistance = 1;
  let aboutTop = 0;
  let holdDistance = 1;
  let anchorWidth = 1;
  let gravityGeometry = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let renderedAboutProgress = -1;
  let renderedAboutMotionPreference = reducedMotion.matches;
  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;
  const orbitVisibilityObserver = new IntersectionObserver(
    ([entry]) => {
      orbitsInView = entry.isIntersecting;
      updateOrbitActivity();
    },
    { rootMargin: "80px 0px" },
  );
  const aboutVisibilityObserver = new IntersectionObserver(
    ([entry]) => {
      about.classList.toggle("about--active", entry.isIntersecting);
    },
    { rootMargin: "30% 0px" },
  );
  const narrativeVisibility = new Map([
    [hero, true],
    [about, false],
  ]);
  const narrativeVisibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        narrativeVisibility.set(entry.target, entry.isIntersecting);
      });
      narrativeInRange = Array.from(narrativeVisibility.values()).some(Boolean);
      requestNarrativeUpdate();
    },
    { rootMargin: "60% 0px" },
  );
  const resizeObserver = panel
    ? new ResizeObserver(() => {
        if (panel.hidden) return;
        clampEditorToViewport();
      })
    : null;

  function createOrbitTrack(direction, kind, gravityBand) {
    const track = document.createElementNS(SVG_NAMESPACE, "g");
    const gravityProgress =
      ORBIT_GRAVITY_BANDS === 1 ? 0.5 : gravityBand / (ORBIT_GRAVITY_BANDS - 1);
    // A few inherited timelines preserve the light rendering budget: inner
    // bands complete a turn first, while each child line supplies its own
    // fragment lengths and phase so the shared motion never looks synchronized.
    const gravityDurationFactor = 0.82 + gravityProgress * 0.36;
    const baseDuration =
      ORBIT_BASE_DURATIONS[kind][direction] * gravityDurationFactor;
    track.classList.add(
      "black-hole-orbit-track",
      `black-hole-orbit-track--${kind}`,
      `black-hole-orbit-track--${direction}`,
      `black-hole-orbit-track--gravity-${gravityBand + 1}`,
    );
    track.dataset.baseDuration = String(baseDuration);
    track.dataset.orbitKind = kind;
    track.dataset.orbitDirection = direction;
    track.style.animationDuration = `${baseDuration / state.orbitSpeed}s`;
    return track;
  }

  function getOrbitTrack(tracks, direction, kind, progress) {
    const gravityBand = Math.min(
      ORBIT_GRAVITY_BANDS - 1,
      Math.floor(progress * ORBIT_GRAVITY_BANDS),
    );
    const key = `${direction}-${gravityBand}`;
    let track = tracks.get(key);
    if (!track) {
      track = createOrbitTrack(direction, kind, gravityBand);
      tracks.set(key, track);
    }
    return track;
  }

  function setOrbitLineMaterial(line, index, kind, fine, semicircle = false) {
    line.style.setProperty(
      "--orbit-dash-pattern",
      createOrbitDashPattern(index, kind, fine, semicircle),
    );
    line.style.setProperty("--orbit-phase", String(getOrbitPhase(index, kind)));
  }

  function syncOrbitSpeed() {
    stage.querySelectorAll(".black-hole-orbit-track").forEach((track) => {
      const baseDuration = Number(track.dataset.baseDuration);
      track.style.animationDuration = `${baseDuration / state.orbitSpeed}s`;
    });
  }

  function syncOrbitDensity() {
    const count = Math.round(state.lineDensity);
    if (count === renderedLineDensity) return;

    const tracks = new Map();
    for (let index = 0; index < count; index += 1) {
      const line = document.createElementNS(SVG_NAMESPACE, "path");
      const progress = count === 1 ? 0.5 : index / (count - 1);
      const centeredProgress = progress - 0.5;
      const centerX = 1024;
      const centerY = 576 + Math.sin(index * 1.7) * 5;
      const radiusX = 748 + centeredProgress * 216;
      const radiusY = 211 + centeredProgress * 104;
      const controlX = radiusX * ELLIPSE_BEZIER_FACTOR;
      const controlY = radiusY * ELLIPSE_BEZIER_FACTOR;
      line.classList.add(
        "black-hole-orbit-line",
        index % 2 === 0
          ? "black-hole-orbit-line--clockwise"
          : "black-hole-orbit-line--counter",
        "black-hole-orbit-hit",
      );
      const fine = index % 3 === 1;
      const semicircle = !fine && index % 4 === 3;
      if (fine) {
        line.classList.add("black-hole-orbit-line--fine");
      } else if (semicircle) {
        line.classList.add("black-hole-orbit-line--semicircle");
      }
      setOrbitLineMaterial(line, index, "rim", fine, semicircle);
      // The four cubic joins share exact tangents, so the lower curve stays
      // smooth when a moving dash crosses either side turn and the path seam.
      line.setAttribute(
        "d",
        [
          `M ${centerX - radiusX} ${centerY}`,
          `C ${centerX - radiusX} ${centerY - controlY}`,
          `${centerX - controlX} ${centerY - radiusY}`,
          `${centerX} ${centerY - radiusY}`,
          `C ${centerX + controlX} ${centerY - radiusY}`,
          `${centerX + radiusX} ${centerY - controlY}`,
          `${centerX + radiusX} ${centerY}`,
          `C ${centerX + radiusX} ${centerY + controlY}`,
          `${centerX + controlX} ${centerY + radiusY}`,
          `${centerX} ${centerY + radiusY}`,
          `C ${centerX - controlX} ${centerY + radiusY}`,
          `${centerX - radiusX} ${centerY + controlY}`,
          `${centerX - radiusX} ${centerY}`,
          "Z",
        ].join(" "),
      );
      line.setAttribute("pathLength", String(ORBIT_PATH_LENGTH));
      const direction = index % 2 === 0 ? "clockwise" : "counter";
      getOrbitTrack(tracks, direction, "rim", progress).append(line);
    }
    densityOrbitGroup.replaceChildren(...tracks.values());
    renderedLineDensity = count;
  }

  function syncTopOrbitDensity() {
    const count = Math.round(state.topDensity);
    if (count === renderedTopDensity) return;

    const tracks = new Map();
    for (let index = 0; index < count; index += 1) {
      const line = document.createElementNS(SVG_NAMESPACE, "path");
      const progress = count === 1 ? 0.5 : index / (count - 1);
      const centeredProgress = progress - 0.5;
      const radiusX = 690 + progress * 170;
      const radiusY = 145 + progress * 70;
      const baseline = 578 + centeredProgress * 12;
      const left = 1024 - radiusX;
      const right = 1024 + radiusX;
      const flare = 105 + progress * 55;
      const flareDrop = 38 + progress * 18;
      line.classList.add(
        "black-hole-orbit-line",
        "black-hole-orbit-line--top",
        index % 2 === 0
          ? "black-hole-orbit-line--clockwise"
          : "black-hole-orbit-line--counter",
        "black-hole-orbit-hit",
      );
      const fine = index % 3 === 1;
      if (fine) {
        line.classList.add("black-hole-orbit-line--fine");
      }
      setOrbitLineMaterial(line, index, "top", fine);
      // The crown stays locked to one lensing silhouette. Its material now
      // travels along this curve in the same explicit directions as the rim.
      line.setAttribute(
        "d",
        [
          `M ${left - flare} ${baseline + flareDrop}`,
          `C ${left - flare * 0.52} ${baseline + flareDrop}`,
          `${left - radiusX * 0.025} ${baseline + flareDrop * 0.42}`,
          `${left} ${baseline}`,
          `C ${left + radiusX * 0.2} ${baseline - radiusY * 0.18}`,
          `${1024 - radiusX * 0.42} ${baseline - radiusY}`,
          `1024 ${baseline - radiusY}`,
          `C ${1024 + radiusX * 0.42} ${baseline - radiusY}`,
          `${right - radiusX * 0.2} ${baseline - radiusY * 0.18}`,
          `${right} ${baseline}`,
          `C ${right + radiusX * 0.025} ${baseline + flareDrop * 0.42}`,
          `${right + flare * 0.52} ${baseline + flareDrop}`,
          `${right + flare} ${baseline + flareDrop}`,
        ].join(" "),
      );
      line.setAttribute("pathLength", String(ORBIT_PATH_LENGTH));
      const direction = index % 2 === 0 ? "clockwise" : "counter";
      getOrbitTrack(tracks, direction, "top", progress).append(line);
    }
    topOrbitGroup.replaceChildren(...tracks.values());
    renderedTopDensity = count;
  }

  function updateOrbitActivity() {
    if (orbitsInView) {
      syncOrbitDensity();
      syncTopOrbitDensity();
      syncOrbitSpeed();
      if (bloomIsWarmed) bloomController?.sync(state);
    }
    const worldIsActive = orbitsInView && blackHoleWorldVisible;
    const active =
      worldIsActive &&
      !orbitScrollActive &&
      !document.hidden &&
      !reducedMotion.matches;
    stage.classList.toggle("black-hole-stage--active", worldIsActive);
    stage.classList.toggle("black-hole-stage--orbits-active", active);
    bloomController?.setActive(active && bloomIsWarmed);
  }

  function captureGravityGeometry() {
    gravityGeometry = new Map(
      [statement, bio, backdrop].map((element) => {
        const bounds = element.getBoundingClientRect();
        return [
          element,
          {
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          },
        ];
      }),
    );
  }

  function applyGravityPull(element, target, progress) {
    const origin = gravityGeometry?.get(element);
    if (!origin || reducedMotion.matches) {
      element.style.setProperty("--about-gravity-x", "0px");
      element.style.setProperty("--about-gravity-y", "0px");
      element.style.setProperty("--about-gravity-scale", "1");
      element.style.setProperty("--about-gravity-rotation", "0deg");
      return;
    }

    const pull = easeInOut(progress);
    const scale = Math.max(0.025, 1 - pull * 0.975);
    element.style.setProperty(
      "--about-gravity-x",
      `${(target.x - origin.x) * pull}px`,
    );
    element.style.setProperty(
      "--about-gravity-y",
      `${(target.y - origin.y) * pull}px`,
    );
    element.style.setProperty("--about-gravity-scale", String(scale));
    element.style.setProperty("--about-gravity-rotation", "0deg");
  }

  function renderAboutBeat(progress) {
    if (
      Math.abs(progress - renderedAboutProgress) < 0.0001 &&
      renderedAboutMotionPreference === reducedMotion.matches &&
      (progress < ABOUT_BIO_END || gravityGeometry)
    ) {
      return;
    }
    renderedAboutProgress = progress;
    renderedAboutMotionPreference = reducedMotion.matches;

    const blackHoleShift = easeInOut(clamp(progress / ABOUT_SETTLE_END, 0, 1));
    const bioReveal = easeInOut(
      clamp(
        (progress - ABOUT_BIO_START) / (ABOUT_BIO_END - ABOUT_BIO_START),
        0,
        1,
      ),
    );
    const absorptionRaw = clamp(
      (progress - ABOUT_ABSORPTION_START) / (1 - ABOUT_ABSORPTION_START),
      0,
      1,
    );
    const absorption = easeInOut(absorptionRaw);
    const blackHoleVisibility =
      1 - easeInOut(clamp((absorptionRaw - 0.64) / 0.28, 0, 1));
    const collapseVisibility =
      1 -
      easeInOut(
        clamp(
          (absorptionRaw - ABOUT_ABSORPTION_FADE_START) /
            (ABOUT_ABSORPTION_FADE_END - ABOUT_ABSORPTION_FADE_START),
          0,
          1,
        ),
      );
    const restingShift = reducedMotion.matches
      ? 0
      : Math.min(110, viewportHeight * 0.11) * blackHoleShift;
    const restingScale = 1 - blackHoleShift * 0.28;
    const growthScale =
      viewportWidth <= 760
        ? ABOUT_BLACK_HOLE_FINAL_SCALE.mobile
        : viewportWidth / Math.max(1, viewportHeight) >= 2
          ? ABOUT_BLACK_HOLE_FINAL_SCALE.ultrawide
          : ABOUT_BLACK_HOLE_FINAL_SCALE.desktop;
    const rotation = (state.rotation * Math.PI) / 180;
    const finalWidth = anchorWidth * state.size * growthScale;
    const finalHeight = finalWidth * (9 / 16);
    const rotatedHeight =
      Math.abs(finalHeight * Math.cos(rotation)) +
      Math.abs(finalWidth * Math.sin(rotation));
    /* Exit position: the entire depth-world object, including its responsive
       scale, clears the top edge before Skills enters the camera. */
    const finalLift = reducedMotion.matches
      ? 0
      : viewportHeight / 2 +
        state.y +
        rotatedHeight / 2 +
        Math.max(48, viewportHeight * 0.08);
    const shiftDistance =
      restingShift * (1 - absorption) - finalLift * absorption;
    const blackHoleScale = reducedMotion.matches
      ? 1
      : restingScale + (growthScale - restingScale) * absorption;
    const statementStartOffset = reducedMotion.matches
      ? 0
      : Math.min(44, viewportHeight * 0.05);

    if (!gravityGeometry && progress >= ABOUT_BIO_END) {
      captureGravityGeometry();
    }

    const gravityTarget = {
      x: viewportWidth / 2 + state.x,
      y: viewportHeight / 2 + state.y - finalLift,
    };

    stage.style.setProperty("--black-hole-settle-y", `${shiftDistance}px`);
    stage.style.setProperty(
      "--black-hole-world-opacity",
      String(blackHoleVisibility),
    );
    const nextBlackHoleWorldVisible = blackHoleVisibility > 0.002;
    if (nextBlackHoleWorldVisible !== blackHoleWorldVisible) {
      blackHoleWorldVisible = nextBlackHoleWorldVisible;
      updateOrbitActivity();
    }
    stage.style.setProperty(
      "--black-hole-settle-scale",
      String(blackHoleScale),
    );
    statement.style.setProperty(
      "--about-statement-settle-y",
      `${statementStartOffset * (1 - blackHoleShift)}px`,
    );
    statement.style.opacity = String(collapseVisibility);
    bio.style.opacity = String(bioReveal * collapseVisibility);
    backdrop.style.opacity = String(collapseVisibility);
    bio.style.filter = "none";
    bio.style.translate = `calc(-50% + var(--about-copy-x)) calc(var(--about-copy-y) + ${(1 - bioReveal) * 1.1}rem)`;
    applyGravityPull(statement, gravityTarget, absorptionRaw);
    applyGravityPull(bio, gravityTarget, absorptionRaw);
    applyGravityPull(backdrop, gravityTarget, absorptionRaw);
    about.classList.toggle(
      "about--absorbing",
      absorptionRaw > 0 && absorptionRaw < 1,
    );
  }

  function updateNarrative() {
    frame = 0;
    if (document.documentElement.classList.contains("is-skills-navigation")) {
      return;
    }
    const introPending = document.body.classList.contains("is-intro-pending");
    const introExiting = document.body.classList.contains("is-intro-exiting");
    const introStillBlocking =
      introPending && (!introExiting || window.scrollY <= 0);
    if (!objectReady || introStillBlocking) {
      return;
    }

    if (!flightController) {
      flightController = createScrollIdentityFlight({
        canvas,
        anchor,
        object,
        title,
        role,
        statementWords,
        reducedMotion,
        onAboutProgress: renderAboutBeat,
      });
      refreshNarrativeLayout();
    }

    const holdScroll = clamp(window.scrollY - aboutTop, 0, holdDistance);
    const aboutBeat = holdScroll / holdDistance;
    flightController.setProgress(window.scrollY / journeyDistance, {
      aboutProgress: aboutBeat,
      immediate: reducedMotion.matches,
    });
  }

  function requestNarrativeUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(updateNarrative);
  }

  function refreshNarrativeLayout() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    journeyDistance = Math.max(1, hero.offsetHeight * JOURNEY_SCROLL_RATIO);
    aboutTop = about.offsetTop;
    holdDistance = Math.max(1, about.offsetHeight - window.innerHeight);
    anchorWidth = Math.max(1, anchor.offsetWidth);
    gravityGeometry = null;
    renderedAboutProgress = -1;
  }

  function handleNarrativeScroll() {
    if (document.documentElement.classList.contains("is-skills-navigation")) {
      return;
    }
    if (orbitsInView && blackHoleWorldVisible) {
      if (!orbitScrollActive) {
        orbitScrollActive = true;
        updateOrbitActivity();
      }
      if (orbitScrollIdleTimer) window.clearTimeout(orbitScrollIdleTimer);
      orbitScrollIdleTimer = window.setTimeout(() => {
        orbitScrollIdleTimer = 0;
        orbitScrollActive = false;
        updateOrbitActivity();
      }, 140);
    }
    if (!narrativeInRange) return;
    requestNarrativeUpdate();
  }

  function render() {
    if (editorEnabled || orbitsInView) {
      syncOrbitDensity();
      syncTopOrbitDensity();
      syncOrbitSpeed();
    }
    stage.style.setProperty("--black-hole-x", `${state.x}px`);
    stage.style.setProperty("--black-hole-y", `${state.y}px`);
    stage.style.setProperty("--black-hole-depth", `${state.depth}px`);
    stage.style.setProperty("--black-hole-size", String(state.size));
    stage.style.setProperty("--black-hole-rotation", `${state.rotation}deg`);
    stage.style.setProperty("--black-hole-layer", String(state.order));
    stage.style.setProperty("--black-hole-orbit-x", `${state.orbitX}px`);
    stage.style.setProperty("--black-hole-orbit-y", `${state.orbitY}px`);
    stage.style.setProperty(
      "--black-hole-orbit-scale",
      String(state.orbitScale),
    );
    stage.style.setProperty(
      "--black-hole-orbit-height",
      String(state.orbitHeight),
    );
    stage.style.setProperty("--black-hole-orbit-color", state.lineOuterColor);
    stage.style.setProperty("--black-hole-line-width", String(state.lineWidth));
    stage.style.setProperty(
      "--black-hole-line-opacity",
      String(state.lineOpacity),
    );
    stage.style.setProperty("--black-hole-top-x", `${state.topX}px`);
    stage.style.setProperty("--black-hole-top-y", `${state.topY}px`);
    stage.style.setProperty("--black-hole-top-scale", String(state.topScale));
    stage.style.setProperty("--black-hole-top-height", String(state.topHeight));
    stage.style.setProperty("--black-hole-top-width", String(state.topWidth));
    stage.style.setProperty(
      "--black-hole-top-opacity",
      String(state.topOpacity),
    );
    stage.style.setProperty("--black-hole-top-color", state.lineInnerColor);
    stage.style.setProperty(
      "--black-hole-image-opacity",
      String(state.blackHoleOpacity),
    );
    stage.style.setProperty(
      "--black-hole-image-brightness",
      String(state.blackHoleBrightness),
    );
    stage.style.setProperty(
      "--black-hole-image-contrast",
      String(state.blackHoleContrast),
    );
    if (orbitsInView && bloomIsWarmed) bloomController?.sync(state);
    if (editorEnabled) {
      Object.entries(controls).forEach(([property, control]) => {
        control.value = String(state[property]);
      });
      outputs.orbitX.value = `${Math.round(state.orbitX)}px`;
      outputs.orbitY.value = `${Math.round(state.orbitY)}px`;
      outputs.orbitScale.value = `${state.orbitScale.toFixed(2)}×`;
      outputs.orbitHeight.value = `${state.orbitHeight.toFixed(2)}×`;
      outputs.orbitSpeed.value = `${state.orbitSpeed.toFixed(2)}×`;
      outputs.lineDensity.value = String(Math.round(state.lineDensity));
      outputs.lineWidth.value = `${state.lineWidth.toFixed(2)}px`;
      outputs.lineOpacity.value = `${Math.round(state.lineOpacity * 100)}%`;
      outputs.glowStrength.value = `${state.glowStrength.toFixed(2)}×`;
      outputs.glowRadius.value = `${state.glowRadius.toFixed(2)}`;
      outputs.glowThreshold.value = `${state.glowThreshold.toFixed(2)}`;
      outputs.glowExposure.value = `${state.glowExposure.toFixed(2)}×`;
      outputs.topX.value = `${Math.round(state.topX)}px`;
      outputs.topY.value = `${Math.round(state.topY)}px`;
      outputs.topScale.value = `${state.topScale.toFixed(2)}×`;
      outputs.topHeight.value = `${state.topHeight.toFixed(2)}×`;
      outputs.topDensity.value = String(Math.round(state.topDensity));
      outputs.topWidth.value = `${state.topWidth.toFixed(2)}px`;
      outputs.topOpacity.value = `${Math.round(state.topOpacity * 100)}%`;
      outputs.blackHoleOpacity.value = `${Math.round(
        state.blackHoleOpacity * 100,
      )}%`;
      outputs.blackHoleBrightness.value = `${Math.round(
        state.blackHoleBrightness * 100,
      )}%`;
      outputs.blackHoleContrast.value = `${Math.round(
        state.blackHoleContrast * 100,
      )}%`;
      Object.entries(fluidControls).forEach(([property, control]) => {
        control.value = String(fluidState[property]);
      });
      fluidOutputs.opacity.value = `${Math.round(fluidState.opacity * 100)}%`;
      fluidOutputs.colorStrength.value = `${Math.round(
        fluidState.colorStrength * 100,
      )}%`;
      fluidOutputs.fadeTime.value = `${fluidState.fadeTime.toFixed(2)}s`;
      fluidOutputs.radius.value = fluidState.radius.toFixed(2);
      fluidOutputs.force.value = String(Math.round(fluidState.force));
      fluidOutputs.curl.value = fluidState.curl.toFixed(1);
      fluidOutputs.reach.value = `${fluidState.reach.toFixed(2)}×`;
      fluidOutputs.emissionRate.value = `${fluidState.emissionRate.toFixed(1)}/s`;
      fluidOutputs.originX.value = `${Math.round(fluidState.originX * 100)}%`;
      fluidOutputs.emitterGap.value = `${Math.round(
        fluidState.emitterGap * 100,
      )}%`;
      fluidOutputs.emitterY.value = `${Math.round(fluidState.emitterY * 100)}%`;
      fluidOutputs.emitterSpread.value = `${Math.round(
        fluidState.emitterSpread * 100,
      )}%`;
      publishFluidSettings(fluidState);
    }
    renderedAboutProgress = -1;
    requestNarrativeUpdate();
  }

  function save() {
    if (!editorEnabled) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setEditorOpen(open) {
    panel.hidden = !open;
    toggle.hidden = open;
    toggle.setAttribute("aria-expanded", String(open));
    stage.classList.toggle("black-hole-stage--editing", open);
    if (open) {
      applyEditorLayout();
      window.requestAnimationFrame(clampEditorToViewport);
    }
  }

  function positionEditor(x, y) {
    const width = Math.max(1, editor.offsetWidth);
    const height = Math.max(1, editor.offsetHeight);
    const nextX = clamp(x, 8, Math.max(8, window.innerWidth - width - 8));
    const nextY = clamp(y, 8, Math.max(8, window.innerHeight - height - 8));
    editor.style.inset = `${nextY}px auto auto ${nextX}px`;
  }

  function clampEditorToViewport() {
    if (panel.hidden) return;
    const bounds = editor.getBoundingClientRect();
    positionEditor(bounds.left, bounds.top);
  }

  function saveEditorLayout() {
    if (panel.hidden) return;
    const editorBounds = editor.getBoundingClientRect();
    const panelBounds = panel.getBoundingClientRect();
    editorLayout = {
      x: editorBounds.left,
      y: editorBounds.top,
      width: panelBounds.width,
      height: panelBounds.height,
    };
    localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(editorLayout));
  }

  function applyEditorLayout() {
    if (!editorLayout) return;
    panel.style.inlineSize = `${clamp(
      editorLayout.width,
      Math.min(256, window.innerWidth - 16),
      Math.max(1, window.innerWidth - 16),
    )}px`;
    panel.style.blockSize = `${clamp(
      editorLayout.height,
      Math.min(288, window.innerHeight - 16),
      Math.max(1, window.innerHeight - 16),
    )}px`;
    positionEditor(editorLayout.x, editorLayout.y);
  }

  function handleEditorPointerDown(event) {
    if (panel.hidden || event.button !== 0) return;
    event.preventDefault();
    const bounds = editor.getBoundingClientRect();
    positionEditor(bounds.left, bounds.top);
    editorDrag = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: bounds.left,
      y: bounds.top,
    };
    editorHandle.setPointerCapture(event.pointerId);
  }

  function handleEditorPointerMove(event) {
    if (!editorDrag || editorDrag.pointerId !== event.pointerId) return;
    positionEditor(
      editorDrag.x + event.clientX - editorDrag.pointerX,
      editorDrag.y + event.clientY - editorDrag.pointerY,
    );
  }

  function handleEditorPointerUp(event) {
    if (!editorDrag || editorDrag.pointerId !== event.pointerId) return;
    editorDrag = null;
    saveEditorLayout();
  }

  function handleEditorKeydown(event) {
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const bounds = editor.getBoundingClientRect();
    const step = event.shiftKey ? 40 : 10;
    positionEditor(
      bounds.left + direction[0] * step,
      bounds.top + direction[1] * step,
    );
    saveEditorLayout();
  }

  function handlePanelPointerDown(event) {
    if (event.button !== 0) return;
    const bounds = panel.getBoundingClientRect();
    const resizeHandleSize = 24;
    editorResizeActive =
      event.clientX >= bounds.right - resizeHandleSize &&
      event.clientY >= bounds.bottom - resizeHandleSize;
  }

  function handlePanelPointerUp() {
    if (!editorResizeActive) return;
    editorResizeActive = false;
    saveEditorLayout();
  }

  function activateTab(name, moveFocus = false) {
    tabs.forEach((tab) => {
      const active = tab.dataset.blackHoleTab === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && moveFocus) tab.focus();
    });
    tabPanels.forEach((tabPanel) => {
      tabPanel.hidden = tabPanel.dataset.blackHolePanel !== name;
    });
  }

  function handleTabClick(event) {
    activateTab(event.currentTarget.dataset.blackHoleTab);
  }

  function handleTabKeydown(event) {
    const currentIndex = tabs.indexOf(event.currentTarget);
    let nextIndex;
    if (event.key === "ArrowRight")
      nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    activateTab(tabs[nextIndex].dataset.blackHoleTab, true);
  }

  function handleOrbitPointerDown(event) {
    if (panel.hidden) return;
    event.stopPropagation();
    orbitDrag = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      orbitX: state.orbitX,
      orbitY: state.orbitY,
    };
    orbits.setPointerCapture(event.pointerId);
  }

  function handleOrbitPointerMove(event) {
    if (!orbitDrag || orbitDrag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const anchorBounds = anchor.getBoundingClientRect();
    const localScale = 2048 / Math.max(1, anchorBounds.width);
    state.orbitX = clamp(
      orbitDrag.orbitX + (event.clientX - orbitDrag.pointerX) * localScale,
      Number(controls.orbitX.min),
      Number(controls.orbitX.max),
    );
    state.orbitY = clamp(
      orbitDrag.orbitY + (event.clientY - orbitDrag.pointerY) * localScale,
      Number(controls.orbitY.min),
      Number(controls.orbitY.max),
    );
    render();
  }

  function handleOrbitPointerUp(event) {
    if (!orbitDrag || orbitDrag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    orbitDrag = null;
    save();
  }

  function handleControlInput(event) {
    const property = event.currentTarget.dataset.blackHoleProperty;
    state[property] =
      property === "orbitColor" ||
      property === "topColor" ||
      property === "lineInnerColor" ||
      property === "lineOuterColor"
        ? event.currentTarget.value
        : Number(event.currentTarget.value);
    render();
    save();
  }

  function handleFluidControlInput(event) {
    const property = event.currentTarget.dataset.fluidProperty;
    fluidState = {
      ...fluidState,
      [property]:
        event.currentTarget.type === "color" ||
        event.currentTarget.tagName === "SELECT"
          ? event.currentTarget.value
          : Number(event.currentTarget.value),
    };
    fluidState = saveFluidSettings(fluidState);
    render();
  }

  function handleReset() {
    state = {
      ...state,
      orbitX: DEFAULT_STATE.orbitX,
      orbitY: DEFAULT_STATE.orbitY,
      orbitScale: DEFAULT_STATE.orbitScale,
      orbitHeight: DEFAULT_STATE.orbitHeight,
      orbitColor: DEFAULT_STATE.orbitColor,
      orbitSpeed: DEFAULT_STATE.orbitSpeed,
      lineDensity: DEFAULT_STATE.lineDensity,
      lineWidth: DEFAULT_STATE.lineWidth,
      lineOpacity: DEFAULT_STATE.lineOpacity,
      lineInnerColor: DEFAULT_STATE.lineInnerColor,
      lineOuterColor: DEFAULT_STATE.lineOuterColor,
      lineMaterialVersion: DEFAULT_STATE.lineMaterialVersion,
      glowStrength: DEFAULT_STATE.glowStrength,
      glowRadius: DEFAULT_STATE.glowRadius,
      glowThreshold: DEFAULT_STATE.glowThreshold,
      glowExposure: DEFAULT_STATE.glowExposure,
      topX: DEFAULT_STATE.topX,
      topY: DEFAULT_STATE.topY,
      topScale: DEFAULT_STATE.topScale,
      topHeight: DEFAULT_STATE.topHeight,
      topDensity: DEFAULT_STATE.topDensity,
      topWidth: DEFAULT_STATE.topWidth,
      topOpacity: DEFAULT_STATE.topOpacity,
      topColor: DEFAULT_STATE.topColor,
      blackHoleOpacity: DEFAULT_STATE.blackHoleOpacity,
      blackHoleBrightness: DEFAULT_STATE.blackHoleBrightness,
      blackHoleContrast: DEFAULT_STATE.blackHoleContrast,
    };
    fluidState = saveFluidSettings(DEFAULT_FLUID_SETTINGS);
    render();
    save();
  }

  function handleOpen() {
    setEditorOpen(true);
  }

  function handleClose() {
    setEditorOpen(false);
  }

  if (editorEnabled) {
    toggle.addEventListener("click", handleOpen);
    close.addEventListener("click", handleClose);
    editorHandle.addEventListener("pointerdown", handleEditorPointerDown);
    editorHandle.addEventListener("pointermove", handleEditorPointerMove);
    editorHandle.addEventListener("pointerup", handleEditorPointerUp);
    editorHandle.addEventListener("pointercancel", handleEditorPointerUp);
    editorHandle.addEventListener("keydown", handleEditorKeydown);
    panel.addEventListener("pointerdown", handlePanelPointerDown);
    window.addEventListener("pointerup", handlePanelPointerUp);
    window.addEventListener("pointercancel", handlePanelPointerUp);
    tabs.forEach((tab) => {
      tab.addEventListener("click", handleTabClick);
      tab.addEventListener("keydown", handleTabKeydown);
    });
    reset.addEventListener("click", handleReset);
    Object.values(controls).forEach((control) =>
      control.addEventListener("input", handleControlInput),
    );
    Object.values(fluidControls).forEach((control) =>
      control.addEventListener("input", handleFluidControlInput),
    );
    orbits.addEventListener("pointerdown", handleOrbitPointerDown);
    orbits.addEventListener("pointermove", handleOrbitPointerMove);
    orbits.addEventListener("pointerup", handleOrbitPointerUp);
    orbits.addEventListener("pointercancel", handleOrbitPointerUp);
  }
  window.addEventListener("scroll", handleNarrativeScroll, { passive: true });
  window.addEventListener(
    "portfolio:section-navigation-settle",
    requestNarrativeUpdate,
  );
  function handleViewportResize() {
    if (panel && !panel.hidden) {
      if (editorLayout) applyEditorLayout();
      else clampEditorToViewport();
    }
    refreshNarrativeLayout();
    flightController?.refreshLayout();
    requestNarrativeUpdate();
  }

  window.addEventListener("resize", handleViewportResize);
  function handleReducedMotionChange() {
    renderedAboutProgress = -1;
    updateOrbitActivity();
    requestNarrativeUpdate();
  }

  function handleVisibilityChange() {
    updateOrbitActivity();
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  reducedMotion.addEventListener("change", handleReducedMotionChange);
  const introObserver = new MutationObserver(() => {
    requestNarrativeUpdate();
    scheduleBloomWarmup();
  });
  introObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  if (panel) resizeObserver?.observe(panel);
  orbitVisibilityObserver.observe(object);
  aboutVisibilityObserver.observe(about);
  narrativeVisibilityObserver.observe(hero);
  narrativeVisibilityObserver.observe(about);

  function warmOrbitGeometry() {
    orbitWarmupHandle = 0;
    if (disposed) return;
    syncOrbitDensity();
    syncTopOrbitDensity();
    syncOrbitSpeed();
  }

  async function warmBloomRenderer() {
    bloomWarmupHandle = 0;
    if (disposed || bloomIsWarmed) return;
    try {
      const { createBlackHoleBloom } = await import("./black-hole-bloom.js");
      if (disposed || bloomIsWarmed) return;
      bloomController = createBlackHoleBloom({
        object,
        rimGroup: densityOrbitGroup,
        crownGroup: topOrbitGroup,
        reducedMotion,
      });
      bloomController.sync(state);
      bloomIsWarmed = true;
      updateOrbitActivity();
    } catch (error) {
      // The SVG trajectories are the complete transparent fallback, so a
      // WebGL/post-processing failure must never remove the moving lines.
      console.warn("Black-hole bloom could not be initialized.", error);
    }
  }

  function scheduleBloomWarmup() {
    if (
      disposed ||
      bloomIsWarmed ||
      bloomWarmupHandle ||
      bloomWarmupDelayHandle ||
      !document.body.classList.contains("is-intro-complete")
    ) {
      return;
    }
    const requestWarmupWhenIdle = () => {
      bloomWarmupDelayHandle = 0;
      if (disposed || bloomIsWarmed || bloomWarmupHandle) return;
      if ("requestIdleCallback" in window) {
        bloomWarmupUsesIdleCallback = true;
        // No timeout: shader compilation must never interrupt active scrolling.
        // The SVG core already supplies the visible moving lines until bloom is
        // safely ready.
        bloomWarmupHandle = window.requestIdleCallback(warmBloomRenderer);
      } else {
        bloomWarmupUsesIdleCallback = false;
        bloomWarmupHandle = window.setTimeout(warmBloomRenderer, 500);
      }
    };

    // A direct About entry is animating the merged dot into the black hole, so
    // wait for that reveal before asking the browser for an idle compile slot.
    if (window.location.hash) {
      bloomWarmupDelayHandle = window.setTimeout(requestWarmupWhenIdle, 1800);
    } else {
      requestWarmupWhenIdle();
    }
  }

  if ("requestIdleCallback" in window) {
    orbitWarmupUsesIdleCallback = true;
    orbitWarmupHandle = window.requestIdleCallback(warmOrbitGeometry, {
      timeout: 1500,
    });
  } else {
    orbitWarmupHandle = window.setTimeout(warmOrbitGeometry, 700);
  }

  scheduleBloomWarmup();
  render();
  function markObjectReady() {
    if (disposed || objectReady) return;
    objectReady = true;
    stage.classList.add("black-hole-stage--ready");
    requestNarrativeUpdate();
  }

  if (image.complete) markObjectReady();
  else {
    image.addEventListener("load", markObjectReady, { once: true });
    image.addEventListener("error", markObjectReady, { once: true });
  }

  return () => {
    disposed = true;
    if (orbitScrollIdleTimer) window.clearTimeout(orbitScrollIdleTimer);
    if (orbitWarmupHandle) {
      if (orbitWarmupUsesIdleCallback) {
        window.cancelIdleCallback(orbitWarmupHandle);
      } else {
        window.clearTimeout(orbitWarmupHandle);
      }
    }
    if (bloomWarmupHandle) {
      if (bloomWarmupUsesIdleCallback) {
        window.cancelIdleCallback(bloomWarmupHandle);
      } else {
        window.clearTimeout(bloomWarmupHandle);
      }
    }
    if (bloomWarmupDelayHandle) {
      window.clearTimeout(bloomWarmupDelayHandle);
    }
    image.removeEventListener("load", markObjectReady);
    image.removeEventListener("error", markObjectReady);
    flightController?.dispose();
    bloomController?.dispose();
    stage.style.removeProperty("--black-hole-settle-y");
    stage.style.removeProperty("--black-hole-settle-scale");
    stage.style.removeProperty("--black-hole-world-opacity");
    statement.style.removeProperty("--about-statement-settle-y");
    about.classList.remove("about--absorbing");
    [statement, bio, backdrop].forEach((element) => {
      element.style.removeProperty("--about-gravity-x");
      element.style.removeProperty("--about-gravity-y");
      element.style.removeProperty("--about-gravity-scale");
      element.style.removeProperty("--about-gravity-rotation");
      element.style.removeProperty("opacity");
    });
    bio.style.removeProperty("filter");
    bio.style.removeProperty("translate");
    if (editorEnabled) {
      orbits.removeEventListener("pointerdown", handleOrbitPointerDown);
      orbits.removeEventListener("pointermove", handleOrbitPointerMove);
      orbits.removeEventListener("pointerup", handleOrbitPointerUp);
      orbits.removeEventListener("pointercancel", handleOrbitPointerUp);
      toggle.removeEventListener("click", handleOpen);
      close.removeEventListener("click", handleClose);
      editorHandle.removeEventListener("pointerdown", handleEditorPointerDown);
      editorHandle.removeEventListener("pointermove", handleEditorPointerMove);
      editorHandle.removeEventListener("pointerup", handleEditorPointerUp);
      editorHandle.removeEventListener("pointercancel", handleEditorPointerUp);
      editorHandle.removeEventListener("keydown", handleEditorKeydown);
      panel.removeEventListener("pointerdown", handlePanelPointerDown);
      window.removeEventListener("pointerup", handlePanelPointerUp);
      window.removeEventListener("pointercancel", handlePanelPointerUp);
      tabs.forEach((tab) => {
        tab.removeEventListener("click", handleTabClick);
        tab.removeEventListener("keydown", handleTabKeydown);
      });
      reset.removeEventListener("click", handleReset);
      Object.values(controls).forEach((control) =>
        control.removeEventListener("input", handleControlInput),
      );
      Object.values(fluidControls).forEach((control) =>
        control.removeEventListener("input", handleFluidControlInput),
      );
    }
    window.removeEventListener("scroll", handleNarrativeScroll);
    window.removeEventListener(
      "portfolio:section-navigation-settle",
      requestNarrativeUpdate,
    );
    window.removeEventListener("resize", handleViewportResize);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    reducedMotion.removeEventListener("change", handleReducedMotionChange);
    introObserver.disconnect();
    resizeObserver?.disconnect();
    orbitVisibilityObserver.disconnect();
    aboutVisibilityObserver.disconnect();
    narrativeVisibilityObserver.disconnect();
    densityOrbitGroup.remove();
    topOrbitGroup.remove();
    authoredOrbitLines.forEach((line) => line.removeAttribute("display"));
    if (frame) window.cancelAnimationFrame(frame);
  };
}
