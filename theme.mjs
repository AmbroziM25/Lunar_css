/**
 * Lunara CSS — theme helper.
 * Tiny, framework-agnostic ESM utility for toggling/persisting the
 * data-theme attribute Lunara's CSS reads. No dependencies, no build step —
 * works the same from plain <script type="module">, React, Vue, Angular,
 * Svelte, or anything else that can `import` an ES module.
 *
 * This is entirely optional: Lunara's CSS only ever reads the `data-theme`
 * attribute, so you can set it however you like (including not using this
 * file at all).
 */

const STORAGE_KEY = 'lunar-theme';

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  // Mirror to Bootstrap's color-mode attribute so lunara-bootstrap pages
  // (and Bootstrap's own dark-mode styles) switch in lockstep. Harmless
  // when Bootstrap isn't present.
  document.documentElement.setAttribute('data-bs-theme', theme);
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
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    document.documentElement.setAttribute('data-bs-theme', saved);
  }
}

/* ------------------------------------------------------------------
 * Moon phase — lunar-reactive theming.
 * ------------------------------------------------------------------ */

const SYNODIC_MONTH = 29.53058867; // days, mean synodic month
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // reference new moon

const PHASE_NAMES = [
  'new',
  'waxing-crescent',
  'first-quarter',
  'waxing-gibbous',
  'full',
  'waning-gibbous',
  'last-quarter',
  'waning-crescent',
];

/**
 * Compute the moon's phase for a given date (defaults to now).
 * Returns { name, age, illumination }:
 *   name         — one of the eight PHASE_NAMES (kebab-case)
 *   age          — days since the last new moon (0–29.53)
 *   illumination — lit fraction as a 0–100 percentage
 */
export function getMoonPhase(date = new Date()) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const age = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const index = Math.round(age / (SYNODIC_MONTH / 8)) % 8;
  const illumination = Math.round(((1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2) * 100);
  return { name: PHASE_NAMES[index], age, illumination };
}

/**
 * Set data-moon-phase on <html> from the real lunar calendar, making the
 * framework's glow intensity track the actual moon (via --lunar-moonlight)
 * and any .moon-live icons render tonight's phase. Returns the phase object.
 */
export function initMoonPhase(date) {
  const phase = getMoonPhase(date);
  document.documentElement.setAttribute('data-moon-phase', phase.name);
  return phase;
}

/* ------------------------------------------------------------------
 * Moonbeam — cursor-tracking glow for .moonbeam elements.
 * ------------------------------------------------------------------ */

/**
 * Enable cursor tracking for every .moonbeam element via one delegated
 * pointermove listener (elements added later just work). Returns a
 * cleanup function that removes the listener.
 */
export function initMoonbeam(root = document) {
  const onMove = (e) => {
    const el = e.target && e.target.closest && e.target.closest('.moonbeam');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--beam-x', (((e.clientX - rect.left) / rect.width) * 100).toFixed(2) + '%');
    el.style.setProperty('--beam-y', (((e.clientY - rect.top) / rect.height) * 100).toFixed(2) + '%');
  };
  root.addEventListener('pointermove', onMove, { passive: true });
  return () => root.removeEventListener('pointermove', onMove);
}
