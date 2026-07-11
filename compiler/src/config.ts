import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import type { ResolvedConfig, UserConfig } from './types.ts';

export const CONFIG_FILE = 'lunara.config.json';

/** The package whose stylesheet is optimized when no css globs are given. */
export const LUNARA_PACKAGE = '@velo0-0/lunara-css';

export const DEFAULTS = {
  content: ['**/*.html', 'src/**/*.{ts,tsx,js,jsx}'],
  outDir: 'dist',
  safelist: [] as string[],
  critical: [] as string[],
  minify: true,
  sourceMap: false,
  hash: false,
  failOnUnused: false,
  clean: false,
};

/**
 * Default CSS input when none is configured:
 * 1. the installed @velo0-0/lunara-css stylesheet (the normal consumer case),
 * 2. dist/lunar.css when running inside the Lunara repo itself,
 * 3. any project CSS under src/ as a generic fallback.
 */
export function resolveLunaraCss(cwd: string): string[] {
  try {
    const req = createRequire(path.join(cwd, 'noop.js'));
    return [req.resolve(`${LUNARA_PACKAGE}/lunar.css`)];
  } catch {
    /* not installed here */
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8')) as {
      name?: string;
    };
    if (pkg.name === LUNARA_PACKAGE) return ['dist/lunar.css'];
  } catch {
    /* no package.json */
  }
  return ['src/**/*.css'];
}

const KNOWN_KEYS = new Set([
  'content',
  'css',
  'outDir',
  'safelist',
  'critical',
  'minify',
  'sourceMap',
  'hash',
  'failOnUnused',
  'clean',
]);

export class ConfigError extends Error {}

function toArray(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

/**
 * Load css-compiler.config.json if present (or the explicitly given path).
 * Returns the parsed config plus warnings for unknown keys.
 */
export function loadConfigFile(
  cwd: string,
  explicitPath?: string,
): { config: UserConfig; path?: string; warnings: string[] } {
  const file = explicitPath
    ? path.resolve(cwd, explicitPath)
    : path.resolve(cwd, CONFIG_FILE);
  if (!fs.existsSync(file)) {
    if (explicitPath) throw new ConfigError(`Config file not found: ${file}`);
    return { config: {}, warnings: [] };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new ConfigError(`Failed to parse ${file}: ${(e as Error).message}`);
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ConfigError(`${file} must contain a JSON object`);
  }
  const warnings: string[] = [];
  for (const key of Object.keys(raw)) {
    if (!KNOWN_KEYS.has(key)) warnings.push(`Unknown config key "${key}" in ${path.basename(file)}`);
  }
  return { config: raw as UserConfig, path: file, warnings };
}

export interface CliOverrides extends UserConfig {
  watch?: boolean;
  verbose?: boolean;
}

/** Merge defaults < config file < CLI flags into a ResolvedConfig. */
export function resolveConfig(
  cwd: string,
  fileConfig: UserConfig,
  cli: CliOverrides = {},
): ResolvedConfig {
  const pick = <T>(cliVal: T | undefined, fileVal: T | undefined, def: T): T =>
    cliVal !== undefined ? cliVal : fileVal !== undefined ? fileVal : def;

  const outDir = pick(cli.outDir, fileConfig.outDir, DEFAULTS.outDir);
  return {
    cwd,
    content: pick(toArray(cli.content), toArray(fileConfig.content), DEFAULTS.content),
    css: pick(toArray(cli.css), toArray(fileConfig.css), resolveLunaraCss(cwd)),
    outDir: path.resolve(cwd, outDir),
    safelist: pick(cli.safelist, fileConfig.safelist, DEFAULTS.safelist),
    critical: pick(cli.critical, fileConfig.critical, DEFAULTS.critical),
    minify: pick(cli.minify, fileConfig.minify, DEFAULTS.minify),
    sourceMap: pick(cli.sourceMap, fileConfig.sourceMap, DEFAULTS.sourceMap),
    hash: pick(cli.hash, fileConfig.hash, DEFAULTS.hash),
    failOnUnused: pick(cli.failOnUnused, fileConfig.failOnUnused, DEFAULTS.failOnUnused),
    clean: pick(cli.clean, fileConfig.clean, DEFAULTS.clean),
    watch: cli.watch ?? false,
    verbose: cli.verbose ?? false,
  };
}

/**
 * A matcher over safelist/critical entries. Plain strings match exactly;
 * "/re/flags" entries are regular expressions.
 */
export interface Matcher {
  test(value: string): boolean;
  readonly empty: boolean;
}

export function compileMatcher(entries: string[]): Matcher {
  const exact = new Set<string>();
  const regexes: RegExp[] = [];
  for (const entry of entries) {
    const m = /^\/(.+)\/([a-z]*)$/.exec(entry);
    if (m) {
      try {
        regexes.push(new RegExp(m[1]!, m[2]));
      } catch (e) {
        throw new ConfigError(`Invalid pattern ${entry}: ${(e as Error).message}`);
      }
    } else {
      exact.add(entry);
    }
  }
  return {
    empty: exact.size === 0 && regexes.length === 0,
    test(value: string): boolean {
      if (exact.has(value)) return true;
      return regexes.some((r) => r.test(value));
    },
  };
}
