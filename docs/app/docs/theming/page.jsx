import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Theming & tokens" };

export default function Theming() {
  return (
    <>
      <h1 className="text-4xl font-bold">Theming &amp; design tokens</h1>
      <p className="text-muted text-lg">
        Every value in Lunara is a CSS custom property on <code>:root</code>, so you can
        override anything per-app or per-component with zero specificity fights.
      </p>

      <h2 className="text-2xl font-bold">Design tokens</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Tokens</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Color</td>
            <td>
              <code>--moon-50</code> … <code>--moon-950</code>, <code>--eclipse</code>,{" "}
              <code>--glow</code>, <code>--tide</code>,{" "}
              <code>--indigo-400/500/600</code>, <code>--violet-400/500/600</code>,{" "}
              <code>--silver-300/400</code>
            </td>
          </tr>
          <tr>
            <td>Spacing</td>
            <td>
              <code>--space-0</code> … <code>--space-32</code> (0.25rem base unit)
            </td>
          </tr>
          <tr>
            <td>Typography</td>
            <td>
              <code>--text-xs</code> … <code>--text-6xl</code>,{" "}
              <code>--font-thin</code> … <code>--font-black</code>,{" "}
              <code>--leading-*</code>, <code>--tracking-*</code>
            </td>
          </tr>
          <tr>
            <td>Radius</td>
            <td><code>--radius-none/sm/md/lg/xl/2xl/full</code></td>
          </tr>
          <tr>
            <td>Shadow</td>
            <td>
              <code>--shadow-sm/md/lg/xl</code>, <code>--shadow-glow-sm/md/lg/violet</code>
            </td>
          </tr>
          <tr>
            <td>Motion</td>
            <td>
              <code>--ease-out</code>, <code>--ease-in-out</code>,{" "}
              <code>--duration-fast/base/slow</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Components consume <strong>semantic aliases</strong> (<code>--lunar-bg</code>,{" "}
        <code>--lunar-surface</code>, <code>--lunar-text</code>, <code>--lunar-border</code>,{" "}
        <code>--lunar-accent</code>, …) which is what{" "}
        <code>[data-theme=&quot;light&quot;]</code> overrides — so theming stays a
        one-attribute switch.
      </p>

      <h2 className="text-2xl font-bold">Dark / light switching</h2>
      <CodeBlock
        lang="html"
        code={`<html data-theme="dark">   <!-- night sky (default; same as no attribute) -->
<html data-theme="light">  <!-- daylight variant -->`}
      />
      <p>
        The attribute works on any container, not just <code>&lt;html&gt;</code> — you can
        theme a single section of a page.
      </p>
      <p>Overriding a token is ordinary CSS:</p>
      <CodeBlock
        lang="css"
        code={`:root {
  --lunar-accent: #f472b6;   /* rebrand the accent */
  --radius-lg: 1rem;         /* rounder everything */
}`}
      />

      <h2 className="text-2xl font-bold">🌖 Lunar-reactive theming</h2>
      <p>
        Lunara&rsquo;s signature trick: call one function and the framework&rsquo;s glow
        intensity tracks the <strong>actual moon phase</strong> — dimmest at new moon,
        brightest at full moon.
      </p>
      <CodeBlock
        lang="js"
        code={`import { initMoonPhase } from "lunara-css/theme";

const phase = initMoonPhase();
// → { name: "waning-gibbous", age: 17.8, illumination: 96 }`}
      />
      <p>
        This sets <code>data-moon-phase=&quot;waning-gibbous&quot;</code> (etc.) on{" "}
        <code>&lt;html&gt;</code>, which drives the <code>--lunar-moonlight</code>{" "}
        multiplier baked into every glow token. Fully opt-in — skip the call and nothing
        changes.
      </p>
      <p>
        <code>--lunar-moonlight</code> also works as a <strong>manual glow dial</strong>:
      </p>
      <CodeBlock
        lang="css"
        code={`:root { --lunar-moonlight: 0; }    /* kill every glow in the framework */
:root { --lunar-moonlight: 1.5; }  /* crank them all */`}
      />

      <h2 className="text-2xl font-bold">🌙 Moon-phase icons</h2>
      <p>
        Astronomically shaped moon glyphs with no images and no SVG — a shadow half plus an
        elliptical terminator, all border-radius and transforms:
      </p>
      <div className="demo-panel">
        {[
          "new",
          "waxing-crescent",
          "first-quarter",
          "waxing-gibbous",
          "full",
          "waning-gibbous",
          "last-quarter",
          "waning-crescent",
        ].map((p) => (
          <div key={p} className="text-center">
            <span className={`moon moon-${p}`} style={{ "--moon-size": "2.5rem" }}></span>
            <div className="text-xs text-muted mt-2">{p}</div>
          </div>
        ))}
      </div>
      <CodeBlock
        lang="html"
        code={`<span class="moon moon-waxing-gibbous"></span>
<span class="moon moon-live"></span> <!-- always shows tonight's actual phase -->`}
      />
      <p>
        Size with <code>--moon-size</code> (default <code>3rem</code>).{" "}
        <code>.moon-live</code> mirrors whatever <code>data-moon-phase</code> an ancestor
        carries — pair it with <code>initMoonPhase()</code> for a live moon widget (the one
        in this site&rsquo;s navbar is exactly that).
      </p>
    </>
  );
}
