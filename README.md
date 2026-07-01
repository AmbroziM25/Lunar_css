# Lunara CSS 🌙

A lightweight, utility-first CSS framework with a dark **"night sky"** aesthetic — deep space
blacks and navys, soft moonlight whites, and subtle glow/gradient accents in silver, indigo, and
violet.

- **Pure CSS, zero build step.** Drop in a `<link>` tag and go.
- **Utility-first**, Tailwind-like class names (`bg-moon-900`, `text-glow`, `p-4`, `rounded-lg`) —
  muscle memory carries over either direction.
- **Tailwind-native.** One preset line (`require('lunara-css/tailwind-preset')`) registers the
  full palette **and every component/effect** as real Tailwind classes — tree-shaken, variant-aware
  (`hover:glow-lg`), emitted by your own Tailwind build.
- **One-line effect utilities.** Glow, glass, aurora, shimmer, starfields, entrance animations —
  no hand-written keyframes or box-shadow stacks.
- **Prebuilt components.** Buttons, cards, inputs, badges, navbar, modal, toast, tooltip — all
  themeable via CSS variables.
- **Dark-mode-first**, with a light "daylight" variant toggled via `data-theme`.
- **Works with any framework.** Plain HTML, React, Next.js, Vue, Angular, or anything else — it's
  just CSS classes and an optional framework-agnostic JS helper for theme toggling.
- **Lunara-reactive theming** 🌖 — opt in and the framework's glow intensity follows the *real*
  moon phase. Nobody else does this.
- **Scroll-driven animations with zero JS** — reveal-on-scroll, parallax, and a reading progress
  bar, all pure CSS via `animation-timeline`.
- **Zero-JavaScript modal** — Lunara styles the native Popover API, so two HTML attributes give
  you a fully animated modal with backdrop blur, Esc, and light-dismiss. No script.

[View the live component + effects gallery →](./index.html)

