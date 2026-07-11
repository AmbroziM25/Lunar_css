import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { compileMatcher } from './config.ts';
import { extractFile, mergeUsage, normalizePath } from './extract.ts';
import { globSync, normalizeSlashes } from './glob.ts';
import {
  selectorClasses,
  selectorMatches,
  serializeSelector,
  transformCss,
  type ClassUsedFn,
  type Selector,
} from './purge.ts';
import type {
  CompileResult,
  CssFileResult,
  FileUsage,
  OutputFile,
  ResolvedConfig,
  Usage,
} from './types.ts';

export class PipelineError extends Error {}

export interface ExtractCacheEntry {
  mtimeMs: number;
  usage: FileUsage;
}
/** Extraction cache for watch mode, keyed by absolute file path. */
export type ExtractCache = Map<string, ExtractCacheEntry>;

/** Scan content globs and extract class usage (incrementally, if cached). */
export function extractAll(
  config: ResolvedConfig,
  cache?: ExtractCache,
): { usage: Usage; files: string[] } {
  const files = globSync(config.content, config.cwd);
  const usages: FileUsage[] = [];
  for (const file of files) {
    let entry = cache?.get(file);
    let mtimeMs = 0;
    try {
      mtimeMs = fs.statSync(file).mtimeMs;
    } catch {
      continue; // deleted between glob and stat
    }
    if (!entry || entry.mtimeMs !== mtimeMs) {
      let code: string;
      try {
        code = fs.readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      entry = { mtimeMs, usage: extractFile(file, code, config.cwd) };
      cache?.set(file, entry);
    }
    usages.push(entry.usage);
  }
  if (cache) {
    const live = new Set(files);
    for (const key of [...cache.keys()]) if (!live.has(key)) cache.delete(key);
  }
  return { usage: mergeUsage(usages), files };
}

/** Stable output base names (no extension) for a set of CSS files. */
export function outputNames(cssFiles: string[], cwd: string): Map<string, string> {
  const names = new Map<string, string>();
  const byBase = new Map<string, string[]>();
  for (const file of cssFiles) {
    const base = path.basename(file).replace(/\.css$/i, '');
    const group = byBase.get(base);
    if (group) group.push(file);
    else byBase.set(base, [file]);
  }
  for (const [base, group] of byBase) {
    if (group.length === 1) {
      names.set(group[0]!, base);
    } else {
      for (const file of group) {
        const rel = normalizeSlashes(path.relative(cwd, file)).replace(/\.css$/i, '');
        names.set(file, rel.replace(/\//g, '-'));
      }
    }
  }
  return names;
}

function makeUsedFn(safelist: string[], usage: Usage, fileKey: string, isModule: boolean): ClassUsedFn {
  const safe = compileMatcher(safelist);
  const moduleSet = usage.modules.get(fileKey);
  const wholeModule = usage.wholeModules.has(fileKey);
  return ({ name, global }) => {
    if (safe.test(name)) return true;
    if (isModule && !global) {
      if (wholeModule) return true;
      return moduleSet?.has(name) ?? false;
    }
    if (usage.global.has(name)) return true;
    return usage.patterns.some(
      (p) =>
        name.length >= p.prefix.length + p.suffix.length &&
        name.startsWith(p.prefix) &&
        name.endsWith(p.suffix),
    );
  };
}

function compressedSizes(buf: Buffer): { gzip: number; brotli: number } {
  return {
    gzip: zlib.gzipSync(buf, { level: 9 }).length,
    brotli: zlib.brotliCompressSync(buf, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}

export interface CompileStringOptions {
  code: string;
  /** Display name; a *.module.css name enables CSS Modules semantics. */
  filename?: string;
  usage: Usage;
  /** Normalized absolute path used for CSS Module usage lookup. */
  fileKey?: string;
  safelist?: string[];
  critical?: string[];
  minify?: boolean;
  sourceMap?: boolean;
}

export interface CompiledOutput {
  kind: 'main' | 'critical';
  code: string;
  /** Raw source-map JSON (no file/sourceMappingURL applied yet). */
  map?: string;
}

export interface CompileStringResult {
  outputs: CompiledOutput[];
  isModule: boolean;
  selectorTotal: number;
  selectorsRemoved: number;
  removedSelectors: string[];
  criticalSelectors: number;
  cssWarnings: string[];
}

/**
 * Purge + minify + (optionally) split one stylesheet entirely in memory.
 * This is the core used by the file pipeline, the HTTP compile endpoint,
 * and the WebSocket compile messages.
 */
export function compileString(opts: CompileStringOptions): CompileStringResult {
  const filename = opts.filename ?? 'input.css';
  const code = opts.code;
  const isModule = /\.module\.[^.]+$/i.test(path.basename(filename));
  const used = makeUsedFn(
    opts.safelist ?? [],
    opts.usage,
    opts.fileKey ?? normalizePath(filename),
    isModule,
  );
  const criticalMatcher = compileMatcher(opts.critical ?? []);
  const splitCritical = !criticalMatcher.empty;
  const isCritical = (sel: Selector): boolean =>
    selectorClasses(sel).some((c) => criticalMatcher.test(c.name)) ||
    criticalMatcher.test(serializeSelector(sel));

  // Analysis pass: selector stats without modifying anything.
  let selectorTotal = 0;
  let criticalSelectors = 0;
  const removedSelectors: string[] = [];
  const cssWarnings: string[] = [];
  const analysis = transformCss({
    filename,
    code,
    minify: false,
    sourceMap: false,
    cssModules: isModule,
    onSelector(sel) {
      selectorTotal++;
      if (!selectorMatches(sel, used)) removedSelectors.push(serializeSelector(sel));
      else if (splitCritical && isCritical(sel)) criticalSelectors++;
    },
  });
  cssWarnings.push(...analysis.warnings);

  const render = (kind: 'main' | 'critical', keep: (sel: Selector) => boolean): CompiledOutput => {
    const res = transformCss({
      filename,
      code,
      minify: opts.minify ?? true,
      sourceMap: opts.sourceMap ?? false,
      cssModules: isModule,
      keep,
    });
    const output: CompiledOutput = { kind, code: res.code };
    if (res.map !== undefined) output.map = res.map;
    return output;
  };

  const outputs: CompiledOutput[] = [];
  if (splitCritical && criticalSelectors > 0) {
    outputs.push(render('critical', (sel) => selectorMatches(sel, used) && isCritical(sel)));
    outputs.push(render('main', (sel) => selectorMatches(sel, used) && !isCritical(sel)));
  } else {
    outputs.push(render('main', (sel) => selectorMatches(sel, used)));
  }

  return {
    outputs,
    isModule,
    selectorTotal,
    selectorsRemoved: removedSelectors.length,
    removedSelectors,
    criticalSelectors,
    cssWarnings,
  };
}

/** Purge + minify + (optionally) split one CSS file and write its outputs. */
export function compileCssFile(
  config: ResolvedConfig,
  usage: Usage,
  file: string,
  outName: string,
): CssFileResult {
  const code = fs.readFileSync(file, 'utf8');
  const relInput = normalizeSlashes(path.relative(config.cwd, file));
  // Never overwrite an input stylesheet with its purged self (e.g. running
  // inside the Lunara repo, where dist/lunar.css is both input and outDir).
  if (normalizePath(path.join(config.outDir, `${outName}.css`)) === normalizePath(file)) {
    outName += '.optimized';
  }

  const compiled = compileString({
    code,
    filename: relInput,
    usage,
    fileKey: normalizePath(file),
    safelist: config.safelist,
    critical: config.critical,
    minify: config.minify,
    sourceMap: config.sourceMap,
  });

  fs.mkdirSync(config.outDir, { recursive: true });
  const outputs: OutputFile[] = [];
  for (const out of compiled.outputs) {
    let outCode = out.code;
    const base = out.kind === 'critical' ? `${outName}.critical` : outName;
    const fileName = config.hash
      ? `${base}.${crypto.createHash('sha256').update(outCode).digest('hex').slice(0, 8)}.css`
      : `${base}.css`;
    if (config.sourceMap && out.map) {
      const mapName = `${fileName}.map`;
      const mapObj = JSON.parse(out.map) as Record<string, unknown>;
      mapObj['file'] = fileName;
      fs.writeFileSync(path.join(config.outDir, mapName), JSON.stringify(mapObj));
      outCode += `${config.minify ? '\n' : ''}/*# sourceMappingURL=${mapName} */\n`;
    }
    fs.writeFileSync(path.join(config.outDir, fileName), outCode);
    const buf = Buffer.from(outCode);
    outputs.push({ kind: out.kind, fileName, bytes: buf.length, ...compressedSizes(buf) });
  }

  return {
    input: relInput,
    isModule: compiled.isModule,
    originalBytes: Buffer.byteLength(code),
    outputs,
    selectorTotal: compiled.selectorTotal,
    selectorsRemoved: compiled.selectorsRemoved,
    removedSelectors: compiled.removedSelectors,
    criticalSelectors: compiled.criticalSelectors,
    cssWarnings: compiled.cssWarnings,
  };
}

/** Remove previous compiled CSS artifacts from outDir (never input files). */
export function cleanOutDir(config: ResolvedConfig, keep: Iterable<string> = []): void {
  const keepSet = new Set([...keep].map(normalizePath));
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(config.outDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (/\.css(\.map)?$/i.test(entry.name) || entry.name === 'manifest.json') {
      const full = path.join(config.outDir, entry.name);
      if (!keepSet.has(normalizePath(full))) fs.rmSync(full);
    }
  }
}

/** Aggregate per-file results, write manifest.json, and total everything up. */
export function buildResult(
  files: CssFileResult[],
  usage: Usage,
  durationMs: number,
  config: ResolvedConfig,
): CompileResult {
  const totals = {
    originalBytes: 0,
    outputBytes: 0,
    gzip: 0,
    brotli: 0,
    selectorTotal: 0,
    selectorsRemoved: 0,
  };
  const manifest: CompileResult['manifest'] = {};
  for (const file of files) {
    totals.originalBytes += file.originalBytes;
    totals.selectorTotal += file.selectorTotal;
    totals.selectorsRemoved += file.selectorsRemoved;
    const entry: { main?: string; critical?: string } = {};
    for (const out of file.outputs) {
      totals.outputBytes += out.bytes;
      totals.gzip += out.gzip;
      totals.brotli += out.brotli;
      entry[out.kind] = out.fileName;
    }
    manifest[file.input] = entry;
  }
  if (files.length > 0) {
    fs.mkdirSync(config.outDir, { recursive: true });
    fs.writeFileSync(
      path.join(config.outDir, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
  return { files, usage, totals, manifest, durationMs };
}

/** One full compile: extract usage, purge/minify every CSS file, report. */
export function compileOnce(config: ResolvedConfig, cache?: ExtractCache): CompileResult {
  const start = performance.now();
  const { usage, files: contentFiles } = extractAll(config, cache);
  if (contentFiles.length === 0) {
    throw new PipelineError(
      `No source files matched content globs: ${config.content.join(', ')}. ` +
        'Refusing to purge (everything would be removed). ' +
        'Check the "content" setting or pass --content.',
    );
  }
  const cssFiles = globSync(config.css, config.cwd);
  if (config.clean) cleanOutDir(config, cssFiles);
  const names = outputNames(cssFiles, config.cwd);
  const results = cssFiles.map((f) => compileCssFile(config, usage, f, names.get(f)!));
  return buildResult(results, usage, performance.now() - start, config);
}
