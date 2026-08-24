# Project scripts

`browser-smoke.mjs` is the deployment smoke matrix and runs through
`npm run test:browser`. It needs a Chromium-compatible binary; set `CHROME_BIN`
when it is not installed at the default path. Set `PORTFOLIO_SCREENSHOT_DIR` to
capture each tested viewport and state for visual review. Set
`PORTFOLIO_INCLUDE_EDITOR=true PORTFOLIO_SCENARIO=development-scene-editor` for
the opt-in local editor smoke case.

The Python files are optional, offline asset-generation tools and require
Pillow. `build-extended-shadow.py` rebuilds the checked-in two-section shadow
from its source plate. `extract-full-body-cutout.py SOURCE` accepts an explicit
green-key plate instead of depending on a machine-local generated-image path.
Their source-size PNGs and previews live in `assets/source-art`; only optimized
runtime variants belong in `public/assets` and ship to GitHub Pages.
