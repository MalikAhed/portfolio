import "@fontsource/anton/latin-400.css";
import "@fontsource/dm-serif-display/latin-400.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";

import { initMobileNavigation } from "./components/site-header/mobile-navigation.js";
import {
  importOriginStateIntoLab,
  installOriginStateResponder,
} from "./components/origin-state-transfer.js";
import { initHeroScene } from "./sections/hero/hero-scene.js";
import { initLockedOverlayPlacement } from "./components/overlay-positioner.js";
import { initCutoutScrollExit } from "./sections/hero/cutout-scroll-exit.js";
import { initBlackHole } from "./sections/about/black-hole.js";
import { initAboutCopyEditor } from "./sections/about/about-copy-editor.js";

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function resetInitialScroll() {
  window.scrollTo(0, 0);
}

resetInitialScroll();
window.addEventListener("pageshow", resetInitialScroll);

const disposeOriginStateResponder = installOriginStateResponder();
await importOriginStateIntoLab();

const disposeFeatures = [
  disposeOriginStateResponder,
  initMobileNavigation(),
  initHeroScene(),
  initLockedOverlayPlacement(),
  initCutoutScrollExit(),
  initBlackHole(),
  initAboutCopyEditor(),
];

function handlePageHide(event) {
  if (event.persisted) return;
  disposeFeatures.reverse().forEach((dispose) => dispose());
  window.removeEventListener("pagehide", handlePageHide);
  window.removeEventListener("pageshow", resetInitialScroll);
}

window.addEventListener("pagehide", handlePageHide);
