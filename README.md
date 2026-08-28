# Portfolio World

Malik Abuallata's portfolio is a small cinematic Three.js experience: one Hero
origin, one Z-only camera rail, and four floating cards.

## Run locally

Use Node.js 22, then:

```bash
npm ci
npm run dev
```

## Validate

```bash
npm run check
```

This checks formatting, linting, and the production build. Pushes to `main`
deploy the built site to GitHub Pages.

Implementation details and scene rules live in
[`docs/architecture.md`](docs/architecture.md).
