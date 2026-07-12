# Changelog

All notable changes to Lunara CSS are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-07-12

The compiler moves into the browser. The `lunara` CLI and its compile server are gone as
user-facing tools; in their place, **one script tag compiles your CSS automatically while
you build your site** — no command, no server, nothing to start or keep running.

### Removed — the CLI (breaking)

- **The `lunara` bin no longer exists.** `npx lunara` (the compile server: on-the-fly CSS
  responses, live-reload injection, dashboard, `lunara.config.json`, CLI flags) is removed.
  This is the breaking change behind the major version bump — the CSS itself is untouched.
- The Node optimizer survives as a **programmatic API only**:
  `import { startServer, compileOnce } from '@velo0-0/lunara-css/server'` still gives CI
  pipelines the Lightning CSS purge/minify passes, TS/TSX + HTML static analysis, and the
  HTTP compile endpoint (optional peers `lightningcss` / `typescript` unchanged).

### Added — the in-browser compiler (`lunar-compiler.js`)

```html
<script src="node_modules/@velo0-0/lunara-css/lunar-compiler.js" defer></script>
<!-- or -->
<script src="https://cdn.jsdelivr.net/npm/@velo0-0/lunara-css@2/lunar-compiler.js" defer></script>
```

- **Compiles automatically on every page load while the site is being built.** It collects
  every class the page actually uses — the rendered DOM, `<template>` contents, and string
  literals in same-origin scripts (`classList.add('open')`, `el.className = 'btn primary'`;
  `` `chip-${tone}` `` becomes a `chip-*` keep-pattern) — then swaps each stylesheet for a
  purged copy, so the page immediately runs on compiled CSS. Originals stay in the document,
  disabled, as the source of truth; replacements are inserted right after them, so cascade
  order never changes.
- **Self-healing.** A MutationObserver keeps watching: a menu opening, a JS toggle, an SPA
  render — any class that appears later restores its rules within a tick. Purging can never
  permanently break the page you are looking at.
- **The artifact is one click away.** A floating badge shows live savings
  (`🌙 CSS −62% · 41/168 selectors · download`) and downloads each optimized stylesheet as
  `<name>.lunara.css`, ready to deploy. `window.lunara.report()` returns the full breakdown
  (per-sheet CSS, selector counts, used classes, patterns).
- **Conservative by design**, mirroring the Node optimizer: selectors keyed on ids, tags, or
  attributes are never removed; classes inside `:not()`/`:is()`/`:where()`/attribute
  brackets never cause a removal; rules using CSS nesting are kept whole; emptied
  `@media`/`@supports`/`@container` blocks are dropped; emptied `@layer` blocks are kept
  (cascade order); cross-origin stylesheets are left untouched.
- **Options**: `<meta name="lunara-safelist" content="visually-hidden /^toast-/">` for
  classes only reachable at runtime; `data-badge="off"` hides the badge;
  `data-scripts="off"` skips script scanning.
- **Zero everything**: a single classic script with no imports and no dependencies — works
  from any static server and even `file://`, in any framework or none.
- New package entries: `@velo0-0/lunara-css/compiler` and `./lunar-compiler.js` exports;
  the file ships at the package root. Test suite grew to 124 tests, covering the browser
  compiler's selector parsing, script scanning, safelist, and purge semantics.

### Migration

| 1.x | 2.0.0 |
| --- | --- |
| `npx lunara` while developing | `<script src=".../lunar-compiler.js" defer>` in the page |
| optimized files written to `dist/` | click the badge (or `window.lunara.download()`) → `*.lunara.css` |
| `lunara.config.json` `safelist` | `<meta name="lunara-safelist" content="…">` |
| CLI in CI (`--fail-on-unused` etc.) | programmatic `@velo0-0/lunara-css/server` API |

One workflow note: the in-browser artifact reflects the states your page has actually been
in — click through your UI (or safelist what you cannot reach) before downloading. Purging
in the page itself is always self-healing; this only matters for the downloaded file.

