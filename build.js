#!/usr/bin/env node
'use strict';
/**
 * Lunara CSS build script.
 * Concatenates the modular /src files (in cascade order) into a single
 * dist/lunar.css, then produces a minified dist/lunar.min.css.
 * No external dependencies — keeps `npm install` unnecessary for consumers
 * and the build itself dependency-free.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, 'src');
const DIST_DIR = path.join(ROOT, 'dist');

// Cascade order matters: tokens/reset first, then theme overrides, then
// effects (keyframes + effect classes), then components, utilities last
// so utility classes can always win (Tailwind-style utility precedence).
const FILES = ['base.css', 'themes.css', 'effects.css', 'motion.css', 'components.css', 'utilities.css'];

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const banner = `/*!
 * Lunara CSS v${pkg.version}
 * A lightweight, utility-first CSS framework with a dark "night sky" aesthetic.
 * ${pkg.homepage || ''}
 * License: MIT
 */`;

function build() {
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const combined = FILES.map((file) =>
    fs.readFileSync(path.join(SRC_DIR, file), 'utf8').trim()
  ).join('\n\n');

  const full = `${banner}\n\n${combined}\n`;
  fs.writeFileSync(path.join(DIST_DIR, 'lunar.css'), full, 'utf8');

  const min = minify(full);
  fs.writeFileSync(path.join(DIST_DIR, 'lunar.min.css'), min, 'utf8');

  const twJson = JSON.stringify(buildTailwindMap(full), null, 2) + '\n';
  fs.writeFileSync(path.join(DIST_DIR, 'lunar.tailwind.json'), twJson, 'utf8');

  const bootstrap = buildBootstrap(full);
  fs.writeFileSync(path.join(DIST_DIR, 'lunar-bootstrap.css'), bootstrap, 'utf8');
  const bootstrapMin = minify(bootstrap);
  fs.writeFileSync(path.join(DIST_DIR, 'lunar-bootstrap.min.css'), bootstrapMin, 'utf8');

  const fullKB = (Buffer.byteLength(full) / 1024).toFixed(1);
  const minKB = (Buffer.byteLength(min) / 1024).toFixed(1);
  const twKB = (Buffer.byteLength(twJson) / 1024).toFixed(1);
  const bsKB = (Buffer.byteLength(bootstrap) / 1024).toFixed(1);
  const bsMinKB = (Buffer.byteLength(bootstrapMin) / 1024).toFixed(1);
  console.log(`built dist/lunar.css (${fullKB} KB)`);
  console.log(`built dist/lunar.min.css (${minKB} KB)`);
  console.log(`built dist/lunar.tailwind.json (${twKB} KB)`);
  console.log(`built dist/lunar-bootstrap.css (${bsKB} KB)`);
  console.log(`built dist/lunar-bootstrap.min.css (${bsMinKB} KB)`);
}

function minify(css) {
  const bannerMatch = css.match(/^\/\*![\s\S]*?\*\//);
  const head = bannerMatch ? bannerMatch[0] : '';
  const rest = bannerMatch ? css.slice(bannerMatch[0].length) : css;

  const body = rest
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip remaining (per-module) comments
    .replace(/\s+/g, ' ') // collapse whitespace runs — never deletes a lone space (safe for calc())
    .replace(/\s*([{}:;,])\s*/g, '$1') // tighten spacing around structural punctuation
    .replace(/;}/g, '}') // drop redundant trailing semicolons
    .trim();

  return head ? `${head}\n${body}\n` : `${body}\n`;
}

/* ------------------------------------------------------------------
 * Tailwind class map — dist/lunar.tailwind.json
 *
 * Pre-parses the built CSS into the { base, components, utilities }
 * CSS-in-JS buckets that tailwind-plugin.js feeds to addBase /
 * addComponents / addUtilities. Doing this at package build time keeps
 * the plugin dependency-free at runtime (no postcss), which is what
 * lets it run under Tailwind v4's plugin loader as well as v3.
 * ------------------------------------------------------------------ */

/**
 * Minimal CSS parser for Lunara's own (flat, well-formed) output.
 * Handles rules, at-rules, declarations, and quoted strings — that is
 * everything the framework's stylesheets contain.
 */
function parseCss(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, ''); // strip comments
  let i = 0;

  function readUntil(stops) {
    let buf = '';
    while (i < src.length && !stops.includes(src[i])) {
      const ch = src[i];
      if (ch === '"' || ch === "'") {
        const quote = ch;
        buf += ch;
        i++;
        while (i < src.length && src[i] !== quote) {
          buf += src[i];
          i++;
        }
        buf += src[i] || '';
        i++;
      } else {
        buf += ch;
        i++;
      }
    }
    return buf;
  }

  function parseNodes() {
    const nodes = [];
    for (;;) {
      while (i < src.length && /\s/.test(src[i])) i++;
      if (i >= src.length) return nodes;
      if (src[i] === '}') {
        i++;
        return nodes;
      }
      const text = readUntil(['{', ';', '}']).trim();
      if (src[i] === '{') {
        i++;
        const children = parseNodes();
        if (text.startsWith('@')) {
          const m = text.match(/^@([\w-]+)\s*([\s\S]*)$/);
          nodes.push({ type: 'atrule', name: m[1], params: m[2].trim(), nodes: children });
        } else {
          nodes.push({ type: 'rule', selector: text, nodes: children });
        }
      } else {
        if (src[i] === ';') i++;
        if (!text) continue;
        if (text.startsWith('@')) {
          const m = text.match(/^@([\w-]+)\s*([\s\S]*)$/);
          nodes.push({ type: 'atrule', name: m[1], params: m[2].trim(), nodes: null });
        } else {
          const colon = text.indexOf(':');
          if (colon !== -1) {
            nodes.push({
              type: 'decl',
              prop: text.slice(0, colon).trim(),
              value: text.slice(colon + 1).trim().replace(/\s+/g, ' '),
            });
          }
        }
      }
    }
  }

  return parseNodes();
}

/** Convert parsed nodes into a Tailwind CSS-in-JS object. */
function toObject(nodes) {
  const obj = {};
  for (const node of nodes) {
    if (node.type === 'decl') {
      obj[node.prop] = node.value;
    } else if (node.type === 'rule') {
      mergeKey(obj, node.selector, toObject(node.nodes));
    } else if (node.type === 'atrule' && node.nodes) {
      mergeKey(obj, '@' + node.name + (node.params ? ' ' + node.params : ''), toObject(node.nodes));
    }
  }
  return obj;
}

/** Merge duplicate keys (e.g. repeated @starting-style blocks) instead of clobbering. */
function mergeKey(obj, key, value) {
  if (obj[key]) {
    Object.assign(obj[key], value);
  } else {
    obj[key] = value;
  }
}

/** Collect the child nodes of every `@layer <name>` block. */
function collectLayer(nodes, layerName) {
  const found = [];
  for (const node of nodes) {
    if (node.type === 'atrule' && node.name === 'layer' && node.params === layerName && node.nodes) {
      found.push(...node.nodes);
    }
  }
  return found;
}

/**
 * Split a layer's nodes into "always-on base" (keyframes, @property,
 * @starting-style, attribute-only selectors like [data-tooltip]) and
 * class-keyed rules that Tailwind can tree-shake.
 */
function splitNodes(nodes, baseBucket, classBucket) {
  for (const node of nodes) {
    if (
      node.type === 'atrule' &&
      (node.name === 'keyframes' || node.name === 'property' || node.name === 'starting-style')
    ) {
      baseBucket.push(node);
    } else if (node.type === 'rule' && !node.selector.includes('.')) {
      baseBucket.push(node);
    } else {
      classBucket.push(node);
    }
  }
}

/** Split a selector list on top-level commas (never inside () or []). */
function splitSelectorList(selector) {
  const groups = [];
  let depth = 0;
  let buf = '';
  for (const ch of selector) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      groups.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) groups.push(buf.trim());
  return groups;
}

/**
 * Re-key class rules under their primary class with `&` nesting:
 *
 *   .hover-lift:hover, .hover-lift:focus-visible  →  ".hover-lift": { "&:hover, &:focus-visible": … }
 *   @supports (…) { .scroll-reveal { … } }        →  ".scroll-reveal": { "@supports (…)": … }
 *   [data-moon-phase="new"] .moon-live            →  ".moon-live": { "[data-moon-phase=\"new\"] &": … }
 *
 * Tailwind v3 accepts both flat and nested forms, but v4's plugin API
 * requires every addUtilities/addComponents key to be a single class —
 * this shape is the common denominator that works in both.
 */
function restructureBucket(nodes) {
  const out = {};

  function walk(nodes, wrappers) {
    for (const node of nodes) {
      if (node.type === 'rule') {
        distribute(node.selector, toObject(node.nodes), wrappers);
      } else if (node.type === 'atrule' && node.nodes) {
        walk(node.nodes, wrappers.concat('@' + node.name + (node.params ? ' ' + node.params : '')));
      }
    }
  }

  function distribute(selector, obj, wrappers) {
    const byPrimary = new Map();
    for (const group of splitSelectorList(selector)) {
      const m = group.match(/\.[A-Za-z0-9_-]+/);
      if (!m) continue;
      const primary = m[0];
      const nested = group.replace(primary, '&').replace(/\s+/g, ' ').trim();
      if (!byPrimary.has(primary)) byPrimary.set(primary, []);
      byPrimary.get(primary).push(nested);
    }
    for (const [primary, nestedSels] of byPrimary) {
      let target = (out[primary] = out[primary] || {});
      for (const w of wrappers) target = target[w] = target[w] || {};
      // Deep-copy so later merges into one class never mutate a sibling
      // class that shared the same source rule (grouped selectors).
      const copy = JSON.parse(JSON.stringify(obj));
      const key = nestedSels.join(', ');
      if (key === '&') Object.assign(target, copy);
      else mergeKey(target, key, copy);
    }
  }

  walk(nodes, []);
  return out;
}

/* ------------------------------------------------------------------
 * Bootstrap bridge — dist/lunar-bootstrap.css ("lunara-bootstrap")
 *
 * A standalone stylesheet for Bootstrap 5.3+ projects: Lunara's design
 * tokens, theme blocks, effects, scroll motion, and moon icons, plus
 * src/bootstrap.css which re-themes Bootstrap through its --bs-*
 * variable API. Lunara's own components/utilities are deliberately
 * excluded — .btn, .card, .p-4 … would collide with Bootstrap's.
 *
 * Emitted UNLAYERED: Bootstrap's CSS is unlayered, and unlayered CSS
 * beats @layer CSS, so the bridge must be unlayered (and loaded after
 * bootstrap.css) to win by source order.
 * ------------------------------------------------------------------ */

/** Serialize parsed nodes back to CSS text. */
function serializeNodes(nodes, indent = '') {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'decl') {
      out += `${indent}${node.prop}: ${node.value};\n`;
    } else if (node.type === 'rule') {
      const selector = node.selector.replace(/\s+/g, ' ');
      out += `${indent}${selector} {\n${serializeNodes(node.nodes, indent + '  ')}${indent}}\n`;
    } else if (node.type === 'atrule') {
      const head = '@' + node.name + (node.params ? ' ' + node.params : '');
      if (node.nodes) {
        out += `${indent}${head} {\n${serializeNodes(node.nodes, indent + '  ')}${indent}}\n`;
      } else {
        out += `${indent}${head};\n`;
      }
    }
  }
  return out;
}

/**
 * Duplicate every [data-theme=…] selector group with a [data-bs-theme=…]
 * twin, so Bootstrap's native color-mode attribute drives Lunara's theme
 * blocks too.
 */
function mirrorThemeSelectors(nodes) {
  return nodes.map((node) => {
    if (node.type !== 'rule' || !node.selector.includes('[data-theme=')) return node;
    const groups = splitSelectorList(node.selector);
    const mirrored = groups
      .filter((g) => g.includes('[data-theme='))
      .map((g) => g.replace(/\[data-theme=/g, '[data-bs-theme='));
    return { ...node, selector: groups.concat(mirrored).join(',\n') };
  });
}

function buildBootstrap(fullCss) {
  const root = parseCss(fullCss);

  const bsBanner = `/*!
 * Lunara Bootstrap (lunara-css) v${pkg.version}
 * Night-sky Bootstrap 5.3+ theme — Lunara tokens, effects, motion, and moon
 * icons, applied to Bootstrap through its own --bs-* CSS variable API.
 * Load AFTER bootstrap.css. ${pkg.homepage || ''}
 * License: MIT
 */`;

  const tokens = collectLayer(root, 'lunar-base').filter(
    (n) => n.type === 'rule' && n.selector.trim() === ':root'
  );
  const themes = mirrorThemeSelectors(collectLayer(root, 'lunar-themes'));
  const properties = root.filter((n) => n.type === 'atrule' && n.name === 'property');
  // Effects carry a few [data-theme=…] rules of their own (e.g. daylight glass) — mirror those too.
  const effects = mirrorThemeSelectors(collectLayer(root, 'lunar-effects'));
  const motion = collectLayer(root, 'lunar-motion');
  const moonIcons = collectLayer(root, 'lunar-components').filter(
    (n) => n.type === 'rule' && n.selector.includes('.moon')
  );

  const bridge = fs.readFileSync(path.join(SRC_DIR, 'bootstrap.css'), 'utf8').trim();

  return [
    bsBanner,
    '/* ===== Lunara design tokens ===== */',
    serializeNodes(tokens),
    '/* ===== Theme blocks (data-theme + data-bs-theme) ===== */',
    serializeNodes(themes),
    serializeNodes(properties),
    '/* ===== Effect utilities ===== */',
    serializeNodes(effects),
    '/* ===== Scroll-driven motion ===== */',
    serializeNodes(motion),
    '/* ===== Moon-phase icons ===== */',
    serializeNodes(moonIcons),
    '/* ===== Bootstrap variable bridge ===== */',
    bridge,
    '',
  ].join('\n\n');
}

function buildTailwindMap(css) {
  const root = parseCss(css);

  const base = [];
  const components = [];
  const utilities = [];

  // Design tokens only — Lunara's element reset stays out of the way of
  // Tailwind's own preflight.
  for (const node of collectLayer(root, 'lunar-base')) {
    if (node.type === 'rule' && node.selector.trim() === ':root') base.push(node);
  }

  // Theme blocks: [data-theme=…] overrides and [data-moon-phase=…] moonlight dial.
  splitNodes(collectLayer(root, 'lunar-themes'), base, base);

  // @property registrations live at the top level, outside any layer.
  for (const node of root) {
    if (node.type === 'atrule' && node.name === 'property') base.push(node);
  }

  // Effects + scroll motion register as utilities (variant-friendly);
  // components register as components.
  splitNodes(collectLayer(root, 'lunar-effects'), base, utilities);
  splitNodes(collectLayer(root, 'lunar-motion'), base, utilities);
  splitNodes(collectLayer(root, 'lunar-components'), base, components);

  return {
    base: toObject(base),
    components: restructureBucket(components),
    utilities: restructureBucket(utilities),
  };
}

build();
