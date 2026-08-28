import * as THREE from "three";
import { getRequiredElement } from "../lib/dom.js";
import { initProjectFrameEditor } from "./project-frame-editor.js";
import {
  FOCUS_WORLD_CONFIG,
  HERO_CAMERA_Z,
  WORK_TITLE_WORLD_CONFIG,
  WORLD_CAMERA_FOV,
  getCameraZAtProgress,
  getProjectFrameEntryAtDepth,
  getWorldBlurAtDepth,
  getWorldVisibilityAtDepth,
} from "./config.js";
import { createPortfolioCards } from "./cards.js";
import { createStockThinkChessPieces } from "./chess-pieces.js";

const BACKGROUND_COLOR = 0xf5f0e8;
// The portrait texture is 1024px wide, so rendering a larger full-screen
// framebuffer adds GPU work without adding visible portrait detail.
const MAX_PIXEL_COUNT = 1920 * 1080;
const INTRO_MINIMUM_MS = 1200;
const INTRO_CAMERA_DURATION_MS = 650;
const INTRO_FAILSAFE_MS = 1000;
const SPLASH_REVEAL_FAILSAFE_MS = 1400;
const SCROLL_RENDER_SETTLE_MS = 140;
const PORTRAIT_ALPHA_CUTOFF = 0.45;
const PORTRAIT_SHADOW_OPACITY = 0.28;
const PORTRAIT_SHADOW_BLUR_TEXELS = 10;
const PORTRAIT_SHADOW_OFFSET_X = 0.04;
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const PORTRAIT_TEXTURE_URL = assetUrl("assets/malik-cutout-v3.webp");

