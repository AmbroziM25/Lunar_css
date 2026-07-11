#!/usr/bin/env node
import * as fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { compileOnce, PipelineError } from './compile.ts';
import { ConfigError, loadConfigFile, resolveConfig, type CliOverrides } from './config.ts';
import { printReport, red, yellow } from './report.ts';

const HELP = `css-compiler — purge, minify, split and fingerprint CSS from TS/TSX class usage

Usage
  css-compiler [options]

Options
  -c, --config <file>      Config file (default: css-compiler.config.json)
      --content <glob>     TS/TSX files to scan (repeatable / comma-separated)
                           default: src/**/*.{ts,tsx}
      --css <glob>         CSS files to compile (repeatable / comma-separated)
                           default: src/**/*.css
  -o, --out-dir <dir>      Output directory (default: dist)
      --safelist <name>    Class to always keep; "/re/" for regex (repeatable)
      --critical <name>    Pattern marking critical (above-the-fold) rules;
                           splits output into <name>.critical.css + <name>.css
      --[no-]minify        Minify output (default: on)
      --source-map         Emit .css.map source maps
      --[no-]hash          Content-hash output filenames (default: off)
      --clean              Delete old .css/.css.map/manifest.json from out dir
  -w, --watch              Watch and rebuild incrementally
      --fail-on-unused     Exit 1 when unused selectors are found (CI)
      --verbose            List removed selectors, patterns and all warnings
  -h, --help               Show this help
  -v, --version            Show version

Examples
  css-compiler                                  # zero config
  css-compiler --css "styles/**/*.css" -o build --source-map --hash
  css-compiler --safelist "/^toast-/" --fail-on-unused
  css-compiler --critical "/^(hero|nav)/" --watch
`;

function commaSplit(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  const out = values.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
  return out.length > 0 ? out : undefined;
}

export async function main(argv: string[]): Promise<number> {
  let values: Record<string, unknown>;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        config: { type: 'string', short: 'c' },
        content: { type: 'string', multiple: true },
        css: { type: 'string', multiple: true },
        'out-dir': { type: 'string', short: 'o' },
        safelist: { type: 'string', multiple: true },
        critical: { type: 'string', multiple: true },
        minify: { type: 'boolean' },
        'source-map': { type: 'boolean' },
        hash: { type: 'boolean' },
        clean: { type: 'boolean' },
        watch: { type: 'boolean', short: 'w' },
        'fail-on-unused': { type: 'boolean' },
        verbose: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
      allowNegative: true,
    }));
  } catch (e) {
    console.error(red((e as Error).message));
    console.error(`Run ${'css-compiler --help'} for usage.`);
    return 2;
  }

  if (values['help']) {
    console.log(HELP);
    return 0;
  }
  if (values['version']) {
    const pkg = JSON.parse(
      fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { version: string };
    console.log(pkg.version);
    return 0;
  }

  const cwd = process.cwd();
  try {
    const { config: fileConfig, warnings } = loadConfigFile(cwd, values['config'] as string | undefined);
    for (const w of warnings) console.error(yellow(`Warning: ${w}`));

    const cli: CliOverrides = {};
    const content = commaSplit(values['content'] as string[] | undefined);
    const css = commaSplit(values['css'] as string[] | undefined);
    const safelist = commaSplit(values['safelist'] as string[] | undefined);
    const critical = commaSplit(values['critical'] as string[] | undefined);
    if (content) cli.content = content;
    if (css) cli.css = css;
    if (safelist) cli.safelist = safelist;
    if (critical) cli.critical = critical;
    if (values['out-dir'] !== undefined) cli.outDir = values['out-dir'] as string;
    if (values['minify'] !== undefined) cli.minify = values['minify'] as boolean;
    if (values['source-map'] !== undefined) cli.sourceMap = values['source-map'] as boolean;
    if (values['hash'] !== undefined) cli.hash = values['hash'] as boolean;
    if (values['clean'] !== undefined) cli.clean = values['clean'] as boolean;
    if (values['fail-on-unused'] !== undefined) cli.failOnUnused = values['fail-on-unused'] as boolean;
    if (values['watch'] !== undefined) cli.watch = values['watch'] as boolean;
    if (values['verbose'] !== undefined) cli.verbose = values['verbose'] as boolean;

    const config = resolveConfig(cwd, fileConfig, cli);

    if (config.watch) {
      const { runWatch } = await import('./watch.ts');
      runWatch(config);
      return 0; // keeps running via watchers
    }

    const result = compileOnce(config);
    printReport(result, config);

    if (config.failOnUnused && result.totals.selectorsRemoved > 0) {
      console.error(
        red(
          `\n--fail-on-unused: ${result.totals.selectorsRemoved} unused selector${
            result.totals.selectorsRemoved === 1 ? '' : 's'
          } found${config.verbose ? '' : ' (run with --verbose to list them)'}.`,
        ),
      );
      return 1;
    }
    return 0;
  } catch (e) {
    if (e instanceof ConfigError || e instanceof PipelineError) {
      console.error(red(e.message));
      return 2;
    }
    throw e;
  }
}

function invokedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(fs.realpathSync(entry)).href;
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  main(process.argv.slice(2)).then(
    (code) => {
      if (code !== 0) process.exitCode = code;
    },
    (e) => {
      console.error(red(`Unexpected error: ${(e as Error).stack ?? e}`));
      process.exitCode = 2;
    },
  );
}
