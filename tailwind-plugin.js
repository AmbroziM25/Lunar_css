/**
 * Lunara CSS — Tailwind components plugin
 *
 * Registers Lunara's prebuilt components (.btn, .card, .modal, .badge, .moon …)
 * and effect utilities (.glow-md, .glass, .starfield, .moonbeam, .scroll-reveal …)
 * inside a Tailwind build, so they behave like native Tailwind classes:
 *
 *   - tree-shaken by content scanning (unused components don't ship)
 *   - variant-compatible (hover:glow-lg, md:scroll-reveal-up, dark:glass …)
 *   - emitted through Tailwind's own pipeline — no separate stylesheet needed
 *
 * Works with both Tailwind v3 (tailwind.config.js `plugins`) and Tailwind v4
 * (`@plugin` in CSS, or via `@import "@velo0-0/lunara-css/tailwind"` which bundles it
 * together with the v4 @theme tokens).
 *
 * Zero duplication and zero runtime dependencies: the class map is pre-parsed
 * from the framework's own built CSS by build.js into dist/lunar.tailwind.json,
 * so the classes here can never drift from the plain-CSS build.
 *
 * This plugin is included automatically by `@velo0-0/lunara-css/tailwind-preset` (v3)
 * and `@velo0-0/lunara-css/tailwind` (v4). To use it standalone on top of your own theme:
 *
 *   // tailwind.config.js (v3)
 *   module.exports = {
 *     plugins: [require('@velo0-0/lunara-css/tailwind-plugin')],
 *   };
 *
 *   // app.css (v4)
 *   @plugin "@velo0-0/lunara-css/tailwind-plugin";
 */

'use strict';

/**
 * Resolve tailwindcss/plugin from the consumer's project first, then from
 * here. Plain require() only walks up from this file's location, which
 * breaks under npm link, pnpm's strict node_modules, and monorepos where
 * tailwindcss lives next to the app rather than next to @velo0-0/lunara-css.
 */
function resolveFromConsumer(id, friendlyHint) {
  try {
    return require(require.resolve(id, { paths: [process.cwd(), __dirname] }));
  } catch (e) {
    throw new Error(friendlyHint + ' (' + e.message + ')');
  }
}

const plugin = resolveFromConsumer(
  'tailwindcss/plugin',
  '@velo0-0/lunara-css/tailwind-plugin can only be used inside a Tailwind CSS project ' +
    '(`npm install tailwindcss`). For plain-CSS usage, import "@velo0-0/lunara-css/dist/lunar.css" instead.'
);

const classes = require('./dist/lunar.tailwind.json');

module.exports = plugin(function lunaraComponents({ addBase, addComponents, addUtilities }) {
  addBase(classes.base);
  addComponents(classes.components);
  addUtilities(classes.utilities);
});
