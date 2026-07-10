# Lunara CSS 🌙

A lightweight, utility-first CSS framework with a dark **"night sky"** aesthetic — deep space
blacks and navys, soft moonlight whites, and subtle glow/gradient accents in silver, indigo, and
violet.

- **Pure CSS, zero build step.** Drop in a `<link>` tag and go.
- **Utility-first**, Tailwind-like class names (`bg-moon-900`, `text-glow`, `p-4`, `rounded-lg`) —
  muscle memory carries over either direction.
- **Tailwind-native, v3 and v4.** One line — `@import "@velo0-0/lunara-css/tailwind"` on Tailwind v4, or
  `presets: [require('@velo0-0/lunara-css/tailwind-preset')]` on v3 — registers the full palette **and every
  component/effect** as real Tailwind classes — tree-shaken, variant-aware (`hover:glow-lg`),
  emitted by your own Tailwind build.
- **One-line effect utilities.** Glow, glass, aurora, shimmer, starfields, entrance animations —
  no hand-written keyframes or box-shadow stacks.
- **Prebuilt components.** Buttons, cards, inputs, badges, navbar, modal, toast, tooltip — all
  themeable via CSS variables.
- **Dark-mode-first**, with a light "daylight" variant toggled via `data-theme`.
- **Works with any framework.** Plain HTML, React, Next.js, Vue, Angular, or anything else — it's
  just CSS classes and an optional framework-agnostic JS helper for theme toggling.
- **Bootstrap-native too.** Not on Tailwind? `lunara-bootstrap` re-themes Bootstrap 5.3+ with the
  full night-sky design through Bootstrap's own `--bs-*` variables — one extra `<link>` tag, no
  Sass, no build step.
- **Lunara-reactive theming** 🌖 — opt in and the framework's glow intensity follows the *real*
  moon phase. Nobody else does this.
- **Scroll-driven animations with zero JS** — reveal-on-scroll, parallax, and a reading progress
  bar, all pure CSS via `animation-timeline`.
- **Zero-JavaScript modal** — Lunara styles the native Popover API, so two HTML attributes give
  you a fully animated modal with backdrop blur, Esc, and light-dismiss. No script.

[View the live component + effects gallery →](./index.html) ·
[Release QA page (renders every class) →](./test/index.html)

**Full documentation site**: [lunaracss.dev](https://lunaracss.dev)

---

## Install

### CDN (no build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@velo0-0/lunara-css@1/dist/lunar.min.css" />
```

(Or via unpkg: `https://unpkg.com/@velo0-0/lunara-css@1/dist/lunar.min.css` — the `@1` pin keeps you on
1.x without surprise majors.)

### npm

```bash
npm install @velo0-0/lunara-css
```

```css
/* import the full framework */
@import "@velo0-0/lunara-css/dist/lunar.css";
```

```js
// or in a bundler entry point
import "@velo0-0/lunara-css/dist/lunar.css";
```

That's it — no PostCSS, no build config. `dist/lunar.css` is the readable build; `dist/lunar.min.css`
is the minified production build.

---

## Quick start

```html
<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@velo0-0/lunara-css/dist/lunar.min.css" />
</head>
<body>
  <div class="card glow-sm hover-lift p-6 max-w-sm">
    <h2 class="text-shimmer">Welcome</h2>
    <p class="text-muted mt-2">Built with Lunara CSS.</p>
    <button class="btn btn-primary mt-4">Get started</button>
  </div>
</body>
</html>
```

Switch to the light "daylight" theme by setting `data-theme="light"` on `<html>` (or any
container) — no attribute, or `data-theme="dark"`, gives you the default night-sky theme.

---

## Copy-paste examples

### Hero section

```html
<section class="starfield gradient-aurora py-16 px-6">
  <div class="container max-w-3xl relative z-10">
    <span class="badge badge-glow mb-4">Now in v1.0</span>
    <h1 class="text-4xl md:text-6xl font-bold text-moon-50">
      Ship faster, <span class="text-shimmer">under the stars</span>
    </h1>
    <p class="mt-4 text-lg text-moon-200 max-w-xl">
      A dark-first design system with one-line glow, glass, and aurora effects.
    </p>
    <div class="mt-6 flex flex-wrap gap-4">
      <a href="#" class="btn btn-glow btn-lg hover-lift">Get started</a>
      <a href="#" class="btn btn-secondary btn-lg glass hover-glow">Live demo</a>
    </div>
  </div>
</section>
```

### Card

