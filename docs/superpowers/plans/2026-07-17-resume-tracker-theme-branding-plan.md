# Resume Tracker Theme and Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the visible product to Resume Tracker and add a chocolate-truffle light/dark/high-contrast theme system with dark as the default across every client route.

**Architecture:** Keep the existing React `ThemeContext` and CSS custom-property architecture. Extract only the pure theme-value resolution and quick-toggle rules into a small helper so they can be tested with Node’s built-in test runner; the context remains responsible for browser storage and DOM effects. Replace only product-brand colors and forced theme behavior in the affected shared, landing, and auth surfaces.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, lucide-react, CSS custom properties, Node `node:test`.

## Global Constraints

- Dark is the default when no saved theme preference exists.
- Supported theme values are `light`, `dark`, and `high-contrast`; the UI label for `high-contrast` is “High Contrast.”
- High Contrast uses pitch-black (`#000000`) page and surface backgrounds for OLED screens.
- The supplied primary palette is `#713600`, `#C05800`, `#FDFBD4`, and `#38240D` and must be used in bright mode as well as dark mode.
- The landing page and auth pages must honor the active theme and must not force light mode.
- Visible “Resume Roaster”/“Roaster” branding becomes “Resume Tracker”; internal resume route/API identifiers remain unchanged.
- Do not modify backend files, resume data models, route names, or unrelated component behavior.
- Do not add a dependency or rewrite the existing UI component system.

---

### Task 1: Add tested theme-state helpers and wire the provider

**Files:**
- Create: `Client/src/lib/theme.js`
- Create: `Client/src/lib/theme.test.js`
- Modify: `Client/src/context/ThemeContext.jsx`

**Interfaces:**
- `theme.js` produces `THEME_VALUES`, `isTheme(value)`, `resolveInitialTheme(storage, prefersDark)`, and `nextQuickTheme(theme)`.
- `ThemeContext.jsx` consumes those helpers and continues to provide `{ theme, setTheme, toggle }` to existing consumers.

- [ ] **Step 1: Write the failing tests**

Create `Client/src/lib/theme.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { nextQuickTheme, resolveInitialTheme } from "./theme.js";

test("defaults to dark when storage has no valid theme", () => {
  assert.equal(resolveInitialTheme(null, false), "dark");
  assert.equal(resolveInitialTheme(null, true), "dark");
});

test("restores only supported stored themes", () => {
  assert.equal(resolveInitialTheme("light", true), "light");
  assert.equal(resolveInitialTheme("dark", false), "dark");
  assert.equal(resolveInitialTheme("high-contrast", false), "high-contrast");
  assert.equal(resolveInitialTheme("sepia", false), "dark");
});

test("quick toggle moves high contrast to light and alternates light/dark", () => {
  assert.equal(nextQuickTheme("high-contrast"), "light");
  assert.equal(nextQuickTheme("light"), "dark");
  assert.equal(nextQuickTheme("dark"), "light");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from `Client`:

```powershell
node --test src/lib/theme.test.js
```

Expected: FAIL because `src/lib/theme.js` does not exist yet.

- [ ] **Step 3: Implement the minimal theme helper**

Create `Client/src/lib/theme.js`:

```js
export const THEME_VALUES = ["light", "dark", "high-contrast"];

export function isTheme(value) {
  return THEME_VALUES.includes(value);
}

export function resolveInitialTheme(stored, _prefersDark) {
  return isTheme(stored) ? stored : "dark";
}

