/**
 * Lunar CSS — Tailwind preset
 *
 * Exposes Lunar's design tokens (colors, spacing, radii, shadows, fonts,
 * animations) as a Tailwind theme extension, so an existing Tailwind setup
 * gets the same night-sky palette and utility values Lunar ships standalone.
 *
 * `dark:` keeps working exactly the way Tailwind's docs describe it — this
 * preset just points Tailwind's built-in selector-based dark mode at the
 * same `data-theme="dark"` attribute Lunar itself toggles, so one attribute
 * switch drives both Lunar's own theme and any `dark:` utilities you write.
 *
 * Usage (tailwind.config.js):
 *
 *   module.exports = {
 *     presets: [require('lunar-css/tailwind-preset')],
 *     content: ['./src/**\/*.{html,js,jsx,ts,tsx}'],
 *   };
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        moon: {
          50: '#f7f8fc',
          100: '#eceef7',
          200: '#d9dcee',
          300: '#b9bfdd',
          400: '#9298bd',
          500: '#6f76a0',
          600: '#545a80',
          700: '#3d4163',
          800: '#262844',
          900: '#14152a',
          950: '#090913',
        },
        indigo: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        silver: {
          300: '#d7dbea',
          400: '#b7bcd6',
        },
        eclipse: '#0d0e1f',
        glow: '#e4e8ff',
        tide: '#6c6ff0',
      },

      spacing: {
        18: '4.5rem',
        88: '22rem',
      },

      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },

      boxShadow: {
        'glow-sm': '0 0 12px 0 rgb(228 232 255 / 0.25)',
        'glow-md': '0 0 24px 2px rgb(108 111 240 / 0.35)',
        'glow-lg': '0 0 48px 6px rgb(108 111 240 / 0.45)',
        'glow-violet': '0 0 32px 4px rgb(139 92 246 / 0.45)',
      },

      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Inter',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },

      keyframes: {
        'lunar-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'lunar-pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px 0 rgb(228 232 255 / 0.25)' },
          '50%': { boxShadow: '0 0 48px 6px rgb(108 111 240 / 0.45)' },
        },
        'lunar-shimmer': {
          to: { backgroundPosition: '-200% center' },
        },
        'lunar-aurora': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'lunar-twinkle': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
      },

      animation: {
        float: 'lunar-float 6s ease-in-out infinite',
        'pulse-glow': 'lunar-pulse-glow 2.4s ease-in-out infinite',
        shimmer: 'lunar-shimmer 4s linear infinite',
        aurora: 'lunar-aurora 12s ease-in-out infinite',
        twinkle: 'lunar-twinkle 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
