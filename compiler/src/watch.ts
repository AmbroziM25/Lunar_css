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
import type { CompileResult, CssFileResult, ResolvedConfig } from './types.ts';

const WATCHED_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|css|html|htm)$/i;
const DEBOUNCE_MS = 120;

export interface WatcherEvents {
  /** Called after every build. `recompiled` = CSS files actually rewritten. */
  onBuild(result: CompileResult, recompiled: number, initial: boolean): void;
  onError(error: Error): void;
  /** Non-fatal notices (e.g. an unwatchable root). */
  onWarn?(message: string): void;
  /**
   * Raw (undebounced) notification for every watched-file change that passes
   * the extension/outDir filters. The server uses this to invalidate and
   * re-broadcast stylesheets it serves on the fly.
   */
  onFileChange?(file: string): void;
}

export interface Watcher {
  close(): void;
  /** Force a rebuild outside the file-change flow. */
  rebuild(): void;
  /** Latest successful result, if any. */
  readonly last: CompileResult | undefined;
}

/**
 * The rebuild engine behind both watch mode and the compile server.
 * Incremental behavior:
 * - extraction is cached per source file (mtime) — only changed files re-parse;
 * - CSS files are recompiled only when they changed or when the merged class
 *   usage actually changed (compared via signature).
 */
export function createWatcher(config: ResolvedConfig, events: WatcherEvents): Watcher {
  const cache: ExtractCache = new Map();
  const compiled = new Map<string, { mtimeMs: number; result: CssFileResult }>();
  let lastSignature = '';
  let lastResult: CompileResult | undefined;
  let building = false;
  let queued = false;
  let closed = false;

  const rebuild = (initial: boolean): void => {
    if (closed) return;
    if (building) {
      queued = true;
      return;
    }
    building = true;
    const start = performance.now();
    try {
      const { usage, files: contentFiles } = extractAll(config, cache);
      if (contentFiles.length === 0) {
        events.onError(
          new Error(
            `No source files matched content globs: ${config.content.join(', ')} — skipping build.`,
          ),
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

      lastResult = buildResult(
        [...compiled.values()].map((c) => c.result),
        usage,
        performance.now() - start,
        config,
      );
      events.onBuild(lastResult, recompiled, initial);
    } catch (e) {
      events.onError(e as Error);
    } finally {
      building = false;
      if (queued) {
        queued = false;
        rebuild(false);
      }
    }
  };

  // Clean once at startup; later rebuilds overwrite in place.
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
        events.onFileChange?.(full);
        schedule();
      });
      watchers.push(watcher);
    } catch (e) {
      events.onWarn?.(`Cannot watch ${root}: ${(e as Error).message}`);
    }
  }

  return {
    close(): void {
      closed = true;
      clearTimeout(timer);
      for (const w of watchers) w.close();
    },
    rebuild(): void {
      schedule();
    },
    get last(): CompileResult | undefined {
      return lastResult;
    },
  };
}

/** Console watch mode (programmatic use; the server is the primary consumer). */
export function runWatch(config: ResolvedConfig): Watcher {
  const watcher = createWatcher(config, {
    onBuild(result, recompiled, initial) {
      if (initial) printReport(result, config);
      else if (recompiled > 0) printRebuild(result, recompiled);
      else console.log(dim('no CSS output affected'));
    },
    onError(error) {
      console.error(red(`Build failed: ${error.message}`));
    },
    onWarn(message) {
      console.error(yellow(message));
    },
  });
  console.log(dim('Watching for changes — Ctrl+C to stop'));
  process.on('SIGINT', () => {
    watcher.close();
    process.exit(0);
  });
  return watcher;
}
