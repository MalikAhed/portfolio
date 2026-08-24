import * as THREE from "three";
import { getRequiredElement } from "../../lib/dom.js";

const BACKGROUND_COLOR = 0xf5f0e8;
// The portrait texture is 900px wide, so rendering a larger full-screen
// framebuffer adds GPU work without adding visible portrait detail.
const MAX_PIXEL_COUNT = 1920 * 1080;
const FINAL_CAMERA_Z = 5;
const INTRO_MINIMUM_MS = 1150;
const INTRO_CAMERA_DURATION_MS = 1550;
const PORTRAIT_SHADOW_PADDING = 72;
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const PORTRAIT_TEXTURE_SOURCES = [
  assetUrl("assets/malik-cutout.webp"),
  assetUrl("assets/malik-cutout.png"),
];
const PORTRAIT_SHADOW_TEXTURE_SOURCES = [
  assetUrl("assets/malik-cutout-shadow.avif"),
  assetUrl("assets/malik-cutout-shadow.webp"),
];

export function initHeroScene() {
  const stage = getRequiredElement("#scene");
  const hero = stage.closest(".hero");
  const app = getRequiredElement("#app");
  const splashProgressFill = getRequiredElement(".splash__progress-fill");
  const splashPercentage = getRequiredElement(".splash__percentage");
  const heroRole = getRequiredElement(".hero__role");

  if (!hero) throw new Error("The hero scene must be inside a .hero element.");

  app.inert = true;

  const roleLabel = heroRole.textContent.trim();
  heroRole.setAttribute("aria-label", roleLabel);
  const roleLetters = Array.from(roleLabel, (letter, index) => {
    const span = document.createElement("span");
    span.className = "hero__role-letter";
    span.setAttribute("aria-hidden", "true");
    span.style.setProperty("--letter-index", index);
    span.textContent = letter;
    return span;
  });
  const highlightedWord = document.createElement("span");
  highlightedWord.className = "hero__role-highlight";
  highlightedWord.setAttribute("aria-hidden", "true");
  highlightedWord.append(...roleLetters.slice(0, "Full-stack".length));
  heroRole.replaceChildren(
    highlightedWord,
    ...roleLetters.slice("Full-stack".length),
  );

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, FINAL_CAMERA_Z);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    depth: false,
    powerPreference: "high-performance",
    stencil: false,
  });

  renderer.setClearColor(BACKGROUND_COLOR, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.append(renderer.domElement);

  const portraitGroup = new THREE.Group();
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const portraitAspect = 900 / 1272;
  const introBootTime = performance.now();
  const introTimers = new Set();
  let resolvePortraitReady;
  const portraitReady = new Promise((resolve) => {
    resolvePortraitReady = resolve;
  });
  let introCameraStartTime = null;
  let introCameraStartZ = FINAL_CAMERA_Z;
  let introPortraitOffsetY = 0;
  let introPortraitStartOffsetY = 0;
  let introComplete = false;
  let loadingTarget = 0;
  let loadingDisplayed = 0;
  let previousFrameTime = 0;
  let animationFrameId = 0;
  let portraitMesh;
  let portraitShadow;
  let portraitReflection;
  let contactShadow;

  scene.add(portraitGroup);

  const textureLoader = new THREE.TextureLoader();

  function handlePortraitTextures(portraitTexture, shadowTexture) {
    portraitTexture.colorSpace = THREE.SRGBColorSpace;
    portraitTexture.minFilter = THREE.LinearMipmapLinearFilter;
    portraitTexture.magFilter = THREE.LinearFilter;
    portraitTexture.anisotropy = Math.min(
      8,
      renderer.capabilities.getMaxAnisotropy(),
    );

    const portraitGeometry = new THREE.PlaneGeometry(portraitAspect, 1);
    const shadowAspect = shadowTexture.image.width / shadowTexture.image.height;
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.76,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    portraitShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(shadowAspect, 1),
      shadowMaterial,
    );
    portraitShadow.renderOrder = 1;

    const reflectionMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        portraitMap: { value: portraitTexture },
        reflectionOpacity: { value: 0.085 },
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
          uniform float reflectionOpacity;
          varying vec2 vUv;

          void main() {
            vec4 portrait = texture2D(portraitMap, vUv);
            float fade = pow(1.0 - vUv.y, 2.4);
            float grayscale = dot(portrait.rgb, vec3(0.299, 0.587, 0.114));
            vec3 reflectedColor = mix(vec3(grayscale), vec3(0.72, 0.69, 0.65), 0.55);
            gl_FragColor = vec4(reflectedColor, portrait.a * fade * reflectionOpacity);
          }
        `,
    });

    portraitReflection = new THREE.Mesh(portraitGeometry, reflectionMaterial);
    portraitReflection.scale.y = -1;
    portraitReflection.renderOrder = 0;

    portraitMesh = new THREE.Mesh(
      portraitGeometry,
      new THREE.MeshBasicMaterial({
        map: portraitTexture,
        transparent: true,
        alphaTest: 0.018,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    portraitMesh.renderOrder = 2;

    contactShadow = createContactShadow();
    portraitGroup.add(
      portraitReflection,
      contactShadow,
      portraitShadow,
      portraitMesh,
    );
    layoutPortrait();
    stage.dataset.sceneState = "ready";
    requestSceneFrame();
    resolvePortraitReady();
  }

  function loadTextureWithFallback(sources) {
    return new Promise((resolve, reject) => {
      function attempt(sourceIndex) {
        textureLoader.load(
          sources[sourceIndex],
          resolve,
          undefined,
          (error) => {
            if (sourceIndex + 1 < sources.length) {
              attempt(sourceIndex + 1);
              return;
            }
            reject(error);
          },
        );
      }

      attempt(0);
    });
  }

  Promise.all([
    loadTextureWithFallback(PORTRAIT_TEXTURE_SOURCES),
    loadTextureWithFallback(PORTRAIT_SHADOW_TEXTURE_SOURCES),
  ])
    .then(([portraitTexture, shadowTexture]) => {
      handlePortraitTextures(portraitTexture, shadowTexture);
    })
    .catch((error) => {
      console.error("The portrait textures could not be loaded.", error);
      stage.dataset.sceneState = "error";
      resolvePortraitReady();
    });

  function createContactShadow() {
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 512;
    shadowCanvas.height = 128;
    const context = shadowCanvas.getContext("2d");
    const gradient = context.createRadialGradient(256, 64, 0, 256, 64, 245);
    gradient.addColorStop(0, "rgba(42, 39, 36, 0.25)");
    gradient.addColorStop(0.42, "rgba(67, 62, 57, 0.12)");
    gradient.addColorStop(1, "rgba(85, 79, 72, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 128);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    shadow.renderOrder = 1;
    return shadow;
  }

  function getViewportSizeAtPortrait() {
    const distance = FINAL_CAMERA_Z;
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
    const loaded =
      image.complete && image.naturalWidth > 0
        ? Promise.resolve()
        : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });

    return loaded.then(() => image.decode?.().catch(() => undefined));
  }

  function updateLoadingProgress(deltaTime) {
    if (loadingDisplayed >= 100) return;

    const smoothing = 1 - Math.exp(-5.5 * deltaTime);
    loadingDisplayed = THREE.MathUtils.lerp(
      loadingDisplayed,
      loadingTarget,
      smoothing,
    );

    if (loadingTarget === 100 && 100 - loadingDisplayed < 0.15) {
      loadingDisplayed = 100;
    }

    splashProgressFill.style.transform = `scaleX(${loadingDisplayed / 100})`;
    splashPercentage.textContent = `${Math.round(loadingDisplayed)}%`;
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
    camera.position.z = FINAL_CAMERA_Z;
    document.body.classList.remove(
      "is-intro-pending",
      "is-intro-exiting",
      "is-hero-entering",
    );
    document.body.classList.add("is-intro-complete");
    app.inert = false;
    renderer.render(scene, camera);
  }

  function beginIntroReveal() {
    if (introComplete || reducedMotion.matches) {
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
    loadingTarget = 100;
    loadingDisplayed = 100;
    splashProgressFill.style.transform = "scaleX(1)";
    splashPercentage.textContent = "100%";
    camera.position.z = introCameraStartZ;
    introCameraStartTime = performance.now();
    document.body.classList.add("is-intro-exiting", "is-hero-entering");
    scheduleIntro(finishIntro, 2200);
    syncAnimationLoop();
  }

  function prepareIntro() {
    if (reducedMotion.matches) {
      finishIntro();
      return;
    }

    const criticalImages = Array.from(
      document.querySelectorAll(
        ".splash__mark, .brand__mark, .hero__window-shadow, .black-hole-image, .hero__window-glow",
      ),
    );
    const fontReady = document.fonts?.ready ?? Promise.resolve();
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
          requestSceneFrame();
        }),
    );

    const allCriticalAssets = Promise.allSettled(trackedAssets);
    const loadingFailsafe = new Promise((resolve) => {
      scheduleIntro(resolve, 8000);
    });
    const criticalAssetsReady = Promise.race([
      allCriticalAssets,
      loadingFailsafe,
    ]).then(() => {
      loadingTarget = 100;
    });

    criticalAssetsReady.then(() => {
      const elapsed = performance.now() - introBootTime;
      scheduleIntro(
        beginIntroReveal,
        Math.max(420, INTRO_MINIMUM_MS - elapsed),
      );
    });
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
      FINAL_CAMERA_Z,
      easedProgress,
    );
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

    const shadowPaddingRatio = 1 + (PORTRAIT_SHADOW_PADDING * 2) / 1272;
    const desktopShadow = stage.clientWidth > 850;
    portraitShadow.scale.setScalar(portraitHeight * shadowPaddingRatio);
    portraitShadow.position.set(
      viewport.width * (desktopShadow ? 0.06 : 0.075),
      portraitY - viewport.height * (desktopShadow ? 0.025 : 0.03),
      -0.08,
    );

    const visibleFloor = -viewport.height * 0.37;
    const reflectionHeight = portraitHeight * 0.42;
    portraitReflection.scale.set(reflectionHeight * 0.92, -reflectionHeight, 1);
    portraitReflection.position.set(
      -viewport.width * 0.018,
      visibleFloor - reflectionHeight / 2,
      -0.1,
    );

    contactShadow.scale.set(viewport.width * 0.47, viewport.height * 0.075, 1);
    contactShadow.position.set(0, visibleFloor, -0.04);
  }

  function renderScene(time = 0) {
    const deltaTime = previousFrameTime
      ? Math.min((time - previousFrameTime) / 1000, 0.12)
      : 1 / 60;
    const easing = reducedMotion.matches ? 1 : 1 - Math.exp(-7.5 * deltaTime);
    previousFrameTime = time;
    updateLoadingProgress(deltaTime);
    updateIntroCamera(time);
    pointerCurrent.lerp(pointerTarget, easing);
    portraitGroup.rotation.y = pointerCurrent.x * 0.032;
    portraitGroup.rotation.x = -pointerCurrent.y * 0.016;
    portraitGroup.position.x = pointerCurrent.x * 0.038;
    portraitGroup.position.y = pointerCurrent.y * 0.02 + introPortraitOffsetY;

    hero.style.setProperty("--light-x", `${pointerCurrent.x * 18}px`);
    hero.style.setProperty("--light-y", `${pointerCurrent.y * 12}px`);
    hero.style.setProperty("--window-shadow-x", `${pointerCurrent.x * -19}px`);
    hero.style.setProperty("--window-shadow-y", `${pointerCurrent.y * 13}px`);
    renderer.render(scene, camera);
  }

  function resetPointer() {
    pointerTarget.set(0, 0);
    requestSceneFrame();
  }

  function handlePointerMove(event) {
    if (reducedMotion.matches || event.pointerType === "touch") return;

    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -2;
    pointerTarget.set(
      THREE.MathUtils.clamp(x, -1, 1),
      THREE.MathUtils.clamp(y, -1, 1),
    );
    requestSceneFrame();
  }

  function sceneNeedsAnotherFrame() {
    if (reducedMotion.matches || document.hidden) return false;

    const pointerIsSettling =
      pointerCurrent.distanceToSquared(pointerTarget) > 0.000001;
    const introIsAnimating = introCameraStartTime !== null;
    const loaderIsAnimating =
      !introComplete && loadingDisplayed < loadingTarget - 0.05;

    return pointerIsSettling || introIsAnimating || loaderIsAnimating;
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

    if (reducedMotion.matches) {
      resetPointer();
      pointerCurrent.set(0, 0);
      renderScene(0);
    } else {
      requestSceneFrame();
    }
  }

  function handleMotionPreferenceChange() {
    if (reducedMotion.matches) finishIntro();
    syncAnimationLoop();
  }

  hero.addEventListener("pointermove", handlePointerMove, { passive: true });
  hero.addEventListener("pointerleave", resetPointer);
  reducedMotion.addEventListener("change", handleMotionPreferenceChange);
  document.addEventListener("visibilitychange", syncAnimationLoop);

  function resizeScene() {
    const cssWidth = Math.max(1, stage.clientWidth);
    const cssHeight = Math.max(1, stage.clientHeight);
    const heroHeight = Math.max(1, hero.clientHeight);
    const requestedRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    const requestedPixels =
      cssWidth * requestedRatio * heroHeight * requestedRatio;
    const pixelScale =
      requestedPixels > MAX_PIXEL_COUNT
        ? Math.sqrt(MAX_PIXEL_COUNT / requestedPixels)
        : 1;

    renderer.setPixelRatio(requestedRatio * pixelScale);
    renderer.setSize(cssWidth, cssHeight, false);

    camera.aspect = cssWidth / heroHeight;
    camera.setViewOffset(cssWidth, heroHeight, 0, 0, cssWidth, cssHeight);
    camera.updateProjectionMatrix();
    layoutPortrait();
    renderer.render(scene, camera);
  }

  const resizeObserver = new ResizeObserver(resizeScene);
  resizeObserver.observe(stage);
  resizeScene();
  syncAnimationLoop();
  prepareIntro();

  function dispose() {
    resizeObserver.disconnect();
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    clearIntroTimers();
    hero.removeEventListener("pointermove", handlePointerMove);
    hero.removeEventListener("pointerleave", resetPointer);
    reducedMotion.removeEventListener("change", handleMotionPreferenceChange);
    document.removeEventListener("visibilitychange", syncAnimationLoop);

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
  }

  return dispose;
}
