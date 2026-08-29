import "@fontsource/anton/latin-400.css";
import "@fontsource-variable/big-shoulders";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/dm-serif-display/latin-400.css";
import "@fontsource/fredoka/latin-700.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";

import { initMobileNavigation } from "./components/site-header/mobile-navigation.js";

const app = document.querySelector("#app");
const skipLink = document.querySelector(".skip-link");
const mainContent = document.querySelector("#main-content");
const disposers = [];
let pageDisposed = false;

document.documentElement.classList.add("has-js");

function forceHeroOrigin() {
  if (window.location.hash) {
    history.replaceState(
      history.state,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }
  window.scrollTo(0, 0);
}

function releaseIntro() {
  if (window.__portfolioSplashFailsafe) {
    window.clearTimeout(window.__portfolioSplashFailsafe);
    window.__portfolioSplashFailsafe = 0;
  }
  document.body.classList.remove(
    "is-intro-pending",
    "is-intro-exiting",
    "is-hero-entering",
    "is-splash-animating",
  );
  document.body.classList.add("is-intro-complete");
  if (app) app.inert = false;
}

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  releaseIntro();
} else if (app) {
  app.inert = true;
}

forceHeroOrigin();
window.requestAnimationFrame(forceHeroOrigin);

function handleSkipLinkClick() {
  window.requestAnimationFrame(() => {
    mainContent?.focus({ preventScroll: true });
  });
}

skipLink?.addEventListener("click", handleSkipLinkClick);

function initializeFeature(name, initialize) {
  try {
    const dispose = initialize();
    if (typeof dispose === "function") {
      if (pageDisposed) dispose();
      else disposers.push(dispose);
    }
  } catch (error) {
    console.error(`${name} could not be initialized.`, error);
  }
}

initializeFeature("Mobile navigation", initMobileNavigation);

void import("./world/world.js")
  .then(({ initWorld }) => {
    initializeFeature("Portfolio world", () => {
      try {
        return initWorld();
      } catch (error) {
        releaseIntro();
        throw error;
      }
    });
  })
  .catch((error) => {
    console.error("Portfolio world could not be loaded.", error);
    releaseIntro();
  });

function handlePageHide(event) {
  if (event.persisted) return;
  pageDisposed = true;
  while (disposers.length) disposers.pop()?.();
  if (window.__portfolioSplashFailsafe) {
    window.clearTimeout(window.__portfolioSplashFailsafe);
    window.__portfolioSplashFailsafe = 0;
  }
  skipLink?.removeEventListener("click", handleSkipLinkClick);
  window.removeEventListener("pagehide", handlePageHide);
}

window.addEventListener("pagehide", handlePageHide);
