import { mkdirSync, writeFileSync } from "node:fs";

const browserTargets = await fetch("http://127.0.0.1:9222/json/list").then(
  (response) => response.json(),
);
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

async function waitForCondition(expression, description, timeout = 10_000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await wait(100);
  }

  throw new Error(`Timed out waiting for ${description}.`);
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    const detail =
      result.exceptionDetails.exception?.description ??
      result.exceptionDetails.exception?.value ??
      result.exceptionDetails.text;
    throw new Error(String(detail));
  }
  return result.result.value;
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
    url: `http://127.0.0.1:5173/?viewport=${width}x${height}`,
  });
  await waitForCondition(
    `Boolean(
      document.documentElement &&
      document.readyState === 'complete' &&
      document.querySelector('.contact-link')
    )`,
    "the page to load",
  );

  await waitForCondition(
    "!document.body.classList.contains('is-intro-pending')",
    "the intro to finish",
    reducedMotion ? 2_000 : 10_000,
  );
  await waitForCondition(
    `['ready', 'error'].includes(
      document.querySelector('[data-hero-subject]').dataset.sceneState
    )`,
    "the hero scene texture to resolve",
  );
}

async function inspectPage() {
  return evaluate(`(() => {
    const trigger = document.querySelector('.contact-link');
    const bounds = trigger?.getBoundingClientRect();
    const keySelectors = [
      '[data-hero-brand]',
      '[data-hero-title]',
      '[data-hero-cta]',
      '[data-hero-subject]',
    ];
    return {
      heroElementsVisible: keySelectors.every((selector) => {
        const element = document.querySelector(selector);
        const rect = element?.getBoundingClientRect();
        return Boolean(rect && rect.width > 0 && rect.height > 0);
      }),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      subjectCanvasReady:
        document.querySelector('[data-hero-subject]').dataset.sceneState === 'ready' &&
        Boolean(document.querySelector('[data-hero-subject] canvas')),
      triggerVisible: Boolean(bounds && bounds.width >= 44 && bounds.height >= 44 && bounds.right <= innerWidth + 1),
      triggerTag: trigger?.tagName,
      width: innerWidth,
      height: innerHeight,
    };
  })()`);
}

async function inspectOpenCard() {
  return evaluate(`(() => {
    const modal = document.querySelector('#contact-modal');
    const card = document.querySelector('.contact-card');
    const bounds = card.getBoundingClientRect();
    return {
      cardFits: bounds.left >= -1 && bounds.right <= innerWidth + 1 && bounds.top >= -1 && bounds.bottom <= innerHeight + 1,
      cardOpacity: getComputedStyle(card).opacity,
      dialogOpen: modal.open,
      focusedClose: document.activeElement?.classList.contains('contact-card__close'),
      inert: card.inert,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  })()`);
}

async function capture(name) {
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  writeFileSync(
    `/tmp/portfolio-contact-validation/${name}.png`,
    Buffer.from(screenshot.data, "base64"),
  );
}

await send("Page.enable");
await send("Runtime.enable");
mkdirSync("/tmp/portfolio-contact-validation", { recursive: true });

const viewports = [
  ["small-phone", 360, 640],
  ["modern-phone", 390, 844],
  ["large-phone", 430, 932],
  ["phone-landscape", 667, 375],
  ["tablet-portrait", 768, 1024],
  ["tablet-landscape", 1024, 768],
  ["short-laptop", 1366, 650],
  ["desktop", 1440, 900],
  ["full-hd", 1920, 1080],
  ["ultrawide", 2560, 1080],
];

const results = [];
for (const [name, width, height] of viewports) {
  await navigate(width, height, true);
  const page = await inspectPage();
  if (
    ["small-phone", "phone-landscape", "desktop", "ultrawide"].includes(name)
  ) {
    await capture(`${name}-hero`);
  }
  await evaluate("document.querySelector('.contact-link').click()");
  await waitForCondition(
    `(() => {
      const card = document.querySelector('.contact-card');
      return document.querySelector('#contact-modal').open &&
        !card.inert &&
        getComputedStyle(card).opacity === '1';
    })()`,
    `${name} contact dialog to open`,
  );
  const open = await inspectOpenCard();
  if (["small-phone", "phone-landscape", "desktop"].includes(name)) {
    await capture(`${name}-reduced-open`);
  }
  await evaluate("document.querySelector('.contact-card__close').click()");
  await waitForCondition(
    `!document.querySelector('#contact-modal').open &&
      document.activeElement?.classList.contains('contact-link')`,
    `${name} contact dialog to close`,
  );
  const closed = await evaluate(`({
    dialogOpen: document.querySelector('#contact-modal').open,
    focusRestored: document.activeElement?.classList.contains('contact-link'),
  })`);
  results.push({ closed, name, open, page });
}

await navigate(1440, 900, false);
await evaluate("document.querySelector('.contact-link').click()");
await waitForCondition(
  `(() => {
    const card = document.querySelector('.contact-card');
    return document.querySelector('#contact-modal').open &&
      !card.inert &&
      getComputedStyle(card).opacity === '1';
  })()`,
  "the animated contact dialog to open",
);
const normalMotionOpen = await inspectOpenCard();
await capture("desktop-motion-open");
await evaluate("document.querySelector('.contact-card__close').click()");
await waitForCondition(
  `!document.querySelector('#contact-modal').open &&
    document.activeElement?.classList.contains('contact-link')`,
  "the animated contact dialog to close",
);
const normalMotionClosed = await evaluate(`({
  dialogOpen: document.querySelector('#contact-modal').open,
  focusRestored: document.activeElement?.classList.contains('contact-link'),
})`);

await navigate(390, 844, true);
await evaluate("document.querySelector('.menu-toggle').click()");
await waitForCondition(
  `document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true' &&
    document.activeElement?.matches('#primary-navigation a')`,
  "the mobile navigation to open and receive focus",
);
await evaluate(
  "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))",
);
await waitForCondition(
  `document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false' &&
    document.activeElement?.classList.contains('menu-toggle')`,
  "the mobile navigation to close and restore focus",
);
const mobileNavigation = await evaluate(`({
  expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
  focusRestored: document.activeElement?.classList.contains('menu-toggle'),
})`);

const reducedMotionPassed = results.every(
  ({ closed, open, page }) =>
    page.heroElementsVisible &&
    page.subjectCanvasReady &&
    !page.overflow &&
    page.triggerVisible &&
    open.cardFits &&
    open.cardOpacity === "1" &&
    open.dialogOpen &&
    open.focusedClose &&
    !open.inert &&
    !open.overflow &&
    !closed.dialogOpen &&
    closed.focusRestored,
);
const normalMotionPassed =
  normalMotionOpen.cardFits &&
  normalMotionOpen.cardOpacity === "1" &&
  normalMotionOpen.dialogOpen &&
  normalMotionOpen.focusedClose &&
  !normalMotionOpen.inert &&
  !normalMotionOpen.overflow &&
  !normalMotionClosed.dialogOpen &&
  normalMotionClosed.focusRestored;
const mobileNavigationPassed =
  mobileNavigation.expanded === "false" && mobileNavigation.focusRestored;

const summary = {
  mobileNavigation,
  normalMotionClosed,
  normalMotionOpen,
  passed:
    reducedMotionPassed &&
    normalMotionPassed &&
    mobileNavigationPassed &&
    runtimeErrors.length === 0,
  results,
  runtimeErrors,
};

console.log(JSON.stringify(summary, null, 2));
socket.close();

if (!summary.passed) process.exitCode = 1;
