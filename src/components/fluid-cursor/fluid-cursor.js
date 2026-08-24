import { loadFluidSettings, publishFluidSettings } from "./fluid-settings.js";

/** Mounts the registry FluidCursor as an isolated depth-world Vue island. */
export function initFluidCursor() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const settings = publishFluidSettings(loadFluidSettings());
  if (reducedMotion.matches) return () => {};

  const hero = document.querySelector("[data-hero]");
  if (!hero) return () => {};

  let disposed = false;
  let host = null;
  let app = null;

  void Promise.all([
    import("vue"),
    import("../ui/fluid-cursor/FluidCursor.vue"),
  ]).then(([{ createApp }, { default: FluidCursor }]) => {
    if (disposed) return;

    host = document.createElement("div");
    host.className = "fluid-cursor-host";
    host.setAttribute("aria-hidden", "true");
    hero.prepend(host);

    app = createApp(FluidCursor, {
      class: "inspira-fluid-cursor",
      enabled: settings.enabled,
      simResolution: 96,
      dyeResolution: 640,
      captureResolution: 384,
      pressureIterations: 12,
      densityDissipation: Math.log(10) / settings.fadeTime,
      curl: settings.curl,
      splatRadius: settings.radius,
      splatForce: settings.force,
      colorMode: settings.colorMode,
      smokeColor: settings.color,
      secondaryColor: settings.secondaryColor,
      colorStrength: settings.colorStrength,
      emitterReach: settings.reach,
      emissionRate: settings.emissionRate,
      originX: settings.originX,
      emitterGap: settings.emitterGap,
      emitterY: settings.emitterY,
      emitterSpread: settings.emitterSpread,
    });
    app.mount(host);
  });

  return () => {
    disposed = true;
    app?.unmount();
    host?.remove();
  };
}