export function nextQuickTheme(theme) {
  return theme === "light" ? "dark" : "light";
}
```

The `_prefersDark` argument is intentionally retained so the call site documents that OS preference is no longer used for the initial fallback.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```powershell
node --test src/lib/theme.test.js
```

Expected: 3 passing tests and 0 failures.

- [ ] **Step 5: Update the context with the tested rules**

Modify `Client/src/context/ThemeContext.jsx` to import `isTheme`, `nextQuickTheme`, and `resolveInitialTheme`; keep storage key `arr-theme`; resolve the browser value with `resolveInitialTheme(localStorage.getItem(STORAGE_KEY), window.matchMedia?.("(prefers-color-scheme: dark)").matches)`; accept all three values; set `data-theme` and persist on theme changes; and implement `toggle` with `setTheme((current) => nextQuickTheme(current))`.

- [ ] **Step 6: Run the helper tests and lint the changed files**

Run:

```powershell
node --test src/lib/theme.test.js
npx eslint src/lib/theme.js src/lib/theme.test.js src/context/ThemeContext.jsx
```

Expected: all tests pass and ESLint exits 0.

---

### Task 2: Replace theme tokens and remove forced light mode

**Files:**
- Modify: `Client/src/index.css`
- Modify: `Client/src/pages/Landing.jsx`

**Interfaces:**
- The existing CSS variable names remain stable so existing components continue to render.
- `Landing.jsx` renders without mutating `data-theme` and without an inline white `main` background.

- [ ] **Step 1: Define the three palette token sets**

In `Client/src/index.css`, keep the existing `@theme` aliases, then replace the `:root/[data-theme="light"]` and `[data-theme="dark"]` token values with chocolate-truffle-derived values. Add `[data-theme="high-contrast"]` with `--bg: #000000`, `--surface: #000000`, `--surface-2: #000000`, cream primary text, orange accents, and low/no shadows. Keep semantic status tokens readable and warm.

Use these exact brand anchors in the token sets:

```css
--brand-brown: #713600;
--brand-orange: #c05800;
--brand-cream: #fdfbd4;
--brand-deep: #38240d;
```

Map light mode to cream background/deep-brown text/orange actions, dark mode to deep-brown background/chocolate surfaces/cream text, and high contrast to black surfaces/cream text/orange actions.

- [ ] **Step 2: Remove landing theme mutation and hard-coded white main background**

In `Client/src/pages/Landing.jsx`, remove the `useEffect` import and effect that forces `data-theme="light"`. Replace `<main style={{ background: "white" }}>` with `<main className="bg-[var(--bg)]">`.

- [ ] **Step 3: Run lint and inspect the theme source**

Run:

```powershell
npx eslint src/index.css src/pages/Landing.jsx
```

Expected: ESLint exits 0; then inspect the file to confirm all three selectors exist and no landing effect writes `data-theme`.

---

### Task 3: Update Settings and quick-toggle semantics

**Files:**
- Modify: `Client/src/pages/Settings.jsx`
- Modify: `Client/src/components/layout/Topbar.jsx`

**Interfaces:**
- `Settings.jsx` continues to call `setTheme(value)` with one of the three supported values.
- `Topbar.jsx` continues to call `toggle()` and displays the appropriate icon without introducing a second theme state.

- [ ] **Step 1: Add the High Contrast appearance option**

In `Client/src/pages/Settings.jsx`, import `Contrast` from `lucide-react`, update `ThemeOption` descriptions to branch on `light`, `dark`, and `high-contrast`, and render a third option:

```jsx
<ThemeOption
  value="high-contrast"
  label="High Contrast"
  icon={Contrast}
  current={theme}
  onSelect={setTheme}
/>
```

Use a responsive grid or flex layout that keeps all three options usable on narrow screens. Add `aria-pressed={active}` to the option button so its selected state is exposed to assistive technology.

- [ ] **Step 2: Make the top-bar control understand the third theme**

In `Client/src/components/layout/Topbar.jsx`, keep the existing `toggle` call. Update the icon condition so light shows `Moon`, and dark/high-contrast show `Sun`; change the title to `Toggle light/dark theme`.

- [ ] **Step 3: Run lint for the appearance surfaces**

Run:

```powershell
npx eslint src/pages/Settings.jsx src/components/layout/Topbar.jsx
```

Expected: ESLint exits 0.

---

### Task 4: Replace visible branding and product-brand color literals

