/** Mounts the registry FluidCursor as an isolated depth-world Vue island. */
export function initFluidCursor() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const precisePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  );
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
      densityDissipation: 3.5,
      velocityDissipation: 2,
      pressure: 0.1,
      pressureIterations: 12,
      curl: 3,
      splatRadius: 0.18,
      splatForce: 5200,
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
