// v2 prevents a previously published, incorrect placement from overriding the
// authored Hero/About checkpoint on returning browsers.
const STORAGE_KEY = "portfolio-overlay-position-v2";

const DEFAULT_PLACEMENT = {
  x: -210.70892333984375,
  y: -141.93353271484375,
  rotation: 11,
  scale: 1.54,
  angle: 122,
  cutoutOffset: -35,
};

function readLockedPlacement() {
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

  function render() {
    const halfAngle = (placement.angle * Math.PI) / 360;
    const tailSize = window.innerWidth / 2 / Math.tan(halfAngle);

    flow.style.setProperty("--overlay-x", `${placement.x}px`);
    flow.style.setProperty("--overlay-y", `${placement.y}px`);
    flow.style.setProperty("--overlay-rotation", `${placement.rotation}deg`);
    flow.style.setProperty("--overlay-scale", String(placement.scale));
    flow.style.setProperty("--portrait-tail-size", `${tailSize}px`);
    flow.style.setProperty("--cutout-offset", `${placement.cutoutOffset}svh`);
  }

  render();
  window.addEventListener("resize", render);

  return () => window.removeEventListener("resize", render);
}
