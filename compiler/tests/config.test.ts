import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, describe, test } from 'node:test';
import {
  compileMatcher,
  ConfigError,
  loadConfigFile,
  resolveConfig,
  resolveLunaraCss,
} from '../src/config.ts';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lunara-config-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('resolveConfig', () => {
  test('applies zero-config defaults', () => {
    const config = resolveConfig(tmp, {});
    assert.deepEqual(config.content, ['**/*.html', 'src/**/*.{ts,tsx,js,jsx}']);
    assert.deepEqual(config.css, ['src/**/*.css']); // no Lunara install in tmp
    assert.equal(config.outDir, path.resolve(tmp, 'dist'));
    assert.equal(config.minify, true);
    assert.equal(config.sourceMap, false);
    assert.equal(config.hash, false);
    assert.equal(config.port, 4321);
    assert.equal(config.host, '127.0.0.1');
  });

  test('CLI overrides file config, file config overrides defaults', () => {
    const config = resolveConfig(
      tmp,
      { outDir: 'from-file', minify: false, safelist: ['a'], port: 5000 },
      { outDir: 'from-cli', sourceMap: true },
    );
    assert.equal(config.outDir, path.resolve(tmp, 'from-cli'));
    assert.equal(config.minify, false); // from file
    assert.equal(config.sourceMap, true); // from CLI
    assert.equal(config.port, 5000); // from file
    assert.deepEqual(config.safelist, ['a']);
  });

  test('string content is normalized to an array', () => {
    const config = resolveConfig(tmp, { content: 'app/**/*.tsx' });
    assert.deepEqual(config.content, ['app/**/*.tsx']);
  });
});

describe('resolveLunaraCss', () => {
  test('detects the Lunara repo itself via package.json name', () => {
    const repo = path.join(tmp, 'repo');
    fs.mkdirSync(repo, { recursive: true });
    fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ name: '@velo0-0/lunara-css' }));
    assert.deepEqual(resolveLunaraCss(repo), ['dist/lunar.css']);
  });

  test('falls back to project CSS when Lunara is not installed', () => {
    assert.deepEqual(resolveLunaraCss(tmp), ['src/**/*.css']);
  });

  test('resolves an installed @velo0-0/lunara-css package', () => {
    const proj = path.join(tmp, 'consumer');
    const pkgDir = path.join(proj, 'node_modules', '@velo0-0', 'lunara-css');
    fs.mkdirSync(path.join(pkgDir, 'dist'), { recursive: true });
    fs.writeFileSync(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({
        name: '@velo0-0/lunara-css',
        version: '0.0.0',
        exports: { './lunar.css': './dist/lunar.css', './package.json': './package.json' },
      }),
    );
    fs.writeFileSync(path.join(pkgDir, 'dist', 'lunar.css'), '.btn{color:red}');
    const resolved = resolveLunaraCss(proj);
    assert.equal(resolved.length, 1);
    assert.equal(path.resolve(resolved[0]!), path.join(pkgDir, 'dist', 'lunar.css'));
  });
});

describe('loadConfigFile', () => {
  test('missing default config file is fine', () => {
    const { config, warnings } = loadConfigFile(tmp);
    assert.deepEqual(config, {});
    assert.deepEqual(warnings, []);
  });

  test('missing explicit config file throws', () => {
    assert.throws(() => loadConfigFile(tmp, 'nope.json'), ConfigError);
  });

  test('reads lunara.config.json and warns on unknown keys', () => {
    fs.writeFileSync(
      path.join(tmp, 'lunara.config.json'),
      JSON.stringify({ outDir: 'out', port: 9000, typo: true }),
    );
    const { config, warnings } = loadConfigFile(tmp);
    assert.equal(config.outDir, 'out');
    assert.equal(config.port, 9000);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0]!, /typo/);
    fs.rmSync(path.join(tmp, 'lunara.config.json'));
  });

  test('invalid JSON throws ConfigError', () => {
    fs.writeFileSync(path.join(tmp, 'bad.json'), '{oops');
    assert.throws(() => loadConfigFile(tmp, 'bad.json'), ConfigError);
  });
});

describe('compileMatcher', () => {
  test('plain strings match exactly', () => {
    const m = compileMatcher(['btn', 'card']);
    assert.ok(m.test('btn'));
    assert.ok(!m.test('btn-primary'));
  });

  test('slash-wrapped entries are regexes', () => {
    const m = compileMatcher(['/^toast-/']);
    assert.ok(m.test('toast-error'));
    assert.ok(!m.test('untoast-error'));
  });

  test('regex flags are honored', () => {
    const m = compileMatcher(['/^BTN$/i']);
    assert.ok(m.test('btn'));
  });

  test('invalid regex throws ConfigError', () => {
    assert.throws(() => compileMatcher(['/[/']), ConfigError);
  });

  test('empty matcher reports empty', () => {
    assert.equal(compileMatcher([]).empty, true);
    assert.equal(compileMatcher(['x']).empty, false);
  });
});
