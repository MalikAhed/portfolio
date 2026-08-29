const DEVICON_ROOT =
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

const technology = (label, mark, logo, background, options = {}) =>
  Object.freeze({ label, mark, logo, background, ...options });

const HTML = technology(
  "HTML",
  "5",
  `${DEVICON_ROOT}/html5/html5-original.svg`,
  "#fff1ec",
);
const CSS = technology(
  "CSS",
  "#",
  `${DEVICON_ROOT}/css3/css3-original.svg`,
  "#edf5ff",
);
const JAVASCRIPT = technology(
  "JavaScript",
  "JS",
  `${DEVICON_ROOT}/javascript/javascript-original.svg`,
  "#f7df1e",
  { hideLabel: true, fillLogo: true },
);
const VITE = technology(
  "Vite",
  "V",
  `${DEVICON_ROOT}/vitejs/vitejs-original.svg`,
  "#f3efff",
  { logoScale: 1.18 },
);
const PLAYWRIGHT = technology(
  "Playwright",
  "PW",
  `${DEVICON_ROOT}/playwright/playwright-original.svg`,
  "#f5fff2",
);

const LEARN_TECHNOLOGIES = Object.freeze([
  HTML,
  CSS,
  JAVASCRIPT,
  technology(
    "React",
    "R",
    `${DEVICON_ROOT}/react/react-original.svg`,
    "#17232b",
    { foreground: "#e8fbff" },
  ),
  technology(
    "Node.js",
    "N",
    `${DEVICON_ROOT}/nodejs/nodejs-original.svg`,
    "#eff8ed",
  ),
  technology(
    "Express",
    "EX",
    `${DEVICON_ROOT}/express/express-original.svg`,
    "#f4f4f4",
  ),
  technology(
    "Tailwind CSS",
    "TW",
    `${DEVICON_ROOT}/tailwindcss/tailwindcss-original.svg`,
    "#ecfeff",
  ),
  technology(
    "Markdown",
    "MD",
    `${DEVICON_ROOT}/markdown/markdown-original.svg`,
    "#f5f5f5",
  ),
  PLAYWRIGHT,
]);

const STOCKTHINK_TECHNOLOGIES = Object.freeze([
  technology(
    "TypeScript",
    "TS",
    `${DEVICON_ROOT}/typescript/typescript-original.svg`,
    "#eaf4ff",
    { hideLabel: true, fillLogo: true },
  ),
  VITE,
  technology(
    "Stockfish",
    "SF",
    "https://stockfishchess.org/images/logo/icon_512x512@2x.webp",
    "#e8f2df",
    { hideLabel: true, fillLogo: true, logoScale: 1.3 },
  ),
  technology(
    "WebAssembly",
    "W",
    "https://cdn.simpleicons.org/webassembly/654ff0",
    "#f0edff",
    { hideLabel: true, fillLogo: true },
  ),
  technology("Chessops", "♞", undefined, "#eee6da", { markSize: "46px" }),
  technology(
    "Three.js",
    "3",
    `${DEVICON_ROOT}/threejs/threejs-original.svg`,
    "#f4f4f4",
  ),
  technology(
    "GSAP",
    "G",
    "https://cdn.simpleicons.org/gsap/0ae448",
    "#102417",
    { foreground: "#dfffe8", hideLabel: true, fillLogo: true },
  ),
  technology(
    "Vitest",
    "VT",
    `${DEVICON_ROOT}/vitest/vitest-original.svg`,
    "#f4f8e9",
  ),
]);

const CUBE_BURGER_TECHNOLOGIES = Object.freeze([
  JAVASCRIPT,
  VITE,
  CSS,
  technology(
    "Framer",
    "F",
    "https://cdn.simpleicons.org/framer/ffffff",
    "#000000",
    { foreground: "#ffffff" },
  ),
  PLAYWRIGHT,
]);

