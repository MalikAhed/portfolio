const PLACEHOLDER_TECHNOLOGIES = Object.freeze([
  Object.freeze({ label: "HTML", mark: "5" }),
  Object.freeze({ label: "CSS", mark: "#" }),
  Object.freeze({ label: "JavaScript", mark: "JS" }),
  Object.freeze({ label: "Three.js", mark: "3" }),
]);

const STOCKTHINK_TECHNOLOGIES = Object.freeze([
  Object.freeze({ label: "TypeScript", mark: "TS" }),
  Object.freeze({ label: "Vite", mark: "V" }),
  Object.freeze({ label: "Stockfish", mark: "SF" }),
  Object.freeze({ label: "WebAssembly", mark: "W" }),
  Object.freeze({ label: "Chessops", mark: "C" }),
]);

const CUBE_BURGER_TECHNOLOGIES = Object.freeze([
  Object.freeze({ label: "JavaScript", mark: "JS" }),
  Object.freeze({ label: "Vite", mark: "V" }),
  Object.freeze({ label: "CSS", mark: "#" }),
  Object.freeze({ label: "Playwright", mark: "PW" }),
]);

const STOCKTHINK = Object.freeze({
  id: "stockthink",
  title: "StockThink",
  description: "Free, private chess analysis in your browser.",
  summary:
    "A chess game-review experience that turns engine analysis into clear move classifications, accuracy scores, and explanations of why each decision worked or failed.",
  highlights: Object.freeze([
    "Stockfish 18 NNUE runs locally with WebAssembly",
    "Verified chess concepts explain every classification",
  ]),
  technologies: STOCKTHINK_TECHNOLOGIES,
  githubUrl: "https://github.com/MalikAhed/stockthink",
  liveUrl: "https://malikahed.github.io/stockthink/",
  previewUrl: "https://malikahed.github.io/stockthink/frontend/landing/",
  previewBrand: "STOCKTHINK",
  previewViewportWidth: 1440,
  sourceRevision: "0e0b4bf",
  files: STOCKTHINK_SOURCE_FILES,
});

const CUBE_BURGER = Object.freeze({
  id: "cube-burger",
  title: "Cube Burger",
  description: "A bold, art-directed restaurant experience.",
  summary:
    "A responsive restaurant landing page built around oversized food photography, playful ingredient motion, and a tactile visual system that makes the brand feel immediate and memorable.",
  highlights: Object.freeze([
    "Art-directed ingredient composition across breakpoints",
    "Responsive food rotator and interaction system",
  ]),
  technologies: CUBE_BURGER_TECHNOLOGIES,
  githubUrl: "https://github.com/MalikAhed/cube-burger-site",
  liveUrl: "https://malikahed.github.io/cube-burger-site/",
  previewUrl: "https://malikahed.github.io/cube-burger-site/",
  previewBrand: "CUBE BURGER",
  previewLoaderTheme: "cube-burger",
  previewLoadDelay: 0,
  previewReadySelector: "#app > *",
  previewViewportWidth: 1440,
  keepPreviewMounted: true,
  sourceRevision: "691d464",
  files: Object.freeze({
    "src/main.js": `const INGREDIENTS = [
  ["lettuceTop", "Top lettuce"],
  ["tomatoLeft", "Left tomato"],
  ["lettuceBottom", "Lower lettuce"],
  ["onionTop", "Top onion"],
  ["lettuceRight", "Right lettuce"],
  ["tomatoRight", "Right tomato"],
  ["onionBottom", "Lower onion"],
];

const ingredientLayer = INGREDIENTS.map(
  ([name, label]) =>
    \`<div class="ingredient-piece ingredient-piece--\${name}" aria-label="\${label}"><span></span></div>\`,
).join("");`,
    "src/styles.css": `.ingredient-piece > span {
  position: absolute;
  inset: 0;
  display: block;
  background-image: var(--ingredients-image);
  background-repeat: no-repeat;
}

.ingredient-piece--lettuceTop > span {
  background-size: 404% 310%;
  background-position: 1.7% 2.9%;
}

.ingredient-piece--tomatoLeft > span {
  background-size: 495% 410%;
  background-position: 0 45.2%;
}`,
    "src/ingredient-layout.json": `{
  "desktop": {
    "lettuceTop": { "x": 26.1, "y": 22.2, "scale": 1, "rotate": -18 },
    "tomatoLeft": { "x": 12.4, "y": 44.9, "scale": 0.87, "rotate": 10 },
    "onionTop": { "x": 81.1, "y": 23.2, "scale": 0.92, "rotate": 82 },
    "tomatoRight": { "x": 97.3, "y": 84.7, "scale": 1.6, "rotate": -10 }
  }
}`,
  }),
});

