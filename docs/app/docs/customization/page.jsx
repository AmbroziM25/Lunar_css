import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Customization" };

const VARS = [
  [".btn", "--btn-bg, --btn-color, --btn-border-color, --btn-hover-bg/-color/-border-color, --btn-glow, --btn-hover-glow, --btn-gradient, --btn-radius, --btn-padding-x/y, --btn-font-size, --btn-opacity"],
  [".card", "--card-bg, --card-border-color, --card-hover-border-color, --card-radius, --card-shadow, --card-padding-x/y, --card-opacity"],
  [".input / .textarea / .select", "--input-bg, --input-color, --input-border-color, --input-focus-border-color, --input-focus-ring-color, --input-radius, --input-opacity"],
  [".badge", "--badge-bg, --badge-color, --badge-border-color, --badge-glow, --badge-radius, --badge-opacity"],
  [".navbar", "--navbar-bg, --navbar-blur, --navbar-border-color, --navbar-link-color/-hover-color/-active-color"],
  [".modal (+ overlay / popover)", "--modal-bg, --modal-border-color, --modal-radius, --modal-max-width, --modal-shadow, --modal-backdrop-color, --modal-backdrop-blur"],
  [".toast", "--toast-bg, --toast-border-color, --toast-accent, --toast-radius, --toast-shadow, --toast-opacity"],
  [".moon", "--moon-size, --moon-light, --moon-dark, --moon-glow"],
  ["[data-tooltip]", "--tooltip-bg, --tooltip-color, --tooltip-radius"],
  [".glow-* / .hover-glow / .pulse-glow", "--glow-color (any color, alpha included), --pulse-speed"],
  [".hover-lift", "--lift-distance"],
  [".glass / .glass-dark", "--glass-bg, --glass-border-color, --glass-blur, --glass-opacity"],
  [".starfield", "--starfield-bg, --star-color"],
  [".gradient-aurora", "--aurora-gradient, --aurora-speed"],
  [".eclipse-border", "--eclipse-color-1/-2/-3, --eclipse-width, --eclipse-speed"],
  [".moonbeam", "--beam-color, --beam-size"],
  [".text-shimmer", "--shimmer-base, --shimmer-glow, --shimmer-accent, --shimmer-speed"],
  [".float", "--float-distance, --float-speed"],
];

export default function Customization() {
  return (
    <>
      <h1 className="text-4xl font-bold">Customization</h1>
      <p className="text-muted text-lg">
        Every component and effect exposes its own custom properties — colors, opacity,
        radius, sizing, speed — with token-based defaults. Variants only reassign those
        variables, so you can restyle any single instance inline or per-scope, without
        writing a selector or fighting specificity.
      </p>

      <h2 className="text-2xl font-bold">Three levels of theming</h2>
      <ul>
        <li>
          <strong>Global tokens</strong> — override <code>--moon-*</code>,{" "}
          <code>--lunar-accent</code>, <code>--radius-*</code>… on <code>:root</code> to
          rebrand the whole framework.
        </li>
        <li>
          <strong>Theme attribute</strong> — <code>data-theme=&quot;light&quot;</code> /{" "}
          <code>&quot;dark&quot;</code> swaps the semantic aliases everywhere at once.
        </li>
        <li>
          <strong>Per-element variables</strong> — this page: set{" "}
          <code>--btn-bg</code>, <code>--card-opacity</code>, <code>--glow-color</code>…
          on a single element (inline, or in a class of your own).
        </li>
      </ul>

      <h2 className="text-2xl font-bold">Live examples</h2>
      <div className="demo-panel">
        <button className="btn btn-primary" style={{ "--btn-bg": "#f472b6", "--btn-hover-bg": "#ec4899" }}>
          Pink primary
        </button>
        <button className="btn btn-primary" style={{ "--btn-bg": "#34d399", "--btn-radius": "9999px" }}>
          Mint pill
        </button>
        <button className="btn btn-primary" style={{ "--btn-opacity": 0.5 }}>
          50% opacity
        </button>
      </div>
      <CodeBlock
        lang="html"
        code={`<button class="btn btn-primary" style="--btn-bg: #f472b6; --btn-hover-bg: #ec4899">Pink primary</button>
<button class="btn btn-primary" style="--btn-bg: #34d399; --btn-radius: 9999px">Mint pill</button>
<button class="btn btn-primary" style="--btn-opacity: 0.5">50% opacity</button>`}
      />

      <div className="demo-panel">
        <div className="card p-4" style={{ "--card-border-color": "#34d399", "--card-radius": "1.5rem" }}>
          Custom border + radius
        </div>
        <div className="card p-4 glow-md" style={{ "--glow-color": "rgb(244 114 182 / 0.5)" }}>
          Pink glow
        </div>
        <div className="card p-4" style={{ "--card-opacity": 0.55 }}>
          Translucent card
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="card" style="--card-border-color: #34d399; --card-radius: 1.5rem">…</div>
<div class="card glow-md" style="--glow-color: rgb(244 114 182 / 0.5)">…</div>
<div class="card" style="--card-opacity: 0.55">…</div>`}
      />

      <div className="demo-panel">
        <span className="moon moon-full" style={{ "--moon-size": "3rem", "--moon-light": "#ffc864" }}></span>
        <span className="moon moon-waxing-crescent" style={{ "--moon-size": "3rem", "--moon-light": "#f472b6", "--moon-dark": "#3f1128" }}></span>
        <span className="text-shimmer text-2xl font-bold" style={{ "--shimmer-accent": "#34d399", "--shimmer-speed": "2s" }}>
          Fast green shimmer
        </span>
      </div>
      <CodeBlock
        lang="html"
        code={`<span class="moon moon-full" style="--moon-light: #ffc864"></span>
<span class="moon moon-waxing-crescent" style="--moon-light: #f472b6; --moon-dark: #3f1128"></span>
<span class="text-shimmer" style="--shimmer-accent: #34d399; --shimmer-speed: 2s">Fast green shimmer</span>`}
      />

      <h2 className="text-2xl font-bold">Variable reference</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Component / effect</th>
            <th>Custom properties</th>
          </tr>
        </thead>
        <tbody>
          {VARS.map(([comp, vars]) => (
            <tr key={comp}>
              <td><code>{comp}</code></td>
              <td>{vars.split(", ").map((v, i) => (
                <span key={v}>{i > 0 && " "}<code>{v}</code></span>
              ))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-2xl font-bold">Scoped and Tailwind usage</h2>
      <p>
        The variables cascade, so you can set them on any ancestor — a section, a page, a
        class of your own — and every instance inside picks them up:
      </p>
      <CodeBlock
        lang="css"
        code={`/* brand a whole section without touching Lunara's classes */
.checkout-flow {
  --btn-bg: #059669;
  --btn-hover-bg: #047857;
  --card-radius: 1.25rem;
}`}
      />
      <p>In Tailwind builds the same hooks work via arbitrary properties:</p>
      <CodeBlock
        lang="html"
        code={`<button class="btn btn-primary [--btn-bg:#f472b6] hover:[--btn-hover-bg:#ec4899]">Pink</button>`}
      />
      <p>
        Global glow intensity remains a single dial: <code>--lunar-moonlight</code> on{" "}
        <code>:root</code> (0 kills every glow, 1.5 cranks them), or let{" "}
        <code>initMoonPhase()</code> drive it from the real lunar calendar. For one
        element&rsquo;s glow, use <code>--glow-color</code> with whatever alpha you want.
      </p>
    </>
  );
}
