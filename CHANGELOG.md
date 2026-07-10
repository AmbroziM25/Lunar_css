# Changelog

All notable changes to Lunara CSS are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/).

## [1.1.1] — 2026-07-10

### Changed

- Package `homepage` now points to the official documentation site,
  [lunaracss.dev](https://lunaracss.dev) (was the GitHub README). No code changes.

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
