/**
 * lunara 🌙 in-browser CSS compiler.
 *
 * Drop this script into a page while you build your site:
 *
 *     <script src="node_modules/@velo0-0/lunara-css/lunar-compiler.js" defer></script>
 *
 * It runs automatically — no CLI, no server, no build step:
 *
 *  1. collects every class your page actually uses (rendered DOM, <template>
 *     contents, and string literals in your same-origin scripts),
 *  2. swaps each stylesheet for a purged copy, so the page immediately runs
 *     on compiled CSS while you develop,
 *  3. keeps watching: classes added later (menus opening, JS toggles, SPA
 *     renders) instantly restore any rule they need,
 *  4. shows a badge with the savings; one click downloads the optimized
 *     stylesheets, ready to deploy.
 *
 * Purging is conservative, mirroring the Node optimizer: only classes
 * outside :not()/:is()/attribute brackets count as evidence, selectors
 * without classes are always kept, nested rules are kept whole, emptied
 * @media/@supports/@container blocks are dropped, and @layer blocks are
 * kept because they still declare cascade order.
 *
 * Options (attributes on the script tag):
 *     data-badge="off"      hide the savings badge
 *     data-scripts="off"    skip scanning scripts for class strings
 * Safelist: <meta name="lunara-safelist" content="visually-hidden /^toast-/">
 *
 * The file is a classic script (no imports) so it also works over file://;
 * in Node it exports its pure functions for testing via require().
 */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Pure helpers (exported for tests)
   * ------------------------------------------------------------------ */

  /** Split a selector list on top-level commas ("," inside (), [] or quotes stays). */
  function splitSelectorList(text) {
    const out = [];
    let depth = 0;
    let quote = null;
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) {
        out.push(text.slice(start, i).trim());
        start = i + 1;
      }
    }
    const last = text.slice(start).trim();
    if (last) out.push(last);
    return out;
  }

  /**
   * Class names appearing at the top level of one selector — classes inside
   * parentheses (:not, :is, :where, :has) or attribute brackets are ignored,
   * so they can never cause a removal (the conservative direction).
   */
  function classesInSelector(selector) {
    const classes = [];
    let depth = 0;
    let quote = null;
    for (let i = 0; i < selector.length; i++) {
      const ch = selector[i];
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
      else if (ch === '.' && depth === 0) {
        let j = i + 1;
        let name = '';
        while (j < selector.length) {
          const c = selector[j];
          if (c === '\\' && j + 1 < selector.length) {
            name += selector[j + 1];
            j += 2;
          } else if (/[-\w]/.test(c)) {
            name += c;
            j++;
          } else break;
        }
        if (name) classes.push(name);
        i = j - 1;
      }
    }
    return classes;
  }

  /** Keep a selector unless it references a top-level class that is unused. */
  function shouldKeepSelector(selector, isUsed) {
    return classesInSelector(selector).every(isUsed);
  }

  /**
   * Harvest class-name candidates from script source text. Over-collecting
   * is fine (it only makes purging more conservative), so every word-like
   * token inside a string literal counts, and `btn-${x}` template literals
   * contribute a "btn-" prefix pattern.
   */
  function scanScriptText(source) {
    const classes = new Set();
    const patterns = new Set();
    const literal = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
    for (const match of source.matchAll(literal)) {
      const text = match[1] ?? match[2] ?? match[3] ?? '';
      for (const token of text.matchAll(/-?[A-Za-z_][-A-Za-z0-9_]*/g)) classes.add(token[0]);
      if (match[3] !== undefined) {
        for (const pre of text.matchAll(/([A-Za-z_][-A-Za-z0-9_]*-)\$\{/g)) patterns.add(pre[1]);
      }
    }
    return { classes, patterns };
  }

  /** "a b /^toast-/" -> matcher; plain entries exact, /re/ entries regexes. */
  function compileSafelist(content) {
    const exact = new Set();
    const regexes = [];
    for (const entry of (content ?? '').split(/[\s,]+/).filter(Boolean)) {
      const re = /^\/(.+)\/([a-z]*)$/.exec(entry);
      if (re) {
        try {
          regexes.push(new RegExp(re[1], re[2]));
        } catch {
          /* ignore a bad pattern rather than break the page */
        }
      } else exact.add(entry);
    }
    return (name) => exact.has(name) || regexes.some((r) => r.test(name));
  }

  /**
   * Filter a CSSRuleList (or an array of rule-shaped objects) down to the
   * css text worth keeping. Duck-typed so tests can feed plain objects:
   * style rules have `selectorText`, grouping rules have `cssRules`.
   */
  function purgeRules(rules, isUsed) {
    const css = [];
    let total = 0;
    let removed = 0;
    for (const rule of rules) {
      if (rule.selectorText !== undefined) {
        const selectors = splitSelectorList(rule.selectorText);
        total += selectors.length;
        if (rule.cssRules && rule.cssRules.length > 0) {
          css.push(rule.cssText); // CSS nesting: keep parents whole
          continue;
        }
        const kept = selectors.filter((s) => shouldKeepSelector(s, isUsed));
        removed += selectors.length - kept.length;
        if (kept.length === selectors.length) css.push(rule.cssText);
        else if (kept.length > 0) css.push(`${kept.join(', ')} { ${rule.style.cssText} }`);
        continue;
      }
      if (rule.cssRules !== undefined && /^@(media|supports|container|layer|scope)/.test(rule.cssText)) {
        const inner = purgeRules(rule.cssRules, isUsed);
        total += inner.total;
        removed += inner.removed;
        const head = rule.cssText.slice(0, rule.cssText.indexOf('{')).trim();
        const isLayer = head.startsWith('@layer');
        // An emptied @media/@supports/... block is dropped; an emptied
        // @layer block still declares cascade order and stays.
        if (inner.css.length > 0 || isLayer) {
          css.push(`${head} {\n${inner.css.join('\n')}\n}`);
        }
        continue;
      }
      css.push(rule.cssText); // @font-face, @keyframes, @import, @property, ...
    }
    return { css, total, removed };
  }

  const api = { splitSelectorList, classesInSelector, shouldKeepSelector, scanScriptText, compileSafelist, purgeRules };

  // Node (tests): export the pure helpers and stop — no DOM work.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    return;
  }
  if (typeof document === 'undefined') return;

  /* ------------------------------------------------------------------ *
   * Browser runtime
   * ------------------------------------------------------------------ */

  const ownScript = document.currentScript;
  const wantBadge = ownScript?.dataset.badge !== 'off';
  const scanScripts = ownScript?.dataset.scripts !== 'off';

  const used = new Set();
  const patterns = new Set();
  const safelist = compileSafelist(
    document.querySelector('meta[name="lunara-safelist"]')?.getAttribute('content'),
  );
  const isUsed = (name) =>
    used.has(name) || safelist(name) || [...patterns].some((p) => name.startsWith(p));

  const harvestElement = (el) => {
    if (el.classList) for (const c of el.classList) used.add(c);
  };
  const harvestTree = (root) => {
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    harvestElement(root);
    const walk = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (const el of walk) {
      harvestElement(el);
      if (el.content) harvestTree(el.content); // <template>
    }
  };

  /** sheets we manage: { node, media, styleEl } */
  const managed = [];
  const stats = { originalBytes: 0, outputBytes: 0, total: 0, removed: 0 };

  const sheetName = (node, index) => {
    if (node.tagName === 'LINK' && node.href) {
      try {
        const base = new URL(node.href).pathname.split('/').pop() || 'styles.css';
        return base.replace(/\.css$/i, '');
      } catch {
        /* fall through */
      }
    }
    return `inline-${index + 1}`;
  };

  const collectSheets = () => {
    for (const sheet of document.styleSheets) {
      const node = sheet.ownerNode;
      if (!node || node.dataset?.lunara !== undefined) continue;
      if (managed.some((m) => m.node === node)) continue;
      let rules;
      try {
        rules = sheet.cssRules; // throws for cross-origin sheets
      } catch {
        continue;
      }
      if (!rules) continue;
      const styleEl = document.createElement('style');
      styleEl.dataset.lunara = 'optimized';
      if (sheet.media.mediaText) styleEl.media = sheet.media.mediaText;
      node.after(styleEl); // right after the original: cascade order intact
      managed.push({ node, sheet, styleEl, name: sheetName(node, managed.length) });
    }
  };

  const recompile = () => {
    collectSheets();
    stats.originalBytes = 0;
    stats.outputBytes = 0;
    stats.total = 0;
    stats.removed = 0;
    for (const entry of managed) {
      let rules;
      try {
        rules = entry.sheet.cssRules;
      } catch {
        continue;
      }
      const original = Array.from(rules, (r) => r.cssText).join('\n');
      const purged = purgeRules(rules, isUsed);
      const text = purged.css.join('\n');
      if (entry.styleEl.textContent !== text) entry.styleEl.textContent = text;
      entry.sheet.disabled = true;
      stats.originalBytes += original.length;
      stats.outputBytes += text.length;
      stats.total += purged.total;
      stats.removed += purged.removed;
    }
    updateBadge();
  };

  let timer = 0;
  const scheduleRecompile = () => {
    clearTimeout(timer);
    timer = setTimeout(recompile, 150);
  };

  /* ---------------------------- badge ------------------------------ */

  let badgeText = null;
  const percent = () =>
    stats.originalBytes > 0
      ? Math.round(((stats.originalBytes - stats.outputBytes) / stats.originalBytes) * 100)
      : 0;

  function updateBadge() {
    if (badgeText) {
      badgeText.textContent = `🌙 CSS −${percent()}% · ${stats.removed}/${stats.total} selectors · download`;
    }
  }

  function mountBadge() {
    if (!wantBadge) return;
    const host = document.createElement('div');
    host.dataset.lunara = 'badge';
    const root = host.attachShadow({ mode: 'open' });
    const button = document.createElement('button');
    button.setAttribute('style',
      'position:fixed;bottom:12px;right:12px;z-index:2147483647;cursor:pointer;' +
      'background:#0b0e1a;color:#dfe4f5;border:1px solid #222c4d;border-radius:99px;' +
      'padding:.45em 1em;font:12px/1.4 ui-monospace,Consolas,monospace;opacity:.92');
    button.title = 'lunara — download the optimized stylesheets';
    button.addEventListener('click', download);
    badgeText = button;
    root.append(button);
    document.body.append(host);
    updateBadge();
  }

  /** Download every optimized stylesheet, ready to deploy. */
  function download() {
    for (const entry of managed) {
      const text = entry.styleEl.textContent;
      if (!text) continue;
      const blob = new Blob([text], { type: 'text/css' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${entry.name}.lunara.css`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
  }

  function report() {
    return {
      sheets: managed.map((m) => ({ name: m.name, css: m.styleEl.textContent })),
      selectorTotal: stats.total,
      selectorsRemoved: stats.removed,
      originalBytes: stats.originalBytes,
      outputBytes: stats.outputBytes,
      usedClasses: [...used].sort(),
      patterns: [...patterns],
    };
  }

  /* --------------------------- startup ------------------------------ */

  async function scanAllScripts() {
    if (!scanScripts) return;
    const jobs = [];
    for (const script of document.querySelectorAll('script')) {
      if (script === ownScript) continue;
      if (script.src) {
        try {
          const url = new URL(script.src, location.href);
          if (url.origin !== location.origin) continue;
          jobs.push(fetch(url).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
        } catch {
          /* ignore */
        }
      } else if (script.textContent) {
        jobs.push(Promise.resolve(script.textContent));
      }
    }
    for (const source of await Promise.all(jobs)) {
      if (!source) continue;
      const found = scanScriptText(source);
      for (const c of found.classes) used.add(c);
      for (const p of found.patterns) patterns.add(p);
    }
  }

  function start() {
    harvestTree(document.documentElement);
    recompile();
    mountBadge();
    void scanAllScripts().then(scheduleRecompile);

    // Classes appearing later (menu opens, SPA render) restore their rules;
    // new stylesheets and removed nodes are picked up the same way.
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes') harvestElement(m.target);
        for (const node of m.addedNodes) harvestTree(node);
      }
      scheduleRecompile();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    // Console API.
    globalThis.lunara = Object.assign(globalThis.lunara ?? {}, {
      ...api,
      report,
      download,
      recompile,
      usedClasses: used,
    });
    console.info(
      `%clunara 🌙%c compiling in the browser — ${stats.removed} of ${stats.total} selectors ` +
        `purged (−${percent()}%). window.lunara.report() for details.`,
      'font-weight:bold',
      '',
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
