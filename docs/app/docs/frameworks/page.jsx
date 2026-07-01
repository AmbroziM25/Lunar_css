import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Framework guides" };

export default function Frameworks() {
  return (
    <>
      <h1 className="text-4xl font-bold">Use with any framework</h1>
      <p className="text-muted text-lg">
        Lunara&rsquo;s CSS has zero JS dependencies — it&rsquo;s just classes, attributes,
        and CSS variables — so it drops into any stack the way Tailwind or Bootstrap
        would: import the stylesheet once, then use the classes in whatever templating
        system you already have. The only per-framework difference is <em>how you toggle
        state</em> (theme switch, modal open, toast list) — ordinary UI state driving
        plain Lunara class names.
      </p>

      <h2 className="text-2xl font-bold">Plain HTML</h2>
      <CodeBlock
        lang="html"
        code={`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lunara-css/dist/lunar.min.css" />
<script type="module">
  import { initTheme, toggleTheme } from "https://cdn.jsdelivr.net/npm/lunara-css/theme.mjs";
  initTheme();
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
</script>`}
      />

      <h2 className="text-2xl font-bold">React (Vite, CRA, Remix — any bundler)</h2>
      <CodeBlock
        lang="jsx"
        code={`// main.jsx / App entry point
import "lunara-css/dist/lunar.css";`}
      />
      <CodeBlock
        lang="jsx"
        code={`import { useEffect } from "react";
import { initTheme, toggleTheme } from "lunara-css/theme";

function ThemeToggle() {
  useEffect(() => { initTheme(); }, []);
  return <button className="btn btn-secondary" onClick={() => toggleTheme()}>☾ / ☀</button>;
}`}
      />
      <p>Modals, toasts, etc. are conditional class names driven by your own state:</p>
      <CodeBlock
        lang="jsx"
        code={`<div className={\`modal-overlay \${isOpen ? "is-open" : ""}\`}>
  <div className="modal scale-in">…</div>
</div>`}
      />

      <h2 className="text-2xl font-bold">Next.js</h2>
      <p>
        Import the CSS once in the root layout (App Router) or <code>_app</code> (Pages
        Router) — Next.js requires global CSS to come from one of those top-level files.
        This docs site is itself a Next.js App Router app doing exactly this:
      </p>
      <CodeBlock
        lang="tsx"
        code={`// app/layout.tsx (App Router)
import "lunara-css/dist/lunar.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Sets data-theme before hydration so there's no flash of the wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: \`try{document.documentElement.setAttribute('data-theme',localStorage.getItem('lunar-theme')||'dark')}catch(e){}\`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`}
      />
      <CodeBlock
        lang="tsx"
        code={`// pages/_app.tsx (Pages Router)
import "lunara-css/dist/lunar.css";
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}`}
      />
      <p>
        <code>initTheme()</code> / <code>toggleTheme()</code> work the same inside Client
        Components (<code>&quot;use client&quot;</code>) — the inline script only handles
        the pre-hydration flash.
      </p>

      <h2 className="text-2xl font-bold">Vue 3</h2>
      <CodeBlock
        lang="js"
        code={`// main.js
import "lunara-css/dist/lunar.css";`}
      />
      <CodeBlock
        lang="vue"
        code={`<script setup>
import { onMounted } from "vue";
import { initTheme, toggleTheme } from "lunara-css/theme";
onMounted(initTheme);
</script>

<template>
  <button class="btn btn-secondary" @click="toggleTheme">☾ / ☀</button>
</template>`}
      />

      <h2 className="text-2xl font-bold">Angular</h2>
      <CodeBlock
        lang="json"
        code={`// angular.json
"styles": ["node_modules/lunara-css/dist/lunar.css", "src/styles.css"]`}
      />
      <CodeBlock
        lang="ts"
        code={`import { Component, OnInit } from "@angular/core";
import { initTheme, toggleTheme } from "lunara-css/theme";

@Component({ selector: "app-root", templateUrl: "./app.component.html" })
export class AppComponent implements OnInit {
  ngOnInit() { initTheme(); }
  onToggleTheme() { toggleTheme(); }
}`}
      />
      <CodeBlock
        lang="html"
        code={`<!-- app.component.html -->
<button class="btn btn-secondary" (click)="onToggleTheme()">☾ / ☀</button>
<div class="modal-overlay" [class.is-open]="isOpen">
  <div class="modal scale-in">…</div>
</div>`}
      />

      <h2 className="text-2xl font-bold">Anything else</h2>
      <p>
        Svelte, SolidJS, Astro, Nuxt, Qwik, plain jQuery — same two ingredients: import{" "}
        <code>lunara-css/dist/lunar.css</code> (or the CDN link) once, and optionally
        import from <code>lunara-css/theme</code>. Nothing in Lunara assumes a specific
        framework, bundler, or virtual DOM.
      </p>
    </>
  );
}
