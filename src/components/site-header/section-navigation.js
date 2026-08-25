import { getRequiredElement } from "../../lib/dom.js";

const SECTION_LINK_SELECTOR = 'a[href="#about"], a[href="#skills"]';
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SKILLS_NAVIGATION_CLASS = "is-skills-navigation";
const NAVIGATION_SETTLE_EVENT = "portfolio:section-navigation-settle";
const INTERRUPTION_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
]);
const MIN_DURATION_MS = 1800;
const MAX_DURATION_MS = 4200;
const TRAVEL_RATE = 0.68;

function smootherStep(progress) {
  return progress ** 3 * (progress * (progress * 6 - 15) + 10);
}

function getTargetScrollPosition(target) {
  const scrollPadding = Number.parseFloat(
    getComputedStyle(document.documentElement).scrollPaddingBlockStart,
  );
  const offset = Number.isFinite(scrollPadding) ? scrollPadding : 0;
  const maximum = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );

  return Math.min(
    maximum,
    Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset),
  );
}

/**
 * About and Skills remain normal semantic anchors. About advances through the
 * authored scene states; Skills temporarily bypasses the heavier About
 * narrative and settles it once the destination is reached.
 */
export function initSectionNavigation() {
  const navigation = getRequiredElement("#primary-navigation");
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  let frame = 0;

  function settleJourney() {
    if (!document.documentElement.classList.contains(SKILLS_NAVIGATION_CLASS)) {
      return;
    }

    document.documentElement.classList.remove(SKILLS_NAVIGATION_CLASS);
    window.dispatchEvent(new Event(NAVIGATION_SETTLE_EVENT));
  }

  function cancelJourney() {
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    settleJourney();
  }

  function travelTo(targetY, { bypassAbout = false } = {}) {
    cancelJourney();
    document.documentElement.classList.toggle(
      SKILLS_NAVIGATION_CLASS,
      bypassAbout,
    );

    const startY = window.scrollY;
    const distance = targetY - startY;
    if (reducedMotion.matches || Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      settleJourney();
      return;
    }

    const duration = Math.min(
      MAX_DURATION_MS,
      Math.max(MIN_DURATION_MS, Math.abs(distance) / TRAVEL_RATE),
    );
    const startTime = performance.now();

    function advance(time) {
      const progress = Math.min(1, (time - startTime) / duration);
      window.scrollTo(0, startY + distance * smootherStep(progress));

      if (progress < 1) {
        frame = window.requestAnimationFrame(advance);
      } else {
        frame = 0;
        window.scrollTo(0, targetY);
        settleJourney();
      }
    }

    frame = window.requestAnimationFrame(advance);
  }

  function handleClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest(SECTION_LINK_SELECTOR);
    if (!(link instanceof HTMLAnchorElement)) return;

    const target = document.querySelector(link.hash);
    if (!target) return;

    event.preventDefault();
    history.pushState(null, "", link.hash);
    travelTo(getTargetScrollPosition(target), {
      bypassAbout: link.hash === "#skills",
    });
  }

  function handleKeydown(event) {
    if (INTERRUPTION_KEYS.has(event.key)) cancelJourney();
  }

  navigation.addEventListener("click", handleClick);
  window.addEventListener("wheel", cancelJourney, { passive: true });
  window.addEventListener("touchstart", cancelJourney, { passive: true });
  window.addEventListener("keydown", handleKeydown);

  return function dispose() {
    cancelJourney();
    navigation.removeEventListener("click", handleClick);
    window.removeEventListener("wheel", cancelJourney);
    window.removeEventListener("touchstart", cancelJourney);
    window.removeEventListener("keydown", handleKeydown);
  };
}
