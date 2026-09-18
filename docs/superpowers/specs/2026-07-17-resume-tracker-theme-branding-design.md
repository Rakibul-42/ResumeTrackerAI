# Resume Tracker Theme and Branding Design

## Goal

Update the client’s visible product branding from Resume Roaster/Roaster to Resume Tracker, apply the supplied chocolate-truffle palette across light and dark experiences, make dark mode the default on every route, and add a High Contrast appearance option with pitch-black OLED-friendly backgrounds.

## Scope

In scope:

- `Client/src/context/ThemeContext.jsx` theme state, persistence, and defaults.
- `Client/src/index.css` theme tokens, palette values, scrollbar treatment, and high-contrast overrides.
- `Client/src/pages/Settings.jsx` appearance choices and descriptions.
- `Client/src/components/layout/Topbar.jsx` quick theme toggle behavior.
- `Client/src/pages/Landing.jsx` removal of forced light mode.
- Visible brand strings and hard-coded sage/green brand styling in the affected client UI, landing, and auth components.
- Verification through lint, production build, and targeted source checks.

Out of scope:

- Backend/API changes.
- Resume data models, route names, or internal identifiers.
- Unrelated refactoring or component redesign.
- Replacing semantic success, warning, and danger colors when they are not product-brand colors.

## Theme model

The client will support three persisted theme values:

- `dark`: the default when no saved preference exists.
- `light`: the bright mode, still based on the chocolate-truffle palette.
- `high-contrast`: exposed to users as “High Contrast,” with pitch-black backgrounds for OLED screens.

The current local-storage key will remain stable for existing installations. Unknown or invalid stored values will resolve to `dark`. The provider will apply the selected value as `data-theme` on the document root and persist it whenever it changes.

The landing page and auth pages will honor the active theme. They will no longer temporarily force `data-theme="light"`.

The top-bar quick toggle will preserve its current two-way light/dark behavior. If the current theme is `high-contrast`, activating the toggle will switch to `light`; from there it continues between light and dark. The full three-way choice remains available in Settings → Appearance.

## Palette tokens

The supplied colors are the primary brand palette:

| Token role | Value |
| --- | --- |
| Chocolate brown | `#713600` |
| Burnt orange | `#C05800` |
| Pale cream | `#FDFBD4` |
| Deep brown | `#38240D` |

Light mode uses pale cream as the page foundation, deep brown for primary text, chocolate brown for secondary emphasis and selected states, and burnt orange for primary actions and focus states. Surface and muted variants may use opacity or color mixing from these same palette values so cards remain distinguishable without introducing a competing brand hue.

Dark mode uses deep brown as the primary background, chocolate brown for raised surfaces, burnt orange for interactive emphasis, and pale cream for primary text.

High Contrast uses `#000000` for page and surface backgrounds, pale cream for primary text, burnt orange for interactive emphasis, and chocolate/deep brown only where contrast remains sufficient. Decorative shadows and glows will be reduced or removed in this mode.

## Branding replacement

Visible occurrences of “Resume Roaster” and “Roaster” will become “Resume Tracker.” This includes the landing navigation/footer, auth marketing copy, sidebar wordmark, testimonial copy, and any other user-facing product-name strings found in the client. Internal resume terminology such as “resume,” “resumes,” and resume route/API identifiers remains unchanged.

## Appearance UI

Settings → Appearance will present Light, Dark, and High Contrast as equal selectable options. Each option will include an icon, a concise description, a selected state, and keyboard-visible focus styling. The High Contrast description will explain that it uses pitch-black OLED-friendly backgrounds.

Theme controls will expose selected state semantics suitable for assistive technology, and the palette will retain clear focus indicators across all three themes.

## Verification

Before completion:

1. Run the client linter.
2. Run the client production build.
3. Confirm all three theme values are wired through the provider and Settings.
4. Confirm the initial fallback is dark and the landing page no longer forces light mode.
5. Search the client for visible “Resume Roaster”/“Roaster” remnants and review any remaining matches.
6. Review the final diff to ensure no unrelated files were changed.
