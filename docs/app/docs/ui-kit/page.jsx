import CodeBlock from "../../../components/CodeBlock";

export const metadata = { title: "UI Kit — premade blocks" };

export default function UiKit() {
  return (
    <>
      <h1 className="text-4xl font-bold">UI Kit — premade blocks</h1>
      <p className="text-muted text-lg">
        Ready-made page sections composed entirely from Lunara&rsquo;s components,
        effects, and utilities — no custom CSS. Every block below is live; copy the
        HTML and it works anywhere the stylesheet is loaded. Restyle any instance
        with the per-element variables from the Customization page.
      </p>

      <h2 className="text-2xl font-bold">Sign-in card</h2>
      <div className="demo-panel justify-center">
        <div className="card glow-sm p-6 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="moon moon-waxing-gibbous" style={{ "--moon-size": "2rem" }}></span>
            <h3 className="text-xl font-semibold">Welcome back</h3>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="kit-email">Email</label>
            <input className="input" id="kit-email" type="email" placeholder="you@nightsky.dev" />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="kit-pass">Password</label>
            <input className="input" id="kit-pass" type="password" placeholder="••••••••" />
            <p className="form-hint">At least 8 characters.</p>
          </div>
          <button className="btn btn-primary w-full">Sign in</button>
          <p className="text-muted text-sm text-center mt-4">
            No account? <a href="#">Create one</a>
          </p>
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="card glow-sm p-6 max-w-sm">
  <div class="flex items-center gap-3 mb-4">
    <span class="moon moon-waxing-gibbous" style="--moon-size: 2rem"></span>
    <h3 class="text-xl font-semibold">Welcome back</h3>
  </div>
  <div class="form-group">
    <label class="label" for="email">Email</label>
    <input class="input" id="email" type="email" placeholder="you@nightsky.dev" />
  </div>
  <div class="form-group">
    <label class="label" for="pass">Password</label>
    <input class="input" id="pass" type="password" placeholder="••••••••" />
    <p class="form-hint">At least 8 characters.</p>
  </div>
  <button class="btn btn-primary w-full">Sign in</button>
  <p class="text-muted text-sm text-center mt-4">No account? <a href="#">Create one</a></p>
</div>`}
      />

      <h2 className="text-2xl font-bold">Hero section</h2>
      <div className="starfield rounded-xl p-16 text-center border border-moon-800 my-4">
        <span className="badge badge-glow">Now in beta</span>
        <h2 className="text-5xl font-black leading-tight mt-4">
          Ship faster under a<br />
          <span className="text-shimmer">night sky</span>
        </h2>
        <p className="text-muted text-lg mt-4 max-w-xl m-auto">
          Everything you need to build a moonlit landing page — components,
          effects, and motion in one stylesheet.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <button className="btn btn-glow btn-lg hover-lift">Get started</button>
          <button className="btn btn-outline btn-lg hover-lift">Live demo</button>
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<section class="starfield rounded-xl p-16 text-center">
  <span class="badge badge-glow">Now in beta</span>
  <h1 class="text-5xl font-black leading-tight mt-4">
    Ship faster under a<br /><span class="text-shimmer">night sky</span>
  </h1>
  <p class="text-muted text-lg mt-4 max-w-xl m-auto">
    Everything you need to build a moonlit landing page.
  </p>
  <div class="flex justify-center gap-4 mt-8">
    <button class="btn btn-glow btn-lg hover-lift">Get started</button>
    <button class="btn btn-outline btn-lg hover-lift">Live demo</button>
  </div>
</section>`}
      />

      <h2 className="text-2xl font-bold">Pricing</h2>
      <div className="grid grid-cols-3 gap-4 my-4">
        <div className="card p-6 hover-lift">
          <p className="text-muted text-sm uppercase tracking-wide">New moon</p>
          <p className="text-4xl font-bold mt-2">$0</p>
          <p className="text-muted text-sm mt-2">For side projects and stargazing.</p>
          <button className="btn btn-secondary w-full mt-8">Start free</button>
        </div>
        <div className="card eclipse-border p-6 hover-lift">
          <div className="flex items-center justify-between">
            <p className="text-muted text-sm uppercase tracking-wide">Full moon</p>
            <span className="badge badge-glow">Popular</span>
          </div>
          <p className="text-4xl font-bold mt-2">$12<span className="text-base text-muted">/mo</span></p>
          <p className="text-muted text-sm mt-2">Maximum glow for growing teams.</p>
          <button className="btn btn-primary w-full mt-8">Go pro</button>
        </div>
        <div className="card p-6 hover-lift">
          <p className="text-muted text-sm uppercase tracking-wide">Eclipse</p>
          <p className="text-4xl font-bold mt-2">Custom</p>
          <p className="text-muted text-sm mt-2">Dedicated orbit for enterprises.</p>
          <button className="btn btn-outline w-full mt-8">Contact us</button>
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="grid grid-cols-3 gap-4">
  <div class="card p-6 hover-lift">
    <p class="text-muted text-sm uppercase tracking-wide">New moon</p>
    <p class="text-4xl font-bold mt-2">$0</p>
    <p class="text-muted text-sm mt-2">For side projects and stargazing.</p>
    <button class="btn btn-secondary w-full mt-8">Start free</button>
  </div>
  <div class="card eclipse-border p-6 hover-lift">
    <div class="flex items-center justify-between">
      <p class="text-muted text-sm uppercase tracking-wide">Full moon</p>
      <span class="badge badge-glow">Popular</span>
    </div>
    <p class="text-4xl font-bold mt-2">$12<span class="text-base text-muted">/mo</span></p>
    <p class="text-muted text-sm mt-2">Maximum glow for growing teams.</p>
    <button class="btn btn-primary w-full mt-8">Go pro</button>
  </div>
  <div class="card p-6 hover-lift">
    <p class="text-muted text-sm uppercase tracking-wide">Eclipse</p>
    <p class="text-4xl font-bold mt-2">Custom</p>
    <p class="text-muted text-sm mt-2">Dedicated orbit for enterprises.</p>
    <button class="btn btn-outline w-full mt-8">Contact us</button>
  </div>
</div>`}
      />

      <h2 className="text-2xl font-bold">Feature grid</h2>
      <div className="grid grid-cols-3 gap-4 my-4">
        <div className="card moonbeam p-6">
          <span className="moon moon-first-quarter" style={{ "--moon-size": "2rem" }}></span>
          <h3 className="text-lg font-semibold mt-4">Zero build step</h3>
          <p className="text-muted text-sm mt-2">One link tag. No pipeline, no config, no waiting.</p>
        </div>
        <div className="card moonbeam p-6">
          <span className="moon moon-full" style={{ "--moon-size": "2rem" }}></span>
          <h3 className="text-lg font-semibold mt-4">Lunar-reactive</h3>
          <p className="text-muted text-sm mt-2">Glow intensity tracks the actual moon phase.</p>
        </div>
        <div className="card moonbeam p-6">
          <span className="moon moon-waning-crescent" style={{ "--moon-size": "2rem" }}></span>
          <h3 className="text-lg font-semibold mt-4">Customizable</h3>
          <p className="text-muted text-sm mt-2">Per-element variables for colors, opacity, radius.</p>
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="grid grid-cols-3 gap-4">
  <div class="card moonbeam p-6">
    <span class="moon moon-first-quarter" style="--moon-size: 2rem"></span>
    <h3 class="text-lg font-semibold mt-4">Zero build step</h3>
    <p class="text-muted text-sm mt-2">One link tag. No pipeline, no config.</p>
  </div>
  <!-- repeat for each feature -->
</div>`}
      />

      <h2 className="text-2xl font-bold">Stats row</h2>
      <div className="card p-6 my-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-4xl font-bold text-glow">40 KB</p>
            <p className="text-muted text-sm mt-2">minified CSS</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-glow">0</p>
            <p className="text-muted text-sm mt-2">dependencies</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-glow">8</p>
            <p className="text-muted text-sm mt-2">moon phases, pure CSS</p>
          </div>
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<div class="card p-6">
  <div class="grid grid-cols-3 gap-4 text-center">
    <div>
      <p class="text-4xl font-bold text-glow">40 KB</p>
      <p class="text-muted text-sm mt-2">minified CSS</p>
    </div>
    <!-- repeat per stat -->
  </div>
