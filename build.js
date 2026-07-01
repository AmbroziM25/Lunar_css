#!/usr/bin/env node
'use strict';
/**
 * Lunar CSS build script.
 * Concatenates the modular /src files (in cascade order) into a single
 * dist/lunar.css, then produces a minified dist/lunar.min.css.
 * No external dependencies — keeps `npm install` unnecessary for consumers
 * and the build itself dependency-free.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, 'src');
const DIST_DIR = path.join(ROOT, 'dist');

// Cascade order matters: tokens/reset first, then theme overrides, then
// effects (keyframes + effect classes), then components, utilities last
// so utility classes can always win (Tailwind-style utility precedence).
const FILES = ['base.css', 'themes.css', 'effects.css', 'components.css', 'utilities.css'];

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const banner = `/*!
 * Lunar CSS v${pkg.version}
 * A lightweight, utility-first CSS framework with a dark "night sky" aesthetic.
 * ${pkg.homepage || ''}
 * License: MIT
 */`;

function build() {
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const combined = FILES.map((file) =>
    fs.readFileSync(path.join(SRC_DIR, file), 'utf8').trim()
  ).join('\n\n');

  const full = `${banner}\n\n${combined}\n`;
  fs.writeFileSync(path.join(DIST_DIR, 'lunar.css'), full, 'utf8');

  const min = minify(full);
  fs.writeFileSync(path.join(DIST_DIR, 'lunar.min.css'), min, 'utf8');

  const fullKB = (Buffer.byteLength(full) / 1024).toFixed(1);
  const minKB = (Buffer.byteLength(min) / 1024).toFixed(1);
  console.log(`built dist/lunar.css (${fullKB} KB)`);
  console.log(`built dist/lunar.min.css (${minKB} KB)`);
}

function minify(css) {
  const bannerMatch = css.match(/^\/\*![\s\S]*?\*\//);
  const head = bannerMatch ? bannerMatch[0] : '';
  const rest = bannerMatch ? css.slice(bannerMatch[0].length) : css;

  const body = rest
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip remaining (per-module) comments
    .replace(/\s+/g, ' ') // collapse whitespace runs — never deletes a lone space (safe for calc())
    .replace(/\s*([{}:;,])\s*/g, '$1') // tighten spacing around structural punctuation
    .replace(/;}/g, '}') // drop redundant trailing semicolons
    .trim();

  return head ? `${head}\n${body}\n` : `${body}\n`;
}

build();
