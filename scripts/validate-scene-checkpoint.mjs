import { readFile } from "node:fs/promises";

const checkpoint = JSON.parse(
  await readFile(
    new URL("../docs/hero-about-safe-point-2026-08-24.json", import.meta.url),
    "utf8",
  ),
);
const debugPort = process.env.SCENE_CHECK_DEBUG_PORT ?? "9225";
const siteUrl = process.env.SCENE_CHECK_URL ?? "http://127.0.0.1:4178/";
const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(
  (response) => response.json(),
);
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("No Chromium page target was available.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pending = new Map();
const runtimeErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const handlers = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) handlers.reject(new Error(message.error.message));
    else handlers.resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") {
    runtimeErrors.push(message.params.exceptionDetails.text);
  }
});

function send(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { reject, resolve });
  });
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

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(expression, description, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

function assertClose(actual, expected, label, tolerance = 0.08) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function assertState(actual, expected, label) {
  Object.entries(expected).forEach(([property, expectedValue]) => {
    const actualValue = actual[property];
    if (typeof expectedValue === "number") {
      assertClose(actualValue, expectedValue, `${label}.${property}`, 0.001);
    } else if (actualValue !== expectedValue) {
      throw new Error(
        `${label}.${property}: expected ${expectedValue}, received ${actualValue}`,
      );
    }
  });
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  deviceScaleFactor: checkpoint.viewport.devicePixelRatio,
  height: checkpoint.viewport.height,
  mobile: false,
  screenHeight: checkpoint.viewport.height,
  screenWidth: checkpoint.viewport.width,
  width: checkpoint.viewport.width,
});
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
});
await send("Page.navigate", { url: siteUrl });
await waitFor(
  `document.readyState === "complete" &&
    document.querySelector(".black-hole-stage")?.classList.contains("black-hole-stage--ready") &&
    !document.body.classList.contains("is-intro-pending")`,
  "the complete Hero/About scene",
);

// Deliberately install the wrong previous-version values. The checkpoint must
// remain exact for returning GitHub Pages visitors who have these old keys.
await evaluate(`(() => {
  localStorage.setItem("portfolio-black-hole-v3", JSON.stringify({
    x: 999,
    y: -999,
    orbitScale: 2.5,
    topScale: 2
  }));
  localStorage.setItem("portfolio-overlay-position", JSON.stringify({
    x: 999,
    y: 999,
    rotation: 0,
    scale: 1,
    angle: 110,
    cutoutOffset: 0
  }));
  location.reload();
})()`);
await waitFor(
  `document.readyState === "complete" &&
    document.querySelector(".black-hole-stage")?.classList.contains("black-hole-stage--ready") &&
    !document.body.classList.contains("is-intro-pending")`,
  "the reloaded checkpoint scene",
);
await evaluate(`window.scrollTo(0, ${checkpoint.liveScene.scrollY})`);
await waitFor(
  `document.querySelector(".black-hole-object")?.classList.contains("is-formed")`,
  "the black hole to finish forming",
  5_000,
);
await evaluate(`document.querySelector(".black-hole-editor__toggle").click()`);
await waitFor(
  `!document.querySelector(".black-hole-editor__panel").hidden`,
  "the black-hole editor to open",
);
await wait(100);

