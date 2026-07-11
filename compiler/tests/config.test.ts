import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, describe, test } from 'node:test';
import { compileMatcher, ConfigError, loadConfigFile, resolveConfig } from '../src/config.ts';

describe('resolveConfig', () => {
  const cwd = process.cwd();

  test('applies zero-config defaults', () => {
    const config = resolveConfig(cwd, {});
    assert.deepEqual(config.content, ['src/**/*.{ts,tsx}']);
    assert.deepEqual(config.css, ['src/**/*.css']);
    assert.equal(config.outDir, path.resolve(cwd, 'dist'));
    assert.equal(config.minify, true);
    assert.equal(config.sourceMap, false);
    assert.equal(config.hash, false);
    assert.equal(config.failOnUnused, false);
  });

  test('CLI overrides file config, file config overrides defaults', () => {
    const config = resolveConfig(
      cwd,
      { outDir: 'from-file', minify: false, safelist: ['a'] },
      { outDir: 'from-cli', sourceMap: true },
    );
    assert.equal(config.outDir, path.resolve(cwd, 'from-cli'));
    assert.equal(config.minify, false); // from file
    assert.equal(config.sourceMap, true); // from CLI
    assert.deepEqual(config.safelist, ['a']);
  });

  test('string content is normalized to an array', () => {
    const config = resolveConfig(cwd, { content: 'app/**/*.tsx' });
    assert.deepEqual(config.content, ['app/**/*.tsx']);
  });
});

describe('loadConfigFile', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cssc-config-'));
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  test('missing default config file is fine', () => {
    const { config, warnings } = loadConfigFile(tmp);
    assert.deepEqual(config, {});
    assert.deepEqual(warnings, []);
  });

  test('missing explicit config file throws', () => {
    assert.throws(() => loadConfigFile(tmp, 'nope.json'), ConfigError);
  });

  test('reads config and warns on unknown keys', () => {
    fs.writeFileSync(
      path.join(tmp, 'css-compiler.config.json'),
      JSON.stringify({ outDir: 'out', typo: true }),
    );
    const { config, warnings } = loadConfigFile(tmp);
    assert.equal(config.outDir, 'out');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0]!, /typo/);
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
