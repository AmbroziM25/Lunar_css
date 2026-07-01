import Link from "next/link";
import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Installation" };

export default function Installation() {
  return (
    <>
      <h1 className="text-4xl font-bold">Installation</h1>
      <p className="text-muted text-lg">
        Lunara is plain CSS — there is no required build step, CLI, or config file.
        Pick whichever delivery method fits your project.
      </p>

      <h2 className="text-2xl font-bold">CDN (no build step)</h2>
      <p>The fastest way to try Lunara. Add one line to your HTML:</p>
      <CodeBlock
        lang="html"
        code={`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lunara-css/dist/lunar.min.css" />`}
      />

      <h2 className="text-2xl font-bold">npm</h2>
      <CodeBlock lang="bash" code={`npm install lunara-css`} />
      <p>Then import it from CSS:</p>
      <CodeBlock
        lang="css"
        code={`/* import the full framework */
@import "lunara-css/dist/lunar.css";`}
      />
      <p>…or from a bundler entry point (Vite, webpack, Next.js, etc.):</p>
      <CodeBlock lang="js" code={`import "lunara-css/dist/lunar.css";`} />
      <p>
        That&rsquo;s it — no PostCSS, no build config.{" "}
        <code>dist/lunar.css</code> is the readable build;{" "}
        <code>dist/lunar.min.css</code> is the minified production build.
      </p>

      <h2 className="text-2xl font-bold">Other package managers</h2>
      <CodeBlock
        lang="bash"
        code={`pnpm add lunara-css
yarn add lunara-css
bun add lunara-css`}
      />

      <h2 className="text-2xl font-bold">Package exports</h2>
      <p>Everything the package exposes:</p>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Import path</th>
            <th>What it is</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>lunara-css</code></td>
            <td>The full framework CSS (same as <code>dist/lunar.css</code>)</td>
          </tr>
          <tr>
            <td><code>lunara-css/min</code></td>
            <td>Minified production build</td>
          </tr>
          <tr>
            <td><code>lunara-css/theme</code></td>
            <td>Optional ESM helpers: theme toggle, moon phase, moonbeam</td>
          </tr>
          <tr>
            <td><code>lunara-css/tailwind-preset</code></td>
            <td>Tailwind preset — full theme + components plugin</td>
          </tr>
          <tr>
            <td><code>lunara-css/tailwind-plugin</code></td>
            <td>Components/effects only, on top of your own Tailwind theme</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-2xl font-bold">Building from source</h2>
      <p>
        The repo ships modular sources in <code>src/</code>. To rebuild{" "}
        <code>dist/</code>:
      </p>
      <CodeBlock lang="bash" code={`npm run build`} />
      <p>
        This runs a small dependency-free Node script that concatenates{" "}
        <code>src/*.css</code> in cascade order (base → themes → effects → components →
        utilities, so utilities always win) and writes the minified build. No bundler or
        PostCSS required.
      </p>

      <div className="card glass-dark p-6 mt-8 flex items-center justify-between flex-wrap gap-4">
        <span className="font-semibold">Installed? Write your first component.</span>
        <Link href="/docs/quick-start" className="btn btn-primary hover-lift">
          Quick start →
        </Link>
      </div>
    </>
  );
}
