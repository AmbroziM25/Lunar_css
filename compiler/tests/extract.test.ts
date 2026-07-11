import assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, test } from 'node:test';
import { extractFile, mergeUsage, normalizePath } from '../src/extract.ts';

const FILE = path.resolve('src/App.tsx');

function extract(code: string) {
  return extractFile(FILE, code, process.cwd());
}

describe('static class extraction', () => {
  test('string className', () => {
    const u = extract(`export const A = () => <div className="btn btn-primary large" />;`);
    assert.deepEqual([...u.classes].sort(), ['btn', 'btn-primary', 'large']);
    assert.equal(u.warnings.length, 0);
  });

  test('JSX expression with string literal and template', () => {
    const u = extract('const A = () => <div className={`card shadow`} />;');
    assert.deepEqual([...u.classes].sort(), ['card', 'shadow']);
  });

  test('class attribute (Preact/Solid) is also read', () => {
    const u = extract(`const A = () => <div class="solid-item" />;`);
    assert.ok(u.classes.has('solid-item'));
  });

  test('conditional expression collects both branches', () => {
    const u = extract(`const A = (on: boolean) => <div className={on ? 'on' : 'off'} />;`);
    assert.deepEqual([...u.classes].sort(), ['off', 'on']);
    assert.equal(u.warnings.length, 0);
  });

  test('const identifier resolves through same-file initializer', () => {
    const u = extract(`
      const base = 'btn';
      export const A = () => <div className={base} />;
    `);
    assert.ok(u.classes.has('btn'));
    assert.equal(u.warnings.length, 0);
  });
});

describe('clsx / classnames calls', () => {
  test('collects strings, && guards, objects and arrays', () => {
    const u = extract(`
      import clsx from 'clsx';
      declare const cond: boolean;
      const A = () => (
        <div className={clsx('a', cond && 'b', { c: cond, 'd e': cond }, ['f', cond ? 'g' : 'h'])} />
      );
    `);
    assert.deepEqual([...u.classes].sort(), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    assert.equal(u.warnings.length, 0);
  });

  test('cn call outside JSX is analyzed too', () => {
    const u = extract(`
      import { cn } from './utils';
      export const cls = cn('standalone', 'pair');
    `);
    assert.deepEqual([...u.classes].sort(), ['pair', 'standalone']);
  });

  test('shorthand object property counts as class', () => {
    const u = extract(`
      import clsx from 'clsx';
      declare const active: boolean;
      const A = () => <div className={clsx({ active })} />;
    `);
    assert.ok(u.classes.has('active'));
  });
});

describe('template literals and dynamic patterns', () => {
  test('static tokens plus prefix pattern', () => {
    const u = extract(`
      declare const size: string;
      const A = () => <div className={\`btn btn-\${size}\`} />;
    `);
    assert.ok(u.classes.has('btn'));
    assert.deepEqual(
      u.patterns.map((p) => [p.prefix, p.suffix]),
      [['btn-', '']],
    );
  });

  test('prefix and suffix around an expression', () => {
    const u = extract(`
      declare const dir: string;
      const A = () => <div className={\`icon-\${dir}-solid\`} />;
    `);
    assert.deepEqual(
      u.patterns.map((p) => [p.prefix, p.suffix]),
      [['icon-', '-solid']],
    );
  });

  test('resolvable interpolation expands to concrete classes', () => {
    const u = extract(`
      declare const small: boolean;
      const size = small ? 'sm' : 'lg';
      const A = () => <div className={\`btn-\${size}\`} />;
    `);
    assert.deepEqual([...u.classes].sort(), ['btn-lg', 'btn-sm']);
    assert.equal(u.patterns.length, 0);
  });

  test('string concatenation infers a pattern', () => {
    const u = extract(`
      declare const variant: string;
      const A = () => <div className={'chip-' + variant} />;
    `);
    assert.deepEqual(
      u.patterns.map((p) => [p.prefix, p.suffix]),
      [['chip-', '']],
    );
  });

  test('fully opaque token produces a warning, not a pattern', () => {
    const u = extract(`
      declare function theme(): string;
      const A = () => <div className={\`\${theme()}\`} />;
    `);
    assert.equal(u.patterns.length, 0);
    assert.equal(u.warnings.length, 1);
  });
});

describe('dynamic warnings', () => {
  test('unknown call expression warns with location', () => {
    const u = extract(`
      declare function getCls(): string;
      const A = () => <div className={getCls()} />;
    `);
    assert.equal(u.warnings.length, 1);
    assert.match(u.warnings[0]!.loc, /App\.tsx:3:39$/);
    assert.match(u.warnings[0]!.snippet, /getCls\(\)/);
  });

  test('props passthrough does not warn', () => {
    const u = extract(`
      const A = (props: { className?: string }) => <div className={props.className} />;
    `);
    assert.equal(u.warnings.length, 0);
  });

  test('bare className identifier passthrough does not warn', () => {
    const u = extract(`
      const A = ({ className }: { className?: string }) => <div className={className} />;
    `);
    assert.equal(u.warnings.length, 0);
  });
});

describe('CSS Modules', () => {
  const MODULE_KEY = normalizePath(path.resolve(path.dirname(FILE), './button.module.css'));

  test('property and element access record refs', () => {
    const u = extract(`
      import styles from './button.module.css';
      const A = () => <button className={styles.btn}><i className={styles['icon']} /></button>;
    `);
    assert.deepEqual([...(u.moduleRefs.get(MODULE_KEY) ?? [])].sort(), ['btn', 'icon']);
    assert.equal(u.wholeModules.size, 0);
    assert.equal(u.warnings.length, 0);
  });

  test('named imports record refs', () => {
    const u = extract(`
      import { title as t, body } from './button.module.css';
      export const x = [t, body];
    `);
    assert.deepEqual([...(u.moduleRefs.get(MODULE_KEY) ?? [])].sort(), ['body', 'title']);
  });

  test('opaque use of the import keeps the whole module', () => {
    const u = extract(`
      import styles from './button.module.css';
      export const all = Object.values(styles);
    `);
    assert.ok(u.wholeModules.has(MODULE_KEY));
  });

  test('dynamic key access keeps the whole module', () => {
    const u = extract(`
      import styles from './button.module.css';
      declare const k: string;
      const A = () => <div className={styles[k]} />;
    `);
    assert.ok(u.wholeModules.has(MODULE_KEY));
  });

  test('resolvable computed key records concrete refs', () => {
    const u = extract(`
      import styles from './button.module.css';
      declare const big: boolean;
      const A = () => <div className={styles[big ? 'lg' : 'sm']} />;
    `);
    assert.deepEqual([...(u.moduleRefs.get(MODULE_KEY) ?? [])].sort(), ['lg', 'sm']);
    assert.equal(u.wholeModules.size, 0);
  });

  test('non-relative module import warns', () => {
    const u = extract(`import styles from '@app/x.module.css';`);
    assert.equal(u.warnings.length, 1);
    assert.match(u.warnings[0]!.snippet, /unresolvable CSS Module import/);
  });
});

describe('mergeUsage', () => {
  test('merges classes, modules and dedupes patterns', () => {
    const a = extract(`
      declare const v: string;
      const A = () => <div className={\`x-\${v}\`} />;
    `);
    const b = extract(`
      declare const v: string;
      const B = () => <div className={\`x-\${v} solo\`} />;
    `);
    const merged = mergeUsage([a, b]);
    assert.equal(merged.sourceFiles, 2);
    assert.ok(merged.global.has('solo'));
    assert.equal(merged.patterns.length, 1);
  });
});