### Changed

- **No CSS changes** — classes, tokens, and computed styles are identical to 1.2.1; only the
  version banner in the `dist/` file headers moved to 2.0.0.

## [1.2.1] — 2026-07-12

### Added — the compile server (`npx lunara`)

Lunara still ships every utility with zero build step — but when byte size starts to matter,
the package now includes a **compile server** that runs your website and snipes its CSS:

```bash
npm i -D @velo0-0/lunara-css lightningcss   # + typescript to scan .ts/.tsx/.js/.jsx
npx lunara                                  # then open http://127.0.0.1:4321/
```

- Serves your project directory like any dev server, but **every stylesheet the site
  references is intercepted and compiled on the fly** — unused Lunara classes purged, the
  rest minified with Lightning CSS. Your ordinary
  `<link rel="stylesheet" href="styles.css">` stays untouched; the server answers that exact
  request with the optimized build (savings in the `x-lunara` response header). Serving this
  repo's own demo page, the 84.3 KB `dist/lunar.css` its `<link>` asks for arrives as
  **31.4 KB (−62.8 %)**. Optimized files are also written to the out directory (`dist/` by
  default) on every change, ready to deploy.
- **Live reload** — the server injects its client into served HTML automatically, and open
  pages re-style themselves over WebSocket on every save. The WebSocket layer (handshake,
  text frames, ping/pong, close) is implemented in-package — no runtime dependencies added.
- **Usage analysis** scans `**/*.html` and `src/**/*.{ts,tsx,js,jsx}` and understands
  `class="…"` in HTML, `className`/`clsx`/`cn` in JSX, template literals
  (`` `btn-${size}` `` keeps every `.btn-*`), `classList.add/remove/toggle`,
  `el.className = '…'`, `setAttribute('class', …)`, and CSS Modules. Anything it can't
  analyze is reported with `file:line` so you can add a `"safelist"` entry.
- **Purging is conservative by design** — selectors keyed on ids, tags, attributes, or
  `:not()` are never removed, and emptied `@layer` blocks are kept so cascade-layer order
  never changes.
- **Endpoints** (the server's own routes live under `/__lunara`, so they never shadow your
  files):

  | Route | What it does |
  | --- | --- |
  | `GET /<any site file>` | your site — `.css` optimized on the fly, HTML gets the live client |
  | `GET /__lunara` | dashboard: sizes, removed selectors, warnings |
  | `GET /__lunara/report` | full build report as JSON |
  | `GET /lunar.css` | optimized output by stable name (for pages served elsewhere) |
  | `POST /__lunara/compile` | `{ css, sources?, safelist?, critical?, minify?, sourceMap? }` → optimized CSS |
  | `WS /__lunara/ws` | `rebuild`/`cssupdate` broadcasts; send `{ "type": "compile", id, … }` to compile on demand |

- **Configuration** — `lunara.config.json` accepts `content`, `css`, `outDir`, `safelist`,
  `critical` (splits a `*.critical.css` for inlining), `minify`, `sourceMap`, `hash`,
  `clean`, `port`, `host`; the same options exist as CLI flags (`npx lunara --help`).
- **Programmatic API** — `import { startServer, resolveConfig } from
  '@velo0-0/lunara-css/server'`; the package also gained the `lunara` bin.
- **Test suite** — node:test coverage for config resolution, class extraction (HTML, JSX,
  DOM APIs), globbing, purging, WebSocket framing, and the server end-to-end (109 tests,
  run by `prepublishOnly` so a broken compiler can never be published).

### Changed

- New **optional** peer dependencies, loaded only when the compile server runs:
  `lightningcss` ≥ 1.30.0 (purging/minifying) and `typescript` ≥ 5.0.0 (only needed to scan
  script files). The framework itself is unchanged — pure CSS, zero runtime dependencies,
  no build step required. The compile server needs Node 20+.
- The npm package now ships the compiled server (`compiler/dist` + its `package.json`)
  alongside the usual `dist/` CSS.
