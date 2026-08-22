# Responsive composition brief

## Direction

- **Archetype:** split-editorial hero leading into a modular project grid.
- **Hierarchy:** availability signal → positioning statement → primary work CTA → live project evidence.
- **Visual language:** deep green technical canvas, lime product accent, editorial typography, and small code/UI artifacts.
- **Live DOM:** all navigation, headings, project content, CTAs, and contact details.
- **Art layers:** CSS-only glow, code card, and abstract project previews. The portrait is the only raster subject.

## Responsive states

- **Narrow/standard portrait:** single-column hero, full-screen accessible menu, simplified stage overlap, stacked facts and projects.
- **Landscape phone / short viewport:** compact header, scrollable hero, reduced stage height; content is never forced into one viewport.
- **Tablet portrait:** single-column hero with capped stage width and two-column-to-single-column project transition.
- **Tablet landscape / desktop:** split hero and two-column project grid; featured projects span both columns.
- **Ultrawide:** content remains capped at 1440px and the hero gets a safe minimum height.
- **Reduced motion:** reveal transforms and movement are disabled while all content remains visible.

## Asset and motion decisions

- **Assets:** one existing portrait, responsively cropped with fixed intrinsic dimensions. Project visuals are CSS-generated, so no wrong crop or duplicate responsive downloads are possible.
- **Rendering:** **2D**. Real 3D adds no useful interaction or product meaning here.
- **Motion:** small CSS transitions and progressively enhanced intersection reveals only.