function createCounterProject({
  accent,
  description,
  highlights,
  id,
  initialValue,
  liveUrl,
  summary,
  title,
  githubUrl,
}) {
  const files = {
    "index.html": `<main class="counter-app">
  <p class="eyebrow">Interactive project preview</p>
  <h1>${title}</h1>
  <p>${description}</p>
  <div class="counter" aria-label="Counter controls">
    <button type="button" data-action="decrease" aria-label="Decrease">−</button>
    <output aria-live="polite">${initialValue}</output>
    <button type="button" data-action="increase" aria-label="Increase">+</button>
  </div>
  <button class="reset" type="button" data-action="reset">Reset</button>
</main>`,
    "styles.css": `:root {
  color: #1d1d1f;
  background: #ffffff;
  font-family: system-ui, sans-serif;
}

* { box-sizing: border-box; }

body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #ffffff;
}

.counter-app {
  width: min(34rem, calc(100% - 2rem));
  text-align: center;
}

.eyebrow {
  color: ${accent};
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 { margin: 0.2rem 0; font-size: clamp(1.5rem, 6vw, 2.6rem); }
p { color: #6f706d; }
.counter-app > p { margin: 0.35rem 0; }

.counter {
  display: grid;
  grid-template-columns: 4rem minmax(7rem, 1fr) 4rem;
  gap: 0.75rem;
  align-items: center;
  margin: 0.5rem auto 0.35rem;
}

button, output {
  border: 1px solid #d7d7d2;
  border-radius: 1rem;
  color: inherit;
  background: #f7f7f4;
}

button { min-height: 2.5rem; font: inherit; font-size: 1.2rem; cursor: pointer; }
button:hover, button:focus-visible { background: ${accent}; color: #111; }
output { padding: 0.45rem; font-size: 1.3rem; font-variant-numeric: tabular-nums; }
.reset { min-height: 2rem; padding: 0.3rem 0.9rem; font-size: 0.75rem; }
`,
    "script.js": `const output = document.querySelector("output");
const initialValue = ${initialValue};
let value = initialValue;

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "increase") value += 1;
  if (action === "decrease") value -= 1;
  if (action === "reset") value = initialValue;
  output.value = value;
  output.textContent = value;
});
`,
  };

  return Object.freeze({
    description,
    files: Object.freeze(files),
    highlights: Object.freeze(highlights),
    id,
    githubUrl,
    liveUrl,
    summary,
    technologies: PLACEHOLDER_TECHNOLOGIES,
    title,
  });
}

/**
 * Temporary project simulations. A future real project can keep the same card
 * UI and provide either these three browser-native files or a `previewUrl` for
 * a separately built application.
 */
export const PROJECTS = Object.freeze([
  STOCKTHINK,
  CUBE_BURGER,
  createCounterProject({
    id: "capacity-planner",
    title: "Capacity Planner",
    description: "A small planning-control prototype.",
    summary:
      "A lightweight planning concept that turns an abstract capacity value into something direct, readable, and adjustable.",
    highlights: ["Readable planning state", "Responsive interaction"],
    accent: "#c0f58b",
    initialValue: 24,
    githubUrl: "https://github.com/MalikAhed/portfolio",
    liveUrl: "https://malikahed.github.io/portfolio/",
  }),
  createCounterProject({
    id: "release-meter",
    title: "Release Meter",
    description: "A simple release-readiness interaction.",
    summary:
      "A release-readiness experiment that keeps the decision signal prominent and the supporting interaction deliberately simple.",
    highlights: ["Prominent readiness signal", "Focused decision flow"],
    accent: "#f7a8d8",
    initialValue: 84,
    githubUrl: "https://github.com/MalikAhed/portfolio",
    liveUrl: "https://malikahed.github.io/portfolio/",
  }),
]);

export function createProjectPreviewDocument(project) {
  const html = project.files["index.html"] ?? "";
  const css = project.files["styles.css"] ?? "";
  const script = (project.files["script.js"] ?? "").replace(
    /<\/script/gi,
    "<\\/script",
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:">
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>${script}</script>
  </body>
</html>`;
}
import { STOCKTHINK_SOURCE_FILES } from "./stockthink-source.js";
