'use strict';

/* =============================================================
   Game catalogue + live stats from the public Roblox API.

   To add a game, add an entry to GAMES. Every list on the site
   (the wall of art in the hero, the cards on the home page, the games
   page) is built from it.

   universeId is constant per game (resolved once through
   apis.roblox.com/universes/v1/places/{placeId}/universe).

   fallback.* are the last values recorded by hand. They paint
   immediately and stay on screen if the API is unreachable.
   fallback.rating is always static: the public games endpoint
   returns null for positiveRatingPercentage.

   color is the game's own accent. It only shows behind the art
   while the image is still loading. deep is a darker shade of it,
   kept for anything that needs white text on the game colour.
   ============================================================= */

const GAMES = [
  {
    placeId:    '117782023218098',
    universeId: '8153647770',
    title: 'Kick a Brainrot',
    genre: 'Simulator',
    description: 'Hatch eggs, collect Brainrots and kick them to trigger mutations. Over 100 characters to find.',
    image: 'img/games/kick-a-brainrot.webp',
    cover: 'img/games/kick-a-brainrot-cover.webp',
    color: '#ff5a4e', deep: '#d7312c',
    url: 'https://www.roblox.com/games/117782023218098/Kick-a-Brainrot',
    fallback: { plays: '53.3M', rating: '98%', favorites: '2.1M' }
  },
  {
    placeId:    '95275361430060',
    universeId: '8068146529',
    title: 'Steal a Mob',
    genre: 'Simulator',
    description: 'Buy mobs, steal from other players and build an income. Rebirth for permanent upgrades.',
    image: 'img/games/steal-a-mob.webp',
    cover: 'img/games/steal-a-mob-cover.webp',
    color: '#5b6cf0', deep: '#5362e6',
    url: 'https://www.roblox.com/games/95275361430060/Steal-a-Mob',
    fallback: { plays: '2.4M', rating: '96%', favorites: '182.5K' }
  },
  {
    placeId:    '119749960243257',
    universeId: '8626842369',
    title: 'Brainrot Balloon',
    genre: 'Simulator',
    description: 'Pop balloons to collect Brainrots and chase rare mutations across a growing roster.',
    image: 'img/games/brainrot-balloon.webp',
    cover: 'img/games/brainrot-balloon-cover.webp',
    color: '#a98bff', deep: '#7d5ccc',
    url: 'https://www.roblox.com/games/119749960243257/Brainrot-Balloon',
    fallback: { plays: '2.1M', rating: '94%', favorites: '220.9K' }
  },
  {
    placeId:    '103134341448025',
    universeId: '10076620742',
    title: 'Grow Trees for Brainrots',
    genre: 'Idle',
    description: 'Plant trees, harvest Brainrots and keep earning while offline. Endless progression.',
    image: 'img/games/grow-trees.webp',
    cover: 'img/games/grow-trees-cover.webp',
    color: '#5cc45e', deep: '#08851b',
    url: 'https://www.roblox.com/games/103134341448025/Grow-Trees-For-Brainrots',
    fallback: { plays: '935.3K', rating: '94%', favorites: '101.7K' }
  },
  {
    placeId:    '81776530583332',
    universeId: '9691446155',
    title: 'Dont Move For Brainrots',
    genre: 'Survival',
    description: 'Stay completely still while the Brainrots hunt you. One twitch and the round is over.',
    image: 'img/games/dont-move-for-brainrots.webp',
    cover: 'img/games/dont-move-for-brainrots-cover.webp',
    color: '#e8b531', deep: '#926e02',
    url: 'https://www.roblox.com/games/81776530583332/Dont-Move-For-Brainrots',
    fallback: { plays: '117.7K', rating: '64%', favorites: '17.6K' }
  },
  {
    placeId:    '131666238350869',
    universeId: '9258201022',
    title: 'Explode a Brainrot',
    genre: 'Simulator',
    description: 'Launch and detonate Brainrots for combos, collect mutations and climb the leaderboard.',
    image: 'img/games/explode-a-brainrot.webp',
    cover: 'img/games/explode-a-brainrot-cover.webp',
    color: '#ff9a3d', deep: '#ad600b',
    url: 'https://www.roblox.com/games/131666238350869/Explode-a-Brainrot',
    fallback: { plays: '44.2K', rating: '92%', favorites: '7.3K' }
  },
  {
    placeId:    '123506026934679',
    universeId: '9606014660',
    title: 'Brainrot Disaster Survival',
    genre: 'Survival',
    description: 'Outlast waves of escalating disasters. Dodge, react and stay alive longer than the lobby.',
    image: 'img/games/brainrot-disaster-survival.webp',
    cover: 'img/games/brainrot-disaster-survival-cover.webp',
    color: '#46b3f5', deep: '#017ab3',
    url: 'https://www.roblox.com/games/123506026934679/Brainrot-Disaster-Survival',
    fallback: { plays: '30.7K', rating: '67%', favorites: '5.4K' }
  }
];

