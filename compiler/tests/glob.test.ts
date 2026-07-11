import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, describe, test } from 'node:test';
import { expandBraces, globSync, globToRegExp, watchRoots } from '../src/glob.ts';

describe('expandBraces', () => {
  test('no braces returns pattern as-is', () => {
    assert.deepEqual(expandBraces('src/**/*.ts'), ['src/**/*.ts']);
  });

  test('expands simple alternation', () => {
    assert.deepEqual(expandBraces('src/**/*.{ts,tsx}'), ['src/**/*.ts', 'src/**/*.tsx']);
  });

  test('expands nested braces', () => {
    assert.deepEqual(expandBraces('a.{x,{y,z}}'), ['a.x', 'a.y', 'a.z']);
  });

  test('unbalanced brace is literal', () => {
    assert.deepEqual(expandBraces('a{b'), ['a{b']);
  });
});

describe('globToRegExp', () => {
  const matches = (glob: string, p: string): boolean => globToRegExp(glob).test(p);

  test('* stays within a segment', () => {
    assert.ok(matches('src/*.ts', 'src/a.ts'));
    assert.ok(!matches('src/*.ts', 'src/sub/a.ts'));
    assert.ok(!matches('src/*.ts', 'src/a.tsx'));
  });

  test('**/ matches zero or more directories', () => {
    assert.ok(matches('src/**/*.ts', 'src/a.ts'));
    assert.ok(matches('src/**/*.ts', 'src/x/y/a.ts'));
    assert.ok(!matches('src/**/*.ts', 'other/a.ts'));
  });

  test('leading **/ matches root files', () => {
    assert.ok(matches('**/*.css', 'a.css'));
    assert.ok(matches('**/*.css', 'x/a.css'));
  });

  test('? matches one non-separator char', () => {
    assert.ok(matches('a?.ts', 'ab.ts'));
    assert.ok(!matches('a?.ts', 'a/b.ts'));
  });

  test('regex special chars in names are literal', () => {
    assert.ok(matches('a+(b).ts', 'a+(b).ts'));
    assert.ok(!matches('a+(b).ts', 'aab.ts'));
  });
});

describe('globSync', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cssc-glob-'));
  fs.mkdirSync(path.join(tmp, 'src', 'sub'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'node_modules', 'pkg'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'src', 'a.ts'), '');
  fs.writeFileSync(path.join(tmp, 'src', 'sub', 'b.tsx'), '');
  fs.writeFileSync(path.join(tmp, 'src', 'sub', 'c.css'), '');
  fs.writeFileSync(path.join(tmp, 'node_modules', 'pkg', 'd.ts'), '');
  fs.writeFileSync(path.join(tmp, 'root.css'), '');

  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  test('resolves brace glob and skips node_modules', () => {
    const found = globSync(['src/**/*.{ts,tsx}'], tmp).map((f) => path.relative(tmp, f));
    assert.deepEqual(found.sort(), [path.join('src', 'a.ts'), path.join('src', 'sub', 'b.tsx')]);
  });

  test('literal path matches a single file', () => {
    const found = globSync(['root.css'], tmp);
    assert.deepEqual(found, [path.join(tmp, 'root.css')]);
  });

  test('missing literal path matches nothing', () => {
    assert.deepEqual(globSync(['nope.css'], tmp), []);
  });

  test('./ prefix is tolerated', () => {
    const found = globSync(['./src/**/*.css'], tmp);
    assert.deepEqual(found, [path.join(tmp, 'src', 'sub', 'c.css')]);
  });

  test('watchRoots folds nested bases into ancestors', () => {
    const roots = watchRoots(['src/**/*.ts', 'src/sub/*.css', 'root.css'], tmp);
    assert.deepEqual(roots, [tmp]);
  });

  test('watchRoots keeps sibling bases separate', () => {
    const roots = watchRoots(['src/**/*.ts', 'src/sub/*.css'], tmp);
    assert.deepEqual(roots, [path.join(tmp, 'src')]);
  });
});
