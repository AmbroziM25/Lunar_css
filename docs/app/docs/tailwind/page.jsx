import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Tailwind integration" };

export default function Tailwind() {
  return (
    <>
      <h1 className="text-4xl font-bold">Tailwind integration</h1>
      <p className="text-muted text-lg">
        Lunara ships a preset that gives Tailwind projects the <strong>whole
        framework</strong> — not just the color palette, but every prebuilt component and
        effect utility, registered as native Tailwind classes.
      </p>

      <h2 className="text-2xl font-bold">Setup</h2>
      <CodeBlock lang="bash" code={`npm install lunara-css tailwindcss`} />
      <CodeBlock
        lang="js"
        code={`// tailwind.config.js
module.exports = {
  presets: [require("lunara-css/tailwind-preset")],
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
};`}
      />

      <h2 className="text-2xl font-bold">What one preset line gets you</h2>
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
        Under the hood the plugin parses Lunara&rsquo;s own built CSS at build time, so the
        Tailwind classes can never drift from the plain-CSS distribution.
      </p>

      <h2 className="text-2xl font-bold">Components only, no theme</h2>
      <p>
        Want Lunara&rsquo;s components on top of your own Tailwind theme? Skip the preset
        and register just the plugin:
      </p>
      <CodeBlock
        lang="js"
        code={`// tailwind.config.js
module.exports = {
  plugins: [require("lunara-css/tailwind-plugin")],
};`}
      />

      <h2 className="text-2xl font-bold">Tailwind v4</h2>
      <p>
        The preset/plugin target Tailwind v3&rsquo;s JS config. On v4&rsquo;s CSS-first
        setup, either load the config through <code>@config</code>, or simply import the
        built CSS next to your Tailwind import — the class names are Tailwind-shaped either
        way:
      </p>
      <CodeBlock
        lang="css"
        code={`/* option A: keep the JS config */
@config "./tailwind.config.js";

/* option B: plain CSS build alongside Tailwind */
@import "tailwindcss";
@import "lunara-css/dist/lunar.css";`}
      />

      <h2 className="text-2xl font-bold">Dark mode</h2>
      <p>
        The preset sets <code>darkMode: [&apos;selector&apos;,
        &apos;[data-theme=&quot;dark&quot;]&apos;]</code>, pointing Tailwind&rsquo;s own{" "}
        <code>dark:</code> variant at the same <code>data-theme</code> attribute Lunara
        uses. Set <code>data-theme=&quot;dark&quot;</code> on <code>&lt;html&gt;</code> and
        both Lunara&rsquo;s dark tokens and your <code>dark:</code> utilities activate
        together; <code>data-theme=&quot;light&quot;</code> gives daylight mode.
      </p>
      <p>
        If you only need the plain CSS utilities/components (no Tailwind build), skip this
        page entirely and just link <code>dist/lunar.css</code>.
      </p>
    </>
  );
}
