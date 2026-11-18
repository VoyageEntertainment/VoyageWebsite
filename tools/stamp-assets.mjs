// Puts a version on every asset URL in the pages.  Run:  node tools/stamp-assets.mjs
//
// GitHub Pages lets a browser keep each file for ten minutes. Without a
// version, someone who visited just before an update gets the new page
// with the stylesheet and script they already had, and sees a broken mix
// of the two until the ten minutes are up. With "?v=<hash of the file>"
// on the address, a changed file has a new address, so a page always loads
// the files it was written for.
//
// Run this after changing any file listed in ASSETS, then commit the pages
// together with the files.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'games.html', 'privacy.html'];
const ASSETS = [
  'css/style.css',
  'css/games.css',
  'js/games-data.js',
  'js/script.js',
  'favicon.svg',
  'apple-touch-icon.png',
  'preview.png'
];
const TEXT = /\.(css|js|svg)$/;

// Eight characters of the file's hash. Line endings are evened out first,
// so the same file gives the same version on Windows and everywhere else.
function version(asset) {
  let data = fs.readFileSync(path.join(ROOT, asset));
  if (TEXT.test(asset)) data = Buffer.from(data.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
  return crypto.createHash('sha1').update(data).digest('hex').slice(0, 8);
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const versions = Object.fromEntries(ASSETS.map(a => [a, version(a)]));

for (const page of PAGES) {
  const file = path.join(ROOT, page);
  const html = fs.readFileSync(file, 'utf8');
  let next = html;
  const stamped = [];

  for (const asset of ASSETS) {
    // the asset as an attribute value, relative ("css/style.css") or after
    // the site's address (".../preview.png"), with or without an old version
    const pattern = new RegExp(`(?<=["/])${escapeRe(asset)}(?:\\?v=[0-9a-f]+)?(?=")`, 'g');
    next = next.replace(pattern, () => {
      if (!stamped.includes(asset)) stamped.push(asset);
      return `${asset}?v=${versions[asset]}`;
    });
  }

  if (next !== html) fs.writeFileSync(file, next);
  console.log(page.padEnd(14), next !== html ? 'updated' : 'already current', `(${stamped.length} assets)`);
}
