import { MathUtils } from "three";
import { WARP_SPEED_WORLD_CONFIG } from "./config.js";

function getScreenSpaceLinearCameraDistance(
  nearDistance,
  farDistance,
  progress,
) {
  const projectedScale = MathUtils.lerp(
    1 / nearDistance,
    1 / farDistance,
    progress,
  );

  return 1 / projectedScale;
}

function createLazySimulation(iframe, worldStage) {
  const source = iframe.dataset.src;
  let idleCallbackId = 0;
  let retryTimer = 0;
  let loadStarted = false;
  let loaded = false;
  let latestMessage = null;

  function clearSchedule() {
    if (idleCallbackId) window.cancelIdleCallback?.(idleCallbackId);
    if (retryTimer) window.clearTimeout(retryTimer);
    idleCallbackId = 0;
    retryTimer = 0;
  }

  function postLatestMessage() {
    if (!loaded || !latestMessage) return;
    iframe.contentWindow?.postMessage(latestMessage, window.location.origin);
  }

  function load() {
    if (loadStarted || !source) return;
    clearSchedule();
    loadStarted = true;
    iframe.src = source;
  }

  function schedule() {
    if (loadStarted || idleCallbackId || retryTimer) return;
    const loadWhenSettled = () => {
      idleCallbackId = 0;
      retryTimer = 0;
      if (worldStage.classList.contains("is-journey-scrolling")) {
        retryTimer = window.setTimeout(() => {
          retryTimer = 0;
          schedule();
        }, 500);
      } else {
        load();
      }
    };

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(loadWhenSettled, {
        timeout: 2500,
      });
    } else {
      retryTimer = window.setTimeout(loadWhenSettled, 300);
    }
  }

  function handleLoad() {
    loaded = true;
    postLatestMessage();
  }

  iframe.addEventListener("load", handleLoad);

  return {
    prepare(force = false) {
      if (force) load();
      else schedule();
    },
    setState(message) {
      latestMessage = message;
      postLatestMessage();
    },
    dispose() {
      clearSchedule();
      iframe.removeEventListener("load", handleLoad);
      iframe.removeAttribute("src");
    },
  };
}

export function createWarpSpeedController({
  element,
  endingComposition,
  iframe,
  warpLines,
  worldStage,
}) {
  const simulation = createLazySimulation(iframe, worldStage);

  function update(cameraZ, reducedMotion, cameraSettings) {
    if (reducedMotion) {
      element.style.opacity = "0";
      element.style.visibility = "hidden";
      worldStage.classList.remove("is-warp-active");
      worldStage.classList.remove("is-ending-visible");
      endingComposition.style.opacity = "0";
      endingComposition.style.visibility = "hidden";
      endingComposition.classList.remove("is-interactive");
      endingComposition.inert = true;
      endingComposition.setAttribute("aria-hidden", "true");
      simulation.setState({
        type: "portfolio-warp",
        active: false,
        intensity: 0,
      });
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
    if (cameraZ >= simulationStartCameraZ - 12) {
      simulation.prepare(cameraZ >= simulationStartCameraZ - 4);
    }

    const passageActive = cameraZ >= effectStartCameraZ;
    const lineExitVisibility =
      1 -
      MathUtils.smoothstep(cameraZ, lineFadeStartCameraZ, lineFadeEndCameraZ);
    const linesActive = passageActive && lineExitVisibility > 0.001;
    const simulationActive = cameraZ >= simulationStartCameraZ;
    const simulationRevealProgress = MathUtils.clamp(
      (cameraZ - simulationStartCameraZ) / simulationRevealTravelCameraZ,
      0,
      1,
    );
    const simulationVisibility = simulationActive
      ? MathUtils.lerp(simulationStartOpacity, 1, simulationRevealProgress)
      : 0;
    const simulationBlur = MathUtils.lerp(
      simulationStartBlurPixels,
      0,
      simulationRevealProgress,
    );
    const effectVisibility =
      MathUtils.smoothstep(
        cameraZ,
        effectStartCameraZ,
        effectRevealEndCameraZ,
      ) * lineExitVisibility;
    const effectTravel = MathUtils.clamp(
      (cameraZ - effectStartCameraZ) / (journeyEndCameraZ - effectStartCameraZ),
      0,
      1,
    );
    const blackHoleMotionProgress = MathUtils.clamp(
      (cameraZ - blackHoleShiftStartCameraZ) / blackHoleShiftTravelCameraZ,
      0,
      1,
    );
    const blackHoleScreenOffset = MathUtils.lerp(
      0,
      endBlackHoleScreenOffset,
      blackHoleMotionProgress,
    );
    const endingVisibility = MathUtils.clamp(
      (cameraZ - endingRevealStartCameraZ) /
        (endingRevealEndCameraZ - endingRevealStartCameraZ),
      0,
      1,
    );
    const endingVisible = endingVisibility > 0.001;
    const endingInteractive = endingVisibility > 0.96;
    const darkness = MathUtils.smoothstep(
      cameraZ,
      darknessFadeStartCameraZ,
      darknessFadeEndCameraZ,
    );
    const colorInversion = MathUtils.smoothstep(darkness, 0.44, 0.56);
    const colorChannel = MathUtils.lerp(16, 249, colorInversion);
    const cameraDistance = getScreenSpaceLinearCameraDistance(
      nearCameraDistance,
      farCameraDistance,
      blackHoleMotionProgress,
    );
    const lineCount = Math.round(
      MathUtils.lerp(startLineCount, endLineCount, blackHoleMotionProgress),
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
    worldStage.classList.toggle("is-warp-active", simulationActive);
    worldStage.classList.toggle("is-ending-visible", endingVisible);
    warpLines.setState(linesActive, effectTravel, colorChannel);
    simulation.setState({
      type: "portfolio-warp",
      active: simulationActive,
      travel: blackHoleMotionProgress,
      cameraDistance,
      blackHoleScreenOffset,
      lineCount,
    });
  }

  return {
    update,
    dispose: simulation.dispose,
  };
}
