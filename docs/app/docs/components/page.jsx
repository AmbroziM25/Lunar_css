import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "Components" };

export default function Components() {
  return (
    <>
      <h1 className="text-4xl font-bold">Components</h1>
      <p className="text-muted text-lg">
        Prebuilt, themeable building blocks. All components read from the same design
        tokens and use the effect utilities internally (glows on primary buttons, slide-up
        on toasts, and so on). Every demo below is live.
      </p>

      <h2 className="text-2xl font-bold">Buttons</h2>
      <div className="demo-panel">
        <button className="btn btn-primary">Primary</button>
        <button className="btn btn-secondary">Secondary</button>
        <button className="btn btn-ghost">Ghost</button>
        <button className="btn btn-outline">Outline</button>
        <button className="btn btn-glow">Glow</button>
        <button className="btn btn-primary btn-sm">Small</button>
        <button className="btn btn-primary btn-lg">Large</button>
      </div>
      <CodeBlock
        lang="html"
        code={`<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-glow">Glow</button>
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>`}
      />

      <h2 className="text-2xl font-bold">Cards</h2>
      <div className="demo-panel">
        <div className="card max-w-sm">
          <div className="card-header font-semibold">Card header</div>
          <div className="card-body">
            Cards are surfaces. Combine with <code className="inline-code">glow-sm</code>,{" "}
            <code className="inline-code">hover-lift</code>, or{" "}
            <code className="inline-code">moonbeam</code>.
          </div>
          <div className="card-footer text-sm text-muted">Card footer</div>
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="card">
  <div class="card-header">Card header</div>
  <div class="card-body">…</div>
  <div class="card-footer">Card footer</div>
</div>`}
      />

      <h2 className="text-2xl font-bold">Forms</h2>
      <div className="demo-panel">
        <div className="max-w-sm w-full">
          <div className="form-group">
            <label className="label" htmlFor="demo-email">Email</label>
            <input className="input" id="demo-email" type="email" placeholder="you@nightsky.dev" />
            <p className="form-hint">We&rsquo;ll only write at full moon.</p>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="demo-msg">Message</label>
            <textarea className="textarea" id="demo-msg" rows={3} placeholder="Say hi…"></textarea>
          </div>
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="form-group">
  <label class="label" for="email">Email</label>
  <input class="input" id="email" type="email" placeholder="you@nightsky.dev" />
  <p class="form-hint">We'll only write at full moon.</p>
</div>

<textarea class="textarea" rows="3"></textarea>
<select class="select">…</select>`}
      />

      <h2 className="text-2xl font-bold">Badges</h2>
      <div className="demo-panel">
        <span className="badge">Default</span>
        <span className="badge badge-primary">Primary</span>
        <span className="badge badge-violet">Violet</span>
        <span className="badge badge-outline">Outline</span>
        <span className="badge badge-glow">Glow</span>
      </div>
      <CodeBlock
        lang="html"
        code={`<span class="badge">Default</span>
<span class="badge badge-primary">Primary</span>
<span class="badge badge-violet">Violet</span>
<span class="badge badge-outline">Outline</span>
<span class="badge badge-glow">Glow</span>`}
      />

      <h2 className="text-2xl font-bold">Navbar</h2>
      <p>The bar at the top of this site is the component itself:</p>
      <CodeBlock
        lang="html"
        code={`<nav class="navbar">
  <a href="/" class="navbar-brand">🌙 Lunara</a>
  <div class="navbar-nav">
    <a href="/docs" class="navbar-link">Docs</a>
    <a href="/blog" class="navbar-link">Blog</a>
  </div>
</nav>`}
      />

      <h2 className="text-2xl font-bold">Modal — zero JavaScript</h2>
      <p>
        Lunara styles the browser-native <strong>Popover API</strong>, so a complete,
        animated modal — open/close, blurred backdrop, <kbd>Esc</kbd>, click-outside
        light-dismiss, focus handling — needs no script at all:
      </p>
      <div className="demo-panel">
        <button className="btn btn-primary" popoverTarget="docs-modal">Open modal</button>
      </div>
      <div id="docs-modal" popover="auto" className="modal">
        <div className="modal-header">Hello 🌙</div>
        <div className="modal-body">Two HTML attributes. Zero script.</div>
        <div className="modal-footer">
          <button className="btn btn-secondary" popoverTarget="docs-modal" popoverTargetAction="hide">
            Close
          </button>
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<button class="btn btn-primary" popovertarget="hello">Open</button>

<div id="hello" popover class="modal">
  <div class="modal-header">Hello</div>
  <div class="modal-body">Two HTML attributes. Zero script.</div>
  <div class="modal-footer">
    <button class="btn btn-secondary" popovertarget="hello" popovertargetaction="hide">Close</button>
  </div>
</div>`}
      />
      <p>
        Entrance/exit transitions use <code>@starting-style</code> +{" "}
        <code>transition-behavior: allow-discrete</code>. If you prefer a state-driven
        modal (React state, etc.), use <code>modal-overlay</code> +{" "}
        <code>modal</code> and toggle the <code>is-open</code> class instead.
      </p>

      <h2 className="text-2xl font-bold">Toasts</h2>
      <div className="demo-panel flex-col items-start">
        <div className="toast toast-success"><div className="toast-title">Saved</div><div className="toast-message">Your changes are on the dark side of the moon.</div></div>
        <div className="toast toast-error"><div className="toast-title">Error</div><div className="toast-message">Something eclipsed.</div></div>
        <div className="toast toast-warning"><div className="toast-title">Heads up</div><div className="toast-message">Waning battery.</div></div>
        <div className="toast toast-info"><div className="toast-title">Info</div><div className="toast-message">Full moon tonight.</div></div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="toast toast-success">
  <div class="toast-title">Saved</div>
  <div class="toast-message">Your changes are safe.</div>
</div>
<!-- variants: toast-success, toast-error, toast-warning, toast-info -->`}
      />

      <h2 className="text-2xl font-bold">Tooltip — pure CSS</h2>
      <div className="demo-panel">
        <button className="btn btn-outline" data-tooltip="Pure CSS, no JS">Hover me</button>
      </div>
      <CodeBlock
        lang="html"
        code={`<button class="btn btn-outline" data-tooltip="Pure CSS, no JS">Hover me</button>`}
      />

      <h2 className="text-2xl font-bold">Full reference</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Classes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Button</td>
            <td><code>btn</code> + <code>-primary/-secondary/-ghost/-outline/-glow</code>, <code>-sm/-lg</code></td>
          </tr>
          <tr>
            <td>Card</td>
            <td><code>card</code> + <code>card-header/-body/-footer</code></td>
          </tr>
          <tr>
            <td>Forms</td>
            <td><code>input</code> / <code>textarea</code> / <code>select</code> + <code>label</code>, <code>form-group</code>, <code>form-hint</code></td>
          </tr>
          <tr>
            <td>Badge</td>
            <td><code>badge</code> + <code>-primary/-violet/-outline/-glow</code></td>
          </tr>
          <tr>
            <td>Navbar</td>
            <td><code>navbar</code> + <code>navbar-brand/-nav/-link</code></td>
          </tr>
          <tr>
            <td>Modal</td>
            <td><code>modal</code> (+ <code>popover</code> attr) or <code>modal-overlay</code> + <code>.is-open</code>; <code>-header/-body/-footer</code>, <code>modal-close</code></td>
          </tr>
          <tr>
            <td>Toast</td>
            <td><code>toast</code> + <code>-success/-error/-warning/-info</code>, <code>toast-title</code>, <code>toast-message</code></td>
          </tr>
          <tr>
            <td>Tooltip</td>
            <td><code>data-tooltip=&quot;…&quot;</code> attribute — pure CSS, no JS</td>
          </tr>
          <tr>
            <td>Moon icons</td>
            <td><code>moon</code> + <code>moon-&lt;phase&gt;</code> / <code>moon-live</code>, sized via <code>--moon-size</code></td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