/* ---------- helpers ---------- */
function fmtNum(n) {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(n));
}

function parseNum(s) {
  const n = parseFloat(s);
  if (!n) return 0;
  if (s.includes('B')) return n * 1e9;
  if (s.includes('M')) return n * 1e6;
  if (s.includes('K')) return n * 1e3;
  return n;
}

function getStats(game) { return game.live || game.fallback; }
function visitsOf(game)   { return parseNum(getStats(game).plays); }
function favesOf(game)    { return parseNum(getStats(game).favorites); }
function ratingOf(game)   { return parseInt(getStats(game).rating, 10) || 0; }
function playingOf(game)  { return game.live ? (game.live.playingRaw || 0) : 0; }

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const byVisits = (a, b) => visitsOf(b) - visitsOf(a);

// An icon from the sprite inlined at the top of each page (img/icons.svg).
function icon(name, cls) {
  return `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#${name}"/></svg>`;
}

const NEW_TAB = 'target="_blank" rel="noopener noreferrer"';

// Lists are painted twice, once with recorded values and once when the API
// settles. If nothing changed, leave the DOM alone so no image reloads.
function setHTML(host, html) {
  if (host._html === html) return false;
  host._html = html;
  host.innerHTML = html;
  return true;
}


/* ---------- Roblox API through public proxies ----------
   games.roblox.com sends no CORS headers, so a browser cannot call it
   directly. Each entry turns the real URL into one a page may fetch.
   The first is roproxy, a mirror of the Roblox API that keeps the same
   paths on its own host; the rest are general-purpose CORS proxies.
   Any host added or removed here also belongs in privacy.html. */
const CORS_PROXIES = [
  u => u.replace('//games.roblox.com/', '//games.roproxy.com/'),
  u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
];

const FETCH_TIMEOUT = 8000;

function robloxFetch(url) {
  const attempt = (makeProxy) => {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    return fetch(makeProxy(url), { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .finally(() => clearTimeout(timer));
  };
  // race every proxy, first success wins
  return Promise.any(CORS_PROXIES.map(attempt))
    .catch(() => { throw new Error('all proxies failed'); });
}

async function fetchRobloxStats() {
  const ids = GAMES.map(g => g.universeId).join(',');
  const payload = await robloxFetch(`https://games.roblox.com/v1/games?universeIds=${ids}`);
  if (!payload || !Array.isArray(payload.data)) throw new Error('unexpected payload');

  const byUniverse = {};
  payload.data.forEach(g => {
    byUniverse[String(g.id)] = {
      plays:      fmtNum(g.visits),
      favorites:  fmtNum(g.favoritedCount),
      playing:    g.playing > 0 ? fmtNum(g.playing) : null,
      playingRaw: g.playing || 0
    };
  });

  return GAMES.map(game => {
    const live = byUniverse[game.universeId];
    if (!live) return Object.assign({}, game, { live: null });
    // rating is not exposed by this endpoint, keep the recorded value
    return Object.assign({}, game, {
      live: Object.assign({}, live, { rating: game.fallback.rating })
    });
  });
}

/* ---------- localStorage cache ---------- */
const LS_KEY = 'voyage_live_stats';
const LS_TTL = 30 * 60 * 1000;

// Only the live numbers are cached. Titles, art and colours always come
// from GAMES above, so a stale cache can never show outdated artwork.
function cacheRead() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { ts, live } = JSON.parse(raw);
    if (!live || typeof live !== 'object' || Date.now() - ts > LS_TTL) return null;
    return GAMES.map(g => Object.assign({}, g, { live: live[g.universeId] || null }));
  } catch { return null; }
}

