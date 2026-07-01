import Link from "next/link";
import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Quick start" };

export default function QuickStart() {
  return (
    <>
      <h1 className="text-4xl font-bold">Quick start</h1>
      <p className="text-muted text-lg">
        A complete page in a dozen lines. Copy, save as <code>index.html</code>, open in
        a browser.
      </p>

      <CodeBlock
        lang="html"
        code={`<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lunara-css/dist/lunar.min.css" />
</head>
<body>
  <div class="card glow-sm hover-lift p-6 max-w-sm">
    <h2 class="text-shimmer">Welcome</h2>
    <p class="text-muted mt-2">Built with Lunara CSS.</p>
    <button class="btn btn-primary mt-4">Get started</button>
  </div>
</body>
</html>`}
      />

      <h2 className="text-2xl font-bold">Live result</h2>
      <div className="demo-panel">
        <div className="card glow-sm hover-lift p-6 max-w-sm">
          <h2 className="text-shimmer">Welcome</h2>
          <p className="text-muted mt-2">Built with Lunara CSS.</p>
          <button className="btn btn-primary mt-4">Get started</button>
        </div>
      </div>

      <h2 className="text-2xl font-bold">How classes compose</h2>
      <p>Three layers, all mixable on the same element:</p>
      <ul>
        <li>
          <strong>Components</strong> — <code>card</code>, <code>btn btn-primary</code>,{" "}
          <code>badge</code> — give you the structural styling.
        </li>
        <li>
          <strong>Effects</strong> — <code>glow-sm</code>, <code>hover-lift</code>,{" "}
          <code>text-shimmer</code> — one class per effect, no custom CSS.
        </li>
        <li>
          <strong>Utilities</strong> — <code>p-6</code>, <code>mt-2</code>,{" "}
          <code>max-w-sm</code>, <code>flex</code>, <code>gap-4</code> — Tailwind-shaped
          atomic classes for layout and spacing.
        </li>
      </ul>

      <h2 className="text-2xl font-bold">Switching themes</h2>
      <p>
        Lunara is dark-mode-first. Set <code>data-theme=&quot;light&quot;</code> on{" "}
        <code>&lt;html&gt;</code> (or any container) for the light &ldquo;daylight&rdquo;
        variant; no attribute or <code>data-theme=&quot;dark&quot;</code> gives the default
        night-sky theme. Try the ☾ / ☀ button in this site&rsquo;s navbar.
      </p>
      <CodeBlock
        lang="html"
        code={`<html data-theme="light">  <!-- daylight -->
<html data-theme="dark">   <!-- night sky (default) -->`}
      />
      <p>
        A tiny optional helper handles toggling + <code>localStorage</code> persistence —
        see the <Link href="/docs/javascript">JavaScript API</Link>.
      </p>

      <h2 className="text-2xl font-bold">Next steps</h2>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <Link href="/docs/components" className="card p-4 hover-lift no-underline">
          <span className="font-semibold">Components →</span>
          <p className="text-muted text-sm mt-2">Buttons, cards, forms, modals, toasts…</p>
        </Link>
        <Link href="/docs/effects" className="card p-4 hover-lift no-underline">
          <span className="font-semibold">Effects →</span>
          <p className="text-muted text-sm mt-2">Glow, glass, aurora, starfield, shimmer…</p>
        </Link>
        <Link href="/docs/tailwind" className="card p-4 hover-lift no-underline">
          <span className="font-semibold">Tailwind →</span>
          <p className="text-muted text-sm mt-2">One preset line, the whole framework.</p>
        </Link>
      </div>
    </>
  );
}
