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
  previewUrl: "https://malikahed.github.io/stockthink/app.html",
  files: STOCKTHINK_SOURCE_FILES,
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
  createCounterProject({
    id: "queue-control",
    title: "Queue Control",
    description: "A compact simulation of queue controls.",
    summary:
      "A compact control surface designed to make changing workload visible without burying the operator in interface chrome.",
    highlights: ["Fast operational feedback", "Low-friction controls"],
    accent: "#85d7ff",
    initialValue: 12,
    githubUrl: "https://github.com/MalikAhed/portfolio",
    liveUrl: "https://malikahed.github.io/portfolio/",
  }),
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