**Full documentation site** (Next.js, built with Lunara itself) lives on the
[`docs-site` branch](https://github.com/AmbroziM25/Lunar_css/tree/docs-site):

```bash
git switch docs-site
npm install
npm run dev   # http://localhost:3000
```

---

## Install

### CDN (no build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lunara-css/dist/lunar.min.css" />
```

### npm

```bash
npm install lunara-css
```

```css
/* import the full framework */
@import "lunara-css/dist/lunar.css";
```

```js
// or in a bundler entry point
import "lunara-css/dist/lunar.css";
```

That's it — no PostCSS, no build config. `dist/lunar.css` is the readable build; `dist/lunar.min.css`
is the minified production build.

---

## Quick start

```html
<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lunara-css/dist/lunar.min.css" />
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

## Signature features — things no other framework ships

### 🌖 Lunara-reactive theming

Call one function and the framework's glow intensity tracks the **actual moon phase** — dimmest
at new moon, brightest at full moon:

```js
import { initMoonPhase } from "lunara-css/theme";

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
import { initMoonbeam } from "lunara-css/theme";
initMoonbeam(); // returns a cleanup function
```

Without the JS it gracefully degrades to a centered glow on hover.

---

## Tailwind integration

Lunara ships a preset that gives Tailwind projects the **whole framework** — not just the color
palette, but every prebuilt component and effect utility, registered as native Tailwind classes:

```bash
npm install lunara-css tailwindcss
```

```js
// tailwind.config.js
module.exports = {
  presets: [require("lunara-css/tailwind-preset")],
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
};
```

One preset line gets you all of this, through Tailwind's own build:

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

Under the hood the plugin parses Lunara's own built CSS at build time, so the Tailwind classes
can never drift from the plain-CSS distribution.

**Components only, no theme?** If you want Lunara's components on top of your own Tailwind theme,
skip the preset and register just the plugin:

```js
// tailwind.config.js
module.exports = {
  plugins: [require("lunara-css/tailwind-plugin")],
};
```

**Tailwind v4?** The preset/plugin target Tailwind v3's JS config. On v4's CSS-first setup,
either load the config through `@config "./tailwind.config.js"`, or simply
`@import "lunara-css/dist/lunar.css";` next to your Tailwind import — the class names are
Tailwind-shaped either way.

**Dark mode:** the preset sets `darkMode: ['selector', '[data-theme="dark"]']`, which points
Tailwind's own `dark:` variant convention at the same `data-theme` attribute Lunara uses to toggle
themes. Set `data-theme="dark"` on `<html>` and both Lunara's dark tokens and your `dark:` utilities
activate together; set `data-theme="light"` for daylight mode.

If you only need the plain CSS utilities/components (no Tailwind build), skip this section
entirely and just link `dist/lunar.css`.

---

## Use with any framework

Lunara's CSS has zero JS dependencies — it's just classes, attributes, and CSS variables — so it
drops into any stack the same way Tailwind or Bootstrap would: import the stylesheet once, then
use the classes in whatever templating system you already have (JSX, Vue SFCs, Angular templates,
plain HTML). The only thing that differs per framework is *how you toggle state* for things like
the theme switch, `.modal-overlay.is-open`, or a toast list — that's ordinary UI state in your
framework of choice, driving plain Lunara class names.

For the theme switch specifically, Lunara ships an optional, dependency-free ESM helper —
`lunara-css/theme` — so you don't have to re-write the same three `localStorage`/attribute lines in
every project. It's the same helper [the docs page itself uses](./index.html).

### Plain HTML

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lunara-css/dist/lunar.min.css" />
<script type="module">
  import { initTheme, toggleTheme } from "https://cdn.jsdelivr.net/npm/lunara-css/theme.mjs";
  initTheme();
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
</script>
```

### React (Vite, CRA, Remix — any bundler)

```jsx
// main.jsx / App entry point
import "lunara-css/dist/lunar.css";
```

```jsx
import { useEffect } from "react";
import { initTheme, toggleTheme } from "lunara-css/theme";

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
import "lunara-css/dist/lunar.css";

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
import "lunara-css/dist/lunar.css";
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

The `initTheme()`/`toggleTheme()` calls from the React example above still work the same inside
Client Components (`"use client"`) — the inline script only handles the pre-hydration flash.

### Vue 3

```js
// main.js
import "lunara-css/dist/lunar.css";
```

```vue
<script setup>
import { onMounted } from "vue";
import { initTheme, toggleTheme } from "lunara-css/theme";
onMounted(initTheme);
</script>

<template>
  <button class="btn btn-secondary" @click="toggleTheme">☾ / ☀</button>
</template>
```

### Angular

```json
// angular.json
"styles": ["node_modules/lunara-css/dist/lunar.css", "src/styles.css"]
```

```ts
import { Component, OnInit } from "@angular/core";
import { initTheme, toggleTheme } from "lunara-css/theme";

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
`lunara-css/dist/lunar.css` (or the CDN link) once, and optionally `import` from `lunara-css/theme`.
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
│   └── utilities.css     # atomic utility classes (spacing, flex/grid, typography, borders…)
├── dist/                 # built output (generated, do not hand-edit)
│   ├── lunar.css
│   └── lunar.min.css
├── tailwind-preset.js    # Tailwind theme extension (includes the components plugin)
├── tailwind-plugin.js    # registers components/effects as native Tailwind classes
├── theme.mjs             # optional framework-agnostic theme + moon-phase helpers (ESM)
├── index.html            # palette / typography / component / effects gallery
├── build.js              # concatenates + minifies src/ → dist/
└── package.json
```

### Building from source

```bash
npm run build
```

Runs `build.js`, a small dependency-free Node script: concatenates `src/*.css` in cascade order
(base → themes → effects → components → utilities, so utilities always win) into `dist/lunar.css`,
then writes a minified `dist/lunar.min.css`. No bundler or PostCSS required to build or to consume
the framework.

---

## Browser support

Uses modern, broadly-supported CSS: cascade layers (`@layer`), `backdrop-filter`, and CSS custom
properties. Targets current versions of Chrome, Edge, Firefox, and Safari.

The signature features are progressive enhancements on newer platform APIs:

- **Scroll-driven motion** (`animation-timeline`) — Chrome/Edge 115+, Safari 26+; wrapped in
  `@supports`, so unsupported browsers show content normally, just without the scroll effects.
- **Zero-JS modal** (Popover API + `@starting-style`) — Chrome/Edge 125+, Safari 17.4+,
  Firefox 129+ for the full animated experience; the popover itself works wherever the Popover
  API does.
- **Moon-phase icons and lunar theming** — plain CSS + a tiny JS helper; works everywhere.

## License

MIT
