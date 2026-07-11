import * as path from 'node:path';
import { loadOptional } from './deps.ts';
import type * as TS from 'typescript';
import type { DynamicPattern, ExtractWarning, FileUsage, Usage } from './types.ts';

/** Functions whose arguments are treated as class-name expressions. */
const CLASS_FNS = new Set([
  'clsx',
  'classnames',
  'classNames',
  'cx',
  'cn',
  'cva',
  'twMerge',
  'twJoin',
]);

/** el.classList methods whose string arguments are class names. */
const CLASSLIST_METHODS = new Set(['add', 'remove', 'toggle', 'replace', 'contains']);

const MODULE_SPECIFIER = /\.module\.\w+$/;
/** Identifiers assumed to be pass-through class props coming from callers. */
const PASSTHROUGH_IDENTS = new Set(['className', 'class', 'undefined']);
const MAX_VARIANTS = 16;

/** TypeScript is loaded lazily: HTML-only projects never need it installed. */
function loadTs(): typeof TS {
  return loadOptional<typeof TS>('typescript', 'scanning .ts/.tsx/.js/.jsx sources');
}

/** Normalize a path for use as a cross-file map key. */
export function normalizePath(p: string): string {
  const resolved = path.resolve(p);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function emptyUsage(): FileUsage {
  return {
    classes: new Set(),
    moduleRefs: new Map(),
    wholeModules: new Set(),
    patterns: [],
    warnings: [],
  };
}

/** Extract class-name usage from one source file (HTML or TS/TSX/JS/JSX). */
export function extractFile(filePath: string, code: string, cwd = process.cwd()): FileUsage {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html' || ext === '.htm') return extractHtmlFile(code);
  return extractScriptFile(filePath, code, cwd);
}

/* ------------------------------------------------------------------ *
 * HTML — plain markup is Lunara's no-build home turf.
 * ------------------------------------------------------------------ */

const CLASS_ATTR_RE = /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;

export function extractHtmlFile(code: string): FileUsage {
  const usage = emptyUsage();
  for (const m of code.matchAll(CLASS_ATTR_RE)) {
    const value = m[1] ?? m[2] ?? m[3] ?? '';
    for (const cls of value.split(/\s+/)) if (cls) usage.classes.add(cls);
  }
  return usage;
}

/* ------------------------------------------------------------------ *
 * TS / TSX / JS / JSX — parsed with the TypeScript compiler API.
 * ------------------------------------------------------------------ */

function scriptKindFor(ts: typeof TS, filePath: string): TS.ScriptKind {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.tsx':
      return ts.ScriptKind.TSX;
    case '.jsx':
      return ts.ScriptKind.JSX;
    case '.js':
    case '.mjs':
    case '.cjs':
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function extractScriptFile(filePath: string, code: string, cwd: string): FileUsage {
  const ts = loadTs();
  const usage = emptyUsage();
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    scriptKindFor(ts, filePath),
  );

  const relPath = path.relative(cwd, filePath).replace(/\\/g, '/') || filePath;
  /** Local identifier -> normalized absolute path of the CSS Module it imports. */
  const moduleIdents = new Map<string, string>();
  /** Simple same-file variable resolution: identifier -> initializer. */
  const constMap = new Map<string, TS.Expression>();
  /** Call expressions already analyzed (so the walker doesn't redo them). */
  const analyzed = new Set<TS.Node>();
  /** Identifier nodes currently being resolved through constMap (cycle guard). */
  const resolving = new Set<TS.Node>();
  const warnedAt = new Set<number>();
  const patternKeys = new Set<string>();

  const loc = (node: TS.Node): string => {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    return `${relPath}:${line + 1}:${character + 1}`;
  };

  const addClasses = (text: string): void => {
    for (const cls of text.split(/\s+/)) if (cls) usage.classes.add(cls);
  };

  const addPattern = (prefix: string, suffix: string, node: TS.Node): void => {
    const key = `${prefix} ${suffix}`;
    if (patternKeys.has(key)) return;
    patternKeys.add(key);
    usage.patterns.push({ prefix, suffix, loc: loc(node) });
  };

  const addModuleRef = (modulePath: string, name: string): void => {
    let set = usage.moduleRefs.get(modulePath);
    if (!set) usage.moduleRefs.set(modulePath, (set = new Set()));
    set.add(name);
  };

  const warn = (node: TS.Node): void => {
    const pos = node.getStart(sourceFile);
    if (warnedAt.has(pos)) return;
    warnedAt.add(pos);
    const snippet = node.getText(sourceFile).replace(/\s+/g, ' ');
    usage.warnings.push({
      loc: loc(node),
      snippet: snippet.length > 60 ? `${snippet.slice(0, 57)}...` : snippet,
    });
  };

  function unwrap(e: TS.Expression): TS.Expression {
    while (
      ts.isParenthesizedExpression(e) ||
      ts.isAsExpression(e) ||
      ts.isSatisfiesExpression(e) ||
      ts.isNonNullExpression(e)
    ) {
      e = e.expression;
    }
    return e;
  }

  /** All possible literal string values of an expression, or null if opaque. */
  function literalValues(expr: TS.Expression, seen: Set<string> = new Set()): string[] | null {
    const e = unwrap(expr);
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return [e.text];
    if (ts.isTemplateExpression(e)) {
      let variants = [e.head.text];
      for (const span of e.templateSpans) {
        const vals = literalValues(span.expression, seen);
        if (!vals) return null;
        const next: string[] = [];
        for (const v of variants) for (const s of vals) next.push(v + s + span.literal.text);
        if (next.length > MAX_VARIANTS) return null;
        variants = next;
      }
      return variants;
    }
    if (ts.isConditionalExpression(e)) {
      const a = literalValues(e.whenTrue, seen);
      const b = literalValues(e.whenFalse, seen);
      if (!a || !b) return null;
      const merged = [...new Set([...a, ...b])];
      return merged.length > MAX_VARIANTS ? null : merged;
    }
    if (ts.isBinaryExpression(e)) {
      const op = e.operatorToken.kind;
      if (op === ts.SyntaxKind.PlusToken) {
        const l = literalValues(e.left, seen);
        const r = literalValues(e.right, seen);
        if (!l || !r) return null;
        const out: string[] = [];
        for (const a of l) for (const b of r) out.push(a + b);
        return out.length > MAX_VARIANTS ? null : out;
      }
      if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) {
        const l = literalValues(e.left, seen);
        const r = literalValues(e.right, seen);
        if (!l || !r) return null;
        const merged = [...new Set([...l, ...r])];
        return merged.length > MAX_VARIANTS ? null : merged;
      }
      return null;
    }
    if (ts.isIdentifier(e)) {
      if (e.text === 'undefined') return [''];
      if (seen.has(e.text)) return null;
      const init = constMap.get(e.text);
      if (!init) return null;
      seen.add(e.text);
      return literalValues(init, seen);
    }
    if (e.kind === ts.SyntaxKind.NullKeyword) return [''];
    return null;
  }

  type Part = string | TS.Expression;

  function templateParts(t: TS.TemplateExpression): Part[] {
    const parts: Part[] = [t.head.text];
    for (const span of t.templateSpans) {
      parts.push(span.expression, span.literal.text);
    }
    return parts;
  }

  /** Flatten a `+` concat chain into literal/expression parts. */
  function concatParts(e: TS.Expression, out: Part[] = []): Part[] {
    const n = unwrap(e);
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      concatParts(n.left, out);
      concatParts(n.right, out);
    } else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      out.push(n.text);
    } else {
      out.push(n);
    }
    return out;
  }

  /**
   * Consume the parts of a template/concat expression, tracking
   * whitespace-separated tokens. Static tokens become class names; tokens
   * containing an opaque expression become prefix/suffix patterns.
   */
  function consumeParts(parts: Part[], locNode: TS.Node): void {
    let variants: string[] = [''];
    let hasOpaque = false;
    let opaqueResolved = true;
    let post = '';

    const flush = (): void => {
      if (!hasOpaque) {
        for (const v of variants) if (v) addClasses(v);
      } else {
        let emitted = false;
        for (const v of new Set(variants)) {
          if (v || post) {
            addPattern(v, post, locNode);
            emitted = true;
          }
        }
        if (!emitted && !opaqueResolved) warn(locNode);
      }
      variants = [''];
      hasOpaque = false;
      opaqueResolved = true;
      post = '';
    };

    const markOpaque = (resolved: boolean): void => {
      if (hasOpaque) post = ''; // text between two expressions: drop it
      hasOpaque = true;
      opaqueResolved &&= resolved;
    };

    for (const part of parts) {
      if (typeof part === 'string') {
        for (const piece of part.split(/(\s+)/)) {
          if (!piece) continue;
          if (/^\s+$/.test(piece)) flush();
          else if (!hasOpaque) variants = variants.map((v) => v + piece);
          else post += piece;
        }
        continue;
      }
      const vals = literalValues(part);
      if (vals && vals.every((v) => !/\s/.test(v))) {
        if (!hasOpaque) {
          const next: string[] = [];
          for (const v of variants) for (const s of vals) next.push(v + s);
          if (next.length <= MAX_VARIANTS) {
            variants = [...new Set(next)];
            continue;
          }
        } else if (vals.length === 1) {
          post += vals[0];
          continue;
        }
        markOpaque(true);
      } else if (vals) {
        // Resolvable but contains whitespace: contribute the split tokens.
        for (const v of vals) addClasses(v);
        markOpaque(true);
      } else {
        markOpaque(analyzeExpr(part));
      }
    }
    flush();
  }

  function moduleFor(e: TS.Expression): string | undefined {
    return ts.isIdentifier(e) ? moduleIdents.get(e.text) : undefined;
  }

  /**
   * Analyze an expression appearing in class-name position.
   * Returns true when the expression was fully accounted for; composite
   * expressions report unresolvable children via analyzeOrWarn and still
   * return true so callers do not warn a second time.
   */
  function analyzeExpr(expr: TS.Expression): boolean {
    const e = unwrap(expr);

    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
      addClasses(e.text);
      return true;
    }
    if (ts.isTemplateExpression(e)) {
      consumeParts(templateParts(e), e);
      return true;
    }
    if (ts.isConditionalExpression(e)) {
      analyzeOrWarn(e.whenTrue);
      analyzeOrWarn(e.whenFalse);
      return true;
    }
    if (ts.isBinaryExpression(e)) {
      const op = e.operatorToken.kind;
      if (op === ts.SyntaxKind.PlusToken) {
        const parts = concatParts(e);
        if (parts.some((p) => typeof p === 'string')) {
          consumeParts(parts, e);
          return true;
        }
        return false;
      }
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) {
        analyzeOrWarn(e.right);
        return true;
      }
      if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) {
        analyzeExpr(e.left); // left side is often just a condition: stay quiet
        analyzeOrWarn(e.right);
        return true;
      }
      return false;
    }
    if (ts.isArrayLiteralExpression(e)) {
      for (const el of e.elements) {
        if (ts.isSpreadElement(el)) analyzeOrWarn(el.expression);
        else if (!ts.isOmittedExpression(el)) analyzeOrWarn(el);
      }
      return true;
    }
    if (ts.isObjectLiteralExpression(e)) {
      for (const prop of e.properties) {
        if (ts.isPropertyAssignment(prop)) {
          const name = prop.name;
          if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) addClasses(name.text);
          else if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
            addClasses(name.text);
          } else if (ts.isComputedPropertyName(name)) {
            analyzeOrWarn(name.expression);
          }
        } else if (ts.isShorthandPropertyAssignment(prop)) {
          addClasses(prop.name.text);
        } else if (ts.isSpreadAssignment(prop)) {
          analyzeOrWarn(prop.expression);
        }
      }
      return true;
    }
    if (ts.isCallExpression(e)) {
      const callee = unwrap(e.expression);
      if (ts.isIdentifier(callee) && CLASS_FNS.has(callee.text)) {
        analyzed.add(e);
        for (const arg of e.arguments) {
          if (ts.isSpreadElement(arg)) analyzeOrWarn(arg.expression);
          else analyzeOrWarn(arg);
        }
        return true;
      }
      return false;
    }
    if (ts.isPropertyAccessExpression(e)) {
      if (moduleFor(e.expression)) return true; // recorded by the walker
      const base = unwrap(e.expression);
      if (ts.isIdentifier(base) && (base.text === 'props' || /Props$/.test(base.text))) {
        return true; // pass-through from callers; counted at the call sites
      }
      return false;
    }
    if (ts.isElementAccessExpression(e)) {
      return moduleFor(e.expression) !== undefined; // recorded by the walker
    }
    if (ts.isIdentifier(e)) {
      if (PASSTHROUGH_IDENTS.has(e.text)) return true;
      const init = constMap.get(e.text);
      if (init && init !== e && !resolving.has(e)) {
        resolving.add(e);
        try {
          return analyzeOrWarn(init);
        } finally {
          resolving.delete(e);
        }
      }
      return false;
    }
    switch (e.kind) {
      case ts.SyntaxKind.NumericLiteral:
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
      case ts.SyntaxKind.NullKeyword:
        return true;
      default:
        return false;
    }
  }

  function analyzeOrWarn(expr: TS.Expression): boolean {
    const ok = analyzeExpr(expr);
    if (!ok) warn(expr);
    return ok;
  }

  function handleImport(node: TS.ImportDeclaration): void {
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;
    const spec = node.moduleSpecifier.text;
    if (!MODULE_SPECIFIER.test(spec)) return;
    if (!spec.startsWith('.')) {
      usage.warnings.push({
        loc: loc(node),
        snippet: `unresolvable CSS Module import "${spec}" (only relative paths are supported)`,
      });
      return;
    }
    const modulePath = normalizePath(path.resolve(path.dirname(filePath), spec));
    const clause = node.importClause;
    if (!clause) return;
    if (clause.name) moduleIdents.set(clause.name.text, modulePath);
    const bindings = clause.namedBindings;
    if (bindings) {
      if (ts.isNamespaceImport(bindings)) {
        moduleIdents.set(bindings.name.text, modulePath);
      } else {
        for (const spec of bindings.elements) {
          addModuleRef(modulePath, (spec.propertyName ?? spec.name).text);
        }
      }
    }
    // Make sure the module shows up in the map even before any reference.
    if (!usage.moduleRefs.has(modulePath)) usage.moduleRefs.set(modulePath, new Set());
  }

  function isTypeContext(node: TS.Node): boolean {
    const parent = node.parent;
    return (
      parent !== undefined &&
      (ts.isTypeQueryNode(parent) || ts.isTypeReferenceNode(parent) || ts.isTypeNode(parent))
    );
  }

  function jsxAttrName(node: TS.JsxAttribute): string {
    return ts.isIdentifier(node.name) ? node.name.text : node.name.getText(sourceFile);
  }

  /** el.classList.add(...) / remove / toggle / replace, and setAttribute('class', ...). */
  function handleDomCall(node: TS.CallExpression): void {
    const callee = node.expression;
    if (!ts.isPropertyAccessExpression(callee)) return;
    const method = callee.name.text;
    if (
      CLASSLIST_METHODS.has(method) &&
      ts.isPropertyAccessExpression(callee.expression) &&
      callee.expression.name.text === 'classList'
    ) {
      analyzed.add(node);
      // toggle(name, force): the second argument is a boolean, not a class.
      const args = method === 'toggle' ? node.arguments.slice(0, 1) : [...node.arguments];
      for (const arg of args) {
        if (ts.isSpreadElement(arg)) analyzeOrWarn(arg.expression);
        else analyzeOrWarn(arg);
      }
    } else if (method === 'setAttribute' && node.arguments.length >= 2) {
      const [attr, value] = node.arguments;
      if (attr && value && ts.isStringLiteral(attr) && attr.text === 'class') {
        analyzed.add(node);
        analyzeOrWarn(value);
      }
    }
  }

  function visit(node: TS.Node): void {
    if (ts.isImportDeclaration(node)) {
      handleImport(node);
      return;
    }
    if (ts.isJsxAttribute(node) && node.initializer) {
      const name = jsxAttrName(node);
      if (name === 'className' || name === 'class') {
        if (ts.isStringLiteral(node.initializer)) {
          addClasses(node.initializer.text);
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          const expr = node.initializer.expression;
          if (ts.isCallExpression(expr)) analyzed.add(expr);
          analyzeOrWarn(expr);
        }
      }
      // keep walking: initializers can contain CSS Module references
    }
    if (ts.isCallExpression(node) && !analyzed.has(node)) {
      const callee = node.expression;
      if (ts.isIdentifier(callee) && CLASS_FNS.has(callee.text)) {
        analyzed.add(node);
        for (const arg of node.arguments) {
          if (ts.isSpreadElement(arg)) analyzeOrWarn(arg.expression);
          else analyzeOrWarn(arg);
        }
      } else {
        handleDomCall(node);
      }
    }
    if (
      ts.isBinaryExpression(node) &&
      (node.operatorToken.kind === ts.SyntaxKind.EqualsToken ||
        node.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken) &&
      ts.isPropertyAccessExpression(node.left) &&
      node.left.name.text === 'className'
    ) {
      analyzeOrWarn(node.right); // el.className = '...'
    }
    if (ts.isPropertyAccessExpression(node)) {
      const modulePath = moduleFor(node.expression);
      if (modulePath) addModuleRef(modulePath, node.name.text);
    } else if (ts.isElementAccessExpression(node)) {
      const modulePath = moduleFor(node.expression);
      if (modulePath) {
        const vals = literalValues(node.argumentExpression);
        if (vals) {
          for (const v of vals) if (v) addModuleRef(modulePath, v);
        } else {
          usage.wholeModules.add(modulePath);
        }
      }
    } else if (ts.isIdentifier(node)) {
      const modulePath = moduleIdents.get(node.text);
      if (modulePath) {
        const parent = node.parent;
        const isAccessBase =
          parent &&
          ((ts.isPropertyAccessExpression(parent) && parent.expression === node) ||
            (ts.isElementAccessExpression(parent) && parent.expression === node));
        const isImportBinding =
          parent &&
          (ts.isImportClause(parent) || ts.isNamespaceImport(parent) || ts.isImportSpecifier(parent));
        if (!isAccessBase && !isImportBinding && !isTypeContext(node)) {
          usage.wholeModules.add(modulePath);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  // Pre-pass: variable initializers for simple identifier resolution.
  (function collectVars(node: TS.Node): void {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      constMap.set(node.name.text, node.initializer);
    }
    ts.forEachChild(node, collectVars);
  })(sourceFile);

  visit(sourceFile);
  return usage;
}

/** Merge per-file usage into one index. */
export function mergeUsage(files: Iterable<FileUsage>): Usage {
  const usage: Usage = {
    global: new Set(),
    modules: new Map(),
    wholeModules: new Set(),
    patterns: [],
    warnings: [],
    sourceFiles: 0,
  };
  const patternKeys = new Set<string>();
  for (const file of files) {
    usage.sourceFiles++;
    for (const cls of file.classes) usage.global.add(cls);
    for (const [mod, names] of file.moduleRefs) {
      let set = usage.modules.get(mod);
      if (!set) usage.modules.set(mod, (set = new Set()));
      for (const n of names) set.add(n);
    }
    for (const mod of file.wholeModules) usage.wholeModules.add(mod);
    for (const p of file.patterns) {
      const key = `${p.prefix} ${p.suffix}`;
      if (!patternKeys.has(key)) {
        patternKeys.add(key);
        usage.patterns.push(p);
      }
    }
    usage.warnings.push(...file.warnings);
  }
  return usage;
}

/** Signature of everything that affects purging; used to skip rebuilds. */
export function usageSignature(usage: Usage): string {
  const parts: string[] = [...usage.global].sort();
  for (const [mod, names] of [...usage.modules].sort(([a], [b]) => a.localeCompare(b))) {
    parts.push(`${mod}=>${[...names].sort().join(',')}`);
  }
  parts.push(...[...usage.wholeModules].sort());
  parts.push(...usage.patterns.map((p) => `${p.prefix} ${p.suffix}`).sort());
  return parts.join('|');
}
