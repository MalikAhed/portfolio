// Stored placement is a local scene-editor concern. Production always uses the
// source-controlled composition so returning visitors see the same world.
const STORAGE_KEY = "portfolio-overlay-position-v2";
const editorEnabled =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("edit") === "scene";

const DEFAULT_PLACEMENT = {
  x: -210.70892333984375,
  y: -141.93353271484375,
  rotation: 11,
  scale: 1.54,
  angle: 122,
  cutoutOffset: -35,
};

function readLockedPlacement() {
  if (!editorEnabled) return { ...DEFAULT_PLACEMENT };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Object.fromEntries(
      Object.entries(DEFAULT_PLACEMENT).map(([key, fallback]) => [
        key,
        Number.isFinite(stored?.[key]) ? stored[key] : fallback,
      ]),
    );
  } catch {
    return { ...DEFAULT_PLACEMENT };
  }
}

export function initLockedOverlayPlacement() {
  const flow = document.querySelector(".hero-about-flow");
  if (!flow) return () => {};

  const placement = readLockedPlacement();
  const halfAngle = (placement.angle * Math.PI) / 360;
  let frame = 0;

  function renderViewportPlacement() {
    frame = 0;
    const tailSize = window.innerWidth / 2 / Math.tan(halfAngle);
    flow.style.setProperty("--portrait-tail-size", `${tailSize}px`);
  }

  function requestPlacementUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(renderViewportPlacement);
  }

  flow.style.setProperty("--overlay-x", `${placement.x}px`);
  flow.style.setProperty("--overlay-y", `${placement.y}px`);
  flow.style.setProperty("--overlay-rotation", `${placement.rotation}deg`);
  flow.style.setProperty("--overlay-scale", String(placement.scale));
  flow.style.setProperty("--cutout-offset", `${placement.cutoutOffset}svh`);
  renderViewportPlacement();
  window.addEventListener("resize", requestPlacementUpdate);

  return () => {
    window.removeEventListener("resize", requestPlacementUpdate);
    if (frame) window.cancelAnimationFrame(frame);
  };
}
