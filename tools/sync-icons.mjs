// Copies the icon sprite into every page.  Run:  node tools/sync-icons.mjs
//
// img/icons.svg is the one place icons are drawn. Each page carries an
// inline copy between the "icons:start" and "icons:end" comments, so the
// icons work with no extra request, no JavaScript, and from file://.
// This script rewrites that block; nothing else in the page is touched.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'games.html', 'privacy.html'];
const START = '<!-- icons:start (generated from img/icons.svg, edit that file and run tools/sync-icons.mjs) -->';
const END = '<!-- icons:end -->';

const source = fs.readFileSync(path.join(ROOT, 'img', 'icons.svg'), 'utf8');

// one symbol per line, comments and the standalone-file attributes dropped
const symbols = [...source.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<symbol[\s\S]*?<\/symbol>/g)]
  .map(m => '  ' + m[0].replace(/>\s+</g, '><').replace(/\s+/g, ' '));

if (!symbols.length) throw new Error('no <symbol> found in img/icons.svg');

const ids = symbols.map(s => s.match(/id="([^"]+)"/)[1]);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) throw new Error('duplicate icon ids: ' + dupes.join(', '));

const block = [
  START,
  '<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false">',
  ...symbols,
  '</svg>',
  END
].join('\n');

const pattern = /<!-- icons:start[\s\S]*?<!-- icons:end -->/;

for (const page of PAGES) {
  const file = path.join(ROOT, page);
  const html = fs.readFileSync(file, 'utf8');
  if (!pattern.test(html)) {
    console.warn(page.padEnd(14), 'skipped, no icons:start / icons:end markers');
    continue;
  }
  const next = html.replace(pattern, () => block);

  // every <use href="#id"> in the page must point at a symbol that exists
  const missing = [...new Set([...next.matchAll(/<use href="#([^"]+)"/g)].map(m => m[1]))]
    .filter(id => !ids.includes(id));
  if (missing.length) console.warn(page.padEnd(14), 'unknown icons used:', missing.join(', '));

  if (next !== html) fs.writeFileSync(file, next);
  console.log(page.padEnd(14), next !== html ? 'updated' : 'already current', `(${symbols.length} icons)`);
}
