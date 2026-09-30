// Voxel illustrations for the site.  Run:  node tools/voxel-art.mjs
//
// Each model is a set of unit cubes. The renderer projects them
// isometrically, drops faces hidden by a neighbour, and paints back to
// front. Every colour gets three tones (top, left, right) computed in
// OKLCH, with side faces cooled slightly so shadows do not turn muddy.
// Output goes to img/art/*.svg and needs nothing at runtime.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'img', 'art');

/* ---------- colour ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const toLin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.sign(c) * Math.abs(c) ** (1 / 2.4) - 0.055);

function hexToOklch(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => toLin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360];
}

function oklchToRgb(L, C, h) {
  const A = C * Math.cos(h * Math.PI / 180);
  const B = C * Math.sin(h * Math.PI / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ].map(toGam);
}

function oklchToHex(L, C, h) {
  let rgb = oklchToRgb(L, C, h);
  // pull chroma in until the colour fits sRGB
  while (rgb.some(v => v < -0.001 || v > 1.001) && C > 0) {
    C = Math.max(0, C - 0.004);
    rgb = oklchToRgb(L, C, h);
  }
  return '#' + rgb.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
}

// Shadows lean towards blue-violet, except yellows, which warm into
// orange instead of sliding through green.
function shadowHue(h, amount) {
  if (h > 55 && h < 125) return h - amount;
  const d = ((285 - h + 540) % 360) - 180;
  return h + Math.sign(d) * Math.min(Math.abs(d), amount);
}

const toneCache = new Map();
function tones(hex) {
  if (toneCache.has(hex)) return toneCache.get(hex);
  const [L, C, h] = hexToOklch(hex);
  const neutral = C < 0.03;
  const side = (dL, turn, keep) => neutral
    ? oklchToHex(clamp(L + dL, 0, 0.99), 0.008 + turn * 0.0011, 262)
    : oklchToHex(clamp(L + dL, 0, 0.99), C * keep, shadowHue(h, turn));
  const t = { top: hex, left: side(-0.07, 5, 0.97), right: side(-0.15, 11, 0.92) };
  toneCache.set(hex, t);
  return t;
}

/* ---------- model ---------- */
class Model {
  constructor() { this.v = new Map(); this.floating = new Set(); }
  static key(x, y, z) { return x + ',' + y + ',' + z; }
  has(x, y, z) { return this.v.has(Model.key(x, y, z)); }
  set(x, y, z, c) {
    const k = Model.key(x, y, z);
    if (c) this.v.set(k, { x, y, z, c }); else this.v.delete(k);
    return this;
  }
  box(x, y, z, w, d, h, c) {
    for (let i = 0; i < w; i++)
      for (let j = 0; j < d; j++)
        for (let k = 0; k < h; k++) this.set(x + i, y + j, z + k, c);
    return this;
  }
  // recolour: fn returns a colour for voxels it wants to change
  paint(fn) {
    for (const e of this.v.values()) { const c = fn(e); if (c) e.c = c; }
    return this;
  }
  // ASCII art. Rows run top to bottom along v, columns along u, extruded
  // `depth` layers along w. Characters missing from the legend are
  // skipped; a legend value of null carves voxels out.
  art(rows, legend, { at, u, v, w = [0, 0, 0], depth = 1 }) {
    rows.forEach((row, r) => [...row].forEach((ch, col) => {
      if (!(ch in legend)) return;
      for (let d = 0; d < depth; d++) {
        this.set(
          at[0] + col * u[0] + r * v[0] + d * w[0],
          at[1] + col * u[1] + r * v[1] + d * w[1],
          at[2] + col * u[2] + r * v[2] + d * w[2],
          legend[ch]
        );
      }
    }));
    return this;
  }
}

/* ---------- renderer ---------- */
const COS30 = Math.cos(Math.PI / 6);
const fmt = n => String(Math.round(n * 100) / 100);

