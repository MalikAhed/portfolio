import * as THREE from "three";
import { getRequiredElement } from "../lib/dom.js";
import {
  FOCUS_WORLD_CONFIG,
  HERO_CAMERA_Z,
  JOURNEY_CAMERA_END_Z,
  MORE_WORK_WORLD_CONFIG,
  WARP_SPEED_WORLD_CONFIG,
  WORK_TITLE_WORLD_CONFIG,
  WORLD_CAMERA_FOV,
  getCameraZAtProgress,
  getProjectFrameEntryAtDepth,
  getWorldBlurAtDepth,
  getWorldVisibilityAtDepth,
} from "./config.js";
import { createPortfolioCards } from "./cards.js";
import { initBlackHoleCameraEditor } from "./black-hole-camera-editor.js";
import { createStockthinkChessWorld } from "./chess-world.js";
import { createCubeBurgerIngredientWorld } from "./ingredient-world.js";
import { initLearnObjectEditor } from "./learn-object-editor.js";
import { createMurajaaScreenWorld } from "./murajaa-world.js";
import { createLearnObjectWorld } from "./learn-world.js";

const BACKGROUND_COLOR = 0xf5f0e8;
// The portrait texture is 1024px wide, so rendering a larger full-screen
// framebuffer adds GPU work without adding visible portrait detail.
const DEFAULT_RENDER_BUDGET = Object.freeze({
  maxAnisotropy: 8,
  maxPixelCount: 1920 * 1080,
  maxPixelRatio: 1.75,
});
const CONSTRAINED_RENDER_BUDGET = Object.freeze({
  maxAnisotropy: 4,
  maxPixelCount: 1280 * 720,
  maxPixelRatio: 1.4,
});
const INTRO_MINIMUM_MS = 1200;
const INTRO_CAMERA_DURATION_MS = 2000;
const INTRO_FAILSAFE_MS = 1000;
const SPLASH_REVEAL_FAILSAFE_MS = 1400;
// Leave enough headroom for a temporarily missed frame. A short debounce can
// otherwise re-enable expensive settled-state paint work in the middle of a
// fast scroll and create a self-reinforcing jank loop on slower devices.
const SCROLL_RENDER_SETTLE_MS = 320;
const PORTRAIT_ALPHA_CUTOFF = 0.45;
const PORTRAIT_SHADOW_OPACITY = 0.28;
const PORTRAIT_SHADOW_BLUR_TEXELS = 10;
const PORTRAIT_SHADOW_OFFSET_X = 0.04;
const PORTRAIT_SHADOW_TEXTURE_WIDTH = 512;
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const PORTRAIT_TEXTURE_URL = assetUrl("assets/malik-cutout-v3.webp");

function getRenderBudget() {
  const deviceMemory = Number(navigator.deviceMemory) || Infinity;
  const processorCount = navigator.hardwareConcurrency || Infinity;
  const constrainedDevice =
    navigator.connection?.saveData || deviceMemory <= 4 || processorCount <= 4;

  return constrainedDevice ? CONSTRAINED_RENDER_BUDGET : DEFAULT_RENDER_BUDGET;
}

