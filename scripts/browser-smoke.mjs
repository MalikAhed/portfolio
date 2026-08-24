import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const baseUrl = process.env.PORTFOLIO_URL ?? "http://127.0.0.1:4173/";
const chromeBinary =
  process.env.CHROME_BIN ??
  (process.platform === "linux" ? "/usr/bin/google-chrome" : "google-chrome");
const screenshotDirectory = process.env.PORTFOLIO_SCREENSHOT_DIR;
const requestedScenario = process.env.PORTFOLIO_SCENARIO;
const expectProduction = process.env.PORTFOLIO_EXPECT_PRODUCTION === "true";

async function getAvailablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForDebugger(port) {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return;
    } catch {
      // Chrome is still starting.
    }
    await delay(100);
  }
  throw new Error("Chrome debugging endpoint did not become ready.");
}

class DevToolsClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.socket = new WebSocket(url);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) {
        this.events.push(message);
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function openTarget(port, scenario) {
  const width = scenario.width ?? 390;
  const height = scenario.height ?? 844;
  const response = await fetch(
    `http://127.0.0.1:${port}/json/new?about:blank`,
    { method: "PUT" },
  );
  if (!response.ok) throw new Error("Could not create a Chrome target.");
  const target = await response.json();
  const client = new DevToolsClient(target.webSocketDebuggerUrl);
  await client.connect();
  await Promise.all([
    client.send("Page.enable"),
    client.send("Runtime.enable"),
    client.send("Log.enable"),
    client.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: scenario.deviceScaleFactor ?? 1,
      mobile: width <= 680,
    }),
  ]);
  await client.send("Page.bringToFront");
  return { client, targetId: target.id };
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.text ?? "Browser evaluation failed.",
    );
  }
  return result.result.value;
}

const snapshotExpression = `(() => {
  const style = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const computed = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      display: computed.display,
      visibility: computed.visibility,
      opacity: Number(computed.opacity),
      top: Math.round(bounds.top),
      bottom: Math.round(bounds.bottom),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
    };
  };
  const heroCanvas = document.querySelector('#scene canvas');
  const ids = Array.from(document.querySelectorAll('[id]'), ({ id }) => id);
  const duplicateIds = [...new Set(
    ids.filter((id, index) => ids.indexOf(id) !== index),
  )];
  const brokenHashLinks = Array.from(
    document.querySelectorAll('a[href^="#"]'),
    (link) => link.getAttribute('href'),
  ).filter((hash) => {
    if (!hash || hash === '#') return true;
    try {
      return !document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return true;
    }
  });
  return {
    hash: location.hash,
    scrollY: Math.round(scrollY),
    bodyClass: document.body.className,
    rootClass: document.documentElement.className,
    appInert: document.querySelector('#app')?.inert ?? null,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    sceneScrollY: getComputedStyle(document.querySelector('.hero-about-flow'))
      .getPropertyValue('--scene-scroll-y').trim(),
    splash: style('.splash'),
    title: style('#hero-title'),
    fallback: style('.hero__portrait-fallback'),
    about: style('#about-summary'),
    skills: style('#skills-title'),
    contact: style('#contact-title'),
    navigation: style('#primary-navigation'),
    menuToggle: style('.menu-toggle'),
    contactLink: style('.contact-link'),
    sceneEditor: style('.black-hole-editor'),
    sceneEditorHidden: document.querySelector('.black-hole-editor')?.hidden ?? null,
    heroCanvasPixels: heroCanvas ? heroCanvas.width * heroCanvas.height : null,
    duplicateIds,
    brokenHashLinks,
    imagesMissingAlt: document.querySelectorAll('img:not([alt])').length,
    imagesMissingDimensions: document.querySelectorAll(
      'img:not([width]), img:not([height])',
    ).length,
    unnamedButtons: Array.from(document.querySelectorAll('button')).filter(
      (button) =>
        !button.textContent.trim() &&
        !button.getAttribute('aria-label') &&
        !button.getAttribute('aria-labelledby'),
    ).length,
    sectionsWithoutHeadings: Array.from(document.querySelectorAll('section'))
      .filter((section) => !section.querySelector('h1, h2, h3, h4, h5, h6'))
      .map((section) => section.id || section.className),
    menuExpanded: document.querySelector('.menu-toggle')
      ?.getAttribute('aria-expanded'),
    activeElement: [
      document.activeElement?.tagName,
      document.activeElement?.id,
      document.activeElement?.parentElement?.id,
      document.activeElement?.className,
    ].filter(Boolean).join(':'),
    aboutInert: document.querySelector('#about')?.inert ?? false,
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: Math.max(
      0,
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  };
})()`;