function render(model, { unit = 10, pad = 1.2, shadow = { z: 0, blur: 0.7, opacity: 0.16 } } = {}) {
  const U = unit;
  const P = (x, y, z) => [(x - y) * COS30 * U, (x + y) * 0.5 * U - z * U];

  const voxels = [...model.v.values()].sort(
    (a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z) || a.z - b.z || a.x - b.x
  );

  const faces = [];
  for (const { x, y, z, c } of voxels) {
    const t = tones(c);
    if (!model.has(x, y, z + 1))
      faces.push([t.top, [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)]]);
    if (!model.has(x, y + 1, z))
      faces.push([t.left, [P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)]]);
    if (!model.has(x + 1, y, z))
      faces.push([t.right, [P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)]]);
  }

  // contact shadow: the footprint of whatever touches the ground (or of
  // everything, for objects that float), flattened onto the ground plane
  let shade = '';
  const pts = faces.flatMap(f => f[1]);
  if (shadow) {
    const casters = [...model.v.entries()]
      .filter(([k, e]) => !model.floating.has(k) && (shadow.all || e.z <= shadow.z + 1))
      .map(([, e]) => e);
    const cols = new Set(casters.map(e => e.x + ',' + e.y));
    let d = '';
    for (const k of cols) {
      const [x, y] = k.split(',').map(Number);
      const q = [P(x, y, shadow.z), P(x + 1, y, shadow.z), P(x + 1, y + 1, shadow.z), P(x, y + 1, shadow.z)];
      d += 'M' + q.map(p => fmt(p[0]) + ' ' + fmt(p[1])).join('L') + 'Z';
      pts.push(...q.map(p => [p[0], p[1] + shadow.blur * U * 2]));
    }
    shade =
      `<filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${fmt(shadow.blur * U)}"/></filter>` +
      `<path d="${d}" fill="#1b1530" opacity="${shadow.opacity}" filter="url(#s)" transform="translate(${fmt(U * 0.35)} ${fmt(U * 0.25)})"/>`;
  }

  // merge runs of faces that share a fill, keeping the paint order
  let body = '', cur = null, d = '';
  const flush = () => { if (cur) body += `<path fill="${cur}" stroke="${cur}" d="${d}"/>`; };
  for (const [fill, quad] of faces) {
    if (fill !== cur) { flush(); cur = fill; d = ''; }
    d += 'M' + quad.map(p => fmt(p[0]) + ' ' + fmt(p[1])).join('L') + 'Z';
  }
  flush();

  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const m = pad * U;
  const x0 = Math.min(...xs) - m, y0 = Math.min(...ys) - m;
  const w = Math.max(...xs) - Math.min(...xs) + 2 * m;
  const h = Math.max(...ys) - Math.min(...ys) + 2 * m;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(x0)} ${fmt(y0)} ${fmt(w)} ${fmt(h)}" width="${Math.round(w)}" height="${Math.round(h)}">` +
    shade +
    // the same-colour stroke closes the hairline seams between neighbouring faces
    `<g stroke-width="${fmt(U * 0.14)}" stroke-linejoin="round">${body}</g></svg>\n`;
}

/* ---------- palette ---------- */
const C = {
  ink: '#2b2445',
  cobalt: '#3b5bf5',
  cobaltSoft: '#6f8bff',
  sky: '#a9d6ff',
  lens: '#d9eeff',
  sun: '#ffc93c',
  gold: '#f7b928',
  goldHi: '#ffe07a',
  coral: '#ff6450',
  coralHi: '#ff8a73',
  mint: '#43d39a',
  grass: '#5cc45e',
  wood: '#c2844c',
  woodDark: '#9c6537',
  paper: '#ffffff',
  paperLine: '#e6ddcf',
  teal: '#33cdbd',
  tealHi: '#9ff0e5',
  tealDeep: '#1fa596',
  water: '#5cb9f2',
  foam: '#e3f5ff',
  skinA: '#ffd04a',
  skinB: '#f0b48e'
};

/* ---------- models ---------- */
const flat = { u: [1, 0, 0], v: [0, 0, -1] };           // plane facing +y
const side = { u: [0, -1, 0], v: [0, 0, -1] };          // plane facing +x

