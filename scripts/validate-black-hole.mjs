import { mkdirSync, writeFileSync } from "node:fs";

const debugPort = process.env.BLACK_HOLE_DEBUG_PORT ?? "9223";
const browserTargets = await fetch(
  `http://127.0.0.1:${debugPort}/json/list`,
).then((response) => response.json());
const target = browserTargets.find((entry) => entry.type === "page");
if (!target) throw new Error("No Chromium page target was available.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pendingCommands = new Map();
const runtimeErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pendingCommands.has(message.id)) {
    const { resolve, reject } = pendingCommands.get(message.id);
    pendingCommands.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") {
    runtimeErrors.push(message.params.exceptionDetails.text);
  }
});

function send(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pendingCommands.set(id, { reject, resolve });
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ??
        result.exceptionDetails.text,
    );
  }
  return result.result.value;
}

async function waitFor(expression, description, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

async function navigate(width, height, reducedMotion = true) {
  await send("Emulation.setDeviceMetricsOverride", {
    deviceScaleFactor: 1,
    height,
    mobile: width <= 680,
    screenHeight: height,
    screenWidth: width,
    width,
  });
  await send("Emulation.setEmulatedMedia", {
    features: [
      {
        name: "prefers-reduced-motion",
        value: reducedMotion ? "reduce" : "no-preference",
      },
    ],
  });
  await send("Page.navigate", {
    url: `http://127.0.0.1:5173/?black-hole=${width}x${height}`,
  });
  await waitFor(
    `document.readyState === "complete" &&
      Boolean(document.querySelector(".black-hole-editor__toggle"))`,
    "the editor to load",
  );
  await waitFor(
    `!document.body.classList.contains("is-intro-pending")`,
    "the intro to finish",
    reducedMotion ? 4_000 : 20_000,
  );
}

async function openEditor() {
  await evaluate(
    `document.querySelector(".black-hole-editor__toggle").click()`,
  );
  await waitFor(
    `!document.querySelector(".black-hole-editor__panel").hidden`,
    "the editor to open",
  );
}

async function inspect() {
  return evaluate(`(() => {
    const panel = document.querySelector(".black-hole-editor__panel");
    const bounds = panel.getBoundingClientRect();
    const state = JSON.parse(localStorage.getItem("portfolio-black-hole-v3"));
    const rimLines = Array.from(document.querySelectorAll(
      ".black-hole-orbits__density-lines .black-hole-orbit-line",
    ));
    const topLines = Array.from(document.querySelectorAll(
      ".black-hole-orbits__top-lines .black-hole-orbit-line",
    ));
    const firstTrack = rimLines[0]?.parentElement;
    return {
      blackHoleOpacity: getComputedStyle(
        document.querySelector(".black-hole-image"),
      ).opacity,
      density: document.querySelectorAll(
        ".black-hole-orbits__density-lines .black-hole-orbit-line",
      ).length,
      orbitTracks: document.querySelectorAll(".black-hole-orbit-track").length,
      orbitPatterns: new Set(
        rimLines.map((line) => line.style.getPropertyValue("--orbit-dash-pattern")),
      ).size,
      orbitPhases: new Set(
        rimLines.map((line) => line.style.getPropertyValue("--orbit-phase")),
      ).size,
      orbitSpeedRatio: firstTrack
        ? Number(firstTrack.dataset.baseDuration) /
          Number.parseFloat(firstTrack.style.animationDuration)
        : 0,
      rimInnerDuration: Number.parseFloat(
        rimLines[0]?.parentElement.style.animationDuration,
      ),
      rimOuterDuration: Number.parseFloat(
        rimLines.at(-1)?.parentElement.style.animationDuration,
      ),
      editorFits:
        bounds.left >= 0 &&
        bounds.top >= 0 &&
        bounds.right <= innerWidth + 1 &&
        bounds.bottom <= innerHeight + 1,
      editorHeight: bounds.height,
      editorLeft: bounds.left,
      editorLayout: JSON.parse(
        localStorage.getItem("portfolio-black-hole-editor-v1"),
      ),
      editorTop: bounds.top,
      editorWidth: bounds.width,
      filterCount: document.querySelectorAll(
        ".black-hole-orbits filter, .black-hole-orbits feTurbulence",
      ).length,
      handleTag: document.querySelector(".black-hole-editor__drag-handle")
        .tagName,
      lineOpacity: getComputedStyle(
        document.querySelector(".black-hole-stage"),
      ).getPropertyValue("--black-hole-line-opacity"),
      lineWidth: getComputedStyle(
        document.querySelector(".black-hole-stage"),
      ).getPropertyValue("--black-hole-line-width"),
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
      resize: getComputedStyle(panel).resize,
      selectedTab: document.querySelector(
        '[data-black-hole-tab][aria-selected="true"]',
      ).dataset.blackHoleTab,
      state,
      topDensity: document.querySelectorAll(
        ".black-hole-orbits__top-lines .black-hole-orbit-line",
      ).length,
      topPatterns: new Set(
        topLines.map((line) => line.style.getPropertyValue("--orbit-dash-pattern")),
      ).size,
      topPhases: new Set(
        topLines.map((line) => line.style.getPropertyValue("--orbit-phase")),
      ).size,
      topInnerDuration: Number.parseFloat(
        topLines[0]?.parentElement.style.animationDuration,
      ),
      topOuterDuration: Number.parseFloat(
        topLines.at(-1)?.parentElement.style.animationDuration,
      ),
      topOpacity: getComputedStyle(
        document.querySelector(".black-hole-stage"),
      ).getPropertyValue("--black-hole-top-opacity"),
      topWidth: getComputedStyle(
        document.querySelector(".black-hole-stage"),
      ).getPropertyValue("--black-hole-top-width"),
      tint: getComputedStyle(
        document.querySelector(".black-hole-stage"),
      ).getPropertyValue("--black-hole-orbit-color"),
    };
  })()`);
}

async function setControls() {
  await evaluate(`(() => {
    const values = {
      blackHoleOpacity: "0.42",
      lineDensity: "12",
      lineOpacity: "0.88",
      lineWidth: "13.5",
      orbitColor: "#101010",
      orbitSpeed: "1.6",
      topColor: "#171512",
      topDensity: "7",
      topHeight: "1.35",
      topOpacity: "0.68",
      topScale: "1.12",
      topWidth: "6.5",
      topX: "36",
      topY: "-42",
    };
    Object.entries(values).forEach(([property, value]) => {
      const control = document.querySelector(
        '[data-black-hole-property="' + property + '"]',
      );
      control.value = value;
      control.dispatchEvent(new Event("input", { bubbles: true }));
    });
  })()`);
  await wait(100);
}

async function dragEditor() {
  const bounds = await evaluate(`(() => {
    const rect = document
      .querySelector(".black-hole-editor__drag-handle")
      .getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await send("Input.dispatchMouseEvent", {
    button: "left",
    clickCount: 1,
    type: "mousePressed",
    x: bounds.x,
    y: bounds.y,
  });
  await send("Input.dispatchMouseEvent", {
    button: "left",
    buttons: 1,
    type: "mouseMoved",
    x: Math.max(20, bounds.x - 90),
    y: Math.max(20, bounds.y - 70),
  });
  await send("Input.dispatchMouseEvent", {
    button: "left",
    clickCount: 1,
    type: "mouseReleased",
    x: Math.max(20, bounds.x - 90),
    y: Math.max(20, bounds.y - 70),
  });
  await wait(100);
}

async function resizeEditor() {
  const bounds = await evaluate(`(() => {
    const rect = document
      .querySelector(".black-hole-editor__panel")
      .getBoundingClientRect();
    return { x: rect.right - 3, y: rect.bottom - 3 };
  })()`);
  await send("Input.dispatchMouseEvent", {
    button: "left",
    clickCount: 1,
    type: "mousePressed",
    x: bounds.x,
    y: bounds.y,
  });
  await send("Input.dispatchMouseEvent", {
    button: "left",
    buttons: 1,
    type: "mouseMoved",
    x: bounds.x - 64,
    y: bounds.y - 88,
  });
  await send("Input.dispatchMouseEvent", {
    button: "left",
    clickCount: 1,
    type: "mouseReleased",
    x: bounds.x - 64,
    y: bounds.y - 88,
  });
  await wait(150);
}

async function capture(name) {
  await evaluate(
    `window.scrollTo(0, document.querySelector(".hero").offsetHeight)`,
  );
  await wait(150);
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  writeFileSync(
    `/tmp/portfolio-black-hole-validation/${name}.png`,
    Buffer.from(screenshot.data, "base64"),
  );
}

await send("Page.enable");
await send("Runtime.enable");
mkdirSync("/tmp/portfolio-black-hole-validation", { recursive: true });

await navigate(1440, 900);
await evaluate(`localStorage.removeItem("portfolio-black-hole-v3");
  localStorage.removeItem("portfolio-black-hole-editor-v1");
  location.reload()`);
await waitFor(
  `document.readyState === "complete" &&
    !document.body.classList.contains("is-intro-pending")`,
  "the clean editor state to reload",
);
await openEditor();
const initial = await inspect();
await evaluate(`document.querySelector('[data-black-hole-tab="top"]').click()`);
const tabbed = await inspect();
await setControls();
const customized = await inspect();
await dragEditor();
const dragged = await inspect();
await resizeEditor();
const resized = await inspect();
await capture("desktop-editor");

const viewportResults = [];
for (const [name, width, height] of [
  ["small-phone", 360, 640],
  ["phone-landscape", 667, 375],
  ["tablet", 768, 1024],
  ["ultrawide", 2560, 1080],
]) {
  await navigate(width, height);
  await openEditor();
  const result = await inspect();
  viewportResults.push({ name, result });
  if (name === "small-phone" || name === "phone-landscape") {
    await capture(`${name}-editor`);
  }
}

const controlsPassed =
  initial.density === 4 &&
  initial.orbitTracks === 8 &&
  initial.orbitPatterns === initial.density &&
  initial.orbitPhases === initial.density &&
  initial.rimInnerDuration < initial.rimOuterDuration &&
  initial.topPatterns === initial.topDensity &&
  initial.topPhases === initial.topDensity &&
  initial.topInnerDuration < initial.topOuterDuration &&
  customized.density === 12 &&
  customized.orbitTracks <= 16 &&
  customized.orbitPatterns === customized.density &&
  customized.orbitPhases === customized.density &&
  customized.rimInnerDuration < customized.rimOuterDuration &&
  customized.topPatterns === customized.topDensity &&
  customized.topPhases === customized.topDensity &&
  customized.topInnerDuration < customized.topOuterDuration &&
  Math.abs(customized.orbitSpeedRatio - 1.6) < 0.001 &&
  customized.lineWidth.trim() === "13.5" &&
  customized.lineOpacity.trim() === "0.88" &&
  customized.tint.trim() === "#101010" &&
  customized.filterCount === 0 &&
  customized.topDensity === 7 &&
  customized.topWidth.trim() === "6.5" &&
  customized.topOpacity.trim() === "0.68" &&
  customized.blackHoleOpacity === "0.42" &&
  customized.state.lineDensity === 12 &&
  customized.state.orbitSpeed === 1.6 &&
  customized.state.topX === 36 &&
  customized.state.topColor === "#171512";
const tabsPassed =
  initial.selectedTab === "rim" && tabbed.selectedTab === "top";
const layoutPassed = viewportResults.every(
  ({ result }) =>
    result.editorFits &&
    !result.overflow &&
    result.resize === "both" &&
    result.handleTag === "BUTTON",
);
const movementPassed =
  dragged.editorLeft < customized.editorLeft - 40 &&
  dragged.editorTop < customized.editorTop - 40;
const resizePassed =
  resized.editorWidth < dragged.editorWidth - 30 &&
  resized.editorHeight < dragged.editorHeight - 40;
const persistencePassed = viewportResults.every(
  ({ result }) =>
    result.density === 12 &&
    result.blackHoleOpacity === "0.42" &&
    result.orbitTracks <= 16 &&
    Math.abs(result.orbitSpeedRatio - 1.6) < 0.001 &&
    result.topDensity === 7 &&
    result.filterCount === 0,
);

await navigate(1440, 900, false);
const offscreenAnimation = await evaluate(`(() => {
  const stage = document.querySelector(".black-hole-stage");
  const track = document.querySelector(".black-hole-orbits__density-lines .black-hole-orbit-track--clockwise");
  const line = track.querySelector(".black-hole-orbit-line");
  return {
    active: stage.classList.contains("black-hole-stage--orbits-active"),
    offset: getComputedStyle(line).strokeDashoffset,
    playState: getComputedStyle(track).animationPlayState,
  };
})()`);
await wait(250);
const offscreenOffset = await evaluate(
  `getComputedStyle(document.querySelector(".black-hole-orbits__density-lines .black-hole-orbit-track--clockwise .black-hole-orbit-line")).strokeDashoffset`,
);
await evaluate(
  `window.scrollTo(0, document.querySelector(".hero").offsetHeight)`,
);
await wait(250);
const onscreenOffset = await evaluate(
  `getComputedStyle(document.querySelector(".black-hole-orbits__density-lines .black-hole-orbit-track--clockwise .black-hole-orbit-line")).strokeDashoffset`,
);
await wait(1_950);
const onscreenAnimation = await evaluate(`(() => {
  const stage = document.querySelector(".black-hole-stage");
  const track = document.querySelector(".black-hole-orbits__density-lines .black-hole-orbit-track--clockwise");
  const line = track.querySelector(".black-hole-orbit-line");
  return {
    active: stage.classList.contains("black-hole-stage--orbits-active"),
    offset: getComputedStyle(line).strokeDashoffset,
    playState: getComputedStyle(track).animationPlayState,
  };
})()`);
const performancePassed =
  !offscreenAnimation.active &&
  offscreenAnimation.playState === "paused" &&
  offscreenAnimation.offset === offscreenOffset &&
  onscreenAnimation.active &&
  onscreenAnimation.playState === "running" &&
  onscreenAnimation.offset !== onscreenOffset;

const summary = {
  controlsPassed,
  customized,
  dragged,
  initial,
  layoutPassed,
  passed:
    controlsPassed &&
    layoutPassed &&
    movementPassed &&
    performancePassed &&
    persistencePassed &&
    resizePassed &&
    tabsPassed &&
    runtimeErrors.length === 0,
  offscreenAnimation,
  onscreenAnimation,
  performancePassed,
  persistencePassed,
  movementPassed,
  resized,
  resizePassed,
  runtimeErrors,
  tabbed,
  tabsPassed,
  viewportResults,
};

console.log(JSON.stringify(summary, null, 2));
socket.close();
if (!summary.passed) process.exitCode = 1;
