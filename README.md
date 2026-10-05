# Portfolio World

[**View the live portfolio →**](https://malikahed.github.io/portfolio/)

Malik Abuallata's portfolio is a small cinematic Three.js experience: one Hero
origin, one Z-only camera rail, and four floating cards. The scene is a
browser-first static site; it does not require an API, database, account, or
runtime service.

## Run locally

Use Node.js 22 (the package engine allows Node 22 through 26), then:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. To check the production output locally:

```bash
npm run build
npm run preview
```

When testing a subpath deployment, set `VITE_BASE_PATH` to the path that will
host the site, for example `VITE_BASE_PATH=/portfolio/`.

## Validate

```bash
npm run check
```

This checks formatting, linting, and the production build. Pushes to `main`
deploy the built site to GitHub Pages. The deployment target and scene rules
are documented in
[`docs/architecture.md`](docs/architecture.md).

## Contributions

Keep camera behavior, responsive layout, and scene assets aligned with the
architecture guide. Run `npm run check` before opening a pull request and
describe any browser or viewport limitation that could not be tested.

## License

Original contributions by Malik Abuallatta are licensed under the
[MIT License](LICENSE). Third-party code, adaptations, dependencies, and assets
retain their existing licenses and notices. This license does not grant new
rights to third-party material.