function sparkle(m, x, y, z, c = C.sun, plane = flat) {
  m.art(['.S.', 'SSS', '.S.'], { S: c }, { at: [x, y, z], ...plane });
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]].forEach(([col, row]) => m.floating.add(Model.key(
    x + col * plane.u[0] + row * plane.v[0],
    y + col * plane.u[1] + row * plane.v[1],
    z + col * plane.u[2] + row * plane.v[2]
  )));
}

// Retention: three rising columns with a pennant on the tallest
function bars() {
  const m = new Model();
  [[0, 3, C.sky], [4, 5, C.cobaltSoft], [8, 8, C.cobalt]].forEach(([x, h, c]) => {
    m.box(x, 0, 0, 3, 3, h, c);
    m.box(x, 0, h, 3, 3, 1, C.sun);
  });
  m.box(9, 1, 9, 1, 1, 6, C.ink);
  m.art(['CCCC', 'CCC', 'CC'], { C: C.coral }, { at: [10, 1, 14], ...flat });
  return m;
}

// Weekly drops: a wrapped crate with a bow
function gift() {
  const m = new Model();
  m.box(1, 1, 0, 10, 10, 6, C.coral);
  m.box(0, 0, 6, 12, 12, 2, C.coralHi);
  m.paint(e => (e.x === 5 || e.x === 6 || e.y === 5 || e.y === 6) ? C.sun : null);
  m.art([
    '.SSS..SSS.',
    'S..SSSS..S',
    'S...SS...S',
    '.SSSSSSSS.'
  ], { S: C.sun }, { at: [1, 5, 11], ...flat, w: [0, 1, 0], depth: 2 });
  sparkle(m, -3, 4, 14);
  sparkle(m, 12, -2, 16, C.cobalt);
  return m;
}

// Monetisation: a cut gem floating over its shadow
function gem() {
  const m = new Model();
  const cx = 5, cy = 5, z0 = 4;
  [1, 2, 3, 4, 5, 5, 4, 3].forEach((r, i) => {
    for (let x = cx - r; x <= cx + r; x++)
      for (let y = cy - r; y <= cy + r; y++)
        if (Math.abs(x - cx) + Math.abs(y - cy) <= r * 1.45) m.set(x, y, z0 + i, C.teal);
  });
  m.paint(e => {
    const i = e.z - z0, front = (e.x - cx) >= (e.y - cy);
    if (i >= 6) return front ? C.tealHi : '#c8f7f1';
    if (i >= 4) return front ? C.teal : '#5fdccf';
    return front ? C.tealDeep : C.teal;
  });
  m.set(3, 4, z0 + 7, C.paper).set(4, 3, z0 + 7, C.paper).set(3, 3, z0 + 7, C.paper);
  sparkle(m, -2, 8, 14, C.sun);
  sparkle(m, 11, 0, 10, C.teal);
  return m;
}

// Community: two avatars facing each other and a speech bubble
function avatar(m, ox, oy, facing, pal) {
  const put = (a, b, z, c) => facing === 'x' ? m.set(ox + b, oy - a, z, c) : m.set(ox + a, oy + b, z, c);
  const block = (a0, b0, z0, w, d, h, c) => {
    for (let a = a0; a < a0 + w; a++) for (let b = b0; b < b0 + d; b++) for (let z = z0; z < z0 + h; z++) put(a, b, z, c);
  };
  block(3, 0, 0, 3, 3, 6, pal.legs);
  block(6, 0, 0, 3, 3, 6, pal.legs);
  block(3, 0, 6, 6, 3, 6, pal.torso);
  block(0, 0, 6, 3, 3, 6, pal.skin);
  block(9, 0, 6, 3, 3, 6, pal.skin);
  block(0, 0, 9, 3, 3, 3, pal.torso);
  block(9, 0, 9, 3, 3, 3, pal.torso);
  block(3, -1, 12, 6, 5, 5, pal.skin);
  const face = ['......', '.E..E.', '.E..E.', '.M..M.', '..MM..'];
  face.forEach((row, r) => [...row].forEach((ch, a) => { if (ch !== '.') put(3 + a, 3, 16 - r, C.ink); }));
}