**Files:**
- Modify: `Client/src/components/layout/Sidebar.jsx`
- Modify: `Client/src/components/landing/Navbar.jsx`
- Modify: `Client/src/components/landing/Footer.jsx`
- Modify: `Client/src/components/landing/TestimonialsSection.jsx`
- Modify: `Client/src/components/auth/AuthShell.jsx`
- Modify: `Client/src/components/auth/BrandCardMarquee.jsx`
- Modify: `Client/src/components/layout/AILogo.jsx`
- Modify: `Client/src/components/landing/DarkPanel.jsx`
- Modify: `Client/src/components/landing/HeroSection.jsx`
- Modify: `Client/src/components/landing/HeroDashboardPreview.jsx`
- Modify: `Client/src/components/landing/FeaturesSection.jsx`
- Modify: `Client/src/components/landing/DashboardPreviewSection.jsx`
- Modify: `Client/src/components/landing/CTASection.jsx`
- Modify: `Client/src/components/analysis/BulletRewrites.jsx`
- Modify: `Client/src/components/analysis/KeywordChips.jsx`
- Modify: `Client/src/components/analysis/StrengthsList.jsx`
- Modify: `Client/src/components/resume/DiffView.jsx`
- Modify: `Client/src/components/export/ResumeDocument.jsx`

**Interfaces:**
- Existing component props and navigation remain unchanged.
- Product-brand visual literals use CSS variables where they need to respond to theme changes; semantic danger/warning colors remain semantic.

- [ ] **Step 1: Replace all visible product-name strings**

Change only user-facing product-name text:

```text
Resume Roaster -> Resume Tracker
Roaster -> Resume Tracker
AI Resume Roaster -> AI Resume Tracker
```

Do not change route paths, API names, `resume` data keys, or generic uses of “resume.”

- [ ] **Step 2: Replace hard-coded brand colors in shared and landing/auth visuals**

Replace sage/green brand literals and gradient stops in the listed components with `var(--brand-brown)`, `var(--brand-orange)`, `var(--brand-cream)`, `var(--brand-deep)`, `var(--accent)`, or `var(--accent-strong)` as appropriate. Preserve `#F8E3E0`, `#FBF1E2`, and other status backgrounds when they represent danger/warning states rather than brand colors. Replace hard-coded white landing backgrounds with `var(--bg)` or palette-derived surfaces where those elements should respond to light/dark/high-contrast.

- [ ] **Step 3: Search for brand remnants and inspect intentional matches**

Run from `Client`:

```powershell
rg -n -i "resume roaster|roaster" src
```

Expected: no visible product-brand remnants; any remaining match must be an intentional non-visible comment or historical identifier and should be reviewed before proceeding.

- [ ] **Step 4: Run lint across the client**

Run:

```powershell
npm run lint
```

Expected: ESLint exits 0.

---

### Task 5: Run the complete verification checklist

**Files:**
- No planned source changes; only modify files if a verification failure directly identifies a scoped issue.

- [ ] **Step 1: Run the theme helper tests**

From `Client`:

```powershell
node --test src/lib/theme.test.js
```

Expected: 3 passing tests, 0 failures.

- [ ] **Step 2: Build the client**

Run:

```powershell
npm run build
```

Expected: Vite completes successfully with exit code 0.

- [ ] **Step 3: Verify theme and forced-light wiring**

Run:

```powershell
rg -n "high-contrast|High Contrast|data-theme|prefers-color-scheme|background: \"white\"|Resume Roaster|Roaster" src
```

Confirm that `high-contrast` exists in the helper, provider, CSS, and Settings; that only the provider writes `data-theme`; that no landing code forces light or white; and that no visible Roaster branding remains.

- [ ] **Step 4: Review the final diff and file scope**

Run:

```powershell
git status --short
git diff --stat
```

If Git metadata is still unavailable, use:

```powershell
Get-ChildItem -Recurse -File src, docs/superpowers | Select-Object FullName
```

Confirm only the approved theme, branding, test, spec, and plan files changed. Do not claim completion until lint, tests, build, and the source checks have all been read and confirmed.