function cacheWrite(games) {
  try {
    if (!games.some(g => g.live)) return;
    const live = {};
    games.forEach(g => { if (g.live) live[g.universeId] = g.live; });
    localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), live }));
  } catch { /* private mode or quota, ignore */ }
}

async function loadGames() {
  const cached = cacheRead();
  if (cached) {
    fetchRobloxStats().then(cacheWrite).catch(() => {});
    return cached;
  }
  try {
    const games = await fetchRobloxStats();
    cacheWrite(games);
    return games;
  } catch {
    return GAMES.map(g => Object.assign({}, g, { live: null }));
  }
}

let _gamesPromise = null;
function loadGamesOnce() {
  if (!_gamesPromise) _gamesPromise = loadGames();
  return _gamesPromise;
}

/* =============================================================
   Player counts
   ============================================================= */

// Concurrent players are only worth showing when there are enough of
// them. Below this total across all games the site says nothing about
// who is online: no "Playing now" plaque, no pills on the art, no figure
// on the cards. Visits and favorites stay live either way.
const MIN_PLAYERS_SHOWN = 100;

// The games as they should be drawn: unchanged when the total clears the
// bar, otherwise with every player count blanked.
function forDisplay(games) {
  const total = games.reduce((s, g) => s + playingOf(g), 0);
  if (total >= MIN_PLAYERS_SHOWN) return games;
  return games.map(g => (g.live
    ? Object.assign({}, g, { live: Object.assign({}, g.live, { playing: null, playingRaw: 0 }) })
    : g));
}

const hasPlayers = games => games.some(g => playingOf(g) > 0);

/* =============================================================
   Renderers
   ============================================================= */

/* Headline figures. The recorded totals are already in the HTML; this
   swaps in fresh ones. "Playing now" has no offline value, so its entry
   stays hidden unless there is a number to show. */
function renderFigures(games) {
  const playing = games.reduce((s, g) => s + playingOf(g), 0);
  const values = {
    visits:    fmtNum(games.reduce((s, g) => s + visitsOf(g), 0)),
    games:     String(games.length),
    favorites: fmtNum(games.reduce((s, g) => s + favesOf(g), 0)),
    playing:   playing > 0 ? fmtNum(playing) : null
  };

  document.querySelectorAll('[data-figure]').forEach(el => {
    const value = values[el.dataset.figure];
    if (value === undefined) return;
    const tile = el.closest('[data-live]');
    if (value === null) {
      if (tile) tile.hidden = true;
      return;
    }
    el.textContent = value;
    if (tile) tile.hidden = false;
  });
}

/* ---------- home page: the wall behind the title ----------
   Twelve tilted pieces of game art around the edges of the hero. Their
   places are fixed in css/style.css (.wall-tile:nth-child); this only
   deals the art into them: every cover first, most played first, then
   the square icons. It is decoration, so it is built once and never
   refreshed when the live numbers arrive. */
const WALL_TILES = 12;

