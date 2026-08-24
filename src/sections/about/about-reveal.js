export function initAboutReveal() {
  const about = document.querySelector(".about");
  if (!about) return () => {};

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;

  const updateProgress = () => {
    frame = 0;
    const rect = about.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const progress = Math.min(
      1,
      Math.max(0, (viewportHeight - rect.top) / (viewportHeight + rect.height)),
    );
    about.style.setProperty("--about-progress", progress.toFixed(4));
  };

  const requestUpdate = () => {
    if (frame || reducedMotion.matches) return;
    frame = window.requestAnimationFrame(updateProgress);
  };

  let observer;
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    about.classList.add("is-about-visible");
  } else {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        about.classList.add("is-about-visible");
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -8%" },
    );
    observer.observe(about);
  }

  if (!reducedMotion.matches) {
    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  }

  return () => {
    observer?.disconnect();
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", requestUpdate);
    if (frame) window.cancelAnimationFrame(frame);
  };
}
