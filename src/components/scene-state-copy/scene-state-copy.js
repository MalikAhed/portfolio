import "./scene-state-copy.css";

const BLACK_HOLE_STORAGE_KEY = "portfolio-black-hole-v4";
const BLACK_HOLE_EDITOR_STORAGE_KEY = "portfolio-black-hole-editor-v2";
const OVERLAY_STORAGE_KEY = "portfolio-overlay-position-v2";
const PORTFOLIO_STORAGE_PREFIX = "portfolio-";
const SNAPSHOT_VERSION = 1;

const SCENE_VARIABLES = Object.freeze({
  flow: Object.freeze([
    "--overlay-x",
    "--overlay-y",
    "--overlay-rotation",
    "--overlay-scale",
    "--portrait-tail-size",
    "--cutout-offset",
  ]),
  blackHole: Object.freeze([
    "--black-hole-x",
    "--black-hole-y",
    "--black-hole-depth",
    "--black-hole-size",
    "--black-hole-rotation",
    "--black-hole-layer",
    "--black-hole-orbit-x",
    "--black-hole-orbit-y",
    "--black-hole-orbit-scale",
    "--black-hole-orbit-height",
    "--black-hole-orbit-color",
    "--black-hole-line-width",
    "--black-hole-line-opacity",
    "--black-hole-top-x",
    "--black-hole-top-y",
    "--black-hole-top-scale",
    "--black-hole-top-height",
    "--black-hole-top-width",
    "--black-hole-top-opacity",
    "--black-hole-top-color",
    "--black-hole-image-opacity",
  ]),
  aboutCopy: Object.freeze([
    "--about-copy-x",
    "--about-copy-y",
    "--about-copy-width",
    "--about-copy-size-adjust",
    "--about-copy-weight",
  ]),
});

const BLACK_HOLE_VARIABLE_STATE = Object.freeze({
  x: "--black-hole-x",
  y: "--black-hole-y",
  depth: "--black-hole-depth",
  size: "--black-hole-size",
  rotation: "--black-hole-rotation",
  order: "--black-hole-layer",
  orbitX: "--black-hole-orbit-x",
  orbitY: "--black-hole-orbit-y",
  orbitScale: "--black-hole-orbit-scale",
  orbitHeight: "--black-hole-orbit-height",
  orbitColor: "--black-hole-orbit-color",
  lineWidth: "--black-hole-line-width",
  lineOpacity: "--black-hole-line-opacity",
  topX: "--black-hole-top-x",
  topY: "--black-hole-top-y",
  topScale: "--black-hole-top-scale",
  topHeight: "--black-hole-top-height",
  topWidth: "--black-hole-top-width",
  topOpacity: "--black-hole-top-opacity",
  topColor: "--black-hole-top-color",
  blackHoleOpacity: "--black-hole-image-opacity",
});

function readStoredValue(key) {
  const stored = localStorage.getItem(key);
  if (stored === null) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return stored;
  }
}

function readPortfolioStorage() {
  return Object.fromEntries(
    Array.from({ length: localStorage.length }, (_, index) =>
      localStorage.key(index),
    )
      .filter((key) => key?.startsWith(PORTFOLIO_STORAGE_PREFIX))
      .sort()
      .map((key) => [key, readStoredValue(key)]),
  );
}

function readControls(selector, propertyName) {
  return Object.fromEntries(
    Array.from(document.querySelectorAll(selector), (control) => {
      const property = control.dataset[propertyName];
      const numericValue = Number(control.value);
      const value =
        control.type === "color" || !Number.isFinite(numericValue)
          ? control.value
          : numericValue;
      return [property, value];
    }),
  );
}

function readCustomProperties(element, properties) {
  if (!element) return null;
  const styles = getComputedStyle(element);
  return Object.fromEntries(
    properties.map((property) => [
      property,
      styles.getPropertyValue(property).trim(),
    ]),
  );
}

function readRect(element) {
  if (!element) return null;
  const bounds = element.getBoundingClientRect();
  return {
    x: Number(bounds.x.toFixed(2)),
    y: Number(bounds.y.toFixed(2)),
    width: Number(bounds.width.toFixed(2)),
    height: Number(bounds.height.toFixed(2)),
  };
}

function parseNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readOverlayState(flow) {
  const stored = readStoredValue(OVERLAY_STORAGE_KEY);
  if (stored && typeof stored === "object") return stored;

  const styles = getComputedStyle(flow);
  const tailSize = parseNumber(styles.getPropertyValue("--portrait-tail-size"));
  const angle =
    tailSize > 0
      ? (Math.atan(window.innerWidth / 2 / tailSize) * 360) / Math.PI
      : null;

  return {
    x: parseNumber(styles.getPropertyValue("--overlay-x")),
    y: parseNumber(styles.getPropertyValue("--overlay-y")),
    rotation: parseNumber(styles.getPropertyValue("--overlay-rotation")),
    scale: parseNumber(styles.getPropertyValue("--overlay-scale"), 1),
    angle: angle === null ? null : Number(angle.toFixed(4)),
    cutoutOffset: parseNumber(styles.getPropertyValue("--cutout-offset")),
  };
}

