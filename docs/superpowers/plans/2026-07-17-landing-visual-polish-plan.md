# Landing Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the animated AI logo, score progress bars, “How it works” card alignment, and dashboard-preview outlines shown in the supplied screenshots.

**Architecture:** Keep all changes inside the three existing presentation components. Reuse the current CSS custom properties and Framer Motion primitives; do not add state, dependencies, global tokens, or shared abstractions for this small visual pass.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, Vite.

## Global Constraints

- Modify only `Client/src/components/layout/AILogo.jsx`, `Client/src/components/landing/HowItWorks.jsx`, and `Client/src/components/landing/DashboardPreviewSection.jsx`.
- Preserve the rotating diamond logo identity.
- Use amber, burnt orange, cream, and brown values already exposed through the brand CSS variables.
- Preserve all copy, data, component interfaces, routes, and responsive stacking behavior.
- Do not add dependencies, global theme changes, or unrelated refactors.
- The workspace has no Git metadata, so verification replaces commit checkpoints.

---

### Task 1: Clarify the animated AI logo

**Files:**
- Modify: `Client/src/components/layout/AILogo.jsx`

**Interfaces:**
- Consumes the existing `--brand-deep`, `--brand-brown`, `--brand-orange`, `--brand-cream`, and `--accent` CSS variables.
- Continues to export the default `AILogo` component with no props.

- [ ] **Step 1: Replace the muddy halo and sweep values**

Keep the current element structure, but make the halo a restrained amber/brown radial gradient and reduce its opacity/scale range:

```jsx
style={{
  background:
    "radial-gradient(circle, color-mix(in srgb, var(--brand-orange) 58%, transparent) 0%, color-mix(in srgb, var(--brand-brown) 28%, transparent) 42%, transparent 72%)",
  filter: "blur(8px)",
}}
animate={{ opacity: [0.28, 0.62, 0.28], scale: [0.92, 1.04, 0.92] }}
```

Use a mostly amber/brown conic sweep with one narrow cream highlight:

```jsx
background:
  "conic-gradient(from 0deg, var(--brand-deep) 0deg, var(--brand-brown) 95deg, var(--brand-orange) 190deg, var(--brand-cream) 218deg, var(--brand-orange) 244deg, var(--brand-brown) 310deg, var(--brand-deep) 360deg)"
```

- [ ] **Step 2: Strengthen the inner frame and simplify center motion**

Give the inner card a brown background, visible amber border, and warm inset highlight. Keep the diamond’s 45-degree orientation and background-position animation, but remove its rotating keyframes so the outer sweep provides the rotation:

```jsx
className="relative h-[38px] w-[38px] rounded-[12px] bg-[var(--brand-deep)] border border-[color-mix(in_srgb,var(--brand-orange)_70%,var(--brand-cream))] flex items-center justify-center overflow-hidden shadow-[inset_0_1px_0_color-mix(in_srgb,var(--brand-cream)_18%,transparent),0_5px_14px_rgba(22,13,4,0.32)]"
```

```jsx
background:
  "linear-gradient(135deg, var(--brand-cream) 0%, var(--brand-orange) 35%, var(--brand-brown) 100%)"
animate={{
  backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
  scale: [1, 1.08, 1],
}}
```

Change sparkle fills from white to `var(--brand-cream)` and use softer cream shadows.

- [ ] **Step 3: Lint the logo component**

Run from `Client`:

```powershell
.\node_modules\.bin\eslint.cmd src/components/layout/AILogo.jsx
```

Expected: exit code 0.

---

### Task 2: Equalize the “How it works” cards

**Files:**
- Modify: `Client/src/components/landing/HowItWorks.jsx`

**Interfaces:**
- Keeps the existing `STEPS` data and three visual subcomponents unchanged.
- Continues to export `HowItWorks` with no props.

- [ ] **Step 1: Stretch grid children and cards**

Add `items-stretch` to the grid, `h-full` to each animated wrapper, and replace the card’s inline `minHeight` with responsive layout classes:

```jsx
<div className="mt-16 relative grid grid-cols-1 lg:grid-cols-3 items-stretch gap-5">
```

```jsx
className="group relative h-full"
```

```jsx
className="relative h-full min-h-[420px] rounded-[28px] bg-[var(--surface)] border border-[color-mix(in_srgb,var(--brand-orange)_38%,var(--brand-cream))] shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 p-7 overflow-hidden flex flex-col"
```

Remove `style={{ minHeight: 420 }}`.

- [ ] **Step 2: Stabilize text height and anchor visuals**

Use a fixed minimum content region and push the visual to the bottom:

```jsx
<h3 className="relative min-h-[56px] font-display text-[22px] font-semibold tracking-tight text-[var(--ink)] mt-6 leading-tight">
```

