import "@fontsource/anton/latin-400.css";
import "@fontsource/dm-serif-display/latin-400.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";

import { initMobileNavigation } from "./components/site-header/mobile-navigation.js";
import { initSectionNavigation } from "./components/site-header/section-navigation.js";
import { initLockedOverlayPlacement } from "./components/overlay-positioner.js";
import { initBlackHole } from "./sections/about/black-hole.js";
import { initCutoutScrollExit } from "./sections/hero/cutout-scroll-exit.js";
import { initSkillsReveal } from "./sections/skills/skills.js";

const app = document.querySelector("#app");
const skipLink = document.querySelector(".skip-link");
const mainContent = document.querySelector("#main-content");
const disposers = [];
let pageDisposed = false;
let introReleaseTimer = 0;
let sceneEditorLoadTimer = 0;
let sceneEditorClassObserver = null;
let sceneEditorEnhancementHandle = 0;
// Scene tools are visible by default on the local Vite server so the world
// editor is discoverable. `?edit=off` provides a clean local presentation;
// production still strips the complete editor block and modules.
const sceneEditorEnabled =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("edit") !== "off";
const sceneEditors = document.querySelectorAll("[data-scene-editor]");

document.documentElement.classList.add("has-cinematic-scene");
document.documentElement.classList.toggle(
  "has-scene-editor",
  sceneEditorEnabled,
);
sceneEditors.forEach((editor) => {
  editor.hidden = true;
});

function releaseIntro() {
  if (introReleaseTimer) {
    window.clearTimeout(introReleaseTimer);
    introReleaseTimer = 0;
  }
  document.body.classList.remove(
    "is-intro-pending",
    "is-intro-exiting",
    "is-hero-entering",
  );
  document.body.classList.add("is-intro-complete");
  document.documentElement.classList.remove("is-refresh-restart");
  if ("scrollRestoration" in history) history.scrollRestoration = "auto";
  if (app) app.inert = false;
}

if (window.location.hash) releaseIntro();
else introReleaseTimer = window.setTimeout(releaseIntro, 2400);

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
    document.documentElement.classList.add("is-static-fallback");
    releaseIntro();
  }
}

initializeFeature("Mobile navigation", initMobileNavigation);
initializeFeature("Section navigation", initSectionNavigation);
initializeFeature("World overlay", initLockedOverlayPlacement);
initializeFeature("Hero scroll handoff", initCutoutScrollExit);
initializeFeature("About narrative", initBlackHole);
initializeFeature("Skills reveal", initSkillsReveal);

void import("./sections/hero/hero-scene.js")
  .then(({ initHeroScene }) => {
    initializeFeature("Hero scene", initHeroScene);
  })
  .catch((error) => {
    console.error("Hero scene could not be loaded.", error);
    document.documentElement.classList.add("is-static-fallback");
    releaseIntro();
  });

async function loadSceneEditors() {
  sceneEditorLoadTimer = 0;
  if (pageDisposed) return;
  try {
    const { loadSceneEditorShell, loadSceneEditorModules } =
      await import("virtual:scene-editor");
    await loadSceneEditorShell();
    const blackHoleEditor = document.querySelector(".black-hole-editor");
    if (blackHoleEditor) blackHoleEditor.hidden = false;

    const loadEnhancements = async () => {
      sceneEditorEnhancementHandle = 0;
      if (pageDisposed) return;
      const editorModules = await loadSceneEditorModules();
      if (!editorModules) return;
      const { originState, aboutEditor, sceneCopy, fluidCursor } =
        editorModules;
      sceneEditors.forEach((editor) => {
        editor.hidden = false;
      });
      disposers.push(originState.installOriginStateResponder());
      await originState.importOriginStateIntoLab();
      initializeFeature("About copy editor", aboutEditor.initAboutCopyEditor);
      initializeFeature("Scene state copy", sceneCopy.initSceneStateCopy);
      initializeFeature("Fluid cursor lab", fluidCursor.initFluidCursor);
    };

    if ("requestIdleCallback" in window) {
      sceneEditorEnhancementHandle = window.requestIdleCallback(
        () => void loadEnhancements(),
      );
    } else {
      sceneEditorEnhancementHandle = window.setTimeout(
        () => void loadEnhancements(),
        1500,
      );
    }
  } catch (error) {
    console.error("Scene editing tools could not be loaded.", error);
  }
}

if (sceneEditorEnabled) {
  const scheduleSceneEditorLoad = () => {
    sceneEditorClassObserver?.disconnect();
    sceneEditorClassObserver = null;
    sceneEditorLoadTimer = window.setTimeout(() => void loadSceneEditors(), 0);
  };

  // Keep the editor's Vue/CSS module compilation entirely outside the
  // cinematic intro. Hash entries have already skipped the intro and load the
  // tools immediately; normal entry waits for the real completion class.
  if (document.body.classList.contains("is-intro-complete")) {
    scheduleSceneEditorLoad();
  } else {
    sceneEditorClassObserver = new MutationObserver(() => {
      if (document.body.classList.contains("is-intro-complete")) {
        scheduleSceneEditorLoad();
      }
    });
    sceneEditorClassObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
}

if (window.location.hash) {
  window.requestAnimationFrame(() => {
    let target = null;
    try {
      target = document.getElementById(
        decodeURIComponent(window.location.hash.slice(1)),
      );
    } catch {
      // Leave malformed fragments to the browser's default behavior.
    }
    if (!target) return;
    target.scrollIntoView({ block: "start" });
    if (target.id === "about") {
      const holdDistance = Math.max(0, target.offsetHeight - innerHeight);
      window.scrollBy(0, holdDistance * 0.4);
    }
  });
}

function handlePageHide(event) {
  if (event.persisted) return;
  pageDisposed = true;
  if (introReleaseTimer) window.clearTimeout(introReleaseTimer);
  if (sceneEditorLoadTimer) window.clearTimeout(sceneEditorLoadTimer);
  sceneEditorClassObserver?.disconnect();
  if (sceneEditorEnhancementHandle) {
    if ("cancelIdleCallback" in window) {
      window.cancelIdleCallback(sceneEditorEnhancementHandle);
    } else {
      window.clearTimeout(sceneEditorEnhancementHandle);
    }
  }
  while (disposers.length) disposers.pop()?.();
  skipLink?.removeEventListener("click", handleSkipLinkClick);
  window.removeEventListener("pagehide", handlePageHide);
}

window.addEventListener("pagehide", handlePageHide);