const actual = await evaluate(`(() => {
  const number = (styles, property) =>
    Number.parseFloat(styles.getPropertyValue(property));
  const rect = (element) => {
    const bounds = element.getBoundingClientRect();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    };
  };
  const stage = document.querySelector(".black-hole-stage");
  const stageStyles = getComputedStyle(stage);
  const flow = document.querySelector(".hero-about-flow");
  const flowStyles = getComputedStyle(flow);
  const bio = document.querySelector("[data-about-bio]");
  const bioStyles = getComputedStyle(bio);
  const scene = document.querySelector(".scene");
  const blackHole = {
    x: number(stageStyles, "--black-hole-x"),
    y: number(stageStyles, "--black-hole-y"),
    depth: number(stageStyles, "--black-hole-depth"),
    size: number(stageStyles, "--black-hole-size"),
    rotation: number(stageStyles, "--black-hole-rotation"),
    order: number(stageStyles, "--black-hole-layer"),
    orbitX: number(stageStyles, "--black-hole-orbit-x"),
    orbitY: number(stageStyles, "--black-hole-orbit-y"),
    orbitScale: number(stageStyles, "--black-hole-orbit-scale"),
    orbitHeight: number(stageStyles, "--black-hole-orbit-height"),
    orbitColor: stageStyles.getPropertyValue("--black-hole-orbit-color").trim(),
    lineWidth: number(stageStyles, "--black-hole-line-width"),
    lineOpacity: number(stageStyles, "--black-hole-line-opacity"),
    topX: number(stageStyles, "--black-hole-top-x"),
    topY: number(stageStyles, "--black-hole-top-y"),
    topScale: number(stageStyles, "--black-hole-top-scale"),
    topHeight: number(stageStyles, "--black-hole-top-height"),
    topWidth: number(stageStyles, "--black-hole-top-width"),
    topOpacity: number(stageStyles, "--black-hole-top-opacity"),
    topColor: stageStyles.getPropertyValue("--black-hole-top-color").trim(),
    blackHoleOpacity: number(stageStyles, "--black-hole-image-opacity"),
    orbitSpeed: Number(
      document.querySelector('[data-black-hole-property="orbitSpeed"]').value
    ),
    lineDensity: document.querySelectorAll(
      ".black-hole-orbits__density-lines .black-hole-orbit-line"
    ).length,
    topDensity: document.querySelectorAll(
      ".black-hole-orbits__top-lines .black-hole-orbit-line"
    ).length
  };
  return {
    blackHole,
    blackHoleObject: rect(document.querySelector(".black-hole-object")),
    blackHoleStage: rect(stage),
    aboutCopy: {
      x: number(bioStyles, "--about-copy-x"),
      y: number(bioStyles, "--about-copy-y"),
      width: number(bioStyles, "--about-copy-width"),
      size: number(bioStyles, "--about-copy-size-adjust"),
      weight: number(bioStyles, "--about-copy-weight")
    },
    overlay: {
      x: number(flowStyles, "--overlay-x"),
      y: number(flowStyles, "--overlay-y"),
      rotation: number(flowStyles, "--overlay-rotation"),
      scale: number(flowStyles, "--overlay-scale"),
      tailSize: number(flowStyles, "--portrait-tail-size"),
      cutoutOffset: number(flowStyles, "--cutout-offset")
    },
    scene: {
      clipPath: getComputedStyle(scene).clipPath,
      geometry: rect(scene)
    },
    editor: {
      frame: rect(document.querySelector(".black-hole-editor")),
      panel: rect(document.querySelector(".black-hole-editor__panel")),
      copyButton: Boolean(document.querySelector("[data-full-scene-copy]"))
    },
    storage: {
      blackHoleV4: localStorage.getItem("portfolio-black-hole-v4"),
      overlayV2: localStorage.getItem("portfolio-overlay-position-v2")
    },
    viewport: { width: innerWidth, height: innerHeight },
    scrollY
  };
})()`);

assertState(actual.blackHole, checkpoint.blackHole.state, "blackHole");
assertState(actual.aboutCopy, checkpoint.aboutCopy.state, "aboutCopy");
assertClose(actual.overlay.x, checkpoint.shadowOverlay.x, "overlay.x", 0.001);
assertClose(actual.overlay.y, checkpoint.shadowOverlay.y, "overlay.y", 0.001);
assertClose(
  actual.overlay.rotation,
  checkpoint.shadowOverlay.rotation,
  "overlay.rotation",
  0.001,
);
assertClose(
  actual.overlay.scale,
  checkpoint.shadowOverlay.scale,
  "overlay.scale",
  0.001,
);
assertClose(
  actual.overlay.cutoutOffset,
  checkpoint.cutoutAndTriangle.cutoutOffset,
  "cutout.offset",
  0.001,
);
assertClose(
  actual.overlay.tailSize,
  Number.parseFloat(checkpoint.cutoutAndTriangle.portraitTailSize),
  "cutout.tailSize",
  0.01,
);
// Chromium can quantize a programmatic scroll to an integer CSS pixel, while
// the captured wheel position retained the fractional device-pixel remainder.
assertClose(actual.scrollY, checkpoint.liveScene.scrollY, "scrollY", 0.51);
assertClose(
  actual.blackHoleObject.width,
  checkpoint.blackHole.geometry.object.width,
  "blackHole.geometry.width",
  2.5,
);
assertClose(
  actual.blackHoleObject.height,
  checkpoint.blackHole.geometry.object.height,
  "blackHole.geometry.height",
  2.5,
);
if (actual.storage.blackHoleV4 !== null || actual.storage.overlayV2 !== null) {
  throw new Error("A clean checkpoint unexpectedly depended on localStorage.");
}
assertClose(
  actual.editor.frame.x,
  checkpoint.blackHole.editorLayout.x,
  "editor.x",
  0.1,
);
assertClose(
  actual.editor.frame.y,
  checkpoint.blackHole.editorLayout.y,
  "editor.y",
  0.1,
);
assertClose(
  actual.editor.panel.width,
  checkpoint.blackHole.editorLayout.width,
  "editor.width",
  0.1,
);
assertClose(
  actual.editor.panel.height,
  checkpoint.blackHole.editorLayout.height,
  "editor.height",
  0.1,
);
if (!actual.editor.copyButton) {
  throw new Error("The full-scene copy button is missing.");
}
if (runtimeErrors.length) {
  throw new Error(`Browser runtime errors: ${runtimeErrors.join(", ")}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      viewport: actual.viewport,
      scrollY: actual.scrollY,
      blackHole: actual.blackHole,
      overlay: actual.overlay,
      aboutCopy: actual.aboutCopy,
      blackHoleGeometry: actual.blackHoleObject,
      sceneGeometry: actual.scene.geometry,
      editor: actual.editor,
      oldBrowserStateIgnored: true,
    },
    null,
    2,
  ),
);
socket.close();
