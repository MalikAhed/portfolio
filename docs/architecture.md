# Front-end architecture

This portfolio uses a feature-first structure. A visually complex section owns
its layout, responsive states, motion, and optional renderer in one directory.
Shared code stays small and has no knowledge of individual sections.

```text
src/
├── components/              # Reusable UI used by one or more sections
│   ├── contact-dialog/
│   ├── site-header/
│   └── splash/
├── lib/                     # Framework-free DOM and animation utilities
├── sections/                # Page sections with colocated behavior and CSS
│   └── hero/
├── styles/
│   ├── foundation.css       # Design tokens, reset, and global states
│   └── index.css            # Explicit CSS composition order
└── main.js                  # Initializes features and owns page cleanup
```

## Boundaries

- `main.js` only composes features. It must not contain section behavior.
- A section may import from `lib/` and `components/`; shared code must not import
  from a section.
- Keep structural content in semantic HTML. JavaScript enhances behavior but
  does not own essential headings, links, or calls to action.
- Colocate width, height, aspect-ratio, and reduced-motion rules with the
  feature they affect. Do not create a global responsive override file.
- Initialize behavior with an `initFeature()` function that returns a cleanup
  function. Register that initializer in `main.js`.
- Use tokens from `foundation.css` before adding a new color, font, duration, or
  easing value. Add a semantic token when a value is shared.
- Keep decorative layers non-interactive and preserve a usable static state
  when motion or WebGL is unavailable.

## Adding a section

1. Add semantic markup to `index.html` with one stable section class and an
   accessible heading relationship.
2. Create `src/sections/<section-name>/<section-name>.css` for its layout,
   responsive states, and reduced-motion behavior.
3. Import that stylesheet once from `src/styles/index.css` in page order.
4. Only if behavior is needed, add an `init<section-name>.js` module that
   returns cleanup, then register it in `src/main.js`.
5. Keep large timelines, renderers, and data in focused sibling modules when a
   feature file starts mixing more than one responsibility.
6. Run the production build and the viewport matrix before considering the
   section complete.

HTML partials are intentionally not introduced yet: this is still one small,
static page, and keeping semantic HTML directly in `index.html` preserves the
no-JavaScript baseline without a template dependency. If repeated pages or CMS
content are added, adopt a static template layer at that point rather than
assembling essential content in client-side JavaScript.
