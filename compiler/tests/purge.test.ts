import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  selectorClasses,
  selectorMatches,
  serializeSelector,
  transformCss,
  type ClassRef,
  type Selector,
} from '../src/purge.ts';

/** Collect the selectors Lightning CSS reports for a stylesheet. */
function selectorsOf(css: string, cssModules = false): Selector[] {
  const out: Selector[] = [];
  transformCss({
    filename: 'test.css',
    code: css,
    minify: false,
    sourceMap: false,
    cssModules,
    onSelector: (sel) => out.push(sel),
  });
  return out;
}

function purge(css: string, used: string[], cssModules = false): string {
  const usedSet = new Set(used);
  return transformCss({
    filename: 'test.css',
    code: css,
    minify: true,
    sourceMap: false,
    cssModules,
    keep: (sel) => selectorMatches(sel, (ref: ClassRef) => usedSet.has(ref.name)),
  }).code;
}

describe('selector helpers', () => {
  test('serializeSelector renders common selectors', () => {
    const [sel] = selectorsOf('.a > .b:hover::before { color: red; }');
    assert.equal(serializeSelector(sel!), '.a > .b:hover::before');
  });

  test('selectorClasses finds classes inside :is()', () => {
    const [sel] = selectorsOf('.a:is(.b, .c) { color: red; }');
    assert.deepEqual(
      selectorClasses(sel!).map((c) => c.name),
      ['a', 'b', 'c'],
    );
  });

  test('classes inside :global() are flagged global', () => {
    const [sel] = selectorsOf(':global(.theme) .btn { color: red; }', true);
    assert.deepEqual(selectorClasses(sel!), [
      { name: 'theme', global: true },
      { name: 'btn', global: false },
    ]);
  });
});

describe('purging', () => {
  test('removes rules whose classes are unused', () => {
    const out = purge('.used { color: red; } .unused { color: blue; }', ['used']);
    assert.match(out, /\.used/);
    assert.doesNotMatch(out, /\.unused/);
  });

  test('drops only unused selectors from a selector list', () => {
    const out = purge('.used, .unused { color: red; }', ['used']);
    assert.equal(out.trim(), '.used{color:red}');
  });

  test('rules with var()-valued custom properties survive purging', () => {
    // Regression: `--a: var(--b)` cannot round-trip through the JS visitor
    // (Lightning CSS "expected Specifier" bug). Untouched rules must be left
    // alone rather than returned.
    const css = ':root { --lunar-bg: var(--moon-950); } .used { color: var(--lunar-bg); } .unused { top: 0; }';
    const out = purge(css, ['used']);
    assert.match(out, /--lunar-bg:\s*var\(--moon-950\)/);
    assert.match(out, /\.used/);
    assert.doesNotMatch(out, /\.unused/);
  });

  test('coarse fallback keeps a partially-used rule that cannot round-trip', () => {
    const css = '.used, .unused { --a: var(--b); } .gone { top: 0; }';
    const res = transformCss({
      filename: 'test.css',
      code: css,
      minify: true,
      sourceMap: false,
      cssModules: false,
      keep: (sel) => selectorMatches(sel, (ref) => ref.name === 'used'),
    });
    // The partially-used rule is kept whole (dead selector text is harmless);
    // fully-unused rules are still removed.
    assert.match(res.code, /\.used/);
    assert.match(res.code, /\.unused/);
    assert.doesNotMatch(res.code, /\.gone/);
    assert.ok(res.warnings.some((w) => /round-trip/.test(w)));
  });

  test('purges inside @media and drops emptied blocks', () => {
    const css = '@media (min-width: 600px) { .unused { color: red; } } .used { top: 0; }';
    const out = purge(css, ['used']);
    assert.doesNotMatch(out, /@media/);
    assert.match(out, /\.used/);
  });

  test('drops nested at-rules that all become empty', () => {
    const css =
      '@supports (display: grid) { @media print { .unused { color: red; } } } .used { top: 0; }';
    const out = purge(css, ['used']);
    assert.doesNotMatch(out, /@supports/);
    assert.doesNotMatch(out, /@media/);
    assert.match(out, /\.used/);
  });

  test('an emptied @layer block is kept (cascade order)', () => {
    const out = purge('@layer base { .unused { top: 0; } } .used { top: 0; }', ['used']);
    assert.match(out, /@layer base/);
    assert.doesNotMatch(out, /unused/);
  });

  test('descendant combinator requires every class', () => {
    const out = purge('.a .b { color: red; }', ['a']);
    assert.equal(out.trim(), '');
  });

  test(':not() never causes removal', () => {
    const out = purge('.used:not(.unused) { color: red; }', ['used']);
    assert.match(out, /\.used:not\(\.unused\)/);
  });

  test(':is() keeps the rule when one alternative survives', () => {
    const out = purge('.used:is(.unused, .used2) { color: red; }', ['used', 'used2']);
    assert.match(out, /:is/);
    const gone = purge('.used:is(.unused, .unused2) { color: red; }', ['used']);
    assert.equal(gone.trim(), '');
  });

  test('selectors without classes are always kept', () => {
    const out = purge('h1 { font-size: 2rem; } #app { margin: 0; } :root { --x: 1; }', []);
    assert.match(out, /h1/);
    assert.match(out, /#app/);
    assert.match(out, /:root/);
  });

  test('CSS Modules :global classes check the global flag', () => {
    const css = ':global(.theme-dark) .btn { color: white; }';
    const keepIfGlobalTheme = transformCss({
      filename: 'x.module.css',
      code: css,
      minify: true,
      sourceMap: false,
      cssModules: true,
      keep: (sel) =>
        selectorMatches(sel, (ref) => (ref.global ? ref.name === 'theme-dark' : ref.name === 'btn')),
    }).code;
    assert.match(keepIfGlobalTheme, /theme-dark/);
  });

  test('source map is produced on request', () => {
    const res = transformCss({
      filename: 'test.css',
      code: '.a { color: red; }',
      minify: true,
      sourceMap: true,
      cssModules: false,
      keep: () => true,
    });
    assert.ok(res.map);
    const map = JSON.parse(res.map!) as { sources: string[] };
    assert.deepEqual(map.sources, ['test.css']);
  });
});
