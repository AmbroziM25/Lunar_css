import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "JavaScript API" };

export default function JavaScriptApi() {
  return (
    <>
      <h1 className="text-4xl font-bold">JavaScript API</h1>
      <p className="text-muted text-lg">
        Lunara&rsquo;s CSS needs no JavaScript at all. The optional{" "}
        <code>lunara-css/theme</code> module is a tiny, dependency-free ESM helper for the
        three things that are nicer with a few lines of JS: theme persistence, lunar
        phase, and the moonbeam cursor glow.
      </p>
      <CodeBlock
        lang="js"
        code={`import {
  getTheme, setTheme, toggleTheme, initTheme,
  getMoonPhase, initMoonPhase,
  initMoonbeam,
} from "lunara-css/theme";`}
      />

      <h2 className="text-2xl font-bold">Theme helpers</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Function</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>getTheme()</code></td>
            <td>
              Returns the current theme from <code>&lt;html data-theme&gt;</code>{" "}
              (<code>&quot;dark&quot;</code> if unset).
            </td>
          </tr>
          <tr>
            <td><code>setTheme(theme)</code></td>
            <td>
              Sets <code>data-theme</code> on <code>&lt;html&gt;</code> and persists to{" "}
              <code>localStorage</code> under <code>&quot;lunar-theme&quot;</code>.
            </td>
          </tr>
          <tr>
            <td><code>toggleTheme()</code></td>
            <td>Flips dark ↔ light, persists, and returns the new theme name.</td>
          </tr>
          <tr>
            <td><code>initTheme()</code></td>
            <td>
              Call once on mount to restore a previously saved theme. In SSR frameworks
              prefer the inline anti-flash script (see the Next.js guide) since this only
              runs after hydration.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="js"
        code={`import { initTheme, toggleTheme } from "lunara-css/theme";

initTheme(); // restore saved preference
document.querySelector("#toggle").addEventListener("click", toggleTheme);`}
      />

      <h2 className="text-2xl font-bold">Moon phase</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Function</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>getMoonPhase(date?)</code></td>
            <td>
              Pure astronomy, no DOM side effects. Returns{" "}
              <code>{`{ name, age, illumination }`}</code> — the phase name (kebab-case,
              one of the eight phases), days since the last new moon (0–29.53), and lit
              percentage (0–100).
            </td>
          </tr>
          <tr>
            <td><code>initMoonPhase(date?)</code></td>
            <td>
              Sets <code>data-moon-phase</code> on <code>&lt;html&gt;</code> from the real
              lunar calendar, driving <code>--lunar-moonlight</code> glow intensity and
              any <code>.moon-live</code> icons. Returns the phase object.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="js"
        code={`import { getMoonPhase, initMoonPhase } from "lunara-css/theme";

const phase = initMoonPhase();
// → { name: "waning-gibbous", age: 17.8, illumination: 96 }

// or just the astronomy, for any date:
getMoonPhase(new Date("2026-12-25"));`}
      />

      <h2 className="text-2xl font-bold">Moonbeam</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Function</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>initMoonbeam(root?)</code></td>
            <td>
              Enables cursor tracking for every <code>.moonbeam</code> element via one
              delegated <code>pointermove</code> listener — elements added later just
              work. Returns a cleanup function that removes the listener. Without the JS,{" "}
              <code>.moonbeam</code> gracefully degrades to a centered glow on hover.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="jsx"
        code={`import { useEffect } from "react";
import { initMoonbeam } from "lunara-css/theme";

function App() {
  useEffect(() => initMoonbeam(), []); // returns cleanup — perfect for useEffect
  return <div className="card moonbeam">…</div>;
}`}
      />

      <h2 className="text-2xl font-bold">CDN usage</h2>
      <p>The same module works straight from a CDN with no bundler:</p>
      <CodeBlock
        lang="html"
        code={`<script type="module">
  import { initTheme, initMoonPhase, initMoonbeam }
    from "https://cdn.jsdelivr.net/npm/lunara-css/theme.mjs";
  initTheme();
  initMoonPhase();
  initMoonbeam();
</script>`}
      />
    </>
  );
}
