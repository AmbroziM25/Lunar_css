import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Tailwind integration" };

export default function Tailwind() {
  return (
    <>
      <h1 className="text-4xl font-bold">Tailwind integration</h1>
      <p className="text-muted text-lg">
        Lunara gives Tailwind projects the <strong>whole framework</strong> — not just the
        color palette, but every prebuilt component and effect utility, registered as
        native Tailwind classes. Both major Tailwind versions are first-class.
      </p>

      <CodeBlock lang="bash" code={`npm install lunara-css tailwindcss`} />

      <h2 className="text-2xl font-bold">Tailwind v4 (CSS-first)</h2>
      <p>One import next to Tailwind&rsquo;s own:</p>
      <CodeBlock
        lang="css"
        code={`/* app.css */
@import "tailwindcss";
@import "lunara-css/tailwind";`}
      />
      <p>That single line does three things:</p>
      <ul>
        <li>
          Registers the design tokens via <code>@theme</code>, so native v4 utilities pick
          them up — <code>bg-moon-900</code>, <code>text-tide</code>,{" "}
          <code>shadow-glow-lg</code>, <code>rounded-2xl</code>,{" "}
          <code>animate-float</code>, …
        </li>
        <li>
          Loads every component and effect through the components plugin
          (<code>@plugin</code> under the hood) — <code>btn btn-primary</code>,{" "}
          <code>card</code>, <code>modal</code>, <code>glow-md</code>,{" "}
          <code>starfield</code>, <code>scroll-reveal-up</code>, …
        </li>
        <li>
          Re-points Tailwind&rsquo;s <code>dark:</code> variant at Lunara&rsquo;s{" "}
          <code>data-theme</code> attribute via <code>@custom-variant</code>.
        </li>
      </ul>

      <h2 className="text-2xl font-bold">Tailwind v3 (JS config)</h2>
      <CodeBlock
        lang="js"
        code={`// tailwind.config.js
module.exports = {
  presets: [require("lunara-css/tailwind-preset")],
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
};`}
      />

      <h2 className="text-2xl font-bold">What you get (both versions)</h2>
      <ul>
        <li>
          <strong>Design tokens</strong> as theme values — <code>bg-moon-900</code>,{" "}
          <code>text-tide</code>, <code>shadow-glow-lg</code>, <code>rounded-2xl</code>,{" "}
          <code>animate-float</code>, …
        </li>
        <li>
          <strong>Components</strong> as Tailwind component classes —{" "}
          <code>btn btn-primary</code>, <code>card</code>, <code>badge-glow</code>,{" "}
          <code>modal</code> (including the zero-JS popover styling), <code>toast</code>,{" "}
          <code>navbar</code>, <code>input</code>, the <code>.moon</code> phase icons, …
        </li>
        <li>
          <strong>Effect utilities</strong> as Tailwind utilities — <code>glow-md</code>,{" "}
          <code>glass</code>, <code>starfield</code>, <code>gradient-aurora</code>,{" "}
          <code>eclipse-border</code>, <code>moonbeam</code>, <code>text-shimmer</code>,{" "}
          <code>scroll-reveal-up</code>, <code>scroll-progress</code>, …
        </li>
        <li>
          <strong>Theme + moon-phase blocks</strong> in base —{" "}
          <code>data-theme=&quot;light&quot;</code> and <code>data-moon-phase</code>{" "}
          reactivity work exactly like the plain-CSS build.
        </li>
      </ul>
      <p>
        Because they&rsquo;re registered through Tailwind&rsquo;s plugin API, the classes
        behave like native Tailwind: unused components are <strong>tree-shaken</strong> by
        content scanning, and <strong>variants work</strong> —{" "}
        <code>hover:glow-lg</code>, <code>md:scroll-reveal-up</code>,{" "}
        <code>focus:glow-violet</code> all do what you&rsquo;d expect. No separate{" "}
        <code>&lt;link&gt;</code> tag, no second stylesheet: your one Tailwind pipeline
        emits everything.
      </p>
      <p>
        Under the hood, Lunara&rsquo;s build pre-parses its own built CSS into a class map
        (<code>dist/lunar.tailwind.json</code>) that the plugin feeds straight to Tailwind
        — so the Tailwind classes can never drift from the plain-CSS distribution, and the
        plugin has zero runtime dependencies (no PostCSS required, which is what lets it
        run under v4&rsquo;s plugin loader too).
      </p>

      <h2 className="text-2xl font-bold">Components only, no theme</h2>
      <p>
        Want Lunara&rsquo;s components on top of your own Tailwind theme? Register just
        the plugin:
      </p>
      <CodeBlock
        lang="js"
        code={`// tailwind.config.js (v3)
module.exports = {
  plugins: [require("lunara-css/tailwind-plugin")],
};`}
      />
      <CodeBlock
        lang="css"
        code={`/* app.css (v4) */
@import "tailwindcss";
@plugin "lunara-css/tailwind-plugin";`}
      />

      <h2 className="text-2xl font-bold">Dark mode</h2>
      <p>
        Both versions point Tailwind&rsquo;s own <code>dark:</code> variant convention at
        the same <code>data-theme</code> attribute Lunara uses to toggle themes — the v3
        preset via <code>darkMode: [&apos;selector&apos;,
        &apos;[data-theme=&quot;dark&quot;]&apos;]</code>, the v4 entry via{" "}
        <code>@custom-variant dark</code>. Set <code>data-theme=&quot;dark&quot;</code> on{" "}
        <code>&lt;html&gt;</code> and both Lunara&rsquo;s dark tokens and your{" "}
        <code>dark:</code> utilities activate together;{" "}
        <code>data-theme=&quot;light&quot;</code> gives daylight mode.
      </p>
      <p>
        If you only need the plain CSS utilities/components (no Tailwind build), skip this
        page entirely and just link <code>dist/lunar.css</code>.
      </p>
    </>
  );
}
