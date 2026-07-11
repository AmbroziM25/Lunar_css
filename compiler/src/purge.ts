import type * as LightningCss from 'lightningcss';
import { loadOptional } from './deps.ts';

/** Lightning CSS is an optional peer: loaded on first use with install help. */
function lightningcss(): typeof LightningCss {
  return loadOptional<typeof LightningCss>('lightningcss', 'purging and minifying CSS');
}

/**
 * Structural view of Lightning CSS selector components. The real types are
 * elaborate unions; we only need a few fields and want to stay resilient to
 * additions, so we model them loosely.
 */
export interface SelComponent {
  type: string;
  name?: string;
  kind?: string;
  value?: unknown;
  /** Functional pseudo-classes taking a selector list (:is, :where, :has...). */
  selectors?: SelComponent[][];
  /** Pseudo-classes taking a single selector (:global, :local). */
  selector?: SelComponent[];
  operation?: { operator: string; value?: string };
}

export type Selector = SelComponent[];

/** A class occurrence inside a selector. `global` = wrapped in :global(). */
export interface ClassRef {
  name: string;
  global: boolean;
}

export type ClassUsedFn = (ref: ClassRef) => boolean;

const COMBINATORS: Record<string, string> = {
  descendant: ' ',
  child: ' > ',
  'next-sibling': ' + ',
  'later-sibling': ' ~ ',
};

/** Approximate selector text, for reports and critical-CSS matching. */
export function serializeSelector(sel: Selector): string {
  let out = '';
  for (const c of sel) {
    switch (c.type) {
      case 'combinator':
        out += COMBINATORS[String(c.value)] ?? ' ';
        break;
      case 'universal':
        out += '*';
        break;
      case 'type':
        out += c.name ?? '';
        break;
      case 'class':
        out += `.${c.name}`;
        break;
      case 'id':
        out += `#${c.name}`;
        break;
      case 'attribute':
        out += `[${c.name ?? ''}]`;
        break;
      case 'nesting':
        out += '&';
        break;
      case 'pseudo-class': {
        const kind = c.kind ?? '';
        if (kind === 'custom') out += `:${c.name}`;
        else if (kind === 'custom-function') out += `:${c.name}(...)`;
        else if (c.selector) out += `:${kind}(${serializeSelector(c.selector)})`;
        else if (c.selectors) out += `:${kind}(${c.selectors.map(serializeSelector).join(', ')})`;
        else out += `:${kind}`;
        break;
      }
      case 'pseudo-element':
        out += `::${c.kind ?? c.name ?? ''}`;
        break;
      default:
        break;
    }
  }
  return out || '<unknown>';
}

/** Every class referenced by a selector (including inside :is/:global/...). */
export function selectorClasses(sel: Selector, global = false, out: ClassRef[] = []): ClassRef[] {
  for (const c of sel) {
    if (c.type === 'class' && c.name) out.push({ name: c.name, global });
    else if (c.type === 'pseudo-class') {
      if (c.selector) selectorClasses(c.selector, global || c.kind === 'global', out);
      if (c.selectors) for (const s of c.selectors) selectorClasses(s, global, out);
    }
  }
  return out;
}

/**
 * Whether a selector can still match given class usage.
 * - every top-level class must be used;
 * - :not(...) never causes removal;
 * - :is/:where/:has(...) keep the selector when at least one alternative
 *   is fully usable;
 * - selectors without class components are always kept (we purge only on
 *   class evidence — ids, tags and attributes are conservative keeps).
 */
export function selectorMatches(sel: Selector, used: ClassUsedFn, global = false): boolean {
  for (const c of sel) {
    if (c.type === 'class') {
      if (c.name && !used({ name: c.name, global })) return false;
    } else if (c.type === 'pseudo-class') {
      if (c.kind === 'not') continue;
      if (c.selector) {
        if (!selectorMatches(c.selector, used, global || c.kind === 'global')) return false;
      } else if (Array.isArray(c.selectors) && c.selectors.length > 0) {
        if (!c.selectors.some((s) => selectorMatches(s, used, global))) return false;
      }
    }
  }
  return true;
}

