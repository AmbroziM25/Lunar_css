/** Programmatic API for css-compiler. */
export {
  buildResult,
  cleanOutDir,
  compileCssFile,
  compileOnce,
  extractAll,
  outputNames,
  PipelineError,
  type ExtractCache,
  type ExtractCacheEntry,
} from './compile.ts';
export {
  compileMatcher,
  ConfigError,
  DEFAULTS,
  loadConfigFile,
  resolveConfig,
  type CliOverrides,
  type Matcher,
} from './config.ts';
export { extractFile, mergeUsage, normalizePath, usageSignature } from './extract.ts';
export { expandBraces, globSync, globToRegExp, watchRoots } from './glob.ts';
export {
  selectorClasses,
  selectorMatches,
  serializeSelector,
  transformCss,
  type ClassRef,
  type ClassUsedFn,
  type Selector,
  type SelComponent,
} from './purge.ts';
export { formatBytes, formatReduction, printReport } from './report.ts';
export type {
  CompileResult,
  CssFileResult,
  DynamicPattern,
  ExtractWarning,
  FileUsage,
  OutputFile,
  ResolvedConfig,
  Usage,
  UserConfig,
} from './types.ts';
export { runWatch } from './watch.ts';
