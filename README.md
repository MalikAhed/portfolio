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

## License

Original contributions by Malik Abuallatta are licensed under the
[MIT License](LICENSE). Third-party code, adaptations, dependencies, and assets
retain their existing licenses and notices. This license does not grant new
rights to third-party material.
