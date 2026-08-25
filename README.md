# Portfolio World

Malik Abuallata's portfolio is a continuous cinematic world built with semantic
HTML, CSS, JavaScript, and a persistent Three.js Hero scene. The long-term
visual rules live in [AGENTS.md](AGENTS.md); the current implementation map is
in [docs/architecture.md](docs/architecture.md).

## Local development

Use Node.js 22 (the repository includes `.nvmrc`), then install and start Vite:

```bash
npm ci
npm run dev
```

The local Vite server shows the scene-positioning tools by default. Add
`?edit=off` for a clean local presentation. Editor markup, styles, Vue code,
and experimental WebGL are excluded from production builds.

## Quality checks

```bash
npm run check
npm run test:browser
```

`check` verifies formatting, linting, types, and the production build. The
browser smoke matrix covers startup, deep links, WebGL and JavaScript fallbacks,
blocked-module recovery, reduced motion, keyboard navigation, responsive
breakpoints, horizontal overflow, and an interrupted full-page scroll round
trip.

## Deployment

Pushes to `main` run the same checks against the built `/portfolio/` preview,
then publish `dist` to GitHub Pages. Only optimized runtime files belong in
`public/assets`; editable source plates and previews live in
`assets/source-art`.
