import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Scroll-driven motion" };

export default function Motion() {
  return (
    <>
      <h1 className="text-4xl font-bold">Scroll-driven motion</h1>
      <p className="text-muted text-lg">
        Powered by CSS <code>animation-timeline</code> — no IntersectionObserver, no
        scroll listeners, no library. The browser scrubs the animation directly from
        scroll position, off the main thread. Zero JavaScript.
      </p>

      <h2 className="text-2xl font-bold">Classes</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>.scroll-reveal</code></td>
            <td>Fades in as the element scrolls into view (scrubs back out if you scroll up)</td>
          </tr>
          <tr>
            <td><code>.scroll-reveal-up</code></td>
            <td>Fade + rise on scroll into view</td>
          </tr>
          <tr>
            <td><code>.scroll-reveal-scale</code></td>
            <td>Fade + scale on scroll into view</td>
          </tr>
          <tr>
            <td><code>.scroll-reveal-blur</code></td>
            <td>Fade + un-blur on scroll into view</td>
          </tr>
          <tr>
            <td><code>.scroll-parallax</code></td>
            <td>Gentle parallax drift across the viewport</td>
          </tr>
          <tr>
            <td><code>.scroll-progress</code></td>
            <td>Reading progress bar — one <code>&lt;div&gt;</code>, done</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-2xl font-bold">Live demo</h2>
      <p>
        Scroll this page up and down — the cards below scrub in and out with scroll
        position (Chrome/Edge 115+, Safari 26+):
      </p>
      <div className="grid grid-cols-2 gap-4 my-6">
        <div className="card p-6 scroll-reveal">scroll-reveal</div>
        <div className="card p-6 scroll-reveal-up">scroll-reveal-up</div>
        <div className="card p-6 scroll-reveal-scale">scroll-reveal-scale</div>
        <div className="card p-6 scroll-reveal-blur">scroll-reveal-blur</div>
      </div>
      <p>
        The thin bar at the very top of this site is{" "}
        <code>.scroll-progress</code> — a single element:
      </p>
      <CodeBlock
        lang="html"
        code={`<div class="scroll-progress"></div>  <!-- fixed reading progress bar -->

<section class="scroll-reveal-up">Fades and rises into view</section>
<img class="scroll-parallax" src="moon.jpg" alt="" />`}
      />

      <h2 className="text-2xl font-bold">Progressive enhancement</h2>
      <p>
        Everything is wrapped in <code>@supports (animation-timeline: view())</code>, so
        browsers without support simply show the content normally — nothing is ever
        hidden. No polyfill needed, no fallback code to write. All motion also respects{" "}
        <code>prefers-reduced-motion: reduce</code>.
      </p>
    </>
  );
}