function readBlackHoleState(stage) {
  const liveVariables = readCustomProperties(stage, SCENE_VARIABLES.blackHole);
  const liveState = Object.fromEntries(
    Object.entries(BLACK_HOLE_VARIABLE_STATE).map(([property, variable]) => {
      const value = liveVariables?.[variable] ?? "";
      return [
        property,
        property === "orbitColor" || property === "topColor"
          ? value
          : parseNumber(value),
      ];
    }),
  );
  const storedState = readStoredValue(BLACK_HOLE_STORAGE_KEY);

  return {
    ...liveState,
    ...readControls("[data-black-hole-property]", "blackHoleProperty"),
    ...(storedState && typeof storedState === "object" ? storedState : {}),
  };
}

function createSceneSnapshot() {
  const flow = document.querySelector(".hero-about-flow");
  const hero = document.querySelector(".hero");
  const overlay = document.querySelector(".two-section-overlay__image");
  const scene = document.querySelector(".scene");
  const sceneCanvas = scene?.querySelector("canvas");
  const blackHoleStage = document.querySelector(".black-hole-stage");
  const blackHoleObject = document.querySelector(".black-hole-object");
  const aboutCopy = document.querySelector("[data-about-bio]");
  const overlayState = readOverlayState(flow);
  const flowVariables = readCustomProperties(flow, SCENE_VARIABLES.flow);

  return {
    schema: "portfolio-hero-about-scene-state",
    version: SNAPSHOT_VERSION,
    capturedAt: new Date().toISOString(),
    source: {
      origin: window.location.origin,
      pathname: window.location.pathname,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    blackHole: {
      state: readBlackHoleState(blackHoleStage),
      editorLayout: readStoredValue(BLACK_HOLE_EDITOR_STORAGE_KEY),
      liveVariables: readCustomProperties(
        blackHoleStage,
        SCENE_VARIABLES.blackHole,
      ),
      geometry: {
        stage: readRect(blackHoleStage),
        object: readRect(blackHoleObject),
        rimLines: document.querySelectorAll(
          ".black-hole-orbits__density-lines .black-hole-orbit-line",
        ).length,
        crownLines: document.querySelectorAll(
          ".black-hole-orbits__top-lines .black-hole-orbit-line",
        ).length,
      },
    },
    shadowOverlay: {
      x: overlayState.x,
      y: overlayState.y,
      rotation: overlayState.rotation,
      scale: overlayState.scale,
      geometry: readRect(overlay),
    },
    cutoutAndTriangle: {
      angle: overlayState.angle,
      cutoutOffset: overlayState.cutoutOffset,
      portraitTailSize: flowVariables?.["--portrait-tail-size"] ?? null,
      clipPath: scene ? getComputedStyle(scene).clipPath : null,
      sceneGeometry: readRect(scene),
      canvas: sceneCanvas
        ? {
            cssGeometry: readRect(sceneCanvas),
            bufferWidth: sceneCanvas.width,
            bufferHeight: sceneCanvas.height,
          }
        : null,
    },
    aboutCopy: {
      state: readControls("[data-about-copy-property]", "aboutCopyProperty"),
      liveVariables: readCustomProperties(aboutCopy, SCENE_VARIABLES.aboutCopy),
      geometry: readRect(aboutCopy),
    },
    fluidCursor: {
      state: readControls("[data-fluid-property]", "fluidProperty"),
      opacity: getComputedStyle(document.documentElement)
        .getPropertyValue("--fluid-cursor-opacity")
        .trim(),
    },
    liveScene: {
      flowVariables,
      heroGeometry: readRect(hero),
      flowGeometry: readRect(flow),
      scrollY: window.scrollY,
    },
    portfolioStorage: readPortfolioStorage(),
  };
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Clipboard access was unavailable.");
}

export function initSceneStateCopy() {
  const button = document.querySelector("[data-full-scene-copy]");
  const status = document.querySelector("[data-scene-state-copy-status]");
  if (!button || !status) return () => {};

  let resetTimer = 0;

  async function handleCopy() {
    window.clearTimeout(resetTimer);
    button.disabled = true;
    button.dataset.copyState = "copying";
    status.textContent = "Collecting every Hero/About scene value…";

    try {
      const snapshot = createSceneSnapshot();
      await copyText(JSON.stringify(snapshot, null, 2));
      button.dataset.copyState = "copied";
      button.textContent = "Full state copied";
      status.textContent =
        "Copied black hole, overlay, cutout, triangle, About, and stored editor values.";
    } catch (error) {
      console.error("The full scene state could not be copied.", error);
      button.dataset.copyState = "error";
      status.textContent =
        "Clipboard failed. Check browser clipboard permission.";
    } finally {
      button.disabled = false;
      resetTimer = window.setTimeout(() => {
        delete button.dataset.copyState;
        button.textContent = "Copy full scene state";
        status.textContent = "";
      }, 4200);
    }
  }

  button.addEventListener("click", handleCopy);

  return () => {
    window.clearTimeout(resetTimer);
    button.removeEventListener("click", handleCopy);
  };
}
