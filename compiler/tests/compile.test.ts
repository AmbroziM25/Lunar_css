import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { compileOnce, compileString, outputNames, PipelineError } from '../src/compile.ts';
import { resolveConfig } from '../src/config.ts';
import { extractFile, mergeUsage } from '../src/extract.ts';

const APP_TSX = `
import clsx from 'clsx';
import styles from './button.module.css';
declare const active: boolean;
declare const kind: string;
export const App = () => (
  <main className="hero layout">
    <nav className={clsx('nav', active && 'nav-open')} />
    <button className={styles.btn}>Go</button>
    <span className={\`badge-\${active ? 'on' : 'off'} tag-\${kind}\`} />
  </main>
);
`;

const STYLES_CSS = `
.hero { color: red; }
.layout { display: grid; }
.nav { top: 0; }
.nav-open { left: 0; }
.badge-on { color: green; }
.badge-off { color: gray; }
.tag-alpha { color: blue; }
.unused-1 { color: black; }
@media (min-width: 600px) {
  .unused-2 { color: white; }
  .hero { padding: 2rem; }
}
.keep-me-anyway { border: 1px solid; }
h1 { font-weight: bold; }
`;

const BUTTON_MODULE_CSS = `
.btn { color: red; }
.btn:hover { color: blue; }
.unused-mod { top: 0; }
`;

function makeFixture(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cssc-e2e-'));
  fs.mkdirSync(path.join(tmp, 'src'));
  fs.writeFileSync(path.join(tmp, 'src', 'App.tsx'), APP_TSX);
  fs.writeFileSync(path.join(tmp, 'src', 'styles.css'), STYLES_CSS);
  fs.writeFileSync(path.join(tmp, 'src', 'button.module.css'), BUTTON_MODULE_CSS);
  return tmp;
}

describe('compileOnce (end to end)', () => {
  let tmp: string;
  before(() => {
    tmp = makeFixture();
  });
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  test('zero-config compile purges, minifies, reports and writes source maps', () => {
    const config = resolveConfig(tmp, {}, { sourceMap: true, safelist: ['/^keep-/'] });
    const result = compileOnce(config);

    const main = fs.readFileSync(path.join(tmp, 'dist', 'styles.css'), 'utf8');
    for (const kept of ['.hero', '.layout', '.nav-open', '.badge-on', '.badge-off', '.tag-alpha', '.keep-me-anyway', 'h1']) {
      assert.match(main, new RegExp(kept.replace('.', '\\.')), `expected ${kept} in output`);
    }
    assert.doesNotMatch(main, /unused-1/);
    assert.doesNotMatch(main, /unused-2/);

    const mod = fs.readFileSync(path.join(tmp, 'dist', 'button.module.css'), 'utf8');
    assert.match(mod, /\.btn/);
    assert.match(mod, /\.btn:hover/);
    assert.doesNotMatch(mod, /unused-mod/);

    // Stats: 12 selectors in styles.css + 3 in the module; 3 unused.
    assert.equal(result.totals.selectorTotal, 15);
    assert.equal(result.totals.selectorsRemoved, 3);
    const styleFile = result.files.find((f) => f.input.endsWith('styles.css'))!;
    assert.deepEqual(styleFile.removedSelectors.sort(), ['.unused-1', '.unused-2']);
    assert.ok(result.totals.outputBytes < result.totals.originalBytes);
    assert.ok(result.totals.gzip > 0 && result.totals.brotli > 0);

    // Source maps: file written, comment appended, `file` field set.
    assert.match(main, /sourceMappingURL=styles\.css\.map/);
    const map = JSON.parse(fs.readFileSync(path.join(tmp, 'dist', 'styles.css.map'), 'utf8')) as {
      file: string;
      sources: string[];
    };
    assert.equal(map.file, 'styles.css');
    assert.deepEqual(map.sources, ['src/styles.css']);

    // Manifest maps inputs to outputs.
    const manifest = JSON.parse(fs.readFileSync(path.join(tmp, 'dist', 'manifest.json'), 'utf8')) as Record<
      string,
      { main?: string }
    >;
    assert.equal(manifest['src/styles.css']!.main, 'styles.css');
    assert.equal(manifest['src/button.module.css']!.main, 'button.module.css');

    // Dynamic pattern tag-* kept .tag-alpha and was reported.
    assert.equal(result.usage.patterns.length, 1);
    assert.equal(result.usage.patterns[0]!.prefix, 'tag-');
  });

  test('hashed filenames for cache busting', () => {
    const config = resolveConfig(tmp, {}, { hash: true, outDir: 'dist-hash' });
    const result = compileOnce(config);
    const styleFile = result.files.find((f) => f.input.endsWith('styles.css'))!;
    const name = styleFile.outputs[0]!.fileName;
    assert.match(name, /^styles\.[0-9a-f]{8}\.css$/);
    assert.ok(fs.existsSync(path.join(tmp, 'dist-hash', name)));
    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmp, 'dist-hash', 'manifest.json'), 'utf8'),
    ) as Record<string, { main?: string }>;
    assert.equal(manifest['src/styles.css']!.main, name);
  });

  test('critical split writes critical + deferred outputs', () => {
    const config = resolveConfig(tmp, {}, { critical: ['/^(hero|layout)$/'], outDir: 'dist-crit' });
    const result = compileOnce(config);
    const styleFile = result.files.find((f) => f.input.endsWith('styles.css'))!;
    assert.equal(styleFile.outputs.length, 2);
    assert.equal(styleFile.criticalSelectors, 3); // .hero, .layout, .hero in @media

    const critical = fs.readFileSync(path.join(tmp, 'dist-crit', 'styles.critical.css'), 'utf8');
    const deferred = fs.readFileSync(path.join(tmp, 'dist-crit', 'styles.css'), 'utf8');
    assert.match(critical, /\.hero/);
    assert.match(critical, /\.layout/);
    assert.match(critical, /@media/); // .hero rule inside the media query
    assert.doesNotMatch(critical, /\.nav/);
    assert.doesNotMatch(deferred, /\.hero/);
    assert.match(deferred, /\.nav/);
    assert.doesNotMatch(deferred, /unused-1/);
    // The module has no critical rules: single output.
    const modFile = result.files.find((f) => f.isModule)!;
    assert.equal(modFile.outputs.length, 1);
  });

  test('clean removes stale outputs', () => {
    const outDir = path.join(tmp, 'dist-clean');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'stale.abcd1234.css'), '.old{}');
    const config = resolveConfig(tmp, {}, { outDir: 'dist-clean', clean: true });
    compileOnce(config);
    assert.ok(!fs.existsSync(path.join(outDir, 'stale.abcd1234.css')));
    assert.ok(fs.existsSync(path.join(outDir, 'styles.css')));
  });

  test('refuses to purge when no content files match', () => {
    const config = resolveConfig(tmp, {}, { content: ['nothing/**/*.ts'] });
    assert.throws(() => compileOnce(config), PipelineError);
  });
});