function crew() {
  const m = new Model();
  avatar(m, 0, 20, 'x', { skin: C.skinA, torso: C.cobalt, legs: C.mint });
  avatar(m, 9, 0, 'y', { skin: C.skinB, torso: C.coral, legs: C.ink });
  m.art([
    '.WWWWWWWWW.',
    'WWWWWWWWWWW',
    'WWWHHWHHWWW',
    'WWWHHHHHWWW',
    'WWWWHHHWWWW',
    'WWWWWHWWWWW',
    '.WWWWWWWWW.',
    '....WW.....',
    '....W......'
  ], { W: C.paper, H: C.coral }, { at: [3, 8, 28], ...flat, w: [0, -1, 0], depth: 2 });
  return m;
}

// Step 1: an envelope with an analytics card sticking out
function envelope() {
  const m = new Model();
  m.box(3, 0, 8, 8, 1, 5, C.cobalt);
  [[4, 1], [6, 2], [8, 3]].forEach(([x, h]) => m.box(x, 0, 10, 1, 1, h, C.sun));
  m.box(0, 1, 0, 14, 2, 9, C.paper);
  m.art([
    'L............L',
    '.L..........L.',
    '..L........L..',
    '...L......L...',
    '....L....L....',
    '.....LRRL.....',
    '......RR......'
  ], { L: C.paperLine, R: C.coral }, { at: [0, 2, 8], ...flat });
  m.box(6, 3, 2, 2, 1, 2, C.coral);
  return m;
}

// Step 2: a clipboard with the checklist we run on every game
function review() {
  const m = new Model();
  m.box(0, 0, 0, 12, 1, 16, C.wood);
  m.box(1, 1, 1, 10, 1, 13, C.paper);
  m.art([
    '..........',
    '.MM.LLLLL.',
    '.MM.......',
    '..........',
    '.MM.LLLL..',
    '.MM.......',
    '..........',
    '.MM.LLLLL.',
    '.MM.......',
    '..........',
    '.OO.LLL...',
    '.OO.......'
  ], { M: C.mint, L: C.paperLine, O: C.paperLine }, { at: [1, 1, 13], ...flat });
  m.box(4, 1, 14, 4, 2, 2, C.ink);
  m.box(5, 1, 16, 2, 1, 1, C.ink);
  // a pencil leaning on the board
  for (let i = 0; i < 7; i++) m.box(12 - i, 3, i, 1, 1, 1, i === 0 ? C.ink : i === 6 ? C.coral : C.sun);
  return m;
}

// Step 3: an open chest full of gold
function chest() {
  const m = new Model();
  m.box(0, 0, 0, 12, 8, 6, C.wood);
  m.paint(e => e.z === 2 ? C.woodDark : null);
  m.paint(e => (e.x === 1 || e.x === 10) ? C.gold : null);
  m.paint(e => e.z === 5 ? C.gold : null);
  m.box(0, 0, 6, 12, 2, 7, C.wood);
  m.paint(e => e.z >= 6 && e.y <= 1 && (e.x === 1 || e.x === 10 || e.z === 12) ? C.gold : null);
  m.box(1, 2, 6, 10, 5, 1, C.gold);
  m.box(2, 2, 7, 8, 4, 1, C.gold);
  m.box(3, 3, 8, 5, 2, 1, C.goldHi);
  m.set(5, 3, 9, C.goldHi).set(4, 4, 8, C.coral).set(8, 3, 7, C.teal);
  m.box(5, 8, 1, 2, 1, 3, C.gold);
  m.set(5, 8, 2, C.ink).set(6, 8, 2, C.ink);
  m.box(13, 5, 0, 2, 2, 1, C.gold);
  m.box(13, 5, 1, 2, 2, 1, C.goldHi);
  m.box(10, 10, 0, 2, 2, 1, C.goldHi);
  return m;
}

