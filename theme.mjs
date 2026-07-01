/**
 * Lunar CSS — theme helper.
 * Tiny, framework-agnostic ESM utility for toggling/persisting the
 * data-theme attribute Lunar's CSS reads. No dependencies, no build step —
 * works the same from plain <script type="module">, React, Vue, Angular,
 * Svelte, or anything else that can `import` an ES module.
 *
 * This is entirely optional: Lunar's CSS only ever reads the `data-theme`
 * attribute, so you can set it however you like (including not using this
 * file at all).
 */

const STORAGE_KEY = 'lunar-theme';

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    /* localStorage unavailable (privacy mode, SSR, etc.) — theme still applies for this load */
  }
}

export function toggleTheme() {
  const next = getTheme() === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}

/**
 * Call once on mount to restore a previously saved theme. In SSR frameworks
 * (Next.js, Nuxt, Angular Universal) prefer the inline anti-flash script
 * documented in the README, since this only runs after client-side hydration.
 */
export function initTheme() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    saved = null;
  }
  if (saved) document.documentElement.setAttribute('data-theme', saved);
}