</div>`}
      />

      <h2 className="text-2xl font-bold">Testimonial</h2>
      <div className="demo-panel justify-center">
        <figure className="card glass-dark p-6 max-w-md m-0">
          <blockquote className="text-lg leading-relaxed m-0">
            &ldquo;We swapped three plugins and a pile of custom CSS for one
            stylesheet. The moonlit look is exactly what our brand needed.&rdquo;
          </blockquote>
          <figcaption className="flex items-center gap-3 mt-4">
            <span className="moon moon-waxing-crescent" style={{ "--moon-size": "2.5rem" }}></span>
            <div>
              <p className="font-semibold m-0">Luna Selene</p>
              <p className="text-muted text-sm m-0">CTO, Nightshift Labs</p>
            </div>
          </figcaption>
        </figure>
      </div>
      <CodeBlock
        lang="html"
        code={`<figure class="card glass-dark p-6 max-w-md">
  <blockquote class="text-lg leading-relaxed">
    "We swapped three plugins and a pile of custom CSS for one stylesheet."
  </blockquote>
  <figcaption class="flex items-center gap-3 mt-4">
    <span class="moon moon-waxing-crescent" style="--moon-size: 2.5rem"></span>
    <div>
      <p class="font-semibold">Luna Selene</p>
      <p class="text-muted text-sm">CTO, Nightshift Labs</p>
    </div>
  </figcaption>
</figure>`}
      />

      <h2 className="text-2xl font-bold">Call-to-action panel</h2>
      <div className="gradient-aurora rounded-xl p-10 text-center my-4">
        <h3 className="text-3xl font-bold">Ready for lift-off?</h3>
        <p className="mt-2 opacity-75">Join 2,000+ night-sky builders. Unsubscribe anytime.</p>
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          <input
            className="input max-w-xs w-full"
            type="email"
            placeholder="you@nightsky.dev"
            style={{ "--input-bg": "rgb(9 9 19 / 0.45)", "--input-border-color": "rgb(255 255 255 / 0.25)" }}
          />
          <button className="btn btn-secondary hover-lift">Subscribe</button>
        </div>
      </div>
      <CodeBlock
        lang="html"
        code={`<section class="gradient-aurora rounded-xl p-10 text-center">
  <h2 class="text-3xl font-bold">Ready for lift-off?</h2>
  <p class="mt-2 opacity-75">Join 2,000+ night-sky builders. Unsubscribe anytime.</p>
  <div class="flex justify-center gap-3 mt-6 flex-wrap">
    <input class="input max-w-xs" type="email" placeholder="you@nightsky.dev"
           style="--input-bg: rgb(9 9 19 / 0.45); --input-border-color: rgb(255 255 255 / 0.25)" />
    <button class="btn btn-secondary hover-lift">Subscribe</button>
  </div>
</section>`}
      />

      <p className="text-muted mt-8">
        Want a block that isn&rsquo;t here? Everything above is just{" "}
        <a href="/docs/components">components</a> + <a href="/docs/effects">effects</a> +
        utilities composed together — and every instance accepts the{" "}
        <a href="/docs/customization">customization variables</a>.
      </p>
    </>
  );
}
