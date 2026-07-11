/** Programmatic API for the Lunara CSS optimizer / compile server. */
export {
  buildResult,
  cleanOutDir,
  compileCssFile,
  compileOnce,
  compileString,
  extractAll,
  outputNames,
  PipelineError,
  type CompiledOutput,
  type CompileStringOptions,
  type CompileStringResult,
  type ExtractCache,
  type ExtractCacheEntry,
} from './compile.ts';
export {
  compileMatcher,
  ConfigError,
  DEFAULTS,
  loadConfigFile,
  LUNARA_PACKAGE,
  resolveConfig,
  resolveLunaraCss,
  type CliOverrides,
  type Matcher,
} from './config.ts';
export { loadOptional, MissingDependencyError } from './deps.ts';
export {
  extractFile,
  extractHtmlFile,
  mergeUsage,
  normalizePath,
  usageSignature,
} from './extract.ts';
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
export {
  startServer,
  type CompileRequest,
  type CompileResponse,
  type CompileServer,
  type StartServerOptions,
} from './server.ts';
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
export { createWatcher, runWatch, type Watcher, type WatcherEvents } from './watch.ts';
export { attachWebSocket, WsSocket, type WsServer } from './ws.ts';