const MURAJAA_TECHNOLOGIES = Object.freeze([
  HTML,
  CSS,
  JAVASCRIPT,
  technology("PWA", "PWA", "https://cdn.simpleicons.org/pwa/5a0fc8", "#f2edff"),
  technology("SM-2", "S2", undefined, "#16161d", {
    foreground: "#ffffff",
  }),
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
  previewImage: "assets/stockthink-original.png",
  keepPreviewMounted: true,
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
  previewLoaderTheme: "cube-burger",
  previewLoadDelay: 0,
  previewReadyOnLoad: true,
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

const MURAJAA = Object.freeze({
  id: "murajaa",
  title: "Murajaa",
  description: "Arabic-first flashcards for Tawjihi students.",
  summary:
    "An offline-ready study companion that turns Arabic Tawjihi material into focused flashcard sessions, schedules reviews with spaced repetition, and keeps every learner's progress private on their device.",
  highlights: Object.freeze([
    "107 Arabic mathematics cards with SM-2 scheduling",
    "Offline PWA with local progress and JSON deck import",
  ]),
  technologies: MURAJAA_TECHNOLOGIES,
  githubUrl: "https://github.com/MalikAhed/Murajaa",
  liveUrl: "https://malikahed.github.io/Murajaa/",
  previewUrl: "https://malikahed.github.io/Murajaa/",
  previewViewportWidth: 1440,
  keepPreviewMounted: true,
  sourceRevision: "a0d3e24",
  files: Object.freeze({
    "index.html": `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="application-name" content="مراجعة">
  <meta name="description" content="تطبيق بطاقات تعليمية لطلاب التوجيهي، يدعم التكرار المتباعد ويعمل دون اتصال.">
  <link rel="manifest" href="manifest.webmanifest">
  <title>مراجعة · بطاقات التوجيهي</title>
</head>`,
    "src/spaced-repetition.js": `function sm2(card, quality) {
  let { interval = 1, repetitions = 0, easeFactor = 2.5 } = card;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  }
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );
  return {
    interval,
    repetitions,
    easeFactor,
    nextReview: Date.now() + interval * 86400000,
  };
}`,
    "sw.js": `const VERSION = "v7";
const STATIC_CACHE = \`fc-static-\${VERSION}\`;
const RUNTIME_CACHE = \`fc-runtime-\${VERSION}\`;

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./content.json",
  "./manifest.webmanifest",
  "./icon192.png",
  "./icon512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
});`,
    "manifest.webmanifest": `{
  "name": "مراجعة · Murajaa",
  "short_name": "مراجعة",
  "description": "بطاقات تعليمية لطلاب التوجيهي مع تكرار متباعد ودعم للعمل دون اتصال.",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#0E0E12",
  "theme_color": "#0E0E12",
  "lang": "ar",
  "dir": "rtl"
}`,
  }),
});

const LEARN = Object.freeze({
  id: "learn",
  title: "Full-Stack Quest",
  description: "A game-driven path from beginner to full-stack developer.",
  summary:
    "A structured learning platform that turns a sixteen-week full-stack curriculum into daily quests, interactive coding labs, progress ranks, streaks, and AI-reviewed explanations.",
  highlights: Object.freeze([
    "112 lessons across a sixteen-rank progression system",
    "Interactive code labs and structured AI feedback",
  ]),
  technologies: LEARN_TECHNOLOGIES,
  githubUrl: "https://github.com/MalikAhed/full-stack-quest",
  liveUrl: "https://malikahed.github.io/full-stack-quest/",
  previewUrl: "https://malikahed.github.io/full-stack-quest/",
  previewReadyOnLoad: true,
  previewViewportWidth: 1440,
  keepPreviewMounted: true,
  sourceRevision: "7f3f100",
  files: Object.freeze({
    "index.html": `<main class="quest">
  <header class="quest__topbar">
    <div class="quest__brand"><img src="assets/learn-code-book.png" alt=""><strong>LEARN</strong></div>
    <div class="quest__stats">
      <span><img src="assets/learn-rank-bronze.png" alt="">1</span>
      <span><img src="assets/learn-streak-flame.png" alt="">7</span>
      <span><img src="assets/learn-red-gem.png" alt="">640</span>
    </div>
  </header>
  <section class="quest__path" aria-label="Full-Stack Quest learning path">
    <p class="quest__eyebrow">WEEK 1 · WEB FOUNDATIONS</p>
    <h1>BUILD THE WEB,<br>ONE QUEST AT A TIME.</h1>
    <div class="quest__nodes">
      <button class="quest__node is-complete">1</button><span></span>
      <button class="quest__node is-complete">2</button><span></span>
      <button class="quest__node is-current">3</button><span></span>
      <button class="quest__node">4</button><span></span>
      <button class="quest__node">5</button>
    </div>
    <article class="quest__lesson">
      <img src="assets/learn-code-book.png" alt="">
      <div><small>DAY 3</small><h2>Semantic HTML contracts</h2><p>Learn how meaningful structure connects content, browsers, and assistive technology.</p></div>
      <button>START +20 XP</button>
    </article>
  </section>
  <aside class="quest__league">
    <p class="quest__eyebrow">CODE LEAGUE · RANK 1 OF 16</p>
    <img class="quest__rank" src="assets/learn-rank-bronze.png" alt="Bronze rank badge">
    <h2>Bronze Rank</h2>
    <div class="quest__progress"><span></span><b>320 / 800 XP</b></div>
    <h3>CHALLENGES</h3>
    <div class="quest__challenge"><img src="assets/learn-code-book.png" alt=""><span><b>Course progress</b><small>3 / 112 lessons</small></span></div>
    <div class="quest__challenge"><img src="assets/learn-streak-flame.png" alt=""><span><b>Daily streak</b><small>7 days · best 12</small></span></div>
  </aside>
</main>`,
    "styles.css": `:root{font-family:Nunito,Arial,sans-serif;color:#626b76;background:#fafafa}*{box-sizing:border-box}body{margin:0;background:#fafafa}.quest{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 360px;padding-top:72px}.quest__topbar{position:fixed;inset:0 0 auto;display:flex;align-items:center;justify-content:space-between;height:72px;padding:0 36px;border-bottom:1px solid #e3e3e3;background:#fff;z-index:2}.quest__brand,.quest__stats,.quest__stats span{display:flex;align-items:center}.quest__brand{gap:10px;color:#595f67;font-size:18px}.quest__brand img{width:38px;height:38px;object-fit:contain}.quest__stats{gap:28px}.quest__stats span{gap:7px;font-weight:900}.quest__stats img{width:34px;height:34px;object-fit:contain}.quest__path{padding:44px 54px}.quest__eyebrow{margin:0;color:#929292;font-size:13px;font-weight:900;letter-spacing:.11em}.quest__path h1{margin:12px 0 34px;color:#4d5660;font-size:clamp(42px,5vw,74px);line-height:.9;letter-spacing:-.045em}.quest__nodes{display:flex;align-items:center;margin:0 0 34px}.quest__nodes span{height:8px;flex:1;background:#dedede}.quest__node{width:58px;height:58px;border:0;border-radius:50%;background:#dedede;color:#8b9198;font-size:18px;font-weight:900;box-shadow:0 6px 0 #c9c9c9}.quest__node.is-complete{background:#58cc02;color:#fff;box-shadow:0 6px 0 #46a302}.quest__node.is-current{background:#1cb0f6;color:#fff;box-shadow:0 6px 0 #168bc4;transform:scale(1.14)}.quest__lesson{display:grid;grid-template-columns:92px 1fr auto;align-items:center;gap:22px;padding:24px;border:1px solid #e2e2e2;border-radius:22px;background:#fff;box-shadow:0 8px 24px #2020200d}.quest__lesson img{width:88px;height:88px;object-fit:contain}.quest__lesson small{color:#1cb0f6;font-weight:900}.quest__lesson h2{margin:4px 0;color:#515b65;font-size:25px}.quest__lesson p{max-width:460px;margin:0;line-height:1.4}.quest__lesson button{padding:15px 18px;border:0;border-radius:14px;background:#1cb0f6;color:#fff;font-weight:900;box-shadow:0 5px 0 #168bc4}.quest__league{padding:30px 24px;border-left:1px solid #e0e0e0;background:#f7f7f7;text-align:center}.quest__rank{width:145px;height:145px;margin:20px auto 0;object-fit:contain;transform:scale(1.3)}.quest__league h2{margin:0 0 15px;color:#965522}.quest__progress{position:relative;height:24px;overflow:hidden;border-radius:999px;background:#fff4dc}.quest__progress span{position:absolute;inset:0 60% 0 0;background:#f5a623}.quest__progress b{position:relative;font-size:12px;line-height:24px}.quest__league h3{margin:34px 0 12px;text-align:left;font-size:15px}.quest__challenge{display:flex;align-items:center;gap:14px;margin:10px 0;padding:12px;border:1px solid #e5e5e5;border-radius:16px;background:#fff;text-align:left}.quest__challenge img{width:48px;height:48px;object-fit:contain}.quest__challenge span{display:grid;gap:4px}.quest__challenge small{color:#8c949d}@media(max-width:760px){.quest{grid-template-columns:1fr}.quest__league{display:none}.quest__path{padding:28px 20px}.quest__topbar{padding:0 18px}.quest__stats span:last-child{display:none}.quest__lesson{grid-template-columns:70px 1fr}.quest__lesson button{grid-column:1/-1}.quest__lesson img{width:66px;height:66px}}`,
    "src/progression.js": `export function recordLessonCompletion(progress, lessonId, xp) {
  const completed = new Set(progress.completedLessons);
  completed.add(lessonId);
  return { ...progress, completedLessons: [...completed], totalXp: progress.totalXp + xp };
}`,
  }),
});

export const PROJECTS = Object.freeze([
  STOCKTHINK,
  CUBE_BURGER,
  MURAJAA,
  LEARN,
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src * data: blob:">
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>${script}</script>
  </body>
</html>`;
}
import { STOCKTHINK_SOURCE_FILES } from "./stockthink-source.js";