```html
<div class="card hover-lift glow-sm max-w-sm">
  <div class="card-header flex items-center gap-2">
    <span class="moon moon-waxing-gibbous" style="--moon-size: 1.5rem"></span>
    Tonight's forecast
  </div>
  <div class="card-body">
    <p class="text-muted">Clear skies, waxing gibbous, 84% illuminated.
    Perfect conditions for shipping.</p>
  </div>
  <div class="card-footer justify-between">
    <span class="badge badge-primary">astronomy</span>
    <button class="btn btn-primary btn-sm">Details</button>
  </div>
</div>
```

### Button set

```html
<div class="flex flex-wrap items-center gap-3">
  <button class="btn btn-primary">Save</button>
  <button class="btn btn-secondary">Cancel</button>
  <button class="btn btn-outline">Preview</button>
  <button class="btn btn-ghost">Skip</button>
  <button class="btn btn-glow pulse-glow">Launch 🚀</button>
  <button class="btn btn-primary btn-sm">Small</button>
  <button class="btn btn-primary btn-lg">Large</button>
  <button class="btn btn-primary" disabled>Disabled</button>
</div>
```

---

## Signature features — things no other framework ships

### 🌖 Lunara-reactive theming

Call one function and the framework's glow intensity tracks the **actual moon phase** — dimmest
at new moon, brightest at full moon:

```js
import { initMoonPhase } from "@velo0-0/lunara-css/theme";

const phase = initMoonPhase();
// → { name: "waning-gibbous", age: 17.8, illumination: 96 }
```

This sets `data-moon-phase="waning-gibbous"` (etc.) on `<html>`, which drives the
`--lunar-moonlight` multiplier baked into every glow token. It's fully opt-in — skip the call
and nothing changes. You can also grab `getMoonPhase(date)` for just the astronomy (phase name,
age in days, illumination %) with no DOM side effects.

`--lunar-moonlight` also works as a **manual glow dial**: set it to `0` to kill every glow in the
framework at once, or `1.5` to crank them, from one custom property.

### 🌙 Pure-CSS moon-phase icons

Astronomically shaped moon glyphs with no images and no SVG — shadow half plus an elliptical
terminator, all border-radius and transforms:

```html
<span class="moon moon-waxing-gibbous"></span>
<span class="moon moon-live"></span> <!-- always shows tonight's actual phase -->
```

All eight phases: `moon-new`, `moon-waxing-crescent`, `moon-first-quarter`, `moon-waxing-gibbous`,
`moon-full`, `moon-waning-gibbous`, `moon-last-quarter`, `moon-waning-crescent`. Size with
`--moon-size` (default `3rem`). `.moon-live` mirrors whatever `data-moon-phase` an ancestor
carries, so pair it with `initMoonPhase()` for a live moon widget.

### 📜 Scroll-driven motion, zero JavaScript

Powered by CSS `animation-timeline` — no IntersectionObserver, no scroll listeners, no library.
The browser scrubs the animation directly from scroll position, off the main thread:

| Class | Effect |
|---|---|
| `.scroll-reveal` | Fades in as the element scrolls into view (scrubs back out if you scroll up) |
| `.scroll-reveal-up` | Fade + rise on scroll into view |
| `.scroll-reveal-scale` | Fade + scale on scroll into view |
| `.scroll-reveal-blur` | Fade + un-blur on scroll into view |
| `.scroll-parallax` | Gentle parallax drift across the viewport |
| `.scroll-progress` | Reading progress bar — one `<div class="scroll-progress"></div>`, done |