- **No CSS changes** — classes, tokens, and computed styles are identical to 1.1.1; only the
  version banner in the `dist/` file headers moved to 1.2.1.

## [1.1.1] — 2026-07-10

### Changed

- Package `homepage` now points to the official documentation site,
  [lunaracss.dev](https://lunaracss.dev) (was the GitHub README). No code changes.

## [1.1.1] — 2026-07-10

### Changed

- **Package renamed: `lunara-css` → `@velo0-0/lunara-css`.** No CSS changes — classes,
  tokens, local variables, and the file layout are identical. Only the npm name (and
  therefore import specifiers and CDN URLs) changed:
  - `npm install @velo0-0/lunara-css`
  - `import "@velo0-0/lunara-css/dist/lunar.css"` · `@velo0-0/lunara-css/theme` ·
    `@velo0-0/lunara-css/tailwind` · `@velo0-0/lunara-css/bootstrap` …
  - CDN: `https://cdn.jsdelivr.net/npm/@velo0-0/lunara-css@1/dist/lunar.min.css`
- The old `lunara-css` package (last published as 1.1.0) is superseded by this scoped name.

## [1.1.0] — 2026-07-07

### Added — local variable system (component-scoped tokens)

Every component's `--<component>-*` knobs (`--btn-bg`, `--card-radius`, `--glass-blur`…) can
now be set **on any ancestor** ("scope class"), not just inline on the element:

```html
<section style="--btn-bg: #059669; --card-radius: 1.25rem">
  <!-- every plain .btn / .card inside is re-skinned -->
</section>
```

Mechanically: components now **consume** their knobs with token-based fallbacks
(`background: var(--card-bg, var(--lunar-bg-elevated))`) instead of declaring them on the
element — a declaration on the element had always beaten inherited values, which made
wrapper-level overrides silently no-ops in 1.0 (the docs implied this worked; now it does).
Precedence: inline knob → variant class (`.btn-primary` intentionally beats scopes) →
ancestor scope → theme-aware token fallback.

- Converted: `.btn`, `.card`, `.input`/`.textarea`/`.select`, `.badge`, `.navbar`,
  `.modal-overlay`, `.modal`, `.toast`, `.moon`, `.glass`/`.glass-dark`, `.starfield`
  (tooltips and all other effects already followed the consumed pattern).
- `.glass`/`.glass-dark` theme-dependent defaults moved to private `--_glass-*` internals,
  so a `--glass-bg` override now wins in **both** themes (previously the light-theme rule
  clobbered it); unset knobs still swap with `data-theme`.
- Convention: `--_<component>-*` (leading underscore) is reserved for private internals.
  Setting a knob to `initial` inside a scope resets it to the framework default.
- Docs: "Customization" page and README rewritten around the pattern with live scope-class
  examples; `test/index.html` gained a Local Variables section with 8 automated
  precedence/theme assertions.

### Changed

- No class names, knob names, or computed default styles changed — verified by the QA page's
  851-class inventory and computed-style regression checks. `dist/lunar.min.css` shrank
  56.1 KB → 55.3 KB (removed knob declarations).
- One observable (intended) behavior change: knobs set on a wrapper now actually apply to
  components inside it — in 1.0 they were ignored.

## [1.0.0] — 2026-07-03

First stable release. **No breaking changes for existing users** — every class that existed in
0.5.0 keeps its name and behavior; 1.0.0 only adds, fixes, and optimizes.

### Added

- **`xl:` (≥1280px) and `2xl:` (≥1536px) responsive breakpoints**, completing the Tailwind-compatible
  sm/md/lg/xl/2xl set.
- **Uniform responsive matrix** — all five breakpoints now expose the *same* 72-variant set over
  the layout-relevant utilities (display, flex direction/wrap, align/justify, `grid-cols`,
  `col-span`, `gap`, `p`/`px`/`py`, `mx-auto`, text align, font size, width). Previously `sm`/`md`/`lg`
  each had a different ad-hoc subset.
- **Completed utility scales** (previously had gaps):
  - `gap-x-*` / `gap-y-*` now cover the full `{0–6, 8, 10, 12}` scale (were missing 0, 5, 8, 10, 12)
  - `pt/pr/pb/pl-*` and `mt/mb-*` complete to `{0–6, 8, 10, 12}`; `mr/ml-*` to `{0–6, 8}`
  - `px/py-16`, `m-10`, `m-12`, and directional `*-auto` margins (`mt-auto`, `mr-auto`, `mb-auto`, `ml-auto`)
  - `grid-cols-7` … `grid-cols-11` and `col-span-5`, `col-span-7` … `col-span-11` — the 12-column
    grid is now complete
- **New utilities**: `sr-only`, `self-{start,center,end,stretch}`, `inset-x-0`, `inset-y-0`,
  `min-w-0`, `max-w-7xl`, `overflow-x-hidden`, `overflow-y-hidden`
- **`.moon-full` is now an explicit rule** (previously worked only by relying on `.moon` defaults),
  including the matching `[data-moon-phase="full"] .moon-live` state.
- **`test/index.html`** — release QA page that renders every utility, component, and effect class
  grouped by category, with an automated in-page inventory check (fetches `dist/lunar.css` and
  verifies all 851 expected classes exist).
- `unpkg` / `jsdelivr` package fields — CDN default entry now serves `lunar.min.css`.
- `prepublishOnly` build hook so a stale `dist/` can never be published.
- This changelog.

### Fixed

- **`.modal-overlay`** was missing `-webkit-backdrop-filter` — backdrop blur now works in Safari.
- **`user-select: none`** (`.btn`, `.select-none`) silently failed in Safari ≤ 18.1 — now paired
  with `-webkit-user-select`.
- **`.eclipse-border`** used only the `-webkit-mask` path — now also ships standard
  `mask` + `mask-composite: exclude` for spec-compliant engines.
- **Zero-JS popover modal** leaked its content inline into the page in browsers without the
  Popover API — now hidden there via `@supports not selector(:popover-open)`.
- **Navbar links overflowed the viewport on narrow screens** — `.navbar-nav` now wraps.
- `h-screen` / `min-h-screen` / `body` now use `100dvh` with a `100vh` fallback (correct height on
  mobile browsers with dynamic toolbars).
- Demo page skip-link now uses the real `.sr-only` utility instead of an inline-style workaround.

### Changed / removed

- Removed the dead `--lunar-shadow-ambient` custom property (declared in both theme blocks,
  consumed nowhere). *Design tokens are otherwise untouched.*
- Merged the duplicate `.shadow` / `.shadow-md` rules into one selector list (identical output).
- Minifier now strips leading zeros in decimals (`0.5` → `.5`) — pure size win, no behavior change.
- npm package no longer ships `src/` (build input only); the published package is `dist/`, the
  Tailwind entries (`tailwind.css`, `tailwind-preset.js`, `tailwind-plugin.js`), `theme.mjs`,
  `README.md`, and `LICENSE`.

### Build output

| File | 0.5.0 | 1.0.0 | gzip (1.0.0) |
|---|---|---|---|
| `dist/lunar.css` | 62.9 KB | 82.4 KB | 16.1 KB |
| `dist/lunar.min.css` | 40.6 KB | 56.1 KB | **10.8 KB** |
| `dist/lunar-bootstrap.min.css` | 24.2 KB | 24.3 KB | 5.3 KB |

The raw growth is the new responsive matrix and completed scales (~490 added utility classes);
over the wire the minified core costs ~2.5 KB gzip more than 0.5.0.

## [0.5.0] — 2026-06

- Tailwind v4 support (`@import "lunara-css/tailwind"`), Bootstrap 5.3 bridge
  (`lunara-bootstrap`), streamlined CSS variables, per-component customization API.

## [0.4.0] and earlier

- Initial development releases: night-sky design tokens, effect utilities, components,
  scroll-driven motion, moon-phase icons, lunar-reactive theming.
