import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Bootstrap integration" };

export default function Bootstrap() {
  return (
    <>
      <h1 className="text-4xl font-bold">Bootstrap integration</h1>
      <p className="text-muted text-lg">
        Not every site uses Tailwind. For plain-HTML sites (or anything else) built on{" "}
        <strong>Bootstrap 5.3+</strong>, Lunara ships <code>lunara-bootstrap</code> — a
        bridge stylesheet that re-themes all of Bootstrap with the night-sky design,
        purely through Bootstrap&rsquo;s own <code>--bs-*</code> CSS variable API. No
        Sass, no build step, no markup changes: your existing Bootstrap classes just
        look lunar.
      </p>

      <h2 className="text-2xl font-bold">Setup</h2>
      <p>
        One extra <code>&lt;link&gt;</code> tag, loaded <strong>after</strong>{" "}
        <code>bootstrap.css</code>:
      </p>
      <CodeBlock
        lang="html"
        code={`<!-- 1. Bootstrap, as usual -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
<!-- 2. Lunara Bootstrap — must come AFTER bootstrap.css -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lunara-css/dist/lunar-bootstrap.min.css" />`}
      />
      <p>Or from npm:</p>
      <CodeBlock
        lang="js"
        code={`import "bootstrap/dist/css/bootstrap.min.css";
import "lunara-css/bootstrap";`}
      />

      <h2 className="text-2xl font-bold">What gets themed</h2>
      <p>
        Bootstrap&rsquo;s globals (<code>--bs-body-bg</code>, <code>--bs-primary</code>,
        border radius scale, fonts, shadows, focus rings) and per-component variables are
        mapped to Lunara&rsquo;s tokens:
      </p>
      <ul>
        <li>
          <strong>Buttons</strong> — <code>btn-primary</code> becomes tide-indigo with a
          moonlight glow on hover; <code>btn-outline-primary</code>,{" "}
          <code>btn-secondary</code>, and <code>btn-link</code> follow the theme.
        </li>
        <li>
          <strong>Surfaces</strong> — cards, modals (with backdrop blur-dark and a soft
          glow), dropdowns, toasts, offcanvas, popovers, tooltips.
        </li>
        <li>
          <strong>Forms</strong> — inputs, selects, checks, switches, ranges: tide accents
          and glow focus rings.
        </li>
        <li>
          <strong>Navigation</strong> — navbar, tabs, pills, breadcrumbs, pagination.
        </li>
        <li>
          <strong>Data</strong> — tables (striped/hover tints), list groups, progress
          bars, accordions, alerts.
        </li>
      </ul>

      <h2 className="text-2xl font-bold">Lunara extras included</h2>
      <p>
        The bridge also bundles Lunara&rsquo;s design tokens, effect utilities, scroll
        motion, and moon icons — everything that doesn&rsquo;t collide with Bootstrap
        class names:
      </p>
      <CodeBlock
        lang="html"
        code={`<div class="card moonbeam">Bootstrap card + Lunara cursor glow</div>
<section class="starfield">Bootstrap grid inside a starfield</section>
<span class="moon moon-live"></span> <!-- tonight's actual moon phase -->
<div class="scroll-progress"></div>`}
      />
      <p>
        <strong>Deliberately excluded:</strong> Lunara&rsquo;s own components and spacing
        utilities — <code>.btn</code>, <code>.card</code>, <code>.p-4</code>, … would
        collide with Bootstrap&rsquo;s class names, so the bridge never ships them. Use
        Bootstrap&rsquo;s components and utilities; Lunara provides the theme and the
        effects.
      </p>

      <h2 className="text-2xl font-bold">Dark / light switching</h2>
      <p>
        Dark is the default. The bridge responds to <strong>both</strong>{" "}
        Bootstrap&rsquo;s native <code>data-bs-theme</code> attribute and Lunara&rsquo;s{" "}
        <code>data-theme</code> — and the <code>lunara-css/theme</code> helpers set both
        attributes, so one toggle drives Bootstrap&rsquo;s color mode and Lunara&rsquo;s
        tokens together:
      </p>
      <CodeBlock
        lang="html"
        code={`<script type="module">
  import { initTheme, toggleTheme, initMoonPhase }
    from "https://cdn.jsdelivr.net/npm/lunara-css/theme.mjs";
  initTheme();      // restore saved theme (sets data-theme AND data-bs-theme)
  initMoonPhase();  // optional: lunar-reactive glow
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
</script>`}
      />
      <p>
        In light mode the accent shifts from tide to indigo-600 across every themed
        component — buttons, active pagination, checked switches, progress bars — exactly
        like the standalone Lunara build.
      </p>

      <h2 className="text-2xl font-bold">How it works</h2>
      <p>
        Bootstrap 5.3 exposes nearly all of its styling through CSS custom properties.
        The bridge overrides those variables (globals at <code>:root</code> /{" "}
        <code>[data-bs-theme]</code>, components at their class), pointing them at
        Lunara&rsquo;s semantic tokens like <code>--lunar-bg</code> and{" "}
        <code>--lunar-accent</code>. Since the theme switch swaps those tokens, every
        Bootstrap component re-themes from one attribute. The file is intentionally{" "}
        <em>not</em> wrapped in a cascade layer — Bootstrap&rsquo;s CSS is unlayered, and
        unlayered CSS beats layered CSS, so the bridge stays unlayered and wins by source
        order. That&rsquo;s why load order matters.
      </p>
      <p>
        A live gallery of Bootstrap components wearing the theme ships in the repo as{" "}
        <code>bootstrap.html</code>.
      </p>
    </>
  );
}
