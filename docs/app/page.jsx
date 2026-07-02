import Link from "next/link";
import CodeBlock from "../components/CodeBlock";

const PHASES = [
  "new",
  "waxing-crescent",
  "first-quarter",
  "waxing-gibbous",
  "full",
  "waning-gibbous",
  "last-quarter",
  "waning-crescent",
];

const FEATURES = [
  {
    title: "Zero build step",
    body: "Pure CSS. One <link> tag or one import and you're done — no PostCSS, no config, no pipeline.",
  },
  {
    title: "Utility-first",
    body: "Tailwind-shaped class names — bg-moon-900, p-4, rounded-lg — so your muscle memory carries over in both directions.",
  },
  {
    title: "Tailwind-native preset",
    body: "One preset line registers the whole framework as real Tailwind classes: tree-shaken, variant-aware, emitted by your own build.",
  },
  {
    title: "Lunar-reactive theming",
    body: "Opt in and the framework's glow intensity tracks the actual moon phase. Dimmest at new moon, brightest at full. Nobody else ships this.",
  },
  {
    title: "Scroll motion, zero JS",
    body: "Reveal-on-scroll, parallax, and a reading progress bar via CSS animation-timeline — no IntersectionObserver, no listeners.",
  },
  {
    title: "Zero-JS modal",
    body: "Lunara styles the native Popover API: two HTML attributes give you a fully animated modal with backdrop blur, Esc, and light-dismiss.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero starfield">
        <p className="badge badge-glow fade-in">v 0.4.0 · MIT · zero dependencies</p>
        <h1 className="hero-title mt-4 slide-up">
          The <span className="text-shimmer">night-sky</span>
          <br />
          CSS framework
        </h1>
        <p className="text-muted text-lg mt-4 mx-auto max-w-xl slide-up delay-1">
          Deep space blacks, soft moonlight whites, and one-line glow, glass, and
          aurora effects. Utility-first, dark-mode-first, and just CSS.
        </p>
        <div className="flex justify-center gap-4 mt-8 slide-up delay-2">
          <Link href="/docs/installation" className="btn btn-primary btn-lg hover-lift">
            Get started
          </Link>
          <Link href="/docs/components" className="btn btn-outline btn-lg hover-lift">
            Browse components
          </Link>
        </div>
        <div className="hero-moons fade-in delay-3" aria-label="All eight moon phases, drawn in pure CSS">
          {PHASES.map((p) => (
            <span
              key={p}
              className={`moon moon-${p}`}
              style={{ "--moon-size": "2.25rem" }}
              title={p.replace(/-/g, " ")}
            ></span>
          ))}
        </div>
        <p className="text-muted text-sm mt-4 fade-in delay-4">
          ↑ no images, no SVG — border-radius and transforms
        </p>
      </section>

      <section className="container py-10">
        <div className="max-w-2xl m-auto">
          <CodeBlock
            lang="bash"
            code={`npm install lunara-css`}
          />
        </div>
        <div className="grid grid-cols-3 gap-6 mt-8">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card moonbeam hover-lift scroll-reveal-up p-6">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="text-muted text-sm mt-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-10">
        <div className="card glass-dark glow-sm p-6 scroll-reveal-scale">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">Try the zero-JS modal</h2>
              <p className="text-muted mt-2 max-w-lg">
                This button and dialog are plain HTML — <code className="inline-code">popovertarget</code>{" "}
                plus <code className="inline-code">popover</code>. No script on this page opens or closes it.
              </p>
            </div>
            <button className="btn btn-glow btn-lg" popoverTarget="landing-modal">
              Open modal
            </button>
          </div>
        </div>
      </section>

      <div id="landing-modal" popover="auto" className="modal">
        <div className="modal-header">Zero JavaScript 🌙</div>
        <div className="modal-body">
          Backdrop blur, entrance animation, <kbd>Esc</kbd> to dismiss, click-outside
          light-dismiss — all from the native Popover API, styled by Lunara.
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" popoverTarget="landing-modal" popoverTargetAction="hide">
            Close
          </button>
        </div>
      </div>

      <section className="container py-10 text-center">
        <h2 className="text-3xl font-bold scroll-reveal">Read the docs</h2>
        <p className="text-muted mt-2 scroll-reveal">
          Install commands, every component, every effect, Tailwind integration, and the JS API.
        </p>
        <Link href="/docs" className="btn btn-primary btn-lg hover-glow mt-6 inline-flex">
          Open documentation →
        </Link>
      </section>
    </main>
  );
}
