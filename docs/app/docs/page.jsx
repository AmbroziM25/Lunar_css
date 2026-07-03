import Link from "next/link";

export const metadata = { title: "Introduction" };

export default function Introduction() {
  return (
    <>
      <h1 className="text-4xl font-bold">Introduction</h1>
      <p className="text-muted text-lg">
        Lunara CSS is a lightweight, utility-first CSS framework with a dark
        &ldquo;night sky&rdquo; aesthetic — deep space blacks and navys, soft moonlight
        whites, and subtle glow and gradient accents in silver, indigo, and violet.
      </p>

      <h2 className="text-2xl font-bold">Why Lunara?</h2>
      <ul>
        <li>
          <strong>Pure CSS, zero build step.</strong> Drop in a{" "}
          <code>&lt;link&gt;</code> tag and go — no PostCSS, no config.
        </li>
        <li>
          <strong>Utility-first, Tailwind-like class names</strong>{" "}
          (<code>bg-moon-900</code>, <code>text-glow</code>, <code>p-4</code>,{" "}
          <code>rounded-lg</code>) with five responsive breakpoints
          (<code>sm:</code>, <code>md:</code>, <code>lg:</code>, <code>xl:</code>,{" "}
          <code>2xl:</code>) — muscle memory carries over either direction.
        </li>
        <li>
          <strong>Tailwind-native.</strong> One preset line registers the full palette
          and every component/effect as real Tailwind classes — tree-shaken and
          variant-aware (<code>hover:glow-lg</code>).
        </li>
        <li>
          <strong>One-line effect utilities.</strong> Glow, glass, aurora, shimmer,
          starfields, entrance animations — no hand-written keyframes.
        </li>
        <li>
          <strong>Prebuilt components.</strong> Buttons, cards, inputs, badges, navbar,
          modal, toast, tooltip — all themeable via CSS variables.
        </li>
        <li>
          <strong>Dark-mode-first</strong>, with a light &ldquo;daylight&rdquo; variant
          toggled via <code>data-theme</code>.
        </li>
        <li>
          <strong>Works with any framework</strong> — plain HTML, React, Next.js, Vue,
          Angular, Svelte, Astro… it&rsquo;s just CSS classes.
        </li>
      </ul>

      <h2 className="text-2xl font-bold">Signature features</h2>
      <p>Things no other framework ships:</p>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="card p-4 hover-lift">
          <h3 className="font-semibold">🌖 Lunar-reactive theming</h3>
          <p className="text-muted text-sm mt-2">
            Call one function and glow intensity tracks the <em>actual</em> moon phase —
            dimmest at new moon, brightest at full moon. This very site uses it.
          </p>
        </div>
        <div className="card p-4 hover-lift">
          <h3 className="font-semibold">🌙 Pure-CSS moon icons</h3>
          <p className="text-muted text-sm mt-2">
            Astronomically shaped moon glyphs with no images and no SVG — just
            border-radius and transforms. <code>.moon-live</code> shows tonight&rsquo;s phase.
          </p>
        </div>
        <div className="card p-4 hover-lift">
          <h3 className="font-semibold">📜 Scroll-driven motion, zero JS</h3>
          <p className="text-muted text-sm mt-2">
            Reveal-on-scroll, parallax, and a reading progress bar powered by CSS{" "}
            <code>animation-timeline</code> — scrubbed by the browser, off the main thread.
          </p>
        </div>
        <div className="card p-4 hover-lift">
          <h3 className="font-semibold">🪟 Zero-JS modal</h3>
          <p className="text-muted text-sm mt-2">
            Lunara styles the native Popover API, so two HTML attributes give you a fully
            animated modal with backdrop blur, Esc, and light-dismiss.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold">Browser support</h2>
      <p>
        Lunara uses modern, broadly-supported CSS: cascade layers,{" "}
        <code>backdrop-filter</code>, and custom properties. It targets current Chrome,
        Edge, Firefox, and Safari. The signature features are progressive enhancements:
      </p>
      <ul>
        <li>
          <strong>Scroll-driven motion</strong> (<code>animation-timeline</code>) —
          Chrome/Edge 115+, Safari 26+. Wrapped in <code>@supports</code>; other browsers
          simply show content normally.
        </li>
        <li>
          <strong>Zero-JS modal</strong> (Popover API + <code>@starting-style</code>) —
          Chrome/Edge 125+, Safari 17.4+, Firefox 129+ for the full animated experience.
          Browsers without the Popover API hide the modal instead of leaking its content
          inline.
        </li>
        <li>
          <strong>Moon icons and lunar theming</strong> — plain CSS + a tiny JS helper;
          works everywhere.
        </li>
      </ul>
      <p>
        Prefixed fallbacks ship for <code>backdrop-filter</code>, <code>mask</code>, and{" "}
        <code>user-select</code>, and viewport heights use <code>dvh</code> with a{" "}
        <code>vh</code> fallback — nothing in the core needs a feature below ~95% support
        without a graceful fallback.
      </p>

      <div className="card glass-dark p-6 mt-8 flex items-center justify-between flex-wrap gap-4">
        <span className="font-semibold">Ready to install?</span>
        <Link href="/docs/installation" className="btn btn-primary hover-lift">
          Installation →
        </Link>
      </div>
    </>
  );
}
