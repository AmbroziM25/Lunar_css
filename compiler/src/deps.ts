import { createRequire } from 'node:module';

/**
 * Lazy loading for the optimizer's heavy dependencies. Lunara itself installs
 * with zero dependencies ("no build step" is the whole point) — lightningcss
 * and typescript are optional peers, resolved from the consuming project only
 * when the optimizer actually runs.
 */

const requireFrom = createRequire(import.meta.url);
const cache = new Map<string, unknown>();

export class MissingDependencyError extends Error {}

export function loadOptional<T>(pkg: string, why: string): T {
  if (cache.has(pkg)) return cache.get(pkg) as T;
  try {
    const mod = requireFrom(pkg) as T;
    cache.set(pkg, mod);
    return mod;
  } catch {
    throw new MissingDependencyError(
      `The Lunara optimizer needs "${pkg}" for ${why}.\n` +
        `Install it in your project:\n\n    npm install -D ${pkg}\n`,
    );
  }
}
