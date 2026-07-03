import Link from "next/link";
import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Utilities & responsive" };

const rows = [
  ["Container", "container", "centered, breakpoint max-widths, side padding"],
  ["Display", "block · inline-block · inline · flex · inline-flex · grid · inline-grid · hidden", ""],
  ["Position", "static · relative · absolute · fixed · sticky · inset-0 · inset-x-0 · inset-y-0 · top-0 · right-0 · bottom-0 · left-0", ""],
  ["Flex direction / wrap", "flex-row(-reverse) · flex-col(-reverse) · flex-wrap · flex-nowrap", ""],
  ["Align / justify", "items-{start,center,end,baseline,stretch} · justify-{start,center,end,between,around,evenly} · self-{start,center,end,stretch}", ""],
  ["Flex sizing", "flex-1 · flex-auto · flex-initial · flex-none · grow(-0) · shrink(-0)", ""],
  ["Grid", "grid-cols-{1–12} · col-span-{1–12,full} · grid-rows-{1–3}", "complete 12-column grid"],
  ["Gap", "gap-{0–6,8,10,12} · gap-x-* · gap-y-*", "same scale on all three"],
  ["Padding", "p-{0–6,8,10,12,16} · px-* / py-* (same) · pt/pr/pb/pl-{0–6,8,10,12}", ""],
  ["Margin", "m-{0–6,8,10,12,auto} · mx-* / my-* (same) · mt/mb-{0–6,8,10,12,auto} · mr/ml-{0–6,8,auto}", ""],
  ["Width", "w-auto · w-full · w-screen · w-fit · w-1/2 · w-1/3 · w-2/3 · w-1/4 · w-3/4 · min-w-0", ""],
  ["Height", "h-auto · h-full · h-screen · h-fit · min-h-screen · min-h-full", "screen heights use dvh with vh fallback"],
  ["Max width", "max-w-{xs…7xl,prose,full}", ""],
  ["Font size", "text-{xs,sm,base,lg,xl,2xl,3xl,4xl,5xl,6xl}", ""],
  ["Font weight / style", "font-{thin,light,normal,medium,semibold,bold,black} · italic · not-italic", ""],
  ["Text align / transform", "text-{left,center,right,justify} · uppercase · lowercase · capitalize · normal-case", ""],
  ["Line height / tracking", "leading-{none,tight,snug,normal,relaxed,loose} · tracking-{tight,normal,wide,wider}", ""],
  ["Decoration / wrapping", "underline · no-underline · line-through · truncate · whitespace-nowrap · whitespace-pre-wrap", ""],
  ["Text color", "text-moon-{50–950} · text-{glow,tide,eclipse,violet,indigo,muted,current}", ""],
  ["Background", "bg-moon-{50–950} · bg-{glow,tide,eclipse,violet,indigo,surface,transparent}", ""],
  ["Border", "border · border-{0,2,4} · border-{t,r,b,l} · border-{moon-700,moon-800,tide,violet,transparent}", ""],
  ["Radius", "rounded-{none,sm,md,lg,xl,2xl,full}", ""],
  ["Shadow", "shadow-none · shadow-sm · shadow(-md) · shadow-lg · shadow-xl", ""],
  ["Opacity", "opacity-{0,25,50,75,100}", ""],
  ["Overflow", "overflow-{auto,hidden,visible,scroll} · overflow-x/y-{auto,hidden}", ""],
  ["Z-index", "z-{0,10,20,30,40,50,auto}", ""],
  ["Interactivity", "cursor-{pointer,not-allowed,default} · select-none · pointer-events-none", ""],
  ["Accessibility", "sr-only", "visually hidden, screen-reader accessible"],
];

export default function Utilities() {
  return (
    <>
      <h1 className="text-4xl font-bold">Utilities &amp; responsive design</h1>
      <p className="text-muted text-lg">
        Atomic, Tailwind-compatible utility classes. Spacing runs on the{" "}
        <code>--space-*</code> scale (<code>1</code> = 0.25rem), so <code>p-4</code> = 1rem —
        exactly like Tailwind. Utilities live in the last cascade layer, so they always win
        over components.
      </p>

      <h2 className="text-2xl font-bold">Reference</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Classes</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([cat, classes, note]) => (
            <tr key={cat}>
              <td>{cat}</td>
              <td><code>{classes}</code></td>
              <td className="text-muted">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-2xl font-bold">Responsive breakpoints</h2>
      <p>
        Five Tailwind-compatible, <strong>mobile-first</strong> breakpoints. A prefixed class
        applies at that width <em>and up</em>:
      </p>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Prefix</th>
            <th>Min width</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>sm:</code></td><td>640px</td><td><code>sm:flex</code></td></tr>
          <tr><td><code>md:</code></td><td>768px</td><td><code>md:grid-cols-2</code></td></tr>
          <tr><td><code>lg:</code></td><td>1024px</td><td><code>lg:text-xl</code></td></tr>
          <tr><td><code>xl:</code></td><td>1280px</td><td><code>xl:grid-cols-4</code></td></tr>
          <tr><td><code>2xl:</code></td><td>1536px</td><td><code>2xl:w-1/2</code></td></tr>
        </tbody>
      </table>
      <p>
        Every breakpoint exposes the <strong>same</strong> variant set over the layout-relevant
        utilities — display (incl. <code>hidden</code>), flex direction/wrap, align/justify,{" "}
        <code>grid-cols</code>, <code>col-span</code>, <code>gap</code>,{" "}
        <code>p</code>/<code>px</code>/<code>py</code>, <code>mx-auto</code>, text alignment,
        font size, and width — so a class that works at <code>sm:</code> is guaranteed to exist
        at <code>2xl:</code> too.
      </p>

      <CodeBlock
        lang="html"
        code={`<!-- 1 column on phones, 2 on tablets, 4 on wide screens -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">…</div>

<!-- type that scales with the viewport -->
<h1 class="text-3xl md:text-5xl 2xl:text-6xl">Moonrise</h1>

<!-- desktop-only navigation -->
<nav class="hidden lg:flex gap-6">…</nav>

<!-- stack on mobile, row from md up -->
<div class="flex flex-col md:flex-row items-center gap-4">…</div>`}
      />

      <h2 className="text-2xl font-bold">Live demo</h2>
      <p className="text-muted">Resize the window — this grid re-flows at every breakpoint:</p>
      <div className="demo-panel">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card p-3 text-center text-sm">{n}</div>
          ))}
        </div>
      </div>

      <div className="card glass-dark p-6 mt-8 flex items-center justify-between flex-wrap gap-4">
        <span className="font-semibold">Prefer full Tailwind? Lunara is Tailwind-native too.</span>
        <Link href="/docs/tailwind" className="btn btn-primary hover-lift">
          Tailwind integration →
        </Link>
      </div>
    </>
  );
}
