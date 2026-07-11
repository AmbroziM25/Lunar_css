import type { CompileResult, ResolvedConfig } from './types.ts';

const useColor = (): boolean =>
  process.env.NO_COLOR === undefined && process.stdout.isTTY === true;

type Paint = (s: string) => string;
const paint =
  (code: number): Paint =>
  (s: string) =>
    useColor() ? `\x1b[${code}m${s}\x1b[0m` : s;

export const bold = paint(1);
export const dim = paint(2);
export const green = paint(32);
export const yellow = paint(33);
export const red = paint(31);
export const cyan = paint(36);

export function formatBytes(n: number): string {
  if (n < 1000) return `${n} B`;
  if (n < 1000_000) return `${(n / 1000).toFixed(1)} kB`;
  return `${(n / 1000_000).toFixed(2)} MB`;
}

export function formatReduction(original: number, output: number): string {
  if (original === 0) return '0.0%';
  return `${(((original - output) / original) * 100).toFixed(1)}%`;
}

/** Print the full compile report. */
export function printReport(
  result: CompileResult,
  config: ResolvedConfig,
  log: (line: string) => void = console.log,
): void {
  const { usage, totals } = result;
  log(
    bold('lunara 🌙 ') +
      dim(
        `${usage.sourceFiles} source file${usage.sourceFiles === 1 ? '' : 's'} scanned — ` +
          `${usage.global.size} class name${usage.global.size === 1 ? '' : 's'}, ` +
          `${usage.modules.size} CSS Module${usage.modules.size === 1 ? '' : 's'}, ` +
          `${usage.patterns.length} dynamic pattern${usage.patterns.length === 1 ? '' : 's'}`,
      ),
  );
  log('');

  if (result.files.length === 0) {
    log(yellow(`  No CSS files matched: ${config.css.join(', ')}`));
  }

  for (const file of result.files) {
    for (const [i, out] of file.outputs.entries()) {
      const arrow = i === 0 ? `  ${file.input} ` : ' '.repeat(file.input.length + 3);
      const sizes =
        i === 0
          ? `${formatBytes(file.originalBytes)} → ${formatBytes(out.bytes)} (${green(
              `-${formatReduction(file.originalBytes, out.bytes)}`,
            )})`
          : `${formatBytes(out.bytes)}`;
      log(
        `${arrow}→ ${cyan(out.fileName)}  ${sizes}  ${dim(
          `gzip ${formatBytes(out.gzip)} · brotli ${formatBytes(out.brotli)}`,
        )}`,
      );
    }
    const removedText =
      file.selectorsRemoved > 0
        ? `${file.selectorsRemoved}/${file.selectorTotal} selectors removed`
        : `all ${file.selectorTotal} selectors in use`;
    const criticalText =
      file.criticalSelectors > 0 ? ` · ${file.criticalSelectors} critical` : '';
    log(dim(`      ${removedText}${criticalText}`));
    if (config.verbose && file.removedSelectors.length > 0) {
      for (const sel of file.removedSelectors) log(dim(`        ✂ ${sel}`));
    }
    for (const warning of file.cssWarnings) log(yellow(`      ! ${warning}`));
  }
  log('');

  if (usage.patterns.length > 0 && config.verbose) {
    log('  Dynamic patterns kept:');
    for (const p of usage.patterns) {
      log(dim(`    ${p.prefix}*${p.suffix}  (${p.loc})`));
    }
    log('');
  }

  if (usage.warnings.length > 0) {
    log(
      yellow(
        `  ⚠ ${usage.warnings.length} dynamic class name${
          usage.warnings.length === 1 ? '' : 's'
        } could not be analyzed — add matching entries to "safelist" if needed:`,
      ),
    );
    const shown = config.verbose ? usage.warnings : usage.warnings.slice(0, 5);
    for (const w of shown) log(dim(`    ${w.loc}  ${w.snippet}`));
    if (!config.verbose && usage.warnings.length > shown.length) {
      log(dim(`    ...and ${usage.warnings.length - shown.length} more (use --verbose)`));
    }
    log('');
  }

  log(
    bold('  Total ') +
      `${formatBytes(totals.originalBytes)} → ${formatBytes(totals.outputBytes)} (${green(
        `-${formatReduction(totals.originalBytes, totals.outputBytes)}`,
      )})  ${dim(
        `gzip ${formatBytes(totals.gzip)} · brotli ${formatBytes(totals.brotli)} · ` +
          `${totals.selectorsRemoved} of ${totals.selectorTotal} selectors removed`,
      )}`,
  );
  log(dim(`  Done in ${result.durationMs.toFixed(0)} ms`));
}

/** Compact single-line report for watch-mode rebuilds. */
export function printRebuild(
  result: CompileResult,
  compiledCount: number,
  log: (line: string) => void = console.log,
): void {
  const t = new Date().toLocaleTimeString();
  log(
    dim(`[${t}] `) +
      `rebuilt ${compiledCount} file${compiledCount === 1 ? '' : 's'} — ` +
      `${formatBytes(result.totals.originalBytes)} → ${formatBytes(result.totals.outputBytes)} ` +
      green(`(-${formatReduction(result.totals.originalBytes, result.totals.outputBytes)})`) +
      dim(` · ${result.totals.selectorsRemoved} removed · ${result.durationMs.toFixed(0)} ms`),
  );
}
