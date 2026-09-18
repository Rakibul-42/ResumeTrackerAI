# Landing Visual Polish Design

## Goal

Improve the specific landing-page visuals shown in the supplied screenshots: clarify the animated AI logo, make score progress bars easier to read, align the three “How it works” tiles, and make dashboard-preview card outlines clearly detectable.

## Scope

Only these client files will change:

- `Client/src/components/layout/AILogo.jsx`
- `Client/src/components/landing/HowItWorks.jsx`
- `Client/src/components/landing/DashboardPreviewSection.jsx`

No global theme tokens, unrelated components, application behavior, copy, routes, APIs, or dependencies will change.

## Animated logo

The logo keeps its rotating diamond identity and continuous animation. Its visual layers will be simplified and separated:

- A restrained amber halo replaces the muddy diffuse glow.
- The rotating outer sweep uses deep brown, amber, burnt orange, and a small cream highlight.
- The inner card uses a clearly defined warm-brown surface and visible amber border.
- The center diamond uses an amber-to-brown gradient with less competing movement.
- Cream sparkles remain as small highlights.

The result should read as a crisp amber/brown animated mark at small sizes without looking green, blacked-out, or visually muddy.

## Progress bars

The score-breakdown bars in `DashboardPreviewSection.jsx` will use:

- A thicker track so the component is legible in the dark preview.
- A clearly visible warm-brown track with an inset outline.
- An amber-to-gold fill rather than a low-contrast orange-to-cream gradient.
- A small bright leading highlight to make the current value easy to locate.
- Existing staggered entrance animation, adjusted to feel smooth and consistent.

Labels and values retain their existing content and layout.

## Equal-height “How it works” tiles

The three desktop tiles will share equal height through grid stretching and a flex-column card layout. The title and description will occupy a consistent content region, while each visual mockup is anchored to the bottom with `margin-top: auto`. This removes the uneven lower edges caused by different copy and mockup heights.

Card spacing, icon placement, ghost numbers, step order, and responsive stacking remain unchanged except where alignment requires a fixed content region.

## Detectable outlines

Dashboard-preview KPI cards and detail cards will receive:

- A visible warm cream/amber border instead of the current nearly transparent white border.
- Slightly separated brown surface values so adjacent tiles do not visually merge.
- A restrained inset highlight for edge definition.
- A brighter outline on hover without changing the element’s dimensions.

The outer `DarkPanel`, grid layout, card content, and chart data remain unchanged.

## Accessibility and motion

The changes will preserve current semantics and keyboard behavior. Animation remains decorative and will not alter content order. Existing Framer Motion patterns will be retained; no new animation library or state is introduced.

## Verification

1. Run ESLint against the three modified files.
2. Run the existing theme helper tests to guard the earlier theme work.
3. Run the Vite production build.
4. Search the final source to confirm only the three approved client files and this design/plan documentation changed for this polish pass.
5. Inspect the rendered landing page if the available browser tooling can run the local app.
