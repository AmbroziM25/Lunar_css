/** Shape of css-compiler.config.json (all fields optional). */
export interface UserConfig {
  /** Globs of TS/TSX source files to scan for class usage. */
  content?: string | string[];
  /** Globs of CSS files to compile. */
  css?: string | string[];
  /** Output directory for compiled CSS. */
  outDir?: string;
  /**
   * Class names to always keep. Plain strings match exactly;
   * entries wrapped in slashes (e.g. "/^btn-/") are regular expressions.
   */
  safelist?: string[];
  /**
   * Patterns marking rules as critical (above-the-fold). Matched against
   * every class name in a selector and against the serialized selector text.
   * Same syntax as safelist. When non-empty, output is split into
   * <name>.critical.css (inline it) and <name>.css (defer it).
   */
  critical?: string[];
  /** Minify output (default true). */
  minify?: boolean;
  /** Emit .css.map source maps (default false). */
  sourceMap?: boolean;
  /** Content-hash output filenames for cache busting (default false). */
  hash?: boolean;
  /** Exit with code 1 when unused selectors are found (default false). */
  failOnUnused?: boolean;
  /** Delete previous .css/.css.map/manifest.json from outDir first (default false). */
  clean?: boolean;
}

/** Fully-resolved configuration used by the pipeline. */
export interface ResolvedConfig {
  cwd: string;
  content: string[];
  css: string[];
  /** Absolute path. */
  outDir: string;
  safelist: string[];
  critical: string[];
  minify: boolean;
  sourceMap: boolean;
  hash: boolean;
  failOnUnused: boolean;
  clean: boolean;
  watch: boolean;
  verbose: boolean;
}

/**
 * A dynamically-constructed class name for which a static prefix and/or
 * suffix could be inferred, e.g. `btn-${variant}` -> { prefix: "btn-" }.
 * CSS classes matching prefix+suffix are treated as used.
 */
export interface DynamicPattern {
  prefix: string;
  suffix: string;
  /** "file:line:col" of the expression this was inferred from. */
  loc: string;
}

/** A class-name expression that could not be statically analyzed at all. */
export interface ExtractWarning {
  loc: string;
  snippet: string;
}

/** Class usage extracted from a single source file. */
export interface FileUsage {
  /** Static class names used globally (className strings, clsx args, ...). */
  classes: Set<string>;
  /** CSS Module file (normalized absolute path) -> locally referenced class names. */
  moduleRefs: Map<string, Set<string>>;
  /** CSS Module files whose import is used opaquely — keep all their classes. */
  wholeModules: Set<string>;
  patterns: DynamicPattern[];
  warnings: ExtractWarning[];
}

/** Merged usage across all source files. */
export interface Usage {
  global: Set<string>;
  modules: Map<string, Set<string>>;
  wholeModules: Set<string>;
  patterns: DynamicPattern[];
  warnings: ExtractWarning[];
  sourceFiles: number;
}

export interface OutputFile {
  kind: 'main' | 'critical';
  /** File name inside outDir. */
  fileName: string;
  bytes: number;
  gzip: number;
  brotli: number;
}

export interface CssFileResult {
  /** Input path relative to cwd (forward slashes). */
  input: string;
  isModule: boolean;
  originalBytes: number;
  outputs: OutputFile[];
  selectorTotal: number;
  selectorsRemoved: number;
  /** Serialized text of removed (unused) selectors. */
  removedSelectors: string[];
  criticalSelectors: number;
  /** Parser warnings from Lightning CSS (error recovery). */
  cssWarnings: string[];
}

export interface CompileResult {
  files: CssFileResult[];
  usage: Usage;
  totals: {
    originalBytes: number;
    outputBytes: number;
    gzip: number;
    brotli: number;
    selectorTotal: number;
    selectorsRemoved: number;
  };
  manifest: Record<string, { main?: string; critical?: string }>;
  durationMs: number;
}
