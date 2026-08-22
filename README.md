# Malik Abuallatta — Portfolio

My personal portfolio and selected-work showcase.

**[View the live portfolio →](https://malikahed.github.io/portfolio/)**

## What is featured

- StockThink — private, browser-based chess game review
- Cube Burger — art-directed responsive restaurant site
- Murajaa — Arabic-first offline study PWA
- Zen Cleaning — booking-focused service website
- Learnify — Node.js and Express learning platform

## Design and implementation

The site uses semantic HTML, modern responsive CSS, and a small progressive-enhancement script. The split-editorial composition adapts for width, viewport height, aspect ratio, reduced-motion preferences, and mobile navigation without a framework or build step.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Every push to `main` deploys automatically to GitHub Pages.

## Structure

- `index.html` — semantic content and project case-study cards
- `styles.css` — visual system and responsive composition states
- `script.js` — accessible mobile navigation and progressive reveals
- `assets/responsive-composition-brief.md` — design and responsive decisions
