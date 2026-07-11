#!/usr/bin/env node
import * as fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { PipelineError } from './compile.ts';
import { ConfigError, loadConfigFile, resolveConfig, type CliOverrides } from './config.ts';
import { loadOptional, MissingDependencyError } from './deps.ts';
import { bold, cyan, dim, red, yellow } from './report.ts';
import { startServer } from './server.ts';

const HELP = `lunara — the Lunara CSS compile server

Serves your website and snipes its CSS: every stylesheet the site references
is compiled on the fly (unused Lunara classes purged, the rest minified), the
live-reload client is injected into your HTML automatically, and open pages
re-style themselves over WebSocket on every save. Optimized builds are also
written to the out directory on every change.

Usage
  npx lunara [options]        # then open http://127.0.0.1:4321/

Options
  -p, --port <n>          Port (default 4321; tries the next few if busy)
      --host <host>       Bind address (default 127.0.0.1)
  -c, --config <file>     Config file (default: lunara.config.json)
      --content <glob>    Files to scan: HTML/TS/TSX/JS/JSX (repeatable)
      --css <glob>        CSS to optimize (default: installed @velo0-0/lunara-css)
  -o, --out-dir <dir>     Where compiled CSS is written (default: dist)
      --safelist <name>   Class to always keep; "/re/" for regex (repeatable)
      --critical <name>   Critical-CSS pattern (splits <name>.critical.css)
      --no-minify         Keep output readable
      --source-map        Emit .css.map source maps
      --hash              Content-hash output filenames
      --clean             Remove stale .css/.map/manifest.json from out dir
  -h, --help              Show this help
  -v, --version           Show version

For pages served elsewhere
  <link rel="stylesheet" href="http://127.0.0.1:4321/lunar.css">
  <script src="http://127.0.0.1:4321/__lunara/live.js"></script>

Endpoints
  GET  /<any site file>       your site (CSS optimized on the fly)
  GET  /__lunara              dashboard    GET /__lunara/report   report JSON
  POST /__lunara/compile      { css, sources? } -> optimized CSS
  WS   /__lunara/ws           rebuild/cssupdate + { type: "compile" } requests
`;

const NEGATABLE = new Map<string, string>([
  ['--no-minify', 'minify'],
  ['--no-hash', 'hash'],
  ['--no-clean', 'clean'],
  ['--no-source-map', 'source-map'],
]);

function commaSplit(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  const out = values.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
  return out.length > 0 ? out : undefined;
}

export async function main(argv: string[]): Promise<number> {
  const negated = new Map<string, false>();
  const args: string[] = [];
  for (const arg of argv) {
    const key = NEGATABLE.get(arg);
    if (key) negated.set(key, false);
    else args.push(arg);
  }

  let values: Record<string, unknown>;
  try {
    ({ values } = parseArgs({
      args,
      options: {
        port: { type: 'string', short: 'p' },
        host: { type: 'string' },
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
        verbose: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    }));
  } catch (e) {
    console.error(red((e as Error).message));
    console.error('Run "npx lunara --help" for usage.');
    return 2;
  }
  for (const [key, value] of negated) values[key] = value;

  if (values['help']) {
    console.log(HELP);
    return 0;
  }
  if (values['version']) {
    const pkg = JSON.parse(
      fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { name: string; version: string };
    console.log(`${pkg.name} ${pkg.version}`);
    return 0;
  }

  const cwd = process.cwd();
  try {
    // Fail fast with install help instead of a server that can never build.
    loadOptional('lightningcss', 'purging and minifying CSS');

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
    if (values['verbose'] !== undefined) cli.verbose = values['verbose'] as boolean;
    if (values['host'] !== undefined) cli.host = values['host'] as string;
    if (values['port'] !== undefined) {
      const port = Number.parseInt(values['port'] as string, 10);
      if (Number.isNaN(port) || port < 0 || port > 65535) {
        console.error(red(`Invalid port: ${values['port']}`));
        return 2;
      }
      cli.port = port;
    }

    const config = resolveConfig(cwd, fileConfig, cli);

    // Try the configured port, then a few neighbors if it is taken.
    let handle;
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < 10; attempt++) {
      const port = config.port === 0 ? 0 : config.port + attempt;
      try {
        handle = await startServer({ ...config, port });
        break;
      } catch (e) {
        lastError = e as Error;
        if ((e as NodeJS.ErrnoException).code !== 'EADDRINUSE' || config.port === 0) break;
      }
    }
    if (!handle) throw lastError ?? new Error('Could not start server');

    const mainOutput =
      handle
        .latest()
        ?.files.flatMap((f) => f.outputs)
        .find((o) => o.kind === 'main')?.fileName ?? 'lunar.css';
    const stable = mainOutput.replace(/\.[0-9a-f]{8}(?=\.css$)/, '');

    console.log('');
    console.log(bold('  lunara 🌙 compile server'));
    console.log('');
    console.log(`  Site        ${cyan(`${handle.url}/`)}  ${dim(`(serving ${config.cwd}, CSS optimized on the fly)`)}`);
    console.log(`  Dashboard   ${cyan(`${handle.url}/__lunara`)}`);
    console.log(`  Stylesheet  ${cyan(`${handle.url}/${stable}`)}  ${dim('(for pages served elsewhere)')}`);
    console.log(`  WebSocket   ${cyan(`${handle.url.replace(/^http/, 'ws')}/__lunara/ws`)}`);
    console.log('');
    console.log(dim('  Watching for changes — Ctrl+C to stop'));
    console.log('');

    process.on('SIGINT', () => {
      void handle.close().then(() => process.exit(0));
    });
    return 0;
  } catch (e) {
    if (e instanceof ConfigError || e instanceof PipelineError || e instanceof MissingDependencyError) {
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
