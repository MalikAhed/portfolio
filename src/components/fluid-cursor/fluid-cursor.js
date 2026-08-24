import { loadFluidSettings, publishFluidSettings } from "./fluid-settings.js";

/** Mounts the registry FluidCursor as an isolated depth-world Vue island. */
export function initFluidCursor() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const precisePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  );
  const settings = publishFluidSettings(loadFluidSettings());
  if (reducedMotion.matches || !precisePointer.matches) return () => {};

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
    document.body.append(host);

    app = createApp(FluidCursor, {
      class: "inspira-fluid-cursor",
      simResolution: 96,
      dyeResolution: 640,
      captureResolution: 384,
      densityDissipation: settings.fade,
      velocityDissipation: 2,
      pressure: 0.1,
      pressureIterations: 12,
      curl: settings.curl,
      splatRadius: settings.radius,
      splatForce: settings.force,
      smokeColor: settings.color,
      outerColor: settings.outerColor,
      outerRate: settings.outerRate,
      outerSize: settings.outerSize,
      outerDistance: settings.outerDistance,
      shading: true,
      transparent: true,
    });
    app.mount(host);
  });

  return () => {
    disposed = true;
    app?.unmount();
    host?.remove();
  };
}
