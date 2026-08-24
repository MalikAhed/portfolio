export function initSkillsReveal() {
  const section = document.querySelector(".skills");
  const heading = section?.querySelector("[data-skills-heading]");
  if (!section || !heading) return () => {};

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  section.classList.add("skills--enhanced");

  function reveal() {
    section.classList.add("skills--revealed");
  }

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    reveal();
    return () => section.classList.remove("skills--enhanced");
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      reveal();
      observer.disconnect();
    },
    { rootMargin: "-8% 0px -8%", threshold: 0.12 },
  );

  observer.observe(heading);

  return () => {
    observer.disconnect();
    section.classList.remove("skills--enhanced", "skills--revealed");
  };
}