export interface TransformCssOptions {
  filename: string;
  code: string;
  minify: boolean;
  sourceMap: boolean;
  /** Parse with CSS Modules syntax support (identity naming, no rewriting). */
  cssModules: boolean;
  /** Selector filter; omit for an analysis-only pass. */
  keep?: (sel: Selector) => boolean;
  /** Called for every style-rule selector encountered (before filtering). */
  onSelector?: (sel: Selector) => void;
}

export interface TransformCssResult {
  code: string;
  map?: string;
  warnings: string[];
}

/**
 * At-rules that are safe to drop when purging empties them. @layer blocks are
 * deliberately excluded: an empty @layer still declares cascade-layer order.
 */
const DROPPABLE_CONTAINERS = ['media', 'supports', 'container', 'moz-document', 'starting-style', 'scope'] as const;

interface LooseRule {
  type: string;
  value?: { selectors?: Selector[]; rules?: LooseRule[] };
}

/**
 * Run Lightning CSS over one stylesheet: optionally drop selectors/rules via
 * `keep`, minify, and produce a source map. Because visitors see parents
 * before children, emptied @media/@supports blocks are detected predictively:
 * a container is dropped when every nested style rule will fail `keep`.
 *
 * Round-trip safety: a rule returned from a JS visitor is re-deserialized by
 * Lightning CSS, and some perfectly ordinary values do not survive that trip
 * (e.g. `--a: var(--b)` fails with "expected an object-like struct named
 * Specifier"). We therefore return `undefined` (= keep unchanged) whenever a
 * rule is untouched, and only return a mutated rule when some — but not all —
 * of its selectors were purged. If that mutated rule still fails to
 * deserialize, the file is retried in coarse mode where partially-used rules
 * are kept whole (their dead selector text is harmless).
 */
export function transformCss(opts: TransformCssOptions): TransformCssResult {
  const keep = opts.keep;

  const willBeEmpty = (rule: LooseRule): boolean => {
    const rules = rule.value?.rules;
    if (!Array.isArray(rules)) return false;
    return rules.every((child) => {
      if (child.type === 'style') {
        const selectors = child.value?.selectors ?? [];
        return selectors.every((s) => !keep!(s));
      }
      if ((DROPPABLE_CONTAINERS as readonly string[]).includes(child.type)) {
        return willBeEmpty(child);
      }
      return child.type === 'ignored';
    });
  };

  const run = (coarse: boolean, withAnalysis: boolean) => {
    const styleRule = (rule: unknown): unknown => {
      const value = (rule as LooseRule).value as { selectors: Selector[] };
      const selectors = value.selectors;
      if (withAnalysis && opts.onSelector) for (const s of selectors) opts.onSelector(s);
      if (!keep) return undefined;
      if (coarse) {
        return selectors.some((s) => keep(s)) ? undefined : [];
      }
      const kept = selectors.filter((s) => keep(s));
      if (kept.length === selectors.length) return undefined;
      if (kept.length === 0) return [];
      value.selectors = kept;
      return rule;
    };
    const ruleVisitor: Record<string, (rule: unknown) => unknown> = { style: styleRule };
    if (keep) {
      for (const type of DROPPABLE_CONTAINERS) {
        ruleVisitor[type] = (rule: unknown) => (willBeEmpty(rule as LooseRule) ? [] : undefined);
      }
    }
    return lightningcss().transform({
      filename: opts.filename,
      code: Buffer.from(opts.code),
      minify: opts.minify,
      sourceMap: opts.sourceMap,
      errorRecovery: true,
      ...(opts.cssModules ? { cssModules: { pattern: '[local]' } } : {}),
      // The loose structural typing above stands in for Lightning CSS's very
      // elaborate generated union types.
      visitor: { Rule: ruleVisitor } as never,
    });
  };

  const toResult = (res: ReturnType<typeof run>, extra: string[] = []): TransformCssResult => ({
    code: res.code.toString(),
    map: res.map ? res.map.toString() : undefined,
    warnings: [...(res.warnings ?? []).map((w) => w.message), ...extra],
  });

  try {
    return toResult(run(false, true));
  } catch (e) {
    if (!keep || !/deserialize/i.test((e as Error).message)) throw e;
    // Note: onSelector is not replayed on the retry; analysis passes never
    // provide `keep`, so they cannot end up here.
    return toResult(run(true, false), [
      'a partially-used rule could not be round-tripped by Lightning CSS; ' +
        'kept whole rules in this file (per-selector trimming skipped)',
    ]);
  }
}
