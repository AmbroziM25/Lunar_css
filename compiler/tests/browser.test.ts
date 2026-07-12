import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, test } from 'node:test';

/** The in-browser compiler is a classic script; in Node it exports via CJS. */
const require = createRequire(import.meta.url);
const {
  splitSelectorList,
  classesInSelector,
  shouldKeepSelector,
  scanScriptText,
  compileSafelist,
  purgeRules,
} = require('../../lunar-compiler.js') as {
  splitSelectorList(text: string): string[];
  classesInSelector(selector: string): string[];
  shouldKeepSelector(selector: string, isUsed: (name: string) => boolean): boolean;
  scanScriptText(source: string): { classes: Set<string>; patterns: Set<string> };
  compileSafelist(content?: string | null): (name: string) => boolean;
  purgeRules(
    rules: unknown[],
    isUsed: (name: string) => boolean,
  ): { css: string[]; total: number; removed: number };
};

describe('splitSelectorList', () => {
  test('splits on top-level commas only', () => {
    assert.deepEqual(splitSelectorList('.a, .b'), ['.a', '.b']);
    assert.deepEqual(splitSelectorList('.a:is(.b, .c), .d'), ['.a:is(.b, .c)', '.d']);
    assert.deepEqual(splitSelectorList('[data-x=","] .a, .b'), ['[data-x=","] .a', '.b']);
    assert.deepEqual(splitSelectorList('.solo'), ['.solo']);
  });
});

describe('classesInSelector', () => {
  test('collects top-level classes', () => {
    assert.deepEqual(classesInSelector('.btn.primary > .icon'), ['btn', 'primary', 'icon']);
  });
  test('ignores classes inside :not/:is/attribute brackets', () => {
    assert.deepEqual(classesInSelector('.a:not(.b)'), ['a']);
    assert.deepEqual(classesInSelector('.a:is(.b, .c)'), ['a']);
    assert.deepEqual(classesInSelector('div[class~=".x"] .y'), ['y']);
  });
  test('handles escapes and selectors without classes', () => {
    assert.deepEqual(classesInSelector('.hover\\:lift'), ['hover:lift']);
    assert.deepEqual(classesInSelector('h1, #app'), []);
  });
});

describe('shouldKeepSelector', () => {
  const isUsed = (name: string) => name === 'hero' || name === 'nav';
  test('keeps used, drops unused, keeps class-free selectors', () => {
    assert.equal(shouldKeepSelector('.hero .nav', isUsed), true);
    assert.equal(shouldKeepSelector('.hero .gone', isUsed), false);
    assert.equal(shouldKeepSelector('body > h1', isUsed), true);
    assert.equal(shouldKeepSelector('.hero:not(.gone)', isUsed), true);
  });
});

describe('scanScriptText', () => {
  test('collects tokens from string literals', () => {
    const { classes } = scanScriptText(`el.className = 'btn primary'; x.classList.add("open");`);
    assert.ok(classes.has('btn'));
    assert.ok(classes.has('primary'));
    assert.ok(classes.has('open'));
  });
  test('template interpolations become prefix patterns', () => {
    const { patterns } = scanScriptText('el.className = `chip chip-${tone}`;');
    assert.ok(patterns.has('chip-'));
  });
  test('does not scan outside literals', () => {
    const { classes } = scanScriptText('const veryUniqueIdentifier = 1;');
    assert.equal(classes.has('veryUniqueIdentifier'), false);
  });
});

describe('compileSafelist', () => {
  test('plain entries exact, /re/ entries regex, bad regex ignored', () => {
    const match = compileSafelist('keep-me /^toast-/ /(/');
    assert.equal(match('keep-me'), true);
    assert.equal(match('toast-error'), true);
    assert.equal(match('other'), false);
    assert.equal(compileSafelist(null)('x'), false);
  });
});

/* Duck-typed rule objects mirroring the CSSOM shapes purgeRules reads. */
function styleRule(selectorText: string, body = 'color: red;') {
  return { selectorText, style: { cssText: body }, cssText: `${selectorText} { ${body} }` };
}
function groupRule(head: string, rules: unknown[]) {
  return { cssRules: rules, cssText: `${head} { … }` };
}

describe('purgeRules', () => {
  const isUsed = (name: string) => name === 'hero';

  test('drops rules whose classes are unused, keeps the rest', () => {
    const { css, total, removed } = purgeRules(
      [styleRule('.hero'), styleRule('.gone'), styleRule('h1')],
      isUsed,
    );
    assert.equal(css.length, 2);
    assert.equal(total, 3);
    assert.equal(removed, 1);
    assert.ok(css[0]!.includes('.hero'));
    assert.ok(css[1]!.includes('h1'));
  });

  test('drops only the unused selectors from a list', () => {
    const { css } = purgeRules([styleRule('.hero, .gone')], isUsed);
    assert.equal(css.length, 1);
    assert.ok(css[0]!.startsWith('.hero {'));
    assert.ok(!css[0]!.includes('.gone'));
  });

  test('purges inside @media and drops emptied blocks', () => {
    const kept = purgeRules(
      [groupRule('@media (min-width: 600px)', [styleRule('.hero')])],
      isUsed,
    );
    assert.equal(kept.css.length, 1);
    assert.ok(kept.css[0]!.includes('.hero'));

    const emptied = purgeRules(
      [groupRule('@media (min-width: 600px)', [styleRule('.gone')])],
      isUsed,
    );
    assert.equal(emptied.css.length, 0);
  });

  test('an emptied @layer block is kept (cascade order)', () => {
    const { css } = purgeRules([groupRule('@layer components', [styleRule('.gone')])], isUsed);
    assert.equal(css.length, 1);
    assert.ok(css[0]!.startsWith('@layer components'));
  });

  test('rules with nested child rules are kept whole', () => {
    const nested = {
      selectorText: '.gone',
      style: { cssText: 'color: red;' },
      cssRules: [styleRule('&:hover')],
      cssText: '.gone { color: red; &:hover { color: blue; } }',
    };
    const { css } = purgeRules([nested], isUsed);
    assert.equal(css.length, 1);
  });

  test('unknown rules (@font-face, @keyframes) pass through', () => {
    const fontFace = { cssText: '@font-face { font-family: x; }' };
    const { css } = purgeRules([fontFace], isUsed);
    assert.deepEqual(css, ['@font-face { font-family: x; }']);
  });
});
