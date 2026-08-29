import { getRequiredElement } from "../lib/dom.js";
import { HERO_CAMERA_Z, WARP_SPEED_WORLD_CONFIG } from "./config.js";

export function initBlackHoleCameraEditor(getCameraZ, onChange) {
  const editor = getRequiredElement("[data-black-hole-camera-editor]");
  const currentOutput = getRequiredElement(
    "[data-black-hole-camera-current]",
    editor,
  );
  const scrollEndInput = getRequiredElement(
    "[data-black-hole-camera-scroll-end]",
    editor,
  );
  const scrollEndOutput = getRequiredElement(
    "[data-black-hole-camera-scroll-end-value]",
    editor,
  );
  const shiftStartInput = getRequiredElement(
    "[data-black-hole-shift-start]",
    editor,
  );
  const shiftStartOutput = getRequiredElement(
    "[data-black-hole-shift-start-value]",
    editor,
  );
  const useCurrentButton = getRequiredElement(
    "[data-black-hole-camera-use-current]",
    editor,
  );
  const copyButton = getRequiredElement(
    "[data-black-hole-camera-copy]",
    editor,
  );
  const settings = {
    journeyEndCameraZ: WARP_SPEED_WORLD_CONFIG.endCameraZ,
    blackHoleShiftStartCameraZ:
      WARP_SPEED_WORLD_CONFIG.blackHoleShiftStartCameraZ,
  };

  function getJourneyPercentage(cameraZ) {
    return (
      ((cameraZ - HERO_CAMERA_Z) /
        (settings.journeyEndCameraZ - HERO_CAMERA_Z)) *
      100
    );
  }

  function refresh() {
    const latestShiftStart =
      settings.journeyEndCameraZ -
      WARP_SPEED_WORLD_CONFIG.blackHoleShiftTravelCameraZ;
    shiftStartInput.max = latestShiftStart.toFixed(1);
    settings.blackHoleShiftStartCameraZ = Math.min(
      settings.blackHoleShiftStartCameraZ,
      latestShiftStart,
    );
    scrollEndInput.value = settings.journeyEndCameraZ.toFixed(1);
    scrollEndOutput.value = settings.journeyEndCameraZ.toFixed(1);
    shiftStartInput.value = settings.blackHoleShiftStartCameraZ.toFixed(1);
    shiftStartOutput.value = settings.blackHoleShiftStartCameraZ.toFixed(1);
  }

  function handleScrollEndInput() {
    const value = Number(scrollEndInput.value);
    if (!Number.isFinite(value)) return;
    settings.journeyEndCameraZ = value;
    refresh();
    onChange();
  }

  function handleShiftStartInput() {
    const value = Number(shiftStartInput.value);
    if (!Number.isFinite(value)) return;
    settings.blackHoleShiftStartCameraZ = Math.min(
      value,
      settings.journeyEndCameraZ -
        WARP_SPEED_WORLD_CONFIG.blackHoleShiftTravelCameraZ,
    );
    refresh();
    onChange();
  }

  function handleUseCurrent() {
    settings.blackHoleShiftStartCameraZ = Math.min(
      settings.journeyEndCameraZ -
        WARP_SPEED_WORLD_CONFIG.blackHoleShiftTravelCameraZ,
      Math.max(Number(shiftStartInput.min), getCameraZ()),
    );
    refresh();
    onChange();
  }

  async function handleCopy() {
    const text = [
      "Black-hole ending settings",
      `scroll stops: Z ${settings.journeyEndCameraZ.toFixed(1)}`,
      `black hole starts moving down: Z ${settings.blackHoleShiftStartCameraZ.toFixed(1)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = "Copied settings";
      window.setTimeout(() => {
        copyButton.textContent = "Copy settings";
      }, 1200);
    } catch (error) {
      console.warn("Could not copy black-hole ending settings.", error);
      copyButton.textContent = "Copy failed";
    }
  }

  function setCurrentCameraZ(cameraZ) {
    currentOutput.value = `${cameraZ.toFixed(1)} · ${getJourneyPercentage(cameraZ).toFixed(1)}%`;
  }

  scrollEndInput.addEventListener("input", handleScrollEndInput);
  shiftStartInput.addEventListener("input", handleShiftStartInput);
  useCurrentButton.addEventListener("click", handleUseCurrent);
  copyButton.addEventListener("click", handleCopy);
  refresh();
  setCurrentCameraZ(getCameraZ());
  editor.hidden = false;

  return {
    settings,
    setCurrentCameraZ,
    dispose() {
      scrollEndInput.removeEventListener("input", handleScrollEndInput);
      shiftStartInput.removeEventListener("input", handleShiftStartInput);
      useCurrentButton.removeEventListener("click", handleUseCurrent);
      copyButton.removeEventListener("click", handleCopy);
      editor.hidden = true;
    },
  };
}
