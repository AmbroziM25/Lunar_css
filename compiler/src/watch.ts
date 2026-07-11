import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildResult,
  cleanOutDir,
  compileCssFile,
  extractAll,
  outputNames,
  type ExtractCache,
} from './compile.ts';
import { usageSignature } from './extract.ts';
import { globSync, watchRoots } from './glob.ts';
import { dim, printRebuild, printReport, red, yellow } from './report.ts';
import type { CssFileResult, ResolvedConfig } from './types.ts';

const WATCHED_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|css)$/i;
const DEBOUNCE_MS = 120;

/**
 * Watch mode: rebuild on source/CSS changes.
 * Incremental behavior:
 * - TS/TSX extraction is cached per file (mtime) — only changed files re-parse;
 * - CSS files are recompiled only when they changed or when the merged class
 *   usage actually changed (compared via signature).
 */
export function runWatch(config: ResolvedConfig): void {
  const cache: ExtractCache = new Map();
  const compiled = new Map<string, { mtimeMs: number; result: CssFileResult }>();
  let lastSignature = '';
  let building = false;
  let queued = false;

  const rebuild = (initial: boolean): void => {
    if (building) {
      queued = true;
      return;
    }
    building = true;
    const start = performance.now();
    try {
      const { usage, files: contentFiles } = extractAll(config, cache);
      if (contentFiles.length === 0) {
        console.error(
          yellow(`No source files matched content globs: ${config.content.join(', ')} — skipping.`),
        );
        return;
      }
      const signature = usageSignature(usage);
      const usageChanged = signature !== lastSignature;
      lastSignature = signature;

      const cssFiles = globSync(config.css, config.cwd);
      const names = outputNames(cssFiles, config.cwd);
      const live = new Set(cssFiles);
      for (const key of [...compiled.keys()]) if (!live.has(key)) compiled.delete(key);

      let recompiled = 0;
      for (const file of cssFiles) {
        let mtimeMs: number;
        try {
          mtimeMs = fs.statSync(file).mtimeMs;
        } catch {
          continue;
        }
        const prev = compiled.get(file);
        if (!usageChanged && prev && prev.mtimeMs === mtimeMs) continue;
        compiled.set(file, {
          mtimeMs,
          result: compileCssFile(config, usage, file, names.get(file)!),
        });
        recompiled++;
      }

      const result = buildResult(
        [...compiled.values()].map((c) => c.result),
        usage,
        performance.now() - start,
        config,
      );
      if (initial) printReport(result, config);
      else if (recompiled > 0) printRebuild(result, recompiled);
      else console.log(dim('no CSS output affected'));
    } catch (e) {
      console.error(red(`Build failed: ${(e as Error).message}`));
    } finally {
      building = false;
      if (queued) {
        queued = false;
        rebuild(false);
      }
    }
  };

  // Clean once at startup; watch rebuilds overwrite in place.
  if (config.clean) cleanOutDir(config, globSync(config.css, config.cwd));
  rebuild(true);

  const roots = watchRoots([...config.content, ...config.css], config.cwd);
  let timer: NodeJS.Timeout | undefined;
  const schedule = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => rebuild(false), DEBOUNCE_MS);
  };

  const watchers: fs.FSWatcher[] = [];
  for (const root of roots) {
    try {
      const watcher = fs.watch(root, { recursive: true }, (_event, fileName) => {
        if (!fileName) return schedule();
        const full = path.resolve(root, fileName.toString());
        if (full.startsWith(config.outDir + path.sep) || full === config.outDir) return;
        if (/[\\/](node_modules|\.git)[\\/]/.test(full)) return;
        if (!WATCHED_EXT.test(full)) return;
        schedule();
      });
      watchers.push(watcher);
    } catch (e) {
      console.error(yellow(`Cannot watch ${root}: ${(e as Error).message}`));
    }
  }
  if (watchers.length === 0) {
    console.error(red('Nothing to watch.'));
    process.exitCode = 2;
    return;
  }
  console.log(dim(`\nWatching ${roots.map((r) => path.relative(config.cwd, r) || '.').join(', ')} for changes — Ctrl+C to stop`));

  process.on('SIGINT', () => {
    for (const w of watchers) w.close();
    process.exit(0);
  });
}