function createPortraitShadowMaterial(portraitTexture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      portraitMap: { value: portraitTexture },
      texelSize: {
        value: new THREE.Vector2(
          PORTRAIT_SHADOW_BLUR_TEXELS / portraitTexture.image.width,
          PORTRAIT_SHADOW_BLUR_TEXELS / portraitTexture.image.height,
        ),
      },
      shadowColor: { value: new THREE.Color(0x171512) },
      shadowOpacity: { value: PORTRAIT_SHADOW_OPACITY },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D portraitMap;
      uniform vec2 texelSize;
      uniform vec3 shadowColor;
      uniform float shadowOpacity;
      varying vec2 vUv;

      float sampleMask(vec2 uv) {
        vec2 lowerBound = step(vec2(0.0), uv);
        vec2 upperBound = step(uv, vec2(1.0));
        float insideTexture =
          lowerBound.x * lowerBound.y * upperBound.x * upperBound.y;
        float sourceAlpha = texture2D(portraitMap, clamp(uv, 0.0, 1.0)).a;
        return smoothstep(0.38, 0.52, sourceAlpha) * insideTexture;
      }

      float gaussianWeight(float position) {
        float distanceFromCenter = abs(position);
        if (distanceFromCenter < 0.5) return 6.0;
        if (distanceFromCenter < 1.5) return 4.0;
        return 1.0;
      }

      void main() {
        float blurredAlpha = 0.0;

        for (int y = -2; y <= 2; y++) {
          for (int x = -2; x <= 2; x++) {
            vec2 sampleOffset = vec2(float(x), float(y)) * texelSize;
            float sampleWeight =
              gaussianWeight(float(x)) * gaussianWeight(float(y));
            blurredAlpha += sampleMask(vUv + sampleOffset) * sampleWeight;
          }
        }

        blurredAlpha /= 256.0;
        gl_FragColor = vec4(shadowColor, blurredAlpha * shadowOpacity);
      }
    `,
  });
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createJourneyState(progress, reducedMotion) {
  const fullTravelCameraZ = getCameraZAtProgress(progress);
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
  const scale = inFront
    ? clamp(FOCUS_WORLD_CONFIG.distance / depth, 0.55, 2.4)
    : 1;

  element.style.setProperty("--work-title-scale", scale.toFixed(5));
  element.style.setProperty(
    "--work-title-defocus",
    `${getWorldBlurAtDepth(depth).toFixed(2)}px`,
  );
  element.style.opacity = opacity.toFixed(4);
  element.style.visibility =
    opacity > FOCUS_WORLD_CONFIG.visibilityThreshold ? "visible" : "hidden";
}

function initJourneyScroll(worldStage, reducedMotion, onChange) {
  const journeyTrack = getRequiredElement("[data-journey-track]");
  let startY = 0;
  let endY = 1;
  let animationFrameId = 0;
  let previousScrollY = window.scrollY;
  let scrollSettleTimer = 0;
  let scrolling = false;
  let latestState = createJourneyState(0, reducedMotion.matches);

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
    const state = createJourneyState(progress, reducedMotion.matches);
    latestState = state;
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
    onChange(latestState, true);
    if (scrollSettleTimer) window.clearTimeout(scrollSettleTimer);
    scrollSettleTimer = window.setTimeout(() => {
      scrollSettleTimer = 0;
      scrolling = false;
      update();
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

  return () => {
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
  const app = getRequiredElement("#app");
  const splashProgressFill = getRequiredElement(".splash__progress-fill");
  const splashPercentage = getRequiredElement(".splash__percentage");

  if (!hero) throw new Error("The hero scene must be inside a .hero element.");

  if (document.body.classList.contains("is-intro-pending")) app.inert = true;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(WORLD_CAMERA_FOV, 1, 0.1, 120);
  camera.position.set(0, 0, HERO_CAMERA_Z);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const portfolioCards = createPortfolioCards(cardsStage);
  const stockThinkChess = createStockThinkChessPieces();

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
  let journeyScrolling = false;

  function renderWorld() {
    if (journeyScrolling) return;
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
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
  let renderedCardsCameraZ = Number.NaN;
  let portraitMesh;
  let portraitShadow;
  let journeyState = createJourneyState(0, reducedMotion.matches);
  let projectFrameEditor = null;
  let disposeJourney = () => {};

  scene.add(portfolioCards.group, stockThinkChess.group, portraitGroup);
  const textureLoader = new THREE.TextureLoader();

  function handlePortraitTexture(portraitTexture) {
    portraitTexture.colorSpace = THREE.SRGBColorSpace;
    // A firm cutoff keeps the v3 matte out of the visible portrait. A separate
    // blurred silhouette below supplies the intentional depth shadow.
    portraitTexture.generateMipmaps = false;
    portraitTexture.minFilter = THREE.LinearFilter;
    portraitTexture.magFilter = THREE.LinearFilter;
    portraitTexture.anisotropy = Math.min(
      8,
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
    if (!journeyScrolling) renderWorld();
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
    const portraitProgress = THREE.MathUtils.clamp(progress / 0.9, 0, 1);
    const portraitEasedProgress = 1 - Math.pow(1 - portraitProgress, 5);
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
    stockThinkChess.setCameraZ(camera.position.z);
    if (!journeyScrolling) stockThinkChess.update(time, reducedMotion.matches);
    scene.updateMatrixWorld(true);
    if (forceCards || camera.position.z !== renderedCardsCameraZ) {
      renderedCardsCameraZ = camera.position.z;
      portfolioCards.update(
        camera,
        stage.clientWidth,
        stage.clientHeight,
        journeyScrolling,
      );
    }
    renderWorld();
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
      event.target.closest("[data-project-frame-editor], [data-project-card]")
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
    const chessIsAnimating = stockThinkChess.isActive(camera.position.z);
    return pointerIsSettling || introIsAnimating || chessIsAnimating;
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
    const requestedRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    const requestedPixels =
      cssWidth * requestedRatio * cssHeight * requestedRatio;
    const pixelScale =
      requestedPixels > MAX_PIXEL_COUNT
        ? Math.sqrt(MAX_PIXEL_COUNT / requestedPixels)
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
    const presetChanged = portfolioCards.resize(cssWidth, window.innerHeight);
    if (presetChanged) projectFrameEditor?.refresh();
    applyCamera();
    layoutPortrait();
    scene.updateMatrixWorld(true);
    portfolioCards.update(camera, cssWidth, cssHeight, journeyScrolling);
    if (!journeyScrolling) renderWorld();
  }

  const resizeObserver = new ResizeObserver(resizeScene);
  resizeObserver.observe(stage);
  resizeScene();
  disposeJourney = initJourneyScroll(
    getRequiredElement("[data-world-stage]"),
    reducedMotion,
    handleJourneyState,
  );
  projectFrameEditor = initProjectFrameEditor(portfolioCards, () => {
    previousFrameTime = 0;
    renderScene(performance.now(), true);
    previousFrameTime = 0;
  });
  syncAnimationLoop();
  prepareIntro();

  function dispose() {
    resizeObserver.disconnect();
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
    projectFrameEditor?.dispose();
    portfolioCards.dispose();

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