function renderWall(ranked) {
  const host = document.getElementById('heroWall');
  if (!host || host.firstElementChild || !ranked.length) return;

  const art = ranked.map(g => ({ src: g.cover, color: g.color, square: false }))
    .concat(ranked.map(g => ({ src: g.image, color: g.color, square: true })));

  let html = '';
  for (let i = 0; i < WALL_TILES; i++) {
    const a = art[i % art.length];
    html += `<div class="wall-tile${a.square ? ' wall-tile--sq' : ''}" style="background-color:${esc(a.color)}">` +
            `<img src="${esc(a.src)}" alt="" decoding="async" /></div>`;
  }
  host.innerHTML = html;
}

/* ---------- a game's figures ---------- */
function gstat(value, label, kind) {
  return `<span class="gstat${kind ? ' gstat--' + kind : ''}"><b>${value}</b><span class="label">${label}</span></span>`;
}

// Visits lead, in the accent; the player count only appears when there
// is one worth showing (see MIN_PLAYERS_SHOWN).
function gstats(game) {
  const stats   = getStats(game);
  const playing = playingOf(game);
  return `<span class="gstats">` +
    gstat(esc(stats.plays), 'Visits', 'lead') +
    gstat(esc(stats.favorites), 'Favorites') +
    gstat(esc(stats.rating), 'Rating') +
    (playing > 0 ? gstat(`<span class="live-dot"></span>${esc(fmtNum(playing))}`, 'Playing now', 'live') : '') +
    `</span>`;
}

// "#01", "#02", ...: a game's place by visits.
const rankLabel = rank => '#' + String(rank).padStart(2, '0');

const PLAY = `<span class="play">Play on Roblox ${icon('i-arrow-up-right')}</span>`;

/* The most played game, as a wide card with its art on the left. */
function flagshipCard(game) {
  return `
    <a class="flagship" href="${esc(game.url)}" ${NEW_TAB}>
      <span class="flagship-art" style="background-color:${esc(game.color)}">
        <img src="${esc(game.cover)}" alt="" width="768" height="432" />
      </span>
      <span class="flagship-body">
        <span class="rank"><b>${rankLabel(1)}</b> Most played</span>
        <span class="flagship-title">${esc(game.title)}</span>
        ${gstats(game)}
        ${PLAY}
      </span>
    </a>`;
}

/* One card per game; the whole card is the link. The games page asks
   for the detailed version, which adds the description. */
function gameCard(game, rank, detailed) {
  return `
    <a class="gcard" href="${esc(game.url)}" ${NEW_TAB}>
      <span class="gcard-art" style="background-color:${esc(game.color)}">
        <img src="${esc(game.cover)}" alt="" loading="lazy" width="768" height="432" />
      </span>
      <span class="gcard-body">
        <span class="rank"><b>${rankLabel(rank)}</b> ${esc(game.genre)}</span>
        <span class="gcard-title">${esc(game.title)}</span>
        ${detailed ? `<span class="gcard-desc">${esc(game.description)}</span>` : ''}
        ${gstats(game)}
        ${PLAY}
      </span>
    </a>`;
}

/* A single card left alone on the last row looks unfinished. When the
   count and the number of columns would leave one, the first card takes
   a full row instead (.gcard--wide in css/style.css). The column count is
   read from the layout itself, so this follows the CSS breakpoints. */
function balanceGrid(host) {
  const cards = host.querySelectorAll('.gcard');
  if (!cards.length) return;
  const cols = getComputedStyle(host).gridTemplateColumns.split(' ').length;
  cards.forEach((card, i) =>
    card.classList.toggle('gcard--wide', i === 0 && cols > 1 && cards.length % cols === 1));
}

/* Home page: the leader on its own, then the rest in a grid. */
const HOME_LIMIT = 6;

function renderHome(ranked, rank) {
  const lead = document.getElementById('flagship');
  const grid = document.getElementById('gamesGrid');
  if (!lead || !grid || !ranked.length) return;
  setHTML(lead, flagshipCard(ranked[0]));
  setHTML(grid, ranked.slice(1, 1 + HOME_LIMIT).map(g => gameCard(g, rank[g.placeId], false)).join(''));
}