Progressive enhancement: it's all inside `@supports (animation-timeline: view())`, so browsers
without support (see [caniuse](https://caniuse.com/mdn-css_properties_animation-timeline)) simply
show the content normally — nothing is ever hidden.

### 🪟 Zero-JS modal (native Popover API)

Lunara's `.modal` is styled for the browser-native Popover API, so this is a complete, animated
modal — open/close, blurred backdrop, `Esc` to dismiss, click-outside light-dismiss, focus
handling — with **no JavaScript whatsoever**:

```html
<button class="btn btn-primary" popovertarget="hello">Open</button>

<div id="hello" popover class="modal">
  <div class="modal-header">Hello</div>
  <div class="modal-body">Two HTML attributes. Zero script.</div>
  <div class="modal-footer">
    <button class="btn btn-secondary" popovertarget="hello" popovertargetaction="hide">Close</button>
  </div>
</div>
```

Entrance/exit transitions use `@starting-style` + `transition-behavior: allow-discrete` — the
new-school CSS way to animate things that start at `display: none`.

### ✨ Moonbeam — cursor-tracking glow

The "spotlight card" effect as a one-liner. Add `.moonbeam` to any element, call `initMoonbeam()`
once (a single delegated listener handles every current and future `.moonbeam` on the page):

```html
<div class="card moonbeam">…</div>
```

```js
import { initMoonbeam } from "@velo0-0/lunara-css/theme";
initMoonbeam(); // returns a cleanup function
```

Without the JS it gracefully degrades to a centered glow on hover.

---

## Tailwind integration

Lunara gives Tailwind projects the **whole framework** — not just the color palette, but every
prebuilt component and effect utility, registered as native Tailwind classes. Both major
Tailwind versions are first-class:

```bash
npm install @velo0-0/lunara-css tailwindcss
```

### Tailwind v4 (CSS-first)

One import next to Tailwind's own:

```css
/* app.css */
@import "tailwindcss";
@import "@velo0-0/lunara-css/tailwind";
```

That registers the design tokens via `@theme` (so `bg-moon-900`, `shadow-glow-lg`,
`animate-float` are generated natively by v4), loads every component and effect through the
components plugin, and re-points Tailwind's `dark:` variant at Lunara's `data-theme` attribute
via `@custom-variant`.

### Tailwind v3 (JS config)

```js
// tailwind.config.js
module.exports = {
  presets: [require("@velo0-0/lunara-css/tailwind-preset")],
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
};
```

### What you get (both versions)

One line gets you all of this, through Tailwind's own build:

- **Design tokens** as theme values — `bg-moon-900`, `text-tide`, `shadow-glow-lg`,
  `rounded-2xl`, `animate-float`, …
- **Components** as Tailwind component classes — `btn btn-primary`, `card`, `badge-glow`,
  `modal` (including the zero-JS popover styling), `toast`, `navbar`, `input`, the `.moon`
  phase icons, …
- **Effect utilities** as Tailwind utilities — `glow-md`, `glass`, `starfield`,
  `gradient-aurora`, `eclipse-border`, `moonbeam`, `text-shimmer`, `scroll-reveal-up`,
  `scroll-progress`, …
- **Theme + moon-phase blocks** in base — `data-theme="light"` and `data-moon-phase` reactivity
  work exactly like the plain-CSS build.

Because they're registered through Tailwind's plugin API, the classes behave like native
Tailwind: unused components are **tree-shaken** by content scanning, and **variants work** —
`hover:glow-lg`, `md:scroll-reveal-up`, `focus:glow-violet` all do what you'd expect. No separate
`<link>` tag, no second stylesheet: your one Tailwind pipeline emits everything.
(Accessibility guards like `prefers-reduced-motion` blocks always ship alongside the animations
they protect.)

Under the hood, Lunara's build pre-parses its own built CSS into a class map
(`dist/lunar.tailwind.json`) that the plugin feeds straight to Tailwind — so the Tailwind
classes can never drift from the plain-CSS distribution, and the plugin has **zero runtime
dependencies** (no PostCSS required, which is what makes it work under v4's plugin loader too).

**Components only, no theme?** If you want Lunara's components on top of your own Tailwind theme,
register just the plugin:

```js
// tailwind.config.js (v3)
module.exports = {
  plugins: [require("@velo0-0/lunara-css/tailwind-plugin")],
};
```

```css
/* app.css (v4) */
@import "tailwindcss";
@plugin "@velo0-0/lunara-css/tailwind-plugin";
```

**Dark mode:** both versions point Tailwind's own `dark:` variant convention at the same
`data-theme` attribute Lunara uses to toggle themes — the v3 preset via
`darkMode: ['selector', '[data-theme="dark"]']`, the v4 entry via `@custom-variant dark`.
Set `data-theme="dark"` on `<html>` and both Lunara's dark tokens and your `dark:` utilities
activate together; set `data-theme="light"` for daylight mode.

If you only need the plain CSS utilities/components (no Tailwind build), skip this section
entirely and just link `dist/lunar.css`.

---

## Bootstrap integration — `lunara-bootstrap`

Not every site uses Tailwind. For plain-HTML sites (or anything else) built on **Bootstrap 5.3+**,
Lunara ships a dedicated bridge stylesheet that re-themes all of Bootstrap with the night-sky
design — buttons, cards, modals, forms, navbars, tables, pagination, toasts, dropdowns,
accordions, and the rest — purely through Bootstrap's own `--bs-*` CSS variable API. No Sass,
no build step, no markup changes: your existing Bootstrap classes just look lunar.

```html
<!-- 1. Bootstrap, as usual -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
<!-- 2. Lunara Bootstrap — must come AFTER bootstrap.css -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@velo0-0/lunara-css/dist/lunar-bootstrap.min.css" />
```

Or from npm:

```js
import "bootstrap/dist/css/bootstrap.min.css";
import "@velo0-0/lunara-css/bootstrap";
```

What's inside `lunar-bootstrap.css`:

- **The variable bridge** — Bootstrap globals (`--bs-body-bg`, `--bs-primary`, `--bs-border-radius`,
  fonts, shadows, focus rings) and per-component variables (`--bs-btn-*`, `--bs-card-*`,
  `--bs-modal-*`, …) mapped to Lunara's tokens, plus signature touches like a glow on
  `.btn-primary:hover` and the nebula body backdrop.
- **Lunara's design tokens, effect utilities, scroll motion, and moon icons** — `glow-md`,
  `glass`, `starfield`, `moonbeam`, `text-shimmer`, `scroll-reveal-up`, `scroll-progress`,
  `.moon.moon-live`, … all work on top of Bootstrap markup (`<div class="card moonbeam">`).
- **Deliberately excluded:** Lunara's own components and spacing utilities — `.btn`, `.card`,
  `.p-4`, … would collide with Bootstrap's class names, so the bridge never ships them.

**Theming:** dark is the default. The bridge responds to **both** Bootstrap's native
`data-bs-theme` attribute and Lunara's `data-theme` — and the `@velo0-0/lunara-css/theme` helpers
(`initTheme()`, `toggleTheme()`) set both attributes, so one toggle drives Bootstrap's color
mode and Lunara's tokens together. Lunar-reactive glow (`initMoonPhase()`) works exactly like
the standalone build.

See [`bootstrap.html`](./bootstrap.html) for a live gallery of Bootstrap components wearing the
theme.

---

## Use with any framework

Lunara's CSS has zero JS dependencies — it's just classes, attributes, and CSS variables — so it
drops into any stack the same way Tailwind or Bootstrap would: import the stylesheet once, then
use the classes in whatever templating system you already have (JSX, Vue SFCs, Angular templates,
plain HTML). The only thing that differs per framework is *how you toggle state* for things like
the theme switch, `.modal-overlay.is-open`, or a toast list — that's ordinary UI state in your
framework of choice, driving plain Lunara class names.

For the theme switch specifically, Lunara ships an optional, dependency-free ESM helper —
`@velo0-0/lunara-css/theme` — so you don't have to re-write the same three `localStorage`/attribute lines in
every project. It's the same helper [the docs page itself uses](./index.html).

### Plain HTML

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@velo0-0/lunara-css/dist/lunar.min.css" />
<script type="module">
  import { initTheme, toggleTheme } from "https://cdn.jsdelivr.net/npm/@velo0-0/lunara-css/theme.mjs";
  initTheme();
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
</script>
```

### React (Vite, CRA, Remix — any bundler)

```jsx
// main.jsx / App entry point
import "@velo0-0/lunara-css/dist/lunar.css";
```

```jsx
import { useEffect } from "react";
import { initTheme, toggleTheme } from "@velo0-0/lunara-css/theme";

function ThemeToggle() {
  useEffect(() => { initTheme(); }, []);
  return <button className="btn btn-secondary" onClick={() => toggleTheme()}>☾ / ☀</button>;
}
```

Modals, toasts, etc. are just conditional class names driven by your own component state:

```jsx
<div className={`modal-overlay ${isOpen ? "is-open" : ""}`}>
  <div className="modal scale-in">…</div>
</div>
```

### Next.js

Import the CSS once in the root layout (App Router) or `_app` (Pages Router) — Next.js requires
global CSS to be imported from one of those top-level files, not from an arbitrary component.

```tsx
// app/layout.tsx (App Router)
import "@velo0-0/lunara-css/dist/lunar.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Sets data-theme before hydration so there's no flash of the wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.setAttribute('data-theme',localStorage.getItem('lunar-theme')||'dark')}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// pages/_app.tsx (Pages Router)
import "@velo0-0/lunara-css/dist/lunar.css";
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

The `initTheme()`/`toggleTheme()` calls from the React example above still work the same inside
Client Components (`"use client"`) — the inline script only handles the pre-hydration flash.

### Vue 3

```js
// main.js
import "@velo0-0/lunara-css/dist/lunar.css";
```

```vue
<script setup>
import { onMounted } from "vue";
import { initTheme, toggleTheme } from "@velo0-0/lunara-css/theme";
onMounted(initTheme);
</script>

<template>
  <button class="btn btn-secondary" @click="toggleTheme">☾ / ☀</button>
</template>
```

### Angular

```json
// angular.json
"styles": ["node_modules/@velo0-0/lunara-css/dist/lunar.css", "src/styles.css"]
```

```ts
import { Component, OnInit } from "@angular/core";
import { initTheme, toggleTheme } from "@velo0-0/lunara-css/theme";

@Component({ selector: "app-root", templateUrl: "./app.component.html" })
export class AppComponent implements OnInit {
  ngOnInit() { initTheme(); }
  onToggleTheme() { toggleTheme(); }
}
```

```html
<!-- app.component.html -->
<button class="btn btn-secondary" (click)="onToggleTheme()">☾ / ☀</button>
<div class="modal-overlay" [class.is-open]="isOpen">
  <div class="modal scale-in">…</div>
</div>
```

### Anything else

Svelte, SolidJS, Astro, Nuxt, Qwik, plain jQuery — same two ingredients: import
`@velo0-0/lunara-css/dist/lunar.css` (or the CDN link) once, and optionally `import` from `@velo0-0/lunara-css/theme`.
Nothing in Lunara assumes a specific framework, bundler, or virtual DOM.

---

## Design tokens

All values are CSS custom properties defined on `:root`, so you can override any of them per-app
or per-component:

| Category   | Tokens |
|------------|--------|
| Color      | `--moon-50` … `--moon-950`, `--eclipse`, `--glow`, `--tide`, `--indigo-400/500/600`, `--violet-400/500/600`, `--silver-300/400` |
| Spacing    | `--space-0` … `--space-32` (0.25rem base unit) |
| Typography | `--text-xs` … `--text-6xl`, `--font-thin` … `--font-black`, `--leading-*`, `--tracking-*` |
| Radius     | `--radius-none/sm/md/lg/xl/2xl/full` |
| Shadow     | `--shadow-sm/md/lg/xl`, `--shadow-glow-sm/md/lg/violet` |
| Motion     | `--ease-out`, `--ease-in-out`, `--duration-fast/base/slow` |

Semantic aliases (`--lunar-bg`, `--lunar-surface`, `--lunar-text`, `--lunar-border`, `--lunar-accent`,
etc.) are what components actually consume, and are what `[data-theme="light"]` overrides — so
theming stays a one-attribute switch.

---

## Local variables — component-scoped tokens

Every component and effect exposes its **own local variables** — colors, opacity, radius,
sizing, speed — named `--<component>-<prop>` (`--btn-bg`, `--card-radius`, `--glow-color`),
distinct from the global `--lunar-*` / `--moon-*` tokens. Lunara never *declares* a local
variable on the component; it only **reads** it with a token-based fallback:

```css
/* inside Lunara */
.card {
  background-color: var(--card-bg, var(--lunar-bg-elevated));
  border-radius: var(--card-radius, var(--radius-lg));
}
```

Because unset custom properties inherit, you can set a knob **inline, on the element, or on
any ancestor** ("scope class") — and anything you don't set keeps following the global theme.
Precedence, most-specific first:

1. inline `style="--card-bg: …"` on the element
2. a variant class on the element (`.btn-primary` declares `--btn-bg` — variants
   intentionally beat scopes)
3. a knob set on any ancestor — your scope class
4. the fallback, which routes through the `--lunar-*` semantic tokens, so
   `data-theme` light/dark switching keeps working for everything you haven't overridden

```html
<!-- single element -->
<button class="btn btn-primary" style="--btn-bg: #f472b6">Pink</button>

<!-- scope class: re-skin a whole section without touching Lunara's classes -->
<style>
  .checkout-flow { --btn-bg: #059669; --btn-hover-bg: #047857; --card-radius: 1.25rem; }
</style>
<section class="checkout-flow">
  <button class="btn">picks up the scope</button>
  <button class="btn btn-primary">variant wins — stays tide</button>
  <div class="card">…scoped card…</div>
</section>
```

Variables starting with `--_` (e.g. `--_glass-bg`) are private internals, not API. To reset a
knob back to its default inside a scope, set it to `initial`. Restyle any single instance
without writing a selector or fighting specificity:

```html
<button class="btn btn-primary" style="--btn-bg: #f472b6; --btn-hover-bg: #ec4899">Pink</button>
<div class="card" style="--card-opacity: 0.6; --card-radius: 2rem; --card-border-color: #34d399">…</div>
<div class="glow-md" style="--glow-color: rgb(244 114 182 / 0.5)">Pink glow</div>
<div class="glass" style="--glass-blur: 32px; --glass-bg: rgb(255 255 255 / 0.12)">Frostier</div>
<span class="moon moon-full" style="--moon-size: 5rem; --moon-light: #ffc864"></span>
<span class="text-shimmer" style="--shimmer-accent: #34d399; --shimmer-speed: 2s">Fast green</span>
```

| Component / effect | Custom properties |
|---|---|
| `.btn` | `--btn-bg`, `--btn-color`, `--btn-border-color`, `--btn-hover-bg/-color/-border-color`, `--btn-glow`, `--btn-hover-glow`, `--btn-gradient`, `--btn-radius`, `--btn-padding-x/y`, `--btn-font-size`, `--btn-opacity` |
| `.card` | `--card-bg`, `--card-border-color`, `--card-hover-border-color`, `--card-radius`, `--card-shadow`, `--card-padding-x/y`, `--card-opacity` |
| `.input` / `.textarea` / `.select` | `--input-bg`, `--input-color`, `--input-border-color`, `--input-focus-border-color`, `--input-focus-ring-color`, `--input-radius`, `--input-opacity` |
| `.badge` | `--badge-bg`, `--badge-color`, `--badge-border-color`, `--badge-glow`, `--badge-radius`, `--badge-opacity` |
| `.navbar` | `--navbar-bg`, `--navbar-blur`, `--navbar-border-color`, `--navbar-link-color/-hover-color/-active-color` |
| `.modal` (+ overlay/popover) | `--modal-bg`, `--modal-border-color`, `--modal-radius`, `--modal-max-width`, `--modal-shadow`, `--modal-backdrop-color`, `--modal-backdrop-blur` |
| `.toast` | `--toast-bg`, `--toast-border-color`, `--toast-accent`, `--toast-radius`, `--toast-shadow`, `--toast-opacity` |
| `.moon` | `--moon-size`, `--moon-light`, `--moon-dark`, `--moon-glow` |
| `[data-tooltip]` | `--tooltip-bg`, `--tooltip-color`, `--tooltip-radius` |
| `.glow-sm/-md/-lg/-violet`, `.hover-glow`, `.pulse-glow` | `--glow-color` (any color, alpha included), `--pulse-speed` |
| `.hover-lift` | `--lift-distance` |
| `.glass` / `.glass-dark` | `--glass-bg`, `--glass-border-color`, `--glass-blur`, `--glass-opacity` |
| `.starfield` | `--starfield-bg`, `--star-color` |
| `.gradient-aurora` | `--aurora-gradient`, `--aurora-speed` |
| `.eclipse-border` | `--eclipse-color-1/-2/-3`, `--eclipse-width`, `--eclipse-speed` |
| `.moonbeam` | `--beam-color`, `--beam-size` |
| `.text-shimmer` | `--shimmer-base`, `--shimmer-glow`, `--shimmer-accent`, `--shimmer-speed` |
| `.float` | `--float-distance`, `--float-speed` |

In Tailwind builds the same hooks work via arbitrary properties:
`class="btn [--btn-bg:#f472b6]"`. Global glow intensity is still one dial —
`--lunar-moonlight` on `:root` (or `initMoonPhase()`).

---

## Components

`btn` (+ `-primary/-secondary/-ghost/-outline/-glow`, `-sm/-lg`) · `card` (+ `card-header/-body/-footer`)
· `input` / `textarea` / `select` (+ `label`, `form-group`, `form-hint`) · `badge` (+ `-primary/-violet/-outline/-glow`)
· `navbar` (+ `navbar-brand/-nav/-link`) · `modal-overlay` / `modal` (+ `-header/-body/-footer`, toggle via
`.is-open`) · `toast` (+ `-success/-error/-warning/-info`) · `[data-tooltip="…"]` (pure CSS, no JS)

All components read from the same design tokens and use the effect utilities below internally
(glows on primary buttons, slide-up on toasts, etc.).

---

## Effects reference

Every effect below is a single class — no custom CSS required. Combine freely with components or
plain elements. See the [live gallery](./index.html#effects) for interactive demos.

| Class | Effect |
|---|---|
| `.glow-sm` / `.glow-md` / `.glow-lg` | Soft moonlight box-shadow glow, increasing intensity |
| `.glow-violet` | Violet-tinted glow variant |
| `.hover-lift` | Subtle `translateY` + shadow bloom on hover/focus |
| `.hover-glow` | Glow intensifies on hover/focus |
| `.text-shimmer` | Animated gradient sweep across text |
| `.float` | Gentle infinite floating (moon-drift) animation |
| `.pulse-glow` | Breathing glow animation |
| `.glass` | Frosted glassmorphism panel (light) |
| `.glass-dark` | Frosted glassmorphism panel (dark) |
| `.starfield` | Animated twinkling star background |
| `.gradient-aurora` | Animated shifting aurora/nebula gradient background |
| `.eclipse-border` | Animated gradient border ring (works on any element with a background) |
| `.fade-in` | One-line fade-in entrance animation |
| `.slide-up` | One-line slide-up entrance animation |
| `.scale-in` | One-line scale-in entrance animation |
| `.delay-1` / `.delay-2` / `.delay-3` / `.delay-4` | Stagger any of the entrance animations (100ms–400ms) |
| `.moonbeam` | Cursor-tracking moonlight glow (pair with `initMoonbeam()`; centered hover glow without JS) |
| `.scroll-reveal` / `-up` / `-scale` / `-blur` | Scroll-scrubbed entrance — pure CSS, zero JS |
| `.scroll-parallax` | Scroll-scrubbed parallax drift |
| `.scroll-progress` | Fixed reading progress bar driven by page scroll |
| `.moon` + `.moon-<phase>` / `.moon-live` | Pure-CSS moon-phase icons (see Signature features) |

All animations respect `prefers-reduced-motion: reduce`.

---

## Utility class reference

Atomic, Tailwind-compatible utilities. Spacing utilities run on the `--space-*` scale
(`1` = 0.25rem), so `p-4` = 1rem, exactly like Tailwind.

| Category | Classes |
|---|---|
| Container | `container` (centered, breakpoint max-widths, `--space-4` side padding) |
| Display | `block` `inline-block` `inline` `flex` `inline-flex` `grid` `inline-grid` `hidden` |
| Position | `static` `relative` `absolute` `fixed` `sticky` · `inset-0` `inset-x-0` `inset-y-0` `top-0` `right-0` `bottom-0` `left-0` |
| Flex direction / wrap | `flex-row` `flex-row-reverse` `flex-col` `flex-col-reverse` `flex-wrap` `flex-nowrap` |
| Align / justify | `items-{start,center,end,baseline,stretch}` · `justify-{start,center,end,between,around,evenly}` · `self-{start,center,end,stretch}` |
| Flex sizing | `flex-1` `flex-auto` `flex-initial` `flex-none` `grow` `grow-0` `shrink` `shrink-0` |
| Grid | `grid-cols-{1–12}` · `col-span-{1–12,full}` · `grid-rows-{1–3}` |
| Gap | `gap-{0–6,8,10,12}` · `gap-x-*` / `gap-y-*` (same scale) |
| Padding | `p-{0–6,8,10,12,16}` · `px-*` / `py-*` (same scale) · `pt-*` / `pr-*` / `pb-*` / `pl-*` `{0–6,8,10,12}` |
| Margin | `m-{0–6,8,10,12,auto}` · `mx-*` / `my-*` (same scale) · `mt-*` / `mb-*` `{0–6,8,10,12,auto}` · `mr-*` / `ml-*` `{0–6,8,auto}` |
| Width | `w-auto` `w-full` `w-screen` `w-fit` `w-1/2` `w-1/3` `w-2/3` `w-1/4` `w-3/4` `min-w-0` |
| Height | `h-auto` `h-full` `h-screen` `h-fit` `min-h-screen` `min-h-full` |
| Max width | `max-w-{xs,sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl,prose,full}` |
| Font size | `text-{xs,sm,base,lg,xl,2xl,3xl,4xl,5xl,6xl}` |
| Font weight / style | `font-{thin,light,normal,medium,semibold,bold,black}` · `italic` `not-italic` |
| Text align / transform | `text-{left,center,right,justify}` · `uppercase` `lowercase` `capitalize` `normal-case` |
| Line height / tracking | `leading-{none,tight,snug,normal,relaxed,loose}` · `tracking-{tight,normal,wide,wider}` |
| Decoration / wrap | `underline` `no-underline` `line-through` · `truncate` `whitespace-nowrap` `whitespace-pre-wrap` |
| Text color | `text-moon-{50–950}` · `text-glow` `text-tide` `text-eclipse` `text-violet` `text-indigo` `text-muted` `text-current` |
| Background | `bg-moon-{50–950}` · `bg-glow` `bg-tide` `bg-eclipse` `bg-violet` `bg-indigo` `bg-surface` `bg-transparent` |
| Border | `border` `border-0` `border-2` `border-4` `border-{t,r,b,l}` · `border-{moon-700,moon-800,tide,violet,transparent}` |
| Radius | `rounded-{none,sm,md,lg,xl,2xl,full}` |
| Shadow | `shadow-none` `shadow-sm` `shadow` `shadow-md` `shadow-lg` `shadow-xl` |
| Opacity | `opacity-{0,25,50,75,100}` |
| Overflow | `overflow-{auto,hidden,visible,scroll}` · `overflow-x-{auto,hidden}` `overflow-y-{auto,hidden}` |
| Z-index | `z-{0,10,20,30,40,50,auto}` |
| Interactivity | `cursor-{pointer,not-allowed,default}` `select-none` `pointer-events-none` |
| Accessibility | `sr-only` (visually hidden, screen-reader accessible) |

### Responsive design

Five Tailwind-compatible, mobile-first breakpoints: `sm:` ≥640px, `md:` ≥768px, `lg:` ≥1024px,
`xl:` ≥1280px, `2xl:` ≥1536px. Every breakpoint exposes the **same** variant set over the
layout-relevant utilities — display, flex direction/wrap, align/justify, `grid-cols`, `col-span`,
`gap`, `p`/`px`/`py`, `mx-auto`, text alignment, font size, and width:

```html
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">…</div>
<h1 class="text-3xl md:text-5xl 2xl:text-6xl">Scales with the viewport</h1>
<nav class="hidden lg:flex gap-6">Desktop-only nav</nav>
```

The [test page](./test/index.html) renders the full matrix and verifies all 851 classes exist.

> **Note:** `.slide-up` and `.scale-in` animate `transform`, and (per the CSS spec) any element
> with a non-`none` computed `transform` becomes the containing block for `position: fixed`
> descendants — including after the entrance animation finishes, since it holds its end state via
> `animation-fill-mode: both`. If you need a `position: fixed` element (a modal, a toast region)
> inside a section that also uses one of these entrance classes, keep the fixed element outside
> that section (e.g. as a sibling near the end of `<body>`) so it stays positioned against the
> viewport instead of the animated ancestor.

---

## Project structure

```
lunar-css/
├── src/                  # modular source (edit these)
│   ├── base.css          # design tokens + reset + base elements
│   ├── themes.css        # dark (default) + data-theme="light" daylight variant
│   ├── effects.css       # one-line effect utilities + keyframes
│   ├── motion.css        # scroll-driven animation utilities (pure CSS)
│   ├── components.css    # buttons, cards, inputs, badges, navbar, modal, toast, tooltip, moon icons
│   ├── utilities.css     # atomic utility classes (spacing, flex/grid, typography, borders…)
│   └── bootstrap.css     # Bootstrap --bs-* variable bridge (source of lunar-bootstrap)
├── dist/                 # built output (generated, do not hand-edit)
│   ├── lunar.css
│   ├── lunar.min.css
│   ├── lunar.tailwind.json     # pre-parsed class map consumed by the Tailwind plugin
│   ├── lunar-bootstrap.css     # "lunara-bootstrap" — night-sky theme for Bootstrap 5.3+
│   └── lunar-bootstrap.min.css
├── tailwind.css          # Tailwind v4 CSS-first entry (@theme + @plugin + dark variant)
├── tailwind-preset.js    # Tailwind v3 theme extension (includes the components plugin)
├── tailwind-plugin.js    # registers components/effects as native Tailwind classes (v3 + v4)
├── theme.mjs             # optional framework-agnostic theme + moon-phase helpers (ESM)
├── index.html            # palette / typography / component / effects gallery
├── bootstrap.html        # lunara-bootstrap live gallery
├── test/index.html       # release QA page — renders every class + automated inventory check
├── build.js              # concatenates + minifies src/ → dist/
├── CHANGELOG.md
├── LICENSE               # MIT
└── package.json
```

### Building from source

```bash
npm run build
```

Runs `build.js`, a small dependency-free Node script: concatenates `src/*.css`
(base → themes → effects → motion → components → utilities) into `dist/lunar.css` — cascade
priority is governed by the `@layer` order declared in `base.css`, with utilities last so they
always win — then writes a minified `dist/lunar.min.css`, the Tailwind class map
(`dist/lunar.tailwind.json`), and the Bootstrap bridge builds. No bundler or PostCSS required
to build or to consume the framework.

---

## Browser support

Uses modern, broadly-supported CSS: cascade layers (`@layer`), `backdrop-filter`, and CSS custom
properties. Targets current versions of Chrome, Edge, Firefox, and Safari.

The signature features are progressive enhancements on newer platform APIs:

- **Scroll-driven motion** (`animation-timeline`) — Chrome/Edge 115+, Safari 26+; wrapped in
  `@supports`, so unsupported browsers show content normally, just without the scroll effects.
- **Zero-JS modal** (Popover API + `@starting-style`) — Chrome/Edge 125+, Safari 17.4+,
  Firefox 129+ for the full animated experience; the popover itself works wherever the Popover
  API does. In browsers without the Popover API the modal is hidden entirely (via
  `@supports not selector(:popover-open)`) instead of leaking inline into the page.
- **Eclipse border spin** (`@property`) — browsers without `@property` (old Firefox) show the
  gradient ring statically instead of animating it; nothing breaks.
- **Moon-phase icons and lunar theming** — plain CSS + a tiny JS helper; works everywhere.

Prefixed fallbacks ship for `backdrop-filter`, `mask`/`mask-composite`, and `user-select`
(`-webkit-*`), and viewport heights use `100vh` with a `100dvh` progressive override, so nothing
in the core requires a feature below ~95% global support without a graceful fallback.

## License

MIT