describe('outputNames', () => {
  test('flattens to basenames, disambiguating collisions', () => {
    const cwd = path.resolve('proj');
    const a = path.join(cwd, 'src', 'app.css');
    const b = path.join(cwd, 'src', 'theme', 'app.css');
    const c = path.join(cwd, 'src', 'other.css');
    const names = outputNames([a, b, c], cwd);
    assert.equal(names.get(c), 'other');
    assert.equal(names.get(a), 'src-app');
    assert.equal(names.get(b), 'src-theme-app');
  });
});

describe('clobber guard', () => {
  test('an input inside outDir is written as <name>.optimized.css', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lunara-clobber-'));
    try {
      fs.mkdirSync(path.join(tmp, 'src'));
      fs.mkdirSync(path.join(tmp, 'dist'));
      fs.writeFileSync(path.join(tmp, 'src', 'index.html'), '<div class="used"></div>');
      const original = '.used { color: red; } .unused { color: blue; }';
      fs.writeFileSync(path.join(tmp, 'dist', 'lunar.css'), original);
      const config = resolveConfig(tmp, {}, { css: ['dist/lunar.css'] });
      const result = compileOnce(config);
      // The input is untouched; the optimized copy sits next to it.
      assert.equal(fs.readFileSync(path.join(tmp, 'dist', 'lunar.css'), 'utf8'), original);
      const optimized = fs.readFileSync(path.join(tmp, 'dist', 'lunar.optimized.css'), 'utf8');
      assert.match(optimized, /\.used/);
      assert.doesNotMatch(optimized, /\.unused/);
      assert.equal(result.files[0]!.outputs[0]!.fileName, 'lunar.optimized.css');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('compileString', () => {
  test('compiles in memory against extracted usage', () => {
    const usage = mergeUsage([
      extractFile(path.resolve('virtual/App.tsx'), `export const A = () => <div className="hero" />;`),
    ]);
    const result = compileString({
      code: '.hero { color: red; } .unused { color: blue; }',
      usage,
    });
    assert.equal(result.outputs.length, 1);
    assert.match(result.outputs[0]!.code, /\.hero/);
    assert.doesNotMatch(result.outputs[0]!.code, /\.unused/);
    assert.equal(result.selectorsRemoved, 1);
    assert.deepEqual(result.removedSelectors, ['.unused']);
  });

  test('honors safelist and critical split', () => {
    const usage = mergeUsage([
      extractFile(path.resolve('virtual/page.html'), '<header class="hero"></header>'),
    ]);
    const result = compileString({
      code: '.hero { color: red; } .toast-x { color: green; } .gone { top: 0; }',
      usage,
      safelist: ['/^toast-/'],
      critical: ['hero'],
    });
    assert.equal(result.outputs.length, 2);
    const critical = result.outputs.find((o) => o.kind === 'critical')!;
    const main = result.outputs.find((o) => o.kind === 'main')!;
    assert.match(critical.code, /\.hero/);
    assert.match(main.code, /\.toast-x/);
    assert.doesNotMatch(main.code, /\.gone/);
  });
});