async function runScenario(port, scenario) {
  const { client, targetId } = await openTarget(port, scenario);
  try {
    if (scenario.reducedMotion) {
      await client.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value: "reduce" }],
      });
    }
    if (scenario.noJavaScript) {
      await client.send("Emulation.setScriptExecutionDisabled", {
        value: true,
      });
    }
    if (scenario.noWebGL) {
      await client.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `(() => {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (type, ...args) {
            if (String(type).toLowerCase().includes('webgl')) return null;
            return original.call(this, type, ...args);
          };
        })();`,
      });
    }
    if (scenario.noModule) {
      await client.send("Network.enable");
      await client.send("Network.setBlockedURLs", {
        urls: ["*/src/main.js*", "*assets/index-*.js"],
      });
    }

    await client.send("Page.navigate", {
      url: new URL(`.${scenario.path}`, baseUrl).href,
    });
    await delay(scenario.wait ?? 4500);
    if (scenario.scrollY != null) {
      await evaluate(client, `scrollTo(0, ${scenario.scrollY})`);
      await delay(250);
    }

    if (scenario.openMenu) {
      await evaluate(client, `document.querySelector('.menu-toggle').click()`);
      await delay(100);
    }

    let scrollMetrics = null;
    if (scenario.scrollRoundTrip) {
      scrollMetrics = await evaluate(
        client,
        `new Promise((resolve) => {
          const frameCount = 120;
          const frameDurations = [];
          let frame = 0;
          let previousTime = performance.now();
          const maxScroll = Math.max(
            0,
            document.documentElement.scrollHeight - innerHeight,
          );
          function advance(time) {
            frameDurations.push(time - previousTime);
            previousTime = time;
            const phase = frame / (frameCount - 1);
            const progress = phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
            scrollTo(0, maxScroll * progress);
            frame += 1;
            if (frame < frameCount) {
              requestAnimationFrame(advance);
              return;
            }
            requestAnimationFrame(() => requestAnimationFrame(() => {
              const ordered = frameDurations.slice(1).sort((a, b) => a - b);
              resolve({
                finalY: Math.round(scrollY),
                meanFrameMs: Number((
                  ordered.reduce((sum, value) => sum + value, 0) /
                  Math.max(1, ordered.length)
                ).toFixed(2)),
                p95FrameMs: Number(
                  ordered[Math.floor(ordered.length * 0.95)]?.toFixed(2) ?? 0,
                ),
                maxFrameMs: Number(ordered.at(-1)?.toFixed(2) ?? 0),
              });
            }));
          }
          requestAnimationFrame(advance);
        })`,
      );
      await delay(250);
    }

    let interaction = null;
    if (scenario.activateSkipLink) {
      await client.send("Input.dispatchKeyEvent", {
        code: "Tab",
        key: "Tab",
        type: "rawKeyDown",
        windowsVirtualKeyCode: 9,
      });
      await client.send("Input.dispatchKeyEvent", {
        code: "Tab",
        key: "Tab",
        type: "keyUp",
        windowsVirtualKeyCode: 9,
      });
      const focusedBeforeActivation = await evaluate(
        client,
        `document.activeElement?.className ?? ''`,
      );
      await client.send("Input.dispatchKeyEvent", {
        code: "Enter",
        key: "Enter",
        type: "rawKeyDown",
        windowsVirtualKeyCode: 13,
      });
      await client.send("Input.dispatchKeyEvent", {
        code: "Enter",
        key: "Enter",
        type: "keyUp",
        windowsVirtualKeyCode: 13,
      });
      await delay(100);
      interaction = await evaluate(
        client,
        `({
          focusedBeforeActivation: ${JSON.stringify(focusedBeforeActivation)},
          activeElementId: document.activeElement?.id ?? '',
          hash: location.hash,
        })`,
      );
    }

    const snapshot = await evaluate(client, snapshotExpression);
    if (screenshotDirectory) {
      const screenshot = await client.send("Page.captureScreenshot", {
        captureBeyondViewport: false,
        format: "png",
        fromSurface: true,
      });
      await writeFile(
        join(screenshotDirectory, `${scenario.name}.png`),
        Buffer.from(screenshot.data, "base64"),
      );
    }
    if (scenario.openMenu) {
      await evaluate(
        client,
        `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`,
      );
      await delay(100);
      interaction = await evaluate(
        client,
        `({
          expanded: document.querySelector('.menu-toggle')
            .getAttribute('aria-expanded'),
          activeElement: document.activeElement?.className ?? '',
          bodyClass: document.body.className,
          aboutInert: document.querySelector('#about').inert,
        })`,
      );
    }
    const runtimeErrors = client.events
      .filter(
        (event) =>
          event.method === "Runtime.exceptionThrown" ||
          (event.method === "Log.entryAdded" &&
            event.params.entry.level === "error"),
      )
      .map(
        (event) =>
          event.params.exceptionDetails?.text ?? event.params.entry?.text,
      )
      .filter(
        (message) =>
          message &&
          !message.includes("GL Driver Message") &&
          !message.includes("Error creating WebGL context") &&
          !(scenario.noModule && message.includes("ERR_BLOCKED_BY_CLIENT")),
      );
    return {
      name: scenario.name,
      snapshot,
      interaction,
      scrollMetrics,
      runtimeErrors,
    };
  } finally {
    client.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${targetId}`).catch(
      () => undefined,
    );
  }
}

function isVisible(value) {
  return (
    value &&
    value.display !== "none" &&
    value.visibility !== "hidden" &&
    value.opacity > 0
  );
}

const scenarioDefinitions = [
  { name: "normal", path: "/", wait: 3500 },
  { name: "about-deep-link", path: "/#about", wait: 2500 },
  { name: "skills-deep-link", path: "/#skills", wait: 2500 },
  { name: "contact-deep-link", path: "/#contact", wait: 2500 },
  { name: "webgl-fallback", path: "/", noWebGL: true, wait: 2000 },
  { name: "module-fallback", path: "/", noModule: true, wait: 4500 },
  { name: "no-javascript", path: "/#contact", noJavaScript: true, wait: 1000 },
  {
    name: "reduced-motion-scroll",
    path: "/",
    reducedMotion: true,
    scrollY: 450,
    wait: 2000,
  },
  {
    name: "mobile-menu",
    path: "/",
    reducedMotion: true,
    openMenu: true,
    wait: 1500,
  },
  {
    name: "skip-link",
    path: "/",
    reducedMotion: true,
    activateSkipLink: true,
    wait: 1500,
  },
  {
    name: "scroll-round-trip",
    path: "/",
    scrollRoundTrip: true,
    wait: 2500,
  },
  {
    name: "small-phone",
    path: "/",
    width: 360,
    height: 640,
    reducedMotion: true,
    wait: 1500,
  },
  {
    name: "phone-landscape",
    path: "/",
    width: 667,
    height: 375,
    reducedMotion: true,
    wait: 1500,
  },
  {
    name: "tablet-portrait",
    path: "/",
    width: 768,
    height: 1024,
    reducedMotion: true,
    wait: 1500,
  },
  {
    name: "mobile-breakpoint",
    path: "/",
    width: 960,
    height: 700,
    reducedMotion: true,
    wait: 1500,
  },
  {
    name: "desktop-breakpoint",
    path: "/",
    width: 961,
    height: 700,
    reducedMotion: true,
    wait: 1500,
  },
  {
    name: "desktop",
    path: "/",
    width: 1440,
    height: 900,
    reducedMotion: true,
    wait: 1500,
  },
  {
    name: "high-dpr-desktop",
    path: "/",
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    reducedMotion: true,
    wait: 1500,
  },
  {
    name: "ultrawide",
    path: "/",
    width: 2560,
    height: 1080,
    reducedMotion: true,
    wait: 1500,
  },
];

if (process.env.PORTFOLIO_INCLUDE_EDITOR === "true") {
  scenarioDefinitions.push({
    name: "development-scene-editor",
    path: "/?edit=scene",
    reducedMotion: true,
    wait: 2500,
  });
}

const scenarios = requestedScenario
  ? scenarioDefinitions.filter(({ name }) => name === requestedScenario)
  : scenarioDefinitions;

if (!scenarios.length) {
  throw new Error(`Unknown browser smoke scenario: ${requestedScenario}`);
}

const port = await getAvailablePort();
const profileDirectory = await mkdtemp(join(tmpdir(), "portfolio-smoke-"));
if (screenshotDirectory) {
  await mkdir(screenshotDirectory, { recursive: true });
}
const chrome = spawn(
  chromeBinary,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--no-first-run",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDirectory}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let exitCode = 0;
try {
  await waitForDebugger(port);
  const results = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(port, scenario));
  }

  const failures = [];
  for (const result of results) {
    const { name, snapshot } = result;
    if (snapshot.horizontalOverflow > 1) {
      failures.push(
        `${name}: document overflows horizontally by ${snapshot.horizontalOverflow}px`,
      );
    }
    if (
      snapshot.duplicateIds.length ||
      snapshot.brokenHashLinks.length ||
      snapshot.imagesMissingAlt ||
      snapshot.imagesMissingDimensions ||
      snapshot.unnamedButtons ||
      snapshot.sectionsWithoutHeadings.length
    ) {
      failures.push(
        `${name}: semantic audit failed (${JSON.stringify({
          duplicateIds: snapshot.duplicateIds,
          brokenHashLinks: snapshot.brokenHashLinks,
          imagesMissingAlt: snapshot.imagesMissingAlt,
          imagesMissingDimensions: snapshot.imagesMissingDimensions,
          unnamedButtons: snapshot.unnamedButtons,
          sectionsWithoutHeadings: snapshot.sectionsWithoutHeadings,
        })})`,
      );
    }
    if (snapshot.heroCanvasPixels > 1920 * 1080 * 1.01) {
      failures.push(
        `${name}: Hero framebuffer exceeded its pixel budget (${snapshot.heroCanvasPixels})`,
      );
    }
    if (name === "normal") {
      if (snapshot.appInert) failures.push("normal: app remained inert");
      if (!isVisible(snapshot.title))
        failures.push("normal: Hero title is hidden");
      if (expectProduction && snapshot.sceneEditor !== null) {
        failures.push(
          "normal: development editor markup shipped to production",
        );
      }
    }
    if (name.endsWith("deep-link")) {
      const target = name.split("-")[0];
      if (snapshot.scrollY < 100)
        failures.push(`${name}: scroll position stayed at top`);
      if (!isVisible(snapshot[target]))
        failures.push(`${name}: target content is hidden`);
    }
    if (name === "webgl-fallback") {
      if (snapshot.appInert)
        failures.push("webgl-fallback: app remained inert");
      if (!isVisible(snapshot.fallback)) {
        failures.push("webgl-fallback: static portrait is hidden");
      }
    }
    if (name === "module-fallback") {
      if (
        snapshot.rootClass.includes("has-js") ||
        !snapshot.rootClass.includes("is-static-fallback") ||
        snapshot.bodyClass.includes("is-intro-pending") ||
        !isVisible(snapshot.navigation) ||
        !isVisible(snapshot.fallback)
      ) {
        failures.push("module-fallback: static experience did not recover");
      }
    }
    if (name === "no-javascript") {
      if (snapshot.rootClass.includes("has-js")) {
        failures.push("no-javascript: enhancement class was present");
      }
      if (!isVisible(snapshot.contact)) {
        failures.push("no-javascript: Contact content is hidden");
      }
      if (!isVisible(snapshot.navigation)) {
        failures.push("no-javascript: navigation links are hidden");
      }
    }
    if (name === "reduced-motion-scroll") {
      if (!snapshot.reducedMotion) {
        failures.push(
          "reduced-motion-scroll: media preference was not applied",
        );
      }
      if (snapshot.sceneScrollY !== "0px") {
        failures.push(
          "reduced-motion-scroll: extra portrait travel remained active",
        );
      }
    }
    if (name === "mobile-menu") {
      if (snapshot.menuExpanded !== "true" || !isVisible(snapshot.navigation)) {
        failures.push("mobile-menu: menu did not open visibly");
      }
      if (
        !snapshot.aboutInert ||
        !snapshot.activeElement.includes("primary-navigation")
      ) {
        failures.push("mobile-menu: focus/background containment failed");
      }
      if (
        result.interaction?.expanded !== "false" ||
        !result.interaction.activeElement.includes("menu-toggle") ||
        result.interaction.aboutInert
      ) {
        failures.push(
          "mobile-menu: Escape did not restore focus and background",
        );
      }
    }
    if (name === "scroll-round-trip") {
      if (result.scrollMetrics?.finalY > 2 || snapshot.scrollY > 2) {
        failures.push("scroll-round-trip: scroll did not return to the Hero");
      }
      if (snapshot.appInert || !isVisible(snapshot.title)) {
        failures.push(
          "scroll-round-trip: Hero did not restore its resting state",
        );
      }
    }
    if (name === "skip-link") {
      if (
        !result.interaction?.focusedBeforeActivation.includes("skip-link") ||
        result.interaction.activeElementId !== "main-content" ||
        result.interaction.hash !== "#main-content"
      ) {
        failures.push("skip-link: keyboard activation did not focus content");
      }
    }
    if (name === "development-scene-editor") {
      if (
        snapshot.sceneEditorHidden !== false ||
        !isVisible(snapshot.sceneEditor) ||
        !snapshot.rootClass.includes("has-scene-editor")
      ) {
        failures.push(
          "development-scene-editor: local editor modules did not initialize",
        );
      }
    }
    if (
      isVisible(snapshot.menuToggle) &&
      (snapshot.menuToggle.width < 44 || snapshot.menuToggle.height < 44)
    ) {
      failures.push(`${name}: menu control is smaller than 44px`);
    }
    if (
      isVisible(snapshot.contactLink) &&
      (snapshot.contactLink.width < 44 || snapshot.contactLink.height < 44)
    ) {
      failures.push(`${name}: contact control is smaller than 44px`);
    }
    if (name === "mobile-breakpoint" && !isVisible(snapshot.menuToggle)) {
      failures.push("mobile-breakpoint: mobile navigation did not engage");
    }
    if (
      name === "desktop-breakpoint" &&
      (isVisible(snapshot.menuToggle) || !isVisible(snapshot.navigation))
    ) {
      failures.push("desktop-breakpoint: desktop navigation did not engage");
    }
    if (result.runtimeErrors.length) {
      failures.push(`${name}: ${result.runtimeErrors.join(" | ")}`);
    }
  }

  if (failures.length) {
    console.error(JSON.stringify({ results, failures }, null, 2));
    exitCode = 1;
  } else {
    const scrollMetrics = results.find(
      ({ name }) => name === "scroll-round-trip",
    )?.scrollMetrics;
    const scrollSummary = scrollMetrics
      ? `; scroll p95 ${scrollMetrics.p95FrameMs}ms`
      : "";
    console.log(
      `Browser smoke passed (${results.length} scenarios${scrollSummary}).`,
    );
  }
} finally {
  chrome.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => chrome.once("exit", resolve)),
    delay(3000),
  ]);
  await delay(250);
  await rm(profileDirectory, { recursive: true, force: true }).catch(
    () => undefined,
  );
}

process.exitCode = exitCode;