// Step 4 and brand: the Voyage ship carrying a game crate
function ship() {
  const m = new Model();
  // a slab of sea with a few crests
  m.box(-4, -4, 0, 26, 15, 2, C.water);
  [[-4, -4], [21, -4], [-4, 10], [21, 10]].forEach(([x, y]) => m.set(x, y, 1, null));
  [[0, 8], [1, 8], [15, 9], [16, 9], [17, 9], [-2, 2], [19, 0], [20, 0]].forEach(([x, y]) => m.set(x, y, 2, C.foam));
  // hull: a red band at the waterline, cobalt sides, white rail, plank deck
  const beam = x => x <= 13 ? [0, 6] : x === 14 ? [1, 5] : x === 15 ? [2, 4] : [3, 3];
  for (let x = 0; x <= 16; x++) {
    const [y0, y1] = beam(x);
    for (let y = y0; y <= y1; y++) {
      const edge = y === y0 || y === y1 || x === 0 || x === 16;
      m.set(x, y, 2, C.coral);
      m.set(x, y, 3, C.cobalt);
      m.set(x, y, 4, edge ? C.cobalt : C.wood);
      if (edge) m.set(x, y, 5, C.paper);
    }
  }
  // cargo
  m.box(2, 2, 5, 4, 3, 3, C.sun);
  m.box(3, 2, 8, 2, 2, 2, C.coral);
  // mast, sails and flag
  m.box(9, 3, 5, 1, 1, 19, C.woodDark);
  m.art([
    '.......S',
    '......SS',
    '.....SSS',
    '....SSSS',
    '...SSSSS',
    '..SSSSSS',
    '.BBBBBBB',
    'SSSSSSSS',
    'SSSSSSSS',
    'SSSSSSSS'
  ], { S: C.paper, B: C.coral }, { at: [1, 3, 22], ...flat });
  m.art(['S', 'SS', 'SSS', 'SSSS', 'SSSSS', 'SSSSSS'], { S: C.paper }, { at: [10, 3, 20], ...flat });
  m.art(['FFFF', 'FFF'], { F: C.sun }, { at: [10, 3, 23], ...flat });
  return m;
}

// Contact: a mailbox on a patch of grass, flag up, a letter in the door
function mailbox() {
  const m = new Model();
  m.box(0, -1, 0, 11, 9, 1, C.grass);
  m.box(4, 2, 1, 2, 2, 8, C.wood);
  const arch = ['.XXXX.', 'XXXXXX', 'XXXXXX', 'XXXXXX', 'XXXXXX', 'XXXXXX'];
  for (let x = 0; x < 12; x++) {
    m.art(arch, { X: x === 11 ? C.coralHi : C.coral }, { at: [x, 0, 14], u: [0, 1, 0], v: [0, 0, -1] });
  }
  m.box(11, 1, 12, 3, 4, 1, C.paper);
  m.set(12, 2, 13, C.coral).set(12, 3, 13, C.coral);
  m.set(11, 5, 10, C.ink);
  m.box(2, 6, 10, 1, 1, 8, C.sun);
  m.art(['FFFF', 'FFFF'], { F: C.sun }, { at: [3, 6, 17], ...flat });
  return m;
}

/* ---------- build ---------- */
const MODELS = {
  'retention': [bars, { unit: 10 }],
  'drops': [gift, { unit: 10 }],
  'gem': [gem, { unit: 10, shadow: { z: 0, blur: 1.1, opacity: 0.12, all: true } }],
  'community': [crew, { unit: 8 }],
  'send': [envelope, { unit: 10 }],
  'review': [review, { unit: 10 }],
  'offer': [chest, { unit: 10 }],
  'ship': [ship, { unit: 10, shadow: null }],
  'mailbox': [mailbox, { unit: 10 }]
};

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const [name, [build, opts]] of Object.entries(MODELS)) {
  if (only.length && !only.includes(name)) continue;
  const svg = render(build(), opts);
  fs.writeFileSync(path.join(OUT, name + '.svg'), svg);
  const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  console.log(name.padEnd(10), `${Math.round(w)}x${Math.round(h)}`.padEnd(10), (svg.length / 1024).toFixed(1) + ' KB');
}
