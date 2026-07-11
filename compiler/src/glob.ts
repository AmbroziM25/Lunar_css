import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Minimal glob engine so the tool has no globbing dependency.
 * Supports: `**` (any depth), `*` (within a segment), `?`, `{a,b}` alternation.
 * Patterns are matched against paths relative to cwd, with forward slashes.
 * `node_modules` and `.git` directories are never traversed.
 */

const MAGIC = /[*?{]/;

export function normalizeSlashes(p: string): string {
  return p.replace(/\\/g, '/');
}

/** Expand `{a,b}` alternations into multiple patterns (handles nesting). */
export function expandBraces(pattern: string): string[] {
  const start = pattern.indexOf('{');
  if (start === -1) return [pattern];
  let depth = 0;
  let end = -1;
  const alts: string[] = [];
  let last = start + 1;
  for (let i = start; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        alts.push(pattern.slice(last, i));
        end = i;
        break;
      }
    } else if (ch === ',' && depth === 1) {
      alts.push(pattern.slice(last, i));
      last = i + 1;
    }
  }
  if (end === -1) return [pattern]; // unbalanced brace: treat literally
  const head = pattern.slice(0, start);
  const tail = pattern.slice(end + 1);
  return alts.flatMap((a) => expandBraces(head + a + tail));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Convert a single (brace-free) glob to a RegExp over slash-separated paths. */
export function globToRegExp(glob: string): RegExp {
  let re = '';
  let i = 0;
  const n = glob.length;
  while (i < n) {
    const ch = glob[i]!;
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          re += '(?:[^/]+/)*'; // "**/" -> zero or more whole segments
          i += 3;
        } else {
          re += '.*';
          i += 2;
        }
        continue;
      }
      re += '[^/]*';
      i++;
      continue;
    }
    if (ch === '?') {
      re += '[^/]';
      i++;
      continue;
    }
    if (ch === '/' && glob.slice(i) === '/**') {
      re += '(?:/.*)?'; // trailing "/**" also matches the directory itself
      break;
    }
    re += escapeRegExp(ch);
    i++;
  }
  return new RegExp(`^${re}$`);
}

/** Leading path segments containing no glob magic (the directory to walk). */
export function staticBase(pattern: string): string {
  const segs = pattern.split('/');
  const out: string[] = [];
  for (const seg of segs) {
    if (MAGIC.test(seg)) break;
    out.push(seg);
  }
  // Drop a trailing file-looking segment only if it's the entire pattern
  // (handled by the caller checking for magic).
  return out.join('/');
}

const SKIP_DIRS = new Set(['node_modules', '.git']);

/**
 * Resolve glob patterns to a sorted list of absolute file paths.
 * A pattern without any magic characters is treated as a literal file path.
 */
export function globSync(patterns: string[], cwd: string): string[] {
  const out = new Set<string>();
  for (const raw of patterns) {
    for (const pattern of expandBraces(normalizeSlashes(raw).replace(/^\.\//, ''))) {
      if (!MAGIC.test(pattern)) {
        const file = path.resolve(cwd, pattern);
        try {
          if (fs.statSync(file).isFile()) out.add(file);
        } catch {
          /* missing literal path: no match */
        }
        continue;
      }
      const re = globToRegExp(pattern);
      const baseRel = staticBase(pattern);
      const baseAbs = path.resolve(cwd, baseRel);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(baseAbs);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;
      walk(baseAbs, cwd, re, out);
    }
  }
  return [...out].sort();
}

function walk(dir: string, cwd: string, re: RegExp, out: Set<string>): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, cwd, re, out);
    } else if (entry.isFile()) {
      const rel = normalizeSlashes(path.relative(cwd, full));
      if (re.test(rel)) out.add(full);
    }
  }
}

/**
 * Directories to watch for a set of patterns: the deduped static bases,
 * with nested bases folded into their ancestors.
 */
export function watchRoots(patterns: string[], cwd: string): string[] {
  const bases = new Set<string>();
  for (const raw of patterns) {
    for (const pattern of expandBraces(normalizeSlashes(raw).replace(/^\.\//, ''))) {
      const base = path.resolve(cwd, staticBase(pattern));
      const dir = MAGIC.test(pattern) ? base : path.dirname(base);
      try {
        if (fs.statSync(dir).isDirectory()) bases.add(dir);
      } catch {
        /* ignore missing roots */
      }
    }
  }
  const sorted = [...bases].sort((a, b) => a.length - b.length);
  const roots: string[] = [];
  for (const dir of sorted) {
    if (!roots.some((r) => dir === r || dir.startsWith(r + path.sep))) roots.push(dir);
  }
  return roots;
}