/* Games page: say where the numbers came from. */
function renderSource(games, settled) {
  const wrap = document.getElementById('sourceState');
  const text = document.getElementById('sourceText');
  if (!wrap || !text || !settled) return;
  const live = games.some(g => g.live);
  wrap.classList.toggle('is-live', live);
  wrap.classList.toggle('is-stale', !live);
  text.textContent = live ? 'Live from the Roblox API' : 'Roblox API unreachable, showing recorded values';
}

/* ---------- games page state ---------- */
const view = { genre: 'All', sort: 'visits', data: GAMES, rank: {} };

// biggest first for every number, ties broken by visits; names A to Z
const SORTS = {
  visits:    (a, b) => visitsOf(b) - visitsOf(a),
  rating:    (a, b) => ratingOf(b) - ratingOf(a) || visitsOf(b) - visitsOf(a),
  favorites: (a, b) => favesOf(b) - favesOf(a),
  playing:   (a, b) => playingOf(b) - playingOf(a) || visitsOf(b) - visitsOf(a),
  title:     (a, b) => a.title.localeCompare(b.title)
};

function applyView() {
  const host = document.getElementById('gamesList');
  if (!host) return;

  // sorting by players only makes sense while player counts are on show
  const sortBy = document.getElementById('sortBy');
  const byPlayers = sortBy && sortBy.querySelector('option[value="playing"]');
  if (byPlayers) {
    const on = hasPlayers(view.data);
    byPlayers.hidden = byPlayers.disabled = !on;
    if (!on && view.sort === 'playing') { view.sort = 'visits'; sortBy.value = 'visits'; }
  }

  let list = view.data.slice();
  if (view.genre !== 'All') list = list.filter(g => g.genre === view.genre);
  list.sort(SORTS[view.sort] || SORTS.visits);

  setHTML(host, list.map(g => gameCard(g, view.rank[g.placeId], true)).join(''));
  balanceGrid(host);

  const count = document.getElementById('resultCount');
  if (count) count.textContent = list.length === 1 ? '1 game' : `${list.length} games`;
}

function initGamesControls() {
  const filterBar = document.getElementById('genreFilter');
  const sortBy    = document.getElementById('sortBy');

  if (filterBar) {
    const genres = ['All'].concat(Array.from(new Set(GAMES.map(g => g.genre))).sort());
    filterBar.innerHTML = genres.map((genre, i) => `
      <button type="button" class="filter-btn" data-genre="${esc(genre)}"
              aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(genre)}</button>`).join('');

    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      view.genre = btn.dataset.genre;
      filterBar.querySelectorAll('.filter-btn').forEach(b =>
        b.setAttribute('aria-pressed', String(b === btn)));
      applyView();
    });
  }

  if (sortBy) {
    sortBy.value = view.sort;
    sortBy.addEventListener('change', () => {
      view.sort = sortBy.value;
      applyView();
    });
  }

  // the number of columns changes with the width of the window
  const list = document.getElementById('gamesList');
  if (list && 'ResizeObserver' in window) new ResizeObserver(() => balanceGrid(list)).observe(list);
}

/* ---------- boot ---------- */
(function init() {
  const onGamesPage = !!document.getElementById('gamesList');

  function paint(games, settled) {
    const shown  = forDisplay(games);
    const ranked = shown.slice().sort(byVisits);
    const rank   = {};
    ranked.forEach((g, i) => { rank[g.placeId] = i + 1; });

    renderWall(ranked);
    renderHome(ranked, rank);
    renderFigures(shown);
    renderSource(games, settled);

    if (onGamesPage) {
      view.data = shown;
      view.rank = rank;
      applyView();
    }
  }

  // 1. recorded values first, so nothing waits on the network
  const offline = GAMES.map(g => Object.assign({}, g, { live: null }));
  if (onGamesPage) initGamesControls();
  paint(offline, false);

  // 2. live values once the API answers, or gives up
  loadGamesOnce().then(games => {
    paint(games.some(g => g.live) ? games : offline, true);
  });
})();
