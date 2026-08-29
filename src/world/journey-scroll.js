import { getRequiredElement } from "../lib/dom.js";
import {
  FOCUS_WORLD_CONFIG,
  HERO_CAMERA_Z,
  JOURNEY_CAMERA_END_Z,
  getCameraZAtProgress,
  getWorldBlurAtDepth,
  getWorldVisibilityAtDepth,
} from "./config.js";

// Keep settled-state effects suspended through temporarily missed frames on
// slower devices instead of toggling them repeatedly during a fast gesture.
const SCROLL_RENDER_SETTLE_MS = 320;
const clamp = (value, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export function createJourneyState(
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

export function initJourneyScroll(
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