function createPortraitShadowMaterial(portraitTexture) {
  const source = portraitTexture.image;
  const scale = Math.min(1, PORTRAIT_SHADOW_TEXTURE_WIDTH / source.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.MeshBasicMaterial({
      color: 0x171512,
      map: portraitTexture,
      opacity: PORTRAIT_SHADOW_OPACITY,
      transparent: true,
      alphaTest: 0.35,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    });
  }

  context.filter = `blur(${PORTRAIT_SHADOW_BLUR_TEXELS * scale}px)`;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  context.filter = "none";
  context.globalCompositeOperation = "source-in";
  context.fillStyle = "#171512";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const shadowTexture = new THREE.CanvasTexture(canvas);
  shadowTexture.colorSpace = THREE.SRGBColorSpace;
  shadowTexture.generateMipmaps = false;
  shadowTexture.minFilter = THREE.LinearFilter;
  shadowTexture.magFilter = THREE.LinearFilter;

  return new THREE.MeshBasicMaterial({
    map: shadowTexture,
    opacity: PORTRAIT_SHADOW_OPACITY,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  });
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createWarpLines(canvas, occluders) {
  const context = canvas.getContext("2d", { alpha: true });
  const maximumLineCount = 220;
  const lines = Array.from({ length: maximumLineCount }, () => ({}));
  let width = 1;
  let height = 1;
  let active = false;
  let travel = 0;
  let colorChannel = 16;
  let animationFrameId = 0;
  let previousTime = 0;

  function resetLine(line, distribute = false) {
    line.angle = Math.random() * Math.PI * 2;
    line.radius = distribute ? Math.random() : Math.random() * 0.075;
    line.speed = 0.45 + Math.random() * 0.9;
    line.brightness = 0.38 + Math.random() * 0.62;
    line.width = 0.45 + Math.random() * 1.25;
  }

  lines.forEach((line) => resetLine(line, true));

  function eraseForegroundWork() {
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "#000";

    occluders.forEach(({ element, opacityElement = element }) => {
      const opacity = Number.parseFloat(opacityElement.style.opacity || "1");
      if (
        opacity <= FOCUS_WORLD_CONFIG.visibilityThreshold ||
        opacityElement.style.visibility === "hidden"
      ) {
        return;
      }

      const bounds = element.getBoundingClientRect();
      if (
        bounds.right <= 0 ||
        bounds.bottom <= 0 ||
        bounds.left >= width ||
        bounds.top >= height
      ) {
        return;
      }

      // Clear slightly beyond the visual bounds so the canvas drop shadow
      // cannot leak back over the foreground edge.
      const padding = 12;
      const x = bounds.left - padding;
      const y = bounds.top - padding;
      const occluderWidth = bounds.width + padding * 2;
      const occluderHeight = bounds.height + padding * 2;

      context.globalAlpha = clamp(opacity);
      context.beginPath();
      if (typeof context.roundRect === "function") {
        context.roundRect(x, y, occluderWidth, occluderHeight, 32);
      } else {
        context.rect(x, y, occluderWidth, occluderHeight);
      }
      context.fill();
    });

    context.restore();
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function render(time) {
    animationFrameId = 0;
    if (!active || !context || document.hidden) return;

    const deltaTime = previousTime
      ? THREE.MathUtils.clamp((time - previousTime) / 1000, 0, 0.05)
      : 1 / 60;
    previousTime = time;
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const maximumRadius = Math.hypot(width, height) * 0.62;
    const visibleLineCount = Math.round(
      THREE.MathUtils.lerp(42, maximumLineCount, travel),
    );
    const radialCompression = 1 + travel * 0.7;
    const motionSpeed = 0.14 + travel * 0.72;
    const baseTrail = 0.01 + travel * 0.045;

    for (let index = 0; index < visibleLineCount; index += 1) {
      const line = lines[index];
      line.radius +=
        deltaTime * line.speed * motionSpeed * (0.3 + line.radius * 1.7);
      if (line.radius > 1.04) resetLine(line);

      const headRadius =
        maximumRadius * Math.pow(line.radius, radialCompression);
      const tailProgress = Math.max(
        0,
        line.radius - baseTrail * (0.55 + line.radius),
      );
      const tailRadius =
        maximumRadius * Math.pow(tailProgress, radialCompression);
      const cosine = Math.cos(line.angle);
      const sine = Math.sin(line.angle);
      const edgeFade = 1 - THREE.MathUtils.smoothstep(line.radius, 0.82, 1.04);
      const centerFade = THREE.MathUtils.smoothstep(line.radius, 0.015, 0.16);
      const opacity =
        line.brightness * edgeFade * centerFade * (0.55 + travel * 0.45);

      context.beginPath();
      context.moveTo(
        centerX + cosine * tailRadius,
        centerY + sine * tailRadius,
      );
      context.lineTo(
        centerX + cosine * headRadius,
        centerY + sine * headRadius,
      );
      context.lineWidth = line.width * (0.75 + travel * 0.85);
      context.strokeStyle = `rgba(${colorChannel}, ${colorChannel}, ${colorChannel}, ${opacity.toFixed(3)})`;
      context.stroke();
    }

    eraseForegroundWork();

    animationFrameId = window.requestAnimationFrame(render);
  }

  function setState(nextActive, nextTravel, nextColorChannel = 16) {
    travel = clamp(nextTravel);
    colorChannel = Math.round(clamp(nextColorChannel, 0, 255));
    if (active === nextActive) return;
    active = nextActive;
    previousTime = 0;
    if (active && !animationFrameId && !document.hidden) {
      animationFrameId = window.requestAnimationFrame(render);
    } else if (!active) {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
      context?.clearRect(0, 0, width, height);
    }
  }

  function handleVisibilityChange() {
    if (active && !document.hidden && !animationFrameId) {
      previousTime = 0;
      animationFrameId = window.requestAnimationFrame(render);
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  resize();

  return {
    setState,
    dispose() {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.width = 1;
      canvas.height = 1;
    },
  };
}

function createJourneyState(
  progress,
  reducedMotion,
  journeyEndCameraZ = JOURNEY_CAMERA_END_Z,
) {
  const fullTravelCameraZ = getCameraZAtProgress(progress, journeyEndCameraZ);
  const cameraTargetZ = reducedMotion
    ? HERO_CAMERA_Z + (fullTravelCameraZ - HERO_CAMERA_Z) * 0.18
    : fullTravelCameraZ;

  return {
    cameraTargetZ,
    originDepthScale: clamp(HERO_CAMERA_Z / cameraTargetZ, 0.2, 1),
    originBlur: getWorldBlurAtDepth(cameraTargetZ),
    originVisibility: getWorldVisibilityAtDepth(cameraTargetZ),
  };
}

function updateWorkTitle(element, cameraZ) {
  const depth = cameraZ - WORK_TITLE_WORLD_CONFIG.position[2];
  const inFront = depth > 0.1;
  const visibility = inFront ? getWorldVisibilityAtDepth(depth) : 0;
  const entryProgress = inFront ? getProjectFrameEntryAtDepth(depth) : 0;
  const opacity = visibility * entryProgress;
  const scale = inFront ? FOCUS_WORLD_CONFIG.distance / depth : 1;

  element.style.setProperty("--work-title-scale", scale.toFixed(5));
  element.style.setProperty(
    "--work-title-defocus",
    `${getWorldBlurAtDepth(depth).toFixed(2)}px`,
  );
  element.style.opacity = opacity.toFixed(4);
  element.style.visibility =
    opacity > FOCUS_WORLD_CONFIG.visibilityThreshold ? "visible" : "hidden";
}

function updateMoreWork(element, cameraZ, scrolling) {
  const depth = cameraZ - MORE_WORK_WORLD_CONFIG.position[2];
  const inFront = depth > 0.1;
  const visibility = inFront ? getWorldVisibilityAtDepth(depth) : 0;
  const entryProgress = inFront ? getProjectFrameEntryAtDepth(depth) : 0;
  const opacity = visibility * entryProgress;
  const scale = inFront ? FOCUS_WORLD_CONFIG.distance / depth : 1;
  const interactive =
    !scrolling &&
    opacity > 0.65 &&
    Math.abs(depth - FOCUS_WORLD_CONFIG.distance) <
      FOCUS_WORLD_CONFIG.interactionBand;

  element.style.setProperty("--more-work-scale", scale.toFixed(5));
  element.style.setProperty(
    "--more-work-defocus",
    `${getWorldBlurAtDepth(depth).toFixed(2)}px`,
  );
  element.style.opacity = opacity.toFixed(4);
  element.style.visibility =
    opacity > FOCUS_WORLD_CONFIG.visibilityThreshold ? "visible" : "hidden";
  element.classList.toggle("is-interactive", interactive);
  element.inert = !interactive;
}

function updateWarpSpeed(
  element,
  endingComposition,
  cameraZ,
  reducedMotion,
  warpLines,
  cameraSettings,
) {
  const simulation = element.querySelector("[data-warp-simulation]");
  const worldStage = element.closest("[data-world-stage]");
  if (reducedMotion) {
    element.style.opacity = "0";
    element.style.visibility = "hidden";
    worldStage?.classList.remove("is-warp-active");
    worldStage?.classList.remove("is-ending-visible");
    endingComposition.style.opacity = "0";
    endingComposition.style.visibility = "hidden";
    endingComposition.classList.remove("is-interactive");
    endingComposition.inert = true;
    endingComposition.setAttribute("aria-hidden", "true");
    simulation?.contentWindow?.postMessage(
      { type: "portfolio-warp", active: false, intensity: 0 },
      window.location.origin,
    );
    warpLines.setState(false, 0);
    return;
  }

  const {
    effectStartCameraZ,
    effectRevealEndCameraZ,
    simulationStartCameraZ,
    simulationRevealTravelCameraZ,
    simulationStartOpacity,
    simulationStartBlurPixels,
    nearCameraDistance,
    farCameraDistance,
    blackHoleShiftTravelCameraZ,
    endBlackHoleScreenOffset,
    endingRevealStartCameraZ,
    endingRevealEndCameraZ,
    darknessFadeStartCameraZ,
    darknessFadeEndCameraZ,
    lineFadeStartCameraZ,
    lineFadeEndCameraZ,
    startLineCount,
    endLineCount,
  } = WARP_SPEED_WORLD_CONFIG;
  const { journeyEndCameraZ, blackHoleShiftStartCameraZ } = cameraSettings;
  const passageActive = cameraZ >= effectStartCameraZ;
  const lineExitVisibility =
    1 -
    THREE.MathUtils.smoothstep(
      cameraZ,
      lineFadeStartCameraZ,
      lineFadeEndCameraZ,
    );
  const linesActive = passageActive && lineExitVisibility > 0.001;
  const simulationActive = cameraZ >= simulationStartCameraZ;
  const simulationRevealProgress = THREE.MathUtils.clamp(
    (cameraZ - simulationStartCameraZ) / simulationRevealTravelCameraZ,
    0,
    1,
  );
  const simulationVisibility = simulationActive
    ? THREE.MathUtils.lerp(simulationStartOpacity, 1, simulationRevealProgress)
    : 0;
  const simulationBlur = THREE.MathUtils.lerp(
    simulationStartBlurPixels,
    0,
    simulationRevealProgress,
  );
  const effectVisibility =
    THREE.MathUtils.smoothstep(
      cameraZ,
      effectStartCameraZ,
      effectRevealEndCameraZ,
    ) * lineExitVisibility;
  const effectTravel = THREE.MathUtils.clamp(
    (cameraZ - effectStartCameraZ) / (journeyEndCameraZ - effectStartCameraZ),
    0,
    1,
  );
  const blackHoleMotionProgress = THREE.MathUtils.clamp(
    (cameraZ - blackHoleShiftStartCameraZ) / blackHoleShiftTravelCameraZ,
    0,
    1,
  );
  const blackHoleScreenOffset = THREE.MathUtils.lerp(
    0,
    endBlackHoleScreenOffset,
    blackHoleMotionProgress,
  );
  const endingVisibility = THREE.MathUtils.clamp(
    (cameraZ - endingRevealStartCameraZ) /
      (endingRevealEndCameraZ - endingRevealStartCameraZ),
    0,
    1,
  );
  const endingVisible = endingVisibility > 0.001;
  const endingInteractive = endingVisibility > 0.96;
  const darkness = THREE.MathUtils.smoothstep(
    cameraZ,
    darknessFadeStartCameraZ,
    darknessFadeEndCameraZ,
  );
  const colorInversion = THREE.MathUtils.smoothstep(darkness, 0.44, 0.56);
  const colorChannel = THREE.MathUtils.lerp(16, 249, colorInversion);
  const cameraDistance = THREE.MathUtils.lerp(
    nearCameraDistance,
    farCameraDistance,
    blackHoleMotionProgress,
  );
  const lineCount = Math.round(
    THREE.MathUtils.lerp(startLineCount, endLineCount, blackHoleMotionProgress),
  );

  element.style.setProperty("--warp-travel", effectTravel.toFixed(4));
  element.style.setProperty(
    "--warp-effect-visibility",
    effectVisibility.toFixed(4),
  );
  element.style.setProperty("--warp-darkness", darkness.toFixed(4));
  element.style.setProperty(
    "--warp-hole-visibility",
    simulationVisibility.toFixed(4),
  );
  element.style.setProperty(
    "--warp-hole-blur",
    `${simulationBlur.toFixed(2)}px`,
  );
  element.style.setProperty(
    "--warp-line-color",
    `${colorChannel.toFixed(0)} ${colorChannel.toFixed(0)} ${colorChannel.toFixed(0)}`,
  );
  element.style.opacity = "1";
  element.style.visibility = passageActive ? "visible" : "hidden";
  endingComposition.style.setProperty(
    "--ending-visibility",
    endingVisibility.toFixed(4),
  );
  endingComposition.style.visibility = endingVisible ? "visible" : "hidden";
  endingComposition.classList.toggle("is-interactive", endingInteractive);
  endingComposition.inert = !endingInteractive;
  endingComposition.setAttribute(
    "aria-hidden",
    endingVisible ? "false" : "true",
  );
  worldStage?.classList.toggle("is-warp-active", simulationActive);
  worldStage?.classList.toggle("is-ending-visible", endingVisible);
  warpLines.setState(linesActive, effectTravel, colorChannel);
  simulation?.contentWindow?.postMessage(
    {
      type: "portfolio-warp",
      active: simulationActive,
      travel: blackHoleMotionProgress,
      cameraDistance,
      blackHoleScreenOffset,
      lineCount,
    },
    window.location.origin,
  );
}

function initJourneyScroll(
  worldStage,
  reducedMotion,
  getJourneyEndCameraZ,
  onChange,
) {
  const journeyTrack = getRequiredElement("[data-journey-track]");
  let startY = 0;
  let endY = 1;
  let animationFrameId = 0;
  let previousScrollY = window.scrollY;
  let scrollSettleTimer = 0;
  let scrolling = false;

  function measure() {
    const bounds = journeyTrack.getBoundingClientRect();
    startY = window.scrollY + bounds.top - window.innerHeight;
    endY = Math.max(
      startY + 1,
      window.scrollY + bounds.bottom - window.innerHeight,
    );
  }

  function update() {
    animationFrameId = 0;
    const progress = clamp((window.scrollY - startY) / (endY - startY));
    const scrollDelta = window.scrollY - previousScrollY;
    const state = createJourneyState(
      progress,
      reducedMotion.matches,
      getJourneyEndCameraZ(),
    );
    worldStage.style.setProperty(
      "--origin-depth-scale",
      state.originDepthScale.toFixed(5),
    );
    worldStage.style.setProperty(
      "--origin-defocus",
      `${state.originBlur.toFixed(2)}px`,
    );
    worldStage.style.setProperty(
      "--origin-visibility",
      state.originVisibility.toFixed(4),
    );
    worldStage.classList.toggle(
      "is-origin-cleared",
      state.originVisibility <= FOCUS_WORLD_CONFIG.visibilityThreshold,
    );
    worldStage.classList.toggle("is-journey-canvas", progress > 0);
    if (progress <= 0.002 || scrollDelta < -1) {
      worldStage.classList.remove("is-header-hidden");
    } else if (
      scrollDelta > 1 &&
      !document.body.classList.contains("is-navigation-open")
    ) {
      worldStage.classList.add("is-header-hidden");
    }
    previousScrollY = window.scrollY;
    onChange(state, scrolling);
  }

  function requestUpdate() {
    if (!animationFrameId) {
      animationFrameId = window.requestAnimationFrame(update);
    }
  }

  function handleScroll() {
    scrolling = true;
    if (scrollSettleTimer) window.clearTimeout(scrollSettleTimer);
    scrollSettleTimer = window.setTimeout(() => {
      scrollSettleTimer = 0;
      scrolling = false;
      requestUpdate();
    }, SCROLL_RENDER_SETTLE_MS);
    requestUpdate();
  }

  function handleResize() {
    measure();
    requestUpdate();
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });
  reducedMotion.addEventListener("change", requestUpdate);
  measure();
  update();

  return {
    refresh: requestUpdate,
    dispose() {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      if (scrollSettleTimer) window.clearTimeout(scrollSettleTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      reducedMotion.removeEventListener("change", requestUpdate);
      worldStage.classList.remove("is-journey-canvas");
      worldStage.classList.remove("is-header-hidden");
      worldStage.classList.remove("is-journey-scrolling");
      worldStage.classList.remove("is-origin-cleared");
      worldStage.style.removeProperty("--origin-depth-scale");
      worldStage.style.removeProperty("--origin-defocus");
      worldStage.style.removeProperty("--origin-visibility");
    },
  };
}

function releaseSplashInterface(app) {
  if (window.__portfolioSplashFailsafe) {
    window.clearTimeout(window.__portfolioSplashFailsafe);
    window.__portfolioSplashFailsafe = 0;
  }
  document.body.classList.remove(
    "is-intro-pending",
    "is-intro-exiting",
    "is-hero-entering",
    "is-splash-animating",
  );
  document.body.classList.add("is-intro-complete");
  app.inert = false;
}

export function initWorld() {
  const stage = getRequiredElement("#scene");
  const cardsStage = getRequiredElement("#project-cards");
  const worldStage = stage.closest("[data-world-stage]");
  const hero = worldStage?.querySelector(".hero");
  const workTitle = getRequiredElement("[data-work-title]");
  const moreWork = getRequiredElement("[data-more-work]");
  const warpSpeed = getRequiredElement("[data-warp-speed]");
  const endingComposition = getRequiredElement("[data-ending-composition]");
  const warpLinesCanvas = getRequiredElement("[data-warp-lines]");
  const app = getRequiredElement("#app");
  const splashProgressFill = getRequiredElement(".splash__progress-fill");
  const splashPercentage = getRequiredElement(".splash__percentage");

  if (!hero) throw new Error("The hero scene must be inside a .hero element.");

  if (document.body.classList.contains("is-intro-pending")) app.inert = true;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(WORLD_CAMERA_FOV, 1, 0.1, 120);
  camera.position.set(0, 0, HERO_CAMERA_Z);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const renderBudget = getRenderBudget();
  const portfolioCards = createPortfolioCards(cardsStage);
  const warpLines = createWarpLines(warpLinesCanvas, [
    ...Array.from(
      cardsStage.querySelectorAll("[data-project-card]"),
      (card) => ({
        element: card.querySelector(".project-card__explainer"),
        opacityElement: card,
      }),
    ),
    { element: workTitle },
    { element: moreWork },
  ]);
  const stockthinkChessWorld = createStockthinkChessWorld(cardsStage, assetUrl);
  const cubeBurgerIngredientWorld = createCubeBurgerIngredientWorld(
    cardsStage,
    assetUrl,
  );
  const murajaaScreenWorld = createMurajaaScreenWorld(cardsStage, assetUrl);
  const learnObjectWorld = createLearnObjectWorld(cardsStage, assetUrl);
  const learnObjectEditor = initLearnObjectEditor(
    learnObjectWorld,
    refreshLearnObjects,
  );

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      depth: true,
      powerPreference: "high-performance",
      stencil: false,
    });
  } catch (error) {
    console.warn(
      "WebGL is unavailable; using the static Hero portrait.",
      error,
    );
    releaseSplashInterface(app);
    return () => {};
  }

  renderer.setClearColor(BACKGROUND_COLOR, 0);
  renderer.autoClear = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.append(renderer.domElement);
  const blackHoleCameraEditor = initBlackHoleCameraEditor(
    () => camera.position.z,
    refreshBlackHoleCamera,
  );
  let journeyScrolling = false;
  let webglFrameVisible = false;

  function renderWorld() {
    const shouldRenderPortrait = Boolean(portraitMesh && portraitGroup.visible);
    if (!shouldRenderPortrait) {
      if (webglFrameVisible) renderer.clear(true, true, true);
      renderer.domElement.style.display = "none";
      webglFrameVisible = false;
      return;
    }

    renderer.domElement.style.display = "block";
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
    webglFrameVisible = true;
  }

  function compileWorld() {
    renderer.compile(scene, camera);
  }

  const portraitGroup = new THREE.Group();
  portraitGroup.name = "hero-origin-subject";
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  let portraitAspect = 1024 / 1536;
  const introBootTime = performance.now();
  const introTimers = new Set();
  let resolvePortraitReady;
  const portraitReady = new Promise((resolve) => {
    resolvePortraitReady = resolve;
  });
  let introCameraStartTime = null;
  let introCameraStartZ = HERO_CAMERA_Z;
  let introPortraitOffsetY = 0;
  let introPortraitStartOffsetY = 0;
  let introComplete = document.body.classList.contains("is-intro-complete");
  let loadingTarget = 0;
  let loadingDisplayed = 0;
  let splashMarkReady = false;
  let resolveLoadingProgressComplete;
  const loadingProgressComplete = new Promise((resolve) => {
    resolveLoadingProgressComplete = resolve;
  });
  let previousLoadingFrameTime = 0;
  let loadingAnimationFrameId = 0;
  let previousFrameTime = 0;
  let animationFrameId = 0;
  let resizeAnimationFrameId = 0;
  let renderedCardsCameraZ = Number.NaN;
  let portraitMesh;
  let portraitShadow;
  let journeyState = createJourneyState(0, reducedMotion.matches);
  let refreshJourney = () => {};
  let disposeJourney = () => {};

  scene.add(
    portfolioCards.group,
    stockthinkChessWorld.group,
    cubeBurgerIngredientWorld.group,
    murajaaScreenWorld.group,
    learnObjectWorld.group,
    portraitGroup,
  );
  const textureLoader = new THREE.TextureLoader();

  function handlePortraitTexture(portraitTexture) {
    portraitTexture.colorSpace = THREE.SRGBColorSpace;
    // A firm cutoff keeps the v3 matte out of the visible portrait. A separate
    // blurred silhouette below supplies the intentional depth shadow.
    portraitTexture.generateMipmaps = false;
    portraitTexture.minFilter = THREE.LinearFilter;
    portraitTexture.magFilter = THREE.LinearFilter;
    portraitTexture.anisotropy = Math.min(
      renderBudget.maxAnisotropy,
      renderer.capabilities.getMaxAnisotropy(),
    );

    portraitAspect = portraitTexture.image.width / portraitTexture.image.height;
    const portraitGeometry = new THREE.PlaneGeometry(portraitAspect, 1);

    const portraitMaterial = new THREE.MeshBasicMaterial({
      map: portraitTexture,
      transparent: true,
      alphaTest: PORTRAIT_ALPHA_CUTOFF,
      premultipliedAlpha: true,
      depthTest: true,
      depthWrite: true,
      toneMapped: false,
    });
    portraitMesh = new THREE.Mesh(portraitGeometry, portraitMaterial);
    portraitMesh.renderOrder = 2;

    portraitShadow = new THREE.Mesh(
      portraitGeometry,
      createPortraitShadowMaterial(portraitTexture),
    );
    portraitShadow.renderOrder = 1;

    portraitGroup.add(portraitShadow, portraitMesh);
    layoutPortrait();
    applyCamera();
    compileWorld();
    renderWorld();
    document.documentElement.classList.add("has-hero-webgl");
    resolvePortraitReady();
  }

  textureLoader
    .loadAsync(PORTRAIT_TEXTURE_URL)
    .then(handlePortraitTexture)
    .catch((error) => {
      console.error("The portrait texture could not be loaded.", error);
      resolvePortraitReady();
    });

  function getViewportSizeAtPortrait() {
    const distance = HERO_CAMERA_Z;
    const height =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    return { height, width: height * camera.aspect };
  }

  function scheduleIntro(callback, delay) {
    const timer = window.setTimeout(() => {
      introTimers.delete(timer);
      callback();
      requestSceneFrame();
    }, delay);
    introTimers.add(timer);
    return timer;
  }

  function clearIntroTimers() {
    introTimers.forEach((timer) => window.clearTimeout(timer));
    introTimers.clear();
  }

  function waitForImage(image) {
    const loaded = image.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });

    return loaded.then(() => image.decode?.().catch(() => undefined));
  }

  function updateLoadingProgress(deltaTime) {
    if (!splashMarkReady || loadingDisplayed >= 100) return;

    // Keep the chase time-based so a temporarily slow GPU does not stretch the
    // splash indefinitely; runLoadingFrame already caps a resumed frame at
    // 120ms so the visible fill still advances in bounded steps.
    const progressDelta = deltaTime;
    const remaining = Math.max(0, loadingTarget - loadingDisplayed);
    const easedStep = remaining * (1 - Math.exp(-10 * progressDelta));
    const maximumStep = 140 * progressDelta;
    loadingDisplayed += Math.min(remaining, Math.min(easedStep, maximumStep));

    if (loadingTarget === 100 && 100 - loadingDisplayed < 0.15) {
      loadingDisplayed = 100;
      resolveLoadingProgressComplete?.();
      resolveLoadingProgressComplete = null;
    }

    splashProgressFill.style.transform = `scaleX(${loadingDisplayed / 100})`;
    splashPercentage.textContent = `${Math.round(loadingDisplayed)}%`;
  }

  function requestLoadingFrame() {
    if (
      loadingAnimationFrameId ||
      document.hidden ||
      !splashMarkReady ||
      loadingDisplayed >= loadingTarget - 0.05
    ) {
      return;
    }
    loadingAnimationFrameId = window.requestAnimationFrame(runLoadingFrame);
  }

  function runLoadingFrame(time) {
    loadingAnimationFrameId = 0;
    const deltaTime = previousLoadingFrameTime
      ? THREE.MathUtils.clamp((time - previousLoadingFrameTime) / 1000, 0, 0.12)
      : 1 / 60;
    previousLoadingFrameTime = time;
    updateLoadingProgress(deltaTime);

    if (loadingDisplayed < loadingTarget - 0.05) requestLoadingFrame();
    else previousLoadingFrameTime = 0;
  }

  function getIntroCameraStartZ() {
    const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
    if (aspect < 0.72) return 4.58;
    if (aspect > 1.55) return 4.25;
    return 4.4;
  }

  function finishIntro() {
    if (introComplete) return;
    introComplete = true;
    introCameraStartTime = null;
    introPortraitOffsetY = 0;
    introPortraitStartOffsetY = 0;
    clearIntroTimers();
    applyCamera();
    releaseSplashInterface(app);
    renderWorld();
  }

  function beginIntroReveal() {
    if (
      introComplete ||
      reducedMotion.matches ||
      document.body.classList.contains("is-intro-complete")
    ) {
      finishIntro();
      return;
    }

    introCameraStartZ = getIntroCameraStartZ();
    const viewport = getViewportSizeAtPortrait();
    introPortraitStartOffsetY =
      -viewport.height *
      (stage.clientWidth / Math.max(1, stage.clientHeight) < 0.72
        ? 0.13
        : 0.19);
    introPortraitOffsetY = introPortraitStartOffsetY;
    introCameraStartTime = performance.now();
    document.body.classList.add("is-intro-exiting", "is-hero-entering");
    scheduleIntro(finishIntro, INTRO_CAMERA_DURATION_MS + 200);
    syncAnimationLoop();
  }

  function prepareIntro() {
    window.scrollTo(0, 0);

    if (reducedMotion.matches || introComplete) {
      finishIntro();
      return;
    }

    const splashMark = document.querySelector(".splash__mark");
    const markReady =
      splashMark && !splashMark.complete
        ? new Promise((resolve) => {
            splashMark.addEventListener("load", resolve, { once: true });
            splashMark.addEventListener("error", resolve, { once: true });
          })
        : Promise.resolve();
    void markReady.finally(() => {
      splashMarkReady = true;
      loadingTarget = Math.max(loadingTarget, 12);
      requestLoadingFrame();
    });

    const criticalImages = Array.from(
      document.querySelectorAll(".brand__mark"),
    );
    const fontReady = document.fonts
      ? Promise.allSettled([
          document.fonts.load('400 1em "DM Serif Display"'),
          document.fonts.load('700 1em "Manrope"'),
        ])
      : Promise.resolve();
    const criticalAssets = [
      portraitReady,
      fontReady,
      ...criticalImages.map(waitForImage),
    ];
    let loadedAssets = 0;

    const trackedAssets = criticalAssets.map((asset) =>
      Promise.resolve(asset)
        .catch(() => undefined)
        .finally(() => {
          loadedAssets += 1;
          loadingTarget = (loadedAssets / criticalAssets.length) * 100;
          requestLoadingFrame();
        }),
    );

    const allCriticalAssets = Promise.allSettled(trackedAssets);
    const loadingFailsafe = new Promise((resolve) => {
      scheduleIntro(resolve, INTRO_FAILSAFE_MS);
    });
    const criticalAssetsReady = Promise.race([
      allCriticalAssets,
      loadingFailsafe,
    ]).then(() => {
      loadingTarget = 100;
    });

    const splashRevealReady = new Promise((resolve) => {
      if (!splashMark) {
        resolve();
        return;
      }

      let settled = false;
      let failsafeTimer = 0;
      const settle = (event) => {
        if (
          event?.type === "animationend" &&
          event.animationName !== "splash-mark-wipe"
        ) {
          return;
        }
        if (settled) return;
        settled = true;
        if (failsafeTimer) {
          window.clearTimeout(failsafeTimer);
          introTimers.delete(failsafeTimer);
        }
        splashMark.removeEventListener("animationend", settle);
        splashMark.removeEventListener("animationcancel", settle);
        resolve();
      };

      splashMark.addEventListener("animationend", settle);
      splashMark.addEventListener("animationcancel", settle);
      failsafeTimer = scheduleIntro(settle, SPLASH_REVEAL_FAILSAFE_MS);
    });

    const elapsed = performance.now() - introBootTime;
    const minimumIntroReady = new Promise((resolve) => {
      scheduleIntro(resolve, Math.max(120, INTRO_MINIMUM_MS - elapsed));
    });

    Promise.all([criticalAssetsReady, splashRevealReady, minimumIntroReady])
      .then(() => {
        loadingTarget = 100;
        requestLoadingFrame();
        return loadingProgressComplete;
      })
      .then(beginIntroReveal);
  }

  function updateIntroCamera(time) {
    if (introCameraStartTime === null) return;

    const progress = THREE.MathUtils.clamp(
      (time - introCameraStartTime) / INTRO_CAMERA_DURATION_MS,
      0,
      1,
    );
    const easedProgress = 1 - Math.pow(1 - progress, 5);
    camera.position.z = THREE.MathUtils.lerp(
      introCameraStartZ,
      HERO_CAMERA_Z,
      easedProgress,
    );
    camera.updateMatrixWorld();
    const portraitEasedProgress = 1 - Math.pow(1 - progress, 5);
    introPortraitOffsetY = THREE.MathUtils.lerp(
      introPortraitStartOffsetY,
      0,
      portraitEasedProgress,
    );

    if (progress === 1) {
      introCameraStartTime = null;
      introPortraitOffsetY = 0;
    }
  }

  function layoutPortrait() {
    if (!portraitMesh) return;

    const viewport = getViewportSizeAtPortrait();
    const viewportAspect = viewport.width / viewport.height;
    const widthRatio =
      viewportAspect < 0.62 ? 1.35 : viewportAspect < 1.12 ? 0.82 : 0.46;
    const portraitWidth = viewport.width * widthRatio;
    const portraitHeight = portraitWidth / portraitAspect;
    const shortLandscape = viewportAspect > 1.4 && stage.clientHeight < 560;
    const portraitTop =
      viewport.height *
      (shortLandscape ? -0.01 : viewportAspect < 0.62 ? 0.11 : 0.13);
    const portraitY = portraitTop - portraitHeight / 2;

    portraitMesh.scale.set(portraitHeight, portraitHeight, 1);
    portraitMesh.position.set(0, portraitY, 0);
    portraitShadow.scale.setScalar(portraitHeight * 1.012);
    portraitShadow.position.set(
      portraitWidth * PORTRAIT_SHADOW_OFFSET_X,
      portraitY - viewport.height * 0.008,
      -0.035,
    );
    worldStage.style.setProperty(
      "--hero-portrait-width",
      `${(widthRatio * stage.clientWidth).toFixed(2)}px`,
    );
    worldStage.style.setProperty(
      "--hero-portrait-top",
      `${((0.5 - portraitTop / viewport.height) * stage.clientHeight).toFixed(
        2,
      )}px`,
    );
  }

  function renderScene(time = 0, forceCards = false) {
    const deltaTime = previousFrameTime
      ? THREE.MathUtils.clamp((time - previousFrameTime) / 1000, 0, 0.12)
      : 1 / 60;
    const easing = reducedMotion.matches ? 1 : 1 - Math.exp(-7.5 * deltaTime);
    previousFrameTime = time;
    applyCamera();
    updateIntroCamera(time);
    pointerCurrent.lerp(pointerTarget, easing);
    portraitGroup.rotation.y = pointerCurrent.x * 0.032;
    portraitGroup.rotation.x = -pointerCurrent.y * 0.016;
    portraitGroup.position.x = pointerCurrent.x * 0.038;
    portraitGroup.position.y = pointerCurrent.y * 0.02 + introPortraitOffsetY;
    portraitGroup.visible =
      journeyState.originVisibility > FOCUS_WORLD_CONFIG.visibilityThreshold;
    updateWorkTitle(workTitle, camera.position.z);
    updateMoreWork(moreWork, camera.position.z, journeyScrolling);
    updateWarpSpeed(
      warpSpeed,
      endingComposition,
      camera.position.z,
      reducedMotion.matches,
      warpLines,
      blackHoleCameraEditor.settings,
    );
    blackHoleCameraEditor.setCurrentCameraZ(camera.position.z);
    scene.updateMatrixWorld(true);
    if (forceCards || camera.position.z !== renderedCardsCameraZ) {
      renderedCardsCameraZ = camera.position.z;
      portfolioCards.update(
        camera,
        stage.clientWidth,
        stage.clientHeight,
        journeyScrolling,
      );
      stockthinkChessWorld.update(
        camera,
        stage.clientWidth,
        stage.clientHeight,
        journeyScrolling,
      );
      cubeBurgerIngredientWorld.update(
        camera,
        stage.clientWidth,
        stage.clientHeight,
        journeyScrolling,
      );
      murajaaScreenWorld.update(
        camera,
        stage.clientWidth,
        stage.clientHeight,
        journeyScrolling,
      );
      learnObjectWorld.update(camera, stage.clientWidth, stage.clientHeight);
    }
    renderWorld();
  }

  function refreshLearnObjects() {
    renderScene(performance.now(), true);
  }

  function refreshBlackHoleCamera() {
    refreshJourney();
    renderScene(performance.now(), true);
  }

  function applyCamera() {
    camera.position.set(0, 0, journeyState.cameraTargetZ);
    camera.quaternion.identity();
    camera.updateMatrixWorld();
  }

  function resetPointer() {
    pointerTarget.set(0, 0);
    requestSceneFrame();
  }

  function handlePointerMove(event) {
    if (
      event.target instanceof Element &&
      event.target.closest(
        "[data-project-frame-editor], [data-learn-object-editor], [data-black-hole-camera-editor], [data-project-card]",
      )
    ) {
      if (pointerTarget.lengthSq() > 0) resetPointer();
      return;
    }

    if (reducedMotion.matches || event.pointerType === "touch") {
      if (pointerTarget.lengthSq() > 0) resetPointer();
      return;
    }

    const bounds = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -2;
    pointerTarget.set(
      THREE.MathUtils.clamp(x, -1, 1),
      THREE.MathUtils.clamp(y, -1, 1),
    );
    previousFrameTime = 0;
    renderScene(performance.now());
    if (sceneNeedsAnotherFrame()) requestSceneFrame();
    else previousFrameTime = 0;
  }

  function sceneNeedsAnotherFrame() {
    if (journeyScrolling || reducedMotion.matches || document.hidden) {
      return false;
    }

    const pointerIsSettling =
      pointerCurrent.distanceToSquared(pointerTarget) > 0.000001;
    const introIsAnimating = introCameraStartTime !== null;
    return pointerIsSettling || introIsAnimating;
  }

  function runSceneFrame(time) {
    animationFrameId = 0;
    renderScene(time);
    if (sceneNeedsAnotherFrame()) requestSceneFrame();
    else previousFrameTime = 0;
  }

  function requestSceneFrame() {
    if (animationFrameId || document.hidden) return;
    animationFrameId = window.requestAnimationFrame(runSceneFrame);
  }

  function syncAnimationLoop() {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
    previousFrameTime = 0;
    previousLoadingFrameTime = 0;

    if (reducedMotion.matches) {
      resetPointer();
      pointerCurrent.set(0, 0);
      renderScene(0);
    } else {
      requestSceneFrame();
      requestLoadingFrame();
    }
  }

  function handleMotionPreferenceChange() {
    if (reducedMotion.matches) finishIntro();
    syncAnimationLoop();
  }

  function handleContextLost(event) {
    event.preventDefault();
    document.documentElement.classList.remove("has-hero-webgl");
    finishIntro();
  }

  function handleContextRestored() {
    document.documentElement.classList.add("has-hero-webgl");
    resizeScene();
    requestSceneFrame();
  }

  function handleJourneyState(nextState, scrolling) {
    journeyState = nextState;
    journeyScrolling = scrolling;

    // Native scroll owns the camera as soon as the journey starts. Otherwise
    // the still-running intro camera update overwrites the scroll position on
    // every frame, so an interrupted portrait reveal can fade without
    // continuing to recede in scale.
    if (scrolling && introCameraStartTime !== null) finishIntro();

    worldStage.classList.toggle("is-journey-scrolling", scrolling);
    previousFrameTime = 0;
    renderScene(performance.now(), true);
    if (sceneNeedsAnotherFrame()) requestSceneFrame();
    else previousFrameTime = 0;
  }

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("blur", resetPointer);
  document.documentElement.addEventListener("pointerleave", resetPointer);
  reducedMotion.addEventListener("change", handleMotionPreferenceChange);
  document.addEventListener("visibilitychange", syncAnimationLoop);
  renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
  renderer.domElement.addEventListener(
    "webglcontextrestored",
    handleContextRestored,
  );

  function resizeScene() {
    const cssWidth = Math.max(1, stage.clientWidth);
    const cssHeight = Math.max(1, stage.clientHeight);
    const heroHeight = Math.max(1, hero.clientHeight);
    const requestedRatio = Math.min(
      window.devicePixelRatio || 1,
      renderBudget.maxPixelRatio,
    );
    const requestedPixels =
      cssWidth * requestedRatio * cssHeight * requestedRatio;
    const pixelScale =
      requestedPixels > renderBudget.maxPixelCount
        ? Math.sqrt(renderBudget.maxPixelCount / requestedPixels)
        : 1;

    renderer.setPixelRatio(requestedRatio * pixelScale);
    renderer.setSize(cssWidth, cssHeight, false);
    if (worldStage?.classList.contains("is-journey-canvas")) {
      camera.clearViewOffset();
      camera.aspect = cssWidth / cssHeight;
    } else {
      camera.aspect = cssWidth / heroHeight;
      camera.setViewOffset(cssWidth, heroHeight, 0, 0, cssWidth, cssHeight);
    }
    camera.updateProjectionMatrix();
    portfolioCards.resize(cssWidth, window.innerHeight);
    applyCamera();
    layoutPortrait();
    scene.updateMatrixWorld(true);
    portfolioCards.update(camera, cssWidth, cssHeight, journeyScrolling);
    stockthinkChessWorld.update(camera, cssWidth, cssHeight, journeyScrolling);
    cubeBurgerIngredientWorld.update(
      camera,
      cssWidth,
      cssHeight,
      journeyScrolling,
    );
    murajaaScreenWorld.update(camera, cssWidth, cssHeight, journeyScrolling);
    learnObjectWorld.update(camera, cssWidth, cssHeight);
    updateMoreWork(moreWork, camera.position.z, journeyScrolling);
    updateWarpSpeed(
      warpSpeed,
      endingComposition,
      camera.position.z,
      reducedMotion.matches,
      warpLines,
      blackHoleCameraEditor.settings,
    );
    blackHoleCameraEditor.setCurrentCameraZ(camera.position.z);
    if (!journeyScrolling) renderWorld();
  }

  function requestResize() {
    if (resizeAnimationFrameId) return;
    resizeAnimationFrameId = window.requestAnimationFrame(() => {
      resizeAnimationFrameId = 0;
      resizeScene();
    });
  }

  const resizeObserver = new ResizeObserver(requestResize);
  resizeObserver.observe(stage);
  resizeScene();
  const journeyController = initJourneyScroll(
    getRequiredElement("[data-world-stage]"),
    reducedMotion,
    () => blackHoleCameraEditor.settings.journeyEndCameraZ,
    handleJourneyState,
  );
  refreshJourney = journeyController.refresh;
  disposeJourney = journeyController.dispose;
  syncAnimationLoop();
  prepareIntro();

  function dispose() {
    resizeObserver.disconnect();
    if (resizeAnimationFrameId) {
      window.cancelAnimationFrame(resizeAnimationFrameId);
    }
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    if (loadingAnimationFrameId) {
      window.cancelAnimationFrame(loadingAnimationFrameId);
    }
    clearIntroTimers();
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("blur", resetPointer);
    document.documentElement.removeEventListener("pointerleave", resetPointer);
    reducedMotion.removeEventListener("change", handleMotionPreferenceChange);
    document.removeEventListener("visibilitychange", syncAnimationLoop);
    renderer.domElement.removeEventListener(
      "webglcontextlost",
      handleContextLost,
    );
    renderer.domElement.removeEventListener(
      "webglcontextrestored",
      handleContextRestored,
    );
    disposeJourney();
    portfolioCards.dispose();
    stockthinkChessWorld.dispose();
    cubeBurgerIngredientWorld.dispose();
    learnObjectEditor.dispose();
    blackHoleCameraEditor.dispose();
    murajaaScreenWorld.dispose();
    learnObjectWorld.dispose();
    warpLines.dispose();
    worldStage.classList.remove("is-warp-active");
    worldStage.classList.remove("is-ending-visible");
    endingComposition.inert = true;
    endingComposition.setAttribute("aria-hidden", "true");

    const disposedGeometries = new Set();
    const disposedMaterials = new Set();
    const disposedTextures = new Set();

    scene.traverse((object) => {
      if (object.geometry && !disposedGeometries.has(object.geometry)) {
        disposedGeometries.add(object.geometry);
        object.geometry.dispose();
      }

      if (!object.material) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      materials.forEach((material) => {
        if (disposedMaterials.has(material)) return;
        disposedMaterials.add(material);

        if (material.map && !disposedTextures.has(material.map)) {
          disposedTextures.add(material.map);
          material.map.dispose();
        }

        material.dispose();
      });
    });

    renderer.dispose();
    renderer.domElement.remove();
    cardsStage.replaceChildren();
    document.documentElement.classList.remove("has-hero-webgl");
  }

  return dispose;
}
