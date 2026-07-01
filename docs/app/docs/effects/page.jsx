import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Effects" };

const EFFECTS = [
  ["glow-sm / glow-md / glow-lg", "Soft moonlight box-shadow glow, increasing intensity"],
  ["glow-violet", "Violet-tinted glow variant"],
  ["hover-lift", "Subtle translateY + shadow bloom on hover/focus"],
  ["hover-glow", "Glow intensifies on hover/focus"],
  ["text-shimmer", "Animated gradient sweep across text"],
  ["float", "Gentle infinite floating (moon-drift) animation"],
  ["pulse-glow", "Breathing glow animation"],
  ["glass", "Frosted glassmorphism panel (light)"],
  ["glass-dark", "Frosted glassmorphism panel (dark)"],
  ["starfield", "Animated twinkling star background"],
  ["gradient-aurora", "Animated shifting aurora/nebula gradient background"],
  ["eclipse-border", "Animated gradient border ring"],
  ["fade-in / slide-up / scale-in", "One-line entrance animations"],
  ["delay-1 … delay-4", "Stagger entrance animations (100ms–400ms)"],
  ["moonbeam", "Cursor-tracking moonlight glow (centered hover glow without JS)"],
];

export default function Effects() {
  return (
    <>
      <h1 className="text-4xl font-bold">Effects</h1>
      <p className="text-muted text-lg">
        Every effect is a single class — no custom CSS, no hand-written keyframes or
        box-shadow stacks. Combine freely with components or plain elements. All
        animations respect <code>prefers-reduced-motion: reduce</code>.
      </p>

      <h2 className="text-2xl font-bold">Glow</h2>
      <div className="demo-panel">
        <div className="card p-4 glow-sm">glow-sm</div>
        <div className="card p-4 glow-md">glow-md</div>
        <div className="card p-4 glow-lg">glow-lg</div>
        <div className="card p-4 glow-violet">glow-violet</div>
        <div className="card p-4 pulse-glow">pulse-glow</div>
      </div>
      <CodeBlock lang="html" code={`<div class="card glow-md">…</div>`} />

      <h2 className="text-2xl font-bold">Hover</h2>
      <div className="demo-panel">
        <div className="card p-4 hover-lift">hover-lift</div>
        <div className="card p-4 hover-glow">hover-glow</div>
        <div className="card p-4 moonbeam">moonbeam (move your cursor)</div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="card hover-lift">…</div>
<div class="card moonbeam">…</div> <!-- pair with initMoonbeam() for cursor tracking -->`}
      />

      <h2 className="text-2xl font-bold">Text &amp; motion</h2>
      <div className="demo-panel">
        <span className="text-shimmer text-2xl font-bold">text-shimmer</span>
        <span className="moon moon-full float" style={{ "--moon-size": "2.5rem" }} title="float"></span>
      </div>

      <h2 className="text-2xl font-bold">Surfaces</h2>
      <div className="demo-panel gradient-aurora rounded-lg">
        <div className="glass p-4 rounded-lg">glass</div>
        <div className="glass-dark p-4 rounded-lg">glass-dark</div>
        <div className="card p-4 eclipse-border">eclipse-border</div>
      </div>
      <div className="starfield rounded-lg p-10 text-center my-4 border border-moon-800">
        <span className="text-glow font-semibold">starfield</span>
        <p className="text-muted text-sm mt-2">animated twinkling star background</p>
      </div>
      <CodeBlock
        lang="html"
        code={`<section class="starfield">…</section>
<section class="gradient-aurora">…</section>
<div class="glass-dark p-4">frosted panel</div>
<div class="card eclipse-border">animated gradient border</div>`}
      />

      <h2 className="text-2xl font-bold">Entrance animations</h2>
      <div className="demo-panel">
        <div className="card p-4 fade-in">fade-in</div>
        <div className="card p-4 slide-up delay-1">slide-up delay-1</div>
        <div className="card p-4 scale-in delay-2">scale-in delay-2</div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="card fade-in">…</div>
<div class="card slide-up delay-1">…</div>
<div class="card scale-in delay-2">…</div>`}
      />
      <p>
        <strong>Note:</strong> <code>slide-up</code> and <code>scale-in</code> animate{" "}
        <code>transform</code>, and any element with a non-<code>none</code> transform
        becomes the containing block for <code>position: fixed</code> descendants. If you
        need a fixed element (a modal, a toast region) inside a section using these
        entrance classes, keep it outside that section — e.g. as a sibling near the end of{" "}
        <code>&lt;body&gt;</code>.
      </p>

      <h2 className="text-2xl font-bold">Reference</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          {EFFECTS.map(([cls, desc]) => (
            <tr key={cls}>
              <td><code>.{cls}</code></td>
              <td>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Scroll-driven classes (<code>scroll-reveal</code>, <code>scroll-parallax</code>,{" "}
        <code>scroll-progress</code>…) have their own page: see{" "}
        <a href="/docs/motion">Scroll-driven motion</a>.
      </p>
    </>
  );
}
