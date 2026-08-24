export function initCutoutScrollExit() {
  const flow = document.querySelector(".hero-about-flow");
  const hero = document.querySelector(".hero");
  const scene = document.querySelector(".scene");

  if (!flow || !hero || !scene) return () => {};

  let frame = 0;
  let heroHeight = 1;
  let extendedHeight = 0;
  let heroInRange = true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function measureLayout() {
    heroHeight = Math.max(1, hero.offsetHeight);
    extendedHeight = Math.max(0, scene.offsetHeight - heroHeight);
  }

  function render() {
    frame = 0;
    const portraitExitDistance = heroHeight * 0.5;
    const progress = Math.max(
      0,
      Math.min(1, window.scrollY / portraitExitDistance),
    );
    const outroProgress = Math.max(
      0,
      Math.min(1, window.scrollY / (heroHeight * 0.72)),
    );
    const easedOutro = outroProgress * outroProgress * (3 - 2 * outroProgress);
    const backdropProgress = Math.max(
      0,
      Math.min(1, window.scrollY / (heroHeight * 1.08)),
    );
    const easedBackdrop =
      backdropProgress * backdropProgress * (3 - 2 * backdropProgress);
    const clearance = heroHeight * 0.2;
    const upwardExit = reducedMotion.matches
      ? 0
      : -(extendedHeight + clearance) * progress;
    flow.style.setProperty("--scene-scroll-y", `${upwardExit}px`);
    flow.style.setProperty("--hero-outro", String(easedOutro));
    flow.style.setProperty("--hero-backdrop-outro", String(easedBackdrop));
  }

  function requestRender() {
    if (frame) return;
    frame = requestAnimationFrame(render);
  }

  function handleScroll() {
    if (heroInRange) requestRender();
  }

  function handleMotionPreferenceChange() {
    flow.classList.toggle(
      "is-hero-scroll-active",
      heroInRange && !reducedMotion.matches,
    );
    requestRender();
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  const resizeObserver = new ResizeObserver(() => {
    measureLayout();
    requestRender();
  });
  resizeObserver.observe(hero);
  resizeObserver.observe(scene);
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      heroInRange = entry.isIntersecting;
      flow.classList.toggle(
        "is-hero-scroll-active",
        heroInRange && !reducedMotion.matches,
      );
      requestRender();
    },
    { rootMargin: "25% 0px" },
  );
  visibilityObserver.observe(hero);
  reducedMotion.addEventListener("change", handleMotionPreferenceChange);
  measureLayout();
  render();

  return () => {
    window.removeEventListener("scroll", handleScroll);
    reducedMotion.removeEventListener("change", handleMotionPreferenceChange);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    flow.classList.remove("is-hero-scroll-active");
    if (frame) cancelAnimationFrame(frame);
  };
}