```jsx
<p className="relative min-h-[66px] text-[13.5px] text-[var(--ink-muted)] mt-2.5 leading-relaxed">
```

```jsx
<div className="relative mt-auto pt-7">
  <Visual />
</div>
```

Keep mobile stacking and card content order unchanged.

- [ ] **Step 3: Lint the card component**

Run:

```powershell
.\node_modules\.bin\eslint.cmd src/components/landing/HowItWorks.jsx
```

Expected: exit code 0.

---

### Task 3: Improve dashboard progress bars and outlines

**Files:**
- Modify: `Client/src/components/landing/DashboardPreviewSection.jsx`

**Interfaces:**
- Keeps `SERIES`, all KPI values, labels, and component props unchanged.
- `DarkCard` and `KpiCard` remain local presentation helpers.

- [ ] **Step 1: Redesign the score progress tracks**

Replace the current `h-1.5 bg-white/[0.06]` track with a thicker warm track and inset border:

```jsx
<div className="relative h-2 rounded-full overflow-hidden bg-[color-mix(in_srgb,var(--brand-deep)_58%,var(--brand-brown))] ring-1 ring-inset ring-[color-mix(in_srgb,var(--brand-orange)_22%,transparent)]">
```

Use a stronger amber fill and add a leading highlight inside the motion element:

```jsx
<motion.div
  initial={{ width: 0 }}
  whileInView={{ width: `${b.value}%` }}
  viewport={{ once: true }}
  transition={{ duration: 0.95, delay: 0.12 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
  className="relative h-full rounded-full overflow-hidden"
  style={{
    background:
      "linear-gradient(90deg, var(--brand-brown) 0%, var(--brand-orange) 52%, #f2a43d 100%)",
  }}
>
  <span className="absolute inset-y-0 right-0 w-3 rounded-full bg-[var(--brand-cream)]/70 blur-[2px]" />
</motion.div>
```

- [ ] **Step 2: Strengthen detail-card outlines**

Change `DarkCard` to use a warm separated surface, a visible border, and inset highlight:

```jsx
className={`rounded-2xl bg-[color-mix(in_srgb,var(--brand-deep)_72%,var(--brand-brown))] border border-[color-mix(in_srgb,var(--brand-orange)_34%,var(--brand-cream))] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--brand-cream)_10%,transparent)] hover:border-[color-mix(in_srgb,var(--brand-orange)_62%,var(--brand-cream))] transition-colors backdrop-blur-sm p-5 ${className}`}
```

- [ ] **Step 3: Strengthen KPI-card outlines consistently**

Give both normal and accent KPI cards the same visible outer-border strength. Use a slightly lighter brown surface for normal cards, preserve the accent gradient for the highlighted card, and add the same inset highlight. Do not change their padding, spans, or data.

```jsx
className={`rounded-2xl p-5 border shadow-[inset_0_1px_0_color-mix(in_srgb,var(--brand-cream)_10%,transparent)] transition-colors hover:border-[color-mix(in_srgb,var(--brand-orange)_62%,var(--brand-cream))] ${
  accent
    ? "bg-gradient-to-br from-[var(--brand-brown)] to-[var(--brand-deep)] border-[color-mix(in_srgb,var(--brand-orange)_45%,var(--brand-cream))]"
    : "bg-[color-mix(in_srgb,var(--brand-deep)_68%,var(--brand-brown))] border-[color-mix(in_srgb,var(--brand-orange)_34%,var(--brand-cream))]"
} ${className}`}
```

- [ ] **Step 4: Lint the dashboard preview**

Run:

```powershell
.\node_modules\.bin\eslint.cmd src/components/landing/DashboardPreviewSection.jsx
```

Expected: exit code 0.

---

### Task 4: Verify the complete polish pass

**Files:**
- No planned source changes; only correct failures directly caused by the three scoped edits.

- [ ] **Step 1: Lint all three modified files together**

Run from `Client`:

```powershell
.\node_modules\.bin\eslint.cmd src/components/layout/AILogo.jsx src/components/landing/HowItWorks.jsx src/components/landing/DashboardPreviewSection.jsx
```

Expected: exit code 0.

- [ ] **Step 2: Run the existing theme tests**

```powershell
node --test src/lib/theme.test.js
```

Expected: 3 passing tests, 0 failures.

- [ ] **Step 3: Build the production client**

```powershell
npm.cmd run build
```

Expected: Vite exits 0. Existing bundle-size or Node deprecation warnings are informational.

- [ ] **Step 4: Audit the source scope**

Confirm the implementation changed only the three approved client files and the design/plan documents. Since no Git metadata exists, inspect the explicitly named files and avoid any other edits.
