/**
 * Lunara CSS — Tailwind components plugin
 *
 * Registers Lunara's prebuilt components (.btn, .card, .modal, .badge, .moon …)
 * and effect utilities (.glow-md, .glass, .starfield, .moonbeam, .scroll-reveal …)
 * inside a Tailwind build, so they behave like native Tailwind classes:
 *
 *   - tree-shaken by content scanning (unused components don't ship)
 *   - variant-compatible (hover:glow-lg, md:scroll-reveal-up, dark:glass …)
 *   - emitted through your own PostCSS pipeline — no separate stylesheet needed
 *
 * The design tokens (:root custom properties), theme attribute blocks
 * (data-theme / data-moon-phase), keyframes, and @property registrations are
 * added via addBase so everything the components reference always resolves.
 *
 * Zero duplication: this plugin parses the framework's own dist/lunar.css at
 * build time, so the classes here can never drift from the plain-CSS build.
 * (postcss is required — it ships with every Tailwind installation.)
 *
 * This plugin is included automatically by `lunara-css/tailwind-preset`.
 * To use it standalone on top of your own theme:
 *
 *   // tailwind.config.js
 *   module.exports = {
 *     plugins: [require('lunara-css/tailwind-plugin')],
 *   };
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Resolve a module from the consumer's project first, then from here.
 * Plain require() only walks up from this file's location, which breaks
 * under npm link, pnpm's strict node_modules, and monorepos where
 * tailwindcss lives next to the app rather than next to lunara-css.
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
  'lunara-css/tailwind-plugin can only be used inside a Tailwind CSS project ' +
    '(`npm install tailwindcss`). For plain-CSS usage, import "lunara-css/dist/lunar.css" instead.'
);

function loadPostcss() {
  return resolveFromConsumer(
    'postcss',
    'lunara-css/tailwind-plugin requires postcss, which normally ships with Tailwind. ' +
      'If your setup somehow lacks it, either `npm install postcss` or skip this plugin ' +
      'and import "lunara-css/dist/lunar.css" directly.'
  );
}

/** Convert a list of postcss nodes into a Tailwind CSS-in-JS object. */
function toObject(nodes) {
  const obj = {};
  for (const node of nodes) {
    if (node.type === 'decl') {
      obj[node.prop] = node.value;
    } else if (node.type === 'rule') {
      merge(obj, node.selector, toObject(node.nodes));
    } else if (node.type === 'atrule' && node.nodes) {
      merge(obj, '@' + node.name + (node.params ? ' ' + node.params : ''), toObject(node.nodes));
    }
  }
  return obj;
}

/** Merge duplicate keys (e.g. repeated @starting-style blocks) instead of clobbering. */
function merge(obj, key, value) {
  if (obj[key]) {
    Object.assign(obj[key], value);
  } else {
    obj[key] = value;
  }
}

/** Collect the child nodes of every `@layer <name>` block in the stylesheet. */
function collectLayer(root, layerName) {
  const nodes = [];
  root.walkAtRules('layer', (at) => {
    if (at.params === layerName && at.nodes) nodes.push(...at.nodes);
  });
  return nodes;
}

/**
 * Split a layer's nodes into "always-on base" (keyframes, @property,
 * @starting-style, attribute-only selectors like [data-tooltip]) and
 * class-keyed rules that Tailwind can tree-shake.
 */
function split(nodes, baseBucket, classBucket) {
  for (const node of nodes) {
    if (node.type === 'atrule' && (node.name === 'keyframes' || node.name === 'property' || node.name === 'starting-style')) {
      baseBucket.push(node);
    } else if (node.type === 'rule' && !node.selector.includes('.')) {
      baseBucket.push(node);
    } else {
      classBucket.push(node);
    }
  }
}

module.exports = plugin(function lunaraComponents({ addBase, addComponents, addUtilities }) {
  const postcss = loadPostcss();
  const css = fs.readFileSync(path.join(__dirname, 'dist', 'lunar.css'), 'utf8');
  const root = postcss.parse(css);

  const base = [];
  const components = [];
  const utilities = [];

  // Design tokens only — Lunara's element reset stays out of the way of
  // Tailwind's own preflight.
  for (const node of collectLayer(root, 'lunar-base')) {
    if (node.type === 'rule' && node.selector.trim() === ':root') base.push(node);
  }

  // Theme blocks: [data-theme=…] overrides and [data-moon-phase=…] moonlight dial.
  split(collectLayer(root, 'lunar-themes'), base, base);

  // @property registrations live at the top level, outside any layer.
  root.walkAtRules('property', (at) => base.push(at));

  // Effects + scroll motion register as utilities (variant-friendly);
  // components register as components.
  split(collectLayer(root, 'lunar-effects'), base, utilities);
  split(collectLayer(root, 'lunar-motion'), base, utilities);
  split(collectLayer(root, 'lunar-components'), base, components);

  addBase(toObject(base));
  addComponents(toObject(components));
  addUtilities(toObject(utilities));
});
