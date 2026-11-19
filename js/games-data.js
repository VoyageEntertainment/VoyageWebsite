'use strict';

/* =============================================================
   Game catalogue + live stats and art from the public Roblox API.

   To add a game, add an entry to GAMES. Every list on the site
   (the wall of art in the hero, the cards on the home page, the games
   page) is built from it.

   universeId is constant per game (resolved once through
   apis.roblox.com/universes/v1/places/{placeId}/universe).

   The pictures come live from Roblox: the game's icon and its main
   thumbnail, so a new picture on Roblox reaches the site by itself.
   image (512x512) and cover (768x432) are copies of them kept in
   img/games, shown only when the live art cannot be had.

   fallback.* are the last values recorded by hand. They paint
   immediately and stay on screen if the API is unreachable. Visits,
   favorites, players online and ratings are all replaced by live
   values once the API answers.

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
    fallback: { plays: '53.4M', rating: '98%', favorites: '2.1M' }
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
    fallback: { plays: '2.4M', rating: '95%', favorites: '182.6K' }
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
    fallback: { plays: '2.1M', rating: '95%', favorites: '220.9K' }
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
    fallback: { plays: '948.7K', rating: '96%', favorites: '103.1K' }
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
    fallback: { plays: '117.7K', rating: '65%', favorites: '17.6K' }
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
    fallback: { plays: '44.3K', rating: '92%', favorites: '7.3K' }
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
    fallback: { plays: '30.8K', rating: '68%', favorites: '5.4K' }
  },
  {
    placeId:    '103662429307630',
    universeId: '10769311074',
    title: 'Catch & Steal an Egg',
    genre: 'Simulator',
    description: 'Chase down eggs that run from you, hatch them into pets and train your speed for the rarer ones.',
    image: 'img/games/catch-steal-an-egg.webp',
    cover: 'img/games/catch-steal-an-egg-cover.webp',
    color: '#b45cf0', deep: '#a53bed',
    url: 'https://www.roblox.com/games/103662429307630/Catch-Steal-an-Egg',
    fallback: { plays: '68.3K', rating: '81%', favorites: '1.6K' }
  },
  {
    placeId:    '91202194985505',
    universeId: '10771974110',
    title: 'Push Animals For Eggs',
    genre: 'Simulator',
    description: 'Push farm animals until they drop eggs. The harder you push, the rarer the egg.',
    image: 'img/games/push-animals-for-eggs.webp',
    cover: 'img/games/push-animals-for-eggs-cover.webp',
    color: '#2ec4b6', deep: '#1e8178',
    url: 'https://www.roblox.com/games/91202194985505/Push-Animals-For-Eggs',
    fallback: { plays: '39K', rating: '94%', favorites: '649' }
  },
  {
    placeId:    '80047097677723',
    universeId: '10767954599',
    title: 'Kick a Pet',
    genre: 'Simulator',
    description: 'Hatch eggs, collect pets and kick them to trigger mutations. More than 250 pets to find.',
    image: 'img/games/kick-a-pet.webp',
    cover: 'img/games/kick-a-pet-cover.webp',
    color: '#38c6f4', deep: '#097da2',
    url: 'https://www.roblox.com/games/80047097677723/Kick-a-Pet',
    fallback: { plays: '36.6K', rating: '86%', favorites: '446' }
  },
  {
    placeId:    '87910146561305',
    universeId: '10774809271',
    title: 'Eat Jelly For Eggs',
    genre: 'Simulator',
    description: 'Eat through jelly to find hidden eggs, outrun the guardians and hatch rare animals in your base.',
    image: 'img/games/eat-jelly-for-eggs.webp',
    cover: 'img/games/eat-jelly-for-eggs-cover.webp',
    color: '#8bd346', deep: '#4e801e',
    url: 'https://www.roblox.com/games/87910146561305/Eat-Jelly-For-Eggs',
    fallback: { plays: '30.5K', rating: '72%', favorites: '71' }
  },
  {
    placeId:    '111063930640316',
    universeId: '10774664913',
    title: '+1 Pogo Escape',
    genre: 'Obby',
    description: 'Every bounce adds +1 power. Wall-jump through nine stages, from city rooftops to lava waves.',
    image: 'img/games/pogo-escape.webp',
    cover: 'img/games/pogo-escape-cover.webp',
    color: '#f2506a', deep: '#e51133',
    url: 'https://www.roblox.com/games/111063930640316/1-Pogo-Escape',
    fallback: { plays: '30.3K', rating: '57%', favorites: '85' }
  },
  {
    placeId:    '91109668570907',
    universeId: '10772401929',
    title: 'Empty A Vault',
    genre: 'Simulator',
    description: 'Smash through safes and steel doors, sell the loot and dig deeper for rarer treasure.',
    image: 'img/games/empty-a-vault.webp',
    cover: 'img/games/empty-a-vault-cover.webp',
    color: '#f4c430', deep: '#906f08',
    url: 'https://www.roblox.com/games/91109668570907/Empty-A-Vault',
    fallback: { plays: '28.9K', rating: '59%', favorites: '228' }
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
   The Roblox API sends no CORS headers, so a browser cannot call it
   directly. Each entry turns the real URL into one a page may fetch.
   The first is roproxy, a mirror of the Roblox API that keeps the same
   paths on its own hosts (games.roproxy.com, thumbnails.roproxy.com);
   the other two are general-purpose CORS proxies, kept in reserve.
   corsproxy.io was dropped in November 2026: it now wants an API key.
   Any host added or removed here also belongs in privacy.html. */
const CORS_PROXIES = [
  u => u.replace(/\/\/(\w+)\.roblox\.com\//, '//$1.roproxy.com/'),
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
];

const FETCH_TIMEOUT = 8000;
const BACKUP_AFTER  = 1200;

/* One Roblox API call, answered as JSON. roproxy is asked first. The
   reserve proxies join in when it fails, or when it is still silent
   after BACKUP_AFTER; the first good answer wins and the others are
   called off. With { backups: false } only roproxy is asked. */
function robloxFetch(url, { backups = true } = {}) {
  const proxies = backups ? CORS_PROXIES : CORS_PROXIES.slice(0, 1);
  const ctrls   = proxies.map(() => new AbortController());
  let primaryFailed;
  const primaryDown = new Promise(resolve => { primaryFailed = resolve; });

  const attempt = (makeProxy, i) => {
    const turn = i === 0 ? Promise.resolve()
      : Promise.race([new Promise(r => setTimeout(r, BACKUP_AFTER)), primaryDown]);
    return turn
      .then(() => {
        if (ctrls[i].signal.aborted) throw new Error('not needed');
        const timer = setTimeout(() => ctrls[i].abort(), FETCH_TIMEOUT);
        return fetch(makeProxy(url), { signal: ctrls[i].signal })
          .then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .finally(() => clearTimeout(timer));
      })
      .catch(err => {
        if (i === 0) primaryFailed();
        throw err;
      });
  };

  return Promise.any(proxies.map(attempt))
    .then(data => { ctrls.forEach(c => c.abort()); return data; })
    .catch(() => { throw new Error('all proxies failed'); });
}

const UNIVERSE_IDS = GAMES.map(g => g.universeId).join(',');

/* Visits, favorites and players online, every game in one call. */
async function fetchStats() {
  const payload = await robloxFetch(`https://games.roblox.com/v1/games?universeIds=${UNIVERSE_IDS}`);
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
  return byUniverse;
}

/* Ratings: the share of thumbs up, as on the game's page on Roblox.
   roproxy turns away the endpoint that takes every game at once, so each
   game is asked on its own (v1/games/{universeId}/votes), of roproxy
   only. Ratings move slowly, so they are kept for RATINGS_TTL. */
async function fetchRatings() {
  const kept = stored(RATINGS_KEY, RATINGS_TTL);
  if (kept) return kept;

  const answers = await Promise.allSettled(GAMES.map(g =>
    robloxFetch(`https://games.roblox.com/v1/games/${g.universeId}/votes`, { backups: false })));
  const ratings = {};
  answers.forEach((a, i) => {
    const votes = a.status === 'fulfilled' ? a.value : null;
    const total = votes ? votes.upVotes + votes.downVotes : 0;
    if (total > 0) ratings[GAMES[i].universeId] = Math.round(100 * votes.upVotes / total) + '%';
  });
  if (Object.keys(ratings).length) store(RATINGS_KEY, ratings);
  return ratings;
}

async function fetchRobloxStats() {
  const [stats, ratings] = await Promise.all([fetchStats(), fetchRatings().catch(() => ({}))]);
  return GAMES.map(game => {
    const live = stats[game.universeId];
    if (!live) return Object.assign({}, game, { live: null });
    // a rating Roblox did not give stays at the recorded value
    return Object.assign({}, game, {
      live: Object.assign({}, live, { rating: ratings[game.universeId] || game.fallback.rating })
    });
  });
}

/* The art: each game's main thumbnail (768x432) and icon (512x512), as
   WebP on the Roblox CDN. Only addresses on rbxcdn.com are taken from an
   answer, since a proxy is not to be trusted with what the page loads.
   Icons are only asked for when the wall in the hero needs them, that
   is while there are fewer games than tiles. */
const CDN_URL = /^https:\/\/[a-z0-9-]+\.rbxcdn\.com\//;

async function fetchArt() {
  const api = 'https://thumbnails.roblox.com/v1/games/';
  const wantIcons = !!document.getElementById('heroWall') && GAMES.length < WALL_TILES;
  const [covers, icons] = await Promise.allSettled([
    robloxFetch(`${api}multiget/thumbnails?universeIds=${UNIVERSE_IDS}&countPerUniverse=1&defaults=true&size=768x432&format=Webp&isCircular=false`),
    wantIcons
      ? robloxFetch(`${api}icons?universeIds=${UNIVERSE_IDS}&returnPolicy=PlaceHolder&size=512x512&format=Webp&isCircular=false`)
      : Promise.reject(new Error('not needed'))
  ]);
  if (covers.status === 'rejected' && icons.status === 'rejected') throw new Error('no art');

  const art = {};
  const put = (universeId, kind, thumb) => {
    if (!thumb || thumb.state !== 'Completed' || !CDN_URL.test(thumb.imageUrl || '')) return;
    (art[universeId] = art[universeId] || {})[kind] = thumb.imageUrl;
  };
  if (covers.value) (covers.value.data || []).forEach(u => put(String(u.universeId), 'cover', (u.thumbnails || [])[0]));
  if (icons.value)  (icons.value.data || []).forEach(t => put(String(t.targetId), 'image', t));
  return art;
}

/* ---------- localStorage cache ----------
   Live values are kept between page views, each kind under its own key:
   the numbers for half an hour (they paint at once on the next visit and
   are refreshed in the background), the ratings for six hours, and the
   addresses of the art for a week, so a returning visitor gets the
   pictures without waiting on the API. Titles, descriptions and colours
   always come from GAMES above. */
const STATS_KEY   = 'voyage_live_stats',   STATS_TTL   = 30 * 60 * 1000;
const RATINGS_KEY = 'voyage_live_ratings', RATINGS_TTL = 6 * 60 * 60 * 1000;
const ART_KEY     = 'voyage_live_art',     ART_TTL     = 7 * 24 * 60 * 60 * 1000;

function stored(key, maxAge) {
  try {
    const { ts, data } = JSON.parse(localStorage.getItem(key)) || {};
    return data && typeof data === 'object' && Date.now() - ts <= maxAge ? data : null;
  } catch { return null; }
}

function store(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); }
  catch { /* private mode or quota, ignore */ }
}

function cacheRead() {
  const live = stored(STATS_KEY, STATS_TTL);
  return live && GAMES.map(g => Object.assign({}, g, { live: live[g.universeId] || null }));
}

function cacheWrite(games) {
  if (!games.some(g => g.live)) return;
  const live = {};
  games.forEach(g => { if (g.live) live[g.universeId] = g.live; });
  store(STATS_KEY, live);
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
   The art on screen
   ============================================================= */

/* Every picture is an <img data-art="placeId:cover"> (or ":image") and
   shows whatever artShown holds for that key. Before anything is known
   the image stays empty and the game colour shows through. The live
   picture goes in as soon as its address arrives. If that takes longer
   than ART_WAIT, or the API cannot be reached, the copy in img/games goes
   in instead, and a live picture arriving after that replaces it only
   once it has loaded, so nothing flickers. A live picture the browser
   cannot load (a school network that blocks Roblox, say) gives way to
   the copy as well. */
const ART_WAIT  = 1500;
const BY_PLACE  = Object.fromEntries(GAMES.map(g => [g.placeId, g]));
const liveArt   = {};          // universeId -> { cover, image }: live addresses known so far
const artShown  = {};          // "placeId:kind" -> the address on screen
const deadArt   = new Set();   // live addresses that would not load
let   useCopies = false;       // whether the copies in img/games may be shown yet

// What a picture should show: the live one if it works, otherwise the
// copy once copies are allowed, otherwise nothing yet.
function artWanted(game, kind) {
  const live = (liveArt[game.universeId] || {})[kind];
  if (live && !deadArt.has(live)) return live;
  return useCopies ? game[kind] : '';
}

function artImg(game, kind, attrs) {
  const key = game.placeId + ':' + kind;
  const src = artShown[key];
  return `<img ${src ? `src="${esc(src)}" ` : ''}data-art="${esc(key)}" alt="" ${attrs} />`;
}

function showArt(key, src) {
  artShown[key] = src;
  document.querySelectorAll(`img[data-art="${key}"]`).forEach(img => { img.src = src; });
}

// Bring every picture up to date with what is known.
function refreshArt() {
  GAMES.forEach(game => ['cover', 'image'].forEach(kind => {
    const key  = game.placeId + ':' + kind;
    const want = artWanted(game, kind);
    if (!want || artShown[key] === want) return;
    // nothing showing yet, or not drawn anywhere: straight in
    if (!artShown[key] || !document.querySelector(`img[data-art="${key}"]`)) return showArt(key, want);
    // a picture is already up: load the new one first, then swap
    const next = new Image();
    next.onload = () => { if (artWanted(game, kind) === want) showArt(key, want); };
    next.src = want;
  }));
}

// A picture that does not load: a live one gives way to the copy, and a
// copy that fails too leaves the colour.
document.addEventListener('error', e => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.art) return;
  const game = BY_PLACE[img.dataset.art.split(':')[0]];
  const kind = img.dataset.art.split(':')[1];
  const src  = img.getAttribute('src');
  if (!game || !src) return;
  if (src !== game[kind]) {
    deadArt.add(src);
    showArt(img.dataset.art, game[kind]);
  } else {
    img.removeAttribute('src');
  }
}, true);

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
   Numbers that count up
   ============================================================= */

/* Figures are written as text: "58.9M", "182.6K", "98%", "7". To count
   up to one, the number inside is animated and whatever surrounds it is
   kept, with the same number of decimals all the way: 0.0M ... 58.9M.

   The element's own text is always the real figure. While it counts, the
   running number is kept in data-shown and the stylesheet draws that on
   top of the real text (css/style.css, [data-shown]). So a screen reader,
   a search engine or a copy and paste gets the real figure at any moment,
   and the figure keeps its final width, so nothing beside it moves.

   Every figure has a key ("total:visits", "117782023218098:rating").
   What is on screen for a key is remembered, so when the live numbers
   arrive and a list is drawn again, a figure carries on from where it
   had got to instead of starting over from zero: a count that is still
   running simply ends on the new number, in the same time. A figure only
   starts counting once it has scrolled into view. */
const COUNT_MS  = 1800;
const NO_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const tallies   = new Map();   // key -> { text, value, unit, done, from, started }: what is on screen for that figure
const counting  = new Map();   // element -> { key, text, parts, from, started }
let countFrame  = 0;

function parseFigure(text) {
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(text);
  if (!m) return null;
  return { before: m[1], to: parseFloat(m[2]), decimals: (m[2].split('.')[1] || '').length, unit: m[3] };
}

const figureText = (parts, value) => parts.before + value.toFixed(parts.decimals) + parts.unit;

function countStep(now) {
  let running = false;
  counting.forEach((job, el) => {
    if (!el.isConnected) { stopCounting(el); return; }   // drawn again since; its replacement carries on
    if (!job.started) return;                            // still below the fold
    const t = Math.min(1, Math.max(0, (now - job.started) / COUNT_MS));
    if (t < 1) {
      // fast at first, then easing into the final figure
      const value = job.from + (job.parts.to - job.from) * (1 - Math.pow(1 - t, 4));
      el.dataset.shown = figureText(job.parts, value);
      tallies.set(job.key, { text: job.text, value, unit: job.parts.unit, done: false, from: job.from, started: job.started });
      running = true;
    } else {
      el.removeAttribute('data-shown');
      tallies.set(job.key, { text: job.text, value: job.parts.to, unit: job.parts.unit, done: true });
      stopCounting(el);
    }
  });
  countFrame = running ? requestAnimationFrame(countStep) : 0;
}

// starts a figure the first time it is on screen
const countWatcher = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const job = counting.get(entry.target);
        if (!job || !entry.isIntersecting) return;
        countWatcher.unobserve(entry.target);
        job.started = performance.now();
        if (!countFrame) countFrame = requestAnimationFrame(countStep);
      });
    }, { rootMargin: '0px 0px -6% 0px' })
  : null;

function stopCounting(el) {
  counting.delete(el);
  if (countWatcher) countWatcher.unobserve(el);
}

/* Put a figure into an element, counting up to it. */
function countTo(el, text, key) {
  const parts = parseFigure(text);
  const seen  = tallies.get(key);
  stopCounting(el);
  el.textContent = text;
  el.classList.add('is-counted');   // the stylesheet keeps headline figures hidden until this

  // nothing to animate: no number in it, motion switched off, or this very figure is already up
  if (!parts || NO_MOTION || !countWatcher || (seen && seen.done && seen.text === text)) {
    el.removeAttribute('data-shown');
    if (parts) tallies.set(key, { text, value: parts.to, unit: parts.unit, done: true });
    return;
  }

  // Carry on from what is on screen for this key, as long as the unit is
  // the same. A count that is still running keeps its start and its clock
  // and only changes where it ends; a finished one counts on from its value.
  const known   = seen && seen.unit === parts.unit;
  const running = known && !seen.done && seen.started > 0;
  const value   = known ? seen.value : 0;
  const from    = running ? seen.from : value;
  const started = running ? seen.started : 0;

  el.dataset.shown = figureText(parts, value);
  tallies.set(key, { text, value, unit: parts.unit, done: false, from, started });
  counting.set(el, { key, text, parts, from, started });
  if (!started) countWatcher.observe(el);
  else if (!countFrame) countFrame = requestAnimationFrame(countStep);
}

/* Start every figure in a freshly drawn list. The markup carries the final
   text, marked with data-count="key"; elements from the previous drawing
   are forgotten first. */
function countFigures(host) {
  counting.forEach((job, el) => { if (!el.isConnected) stopCounting(el); });
  host.querySelectorAll('[data-count]').forEach(el => countTo(el, el.textContent, el.dataset.count));
}

/* =============================================================
   Renderers
   ============================================================= */

/* Headline figures. The recorded totals are already in the HTML; this
   counts up to them, and again to the fresh ones when they arrive.
   "Playing now" has no offline value, so its entry stays hidden unless
   there is a number to show. */
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
    if (tile) tile.hidden = false;
    countTo(el, value, 'total:' + el.dataset.figure);
  });
}

/* ---------- home page: the wall behind the title ----------
   Twelve tilted pieces of game art around the edges of the hero. Their
   places are fixed in css/style.css (.wall-tile:nth-child); this only
   deals the art into them: every cover first, most played first, then
   the square icons. It is decoration, so the tiles are dealt once and
   never again when the live numbers arrive; their pictures follow the
   art like every other picture (see "The art on screen"). */
const WALL_TILES = 12;

function renderWall(ranked) {
  const host = document.getElementById('heroWall');
  if (!host || host.firstElementChild || !ranked.length) return;

  const art = ranked.map(g => ({ game: g, kind: 'cover', square: false }))
    .concat(ranked.map(g => ({ game: g, kind: 'image', square: true })));

  let html = '';
  for (let i = 0; i < WALL_TILES; i++) {
    const a = art[i % art.length];
    html += `<div class="wall-tile${a.square ? ' wall-tile--sq' : ''}" style="background-color:${esc(a.game.color)}">` +
            artImg(a.game, a.kind, 'decoding="async"') + '</div>';
  }
  host.innerHTML = html;
}

/* ---------- a game's figures ----------
   Each number is marked with data-count, its key for counting up (see
   "Numbers that count up"): the game's place id and which figure it is. */
function gstat(game, what, value, label, kind) {
  const number = `<span data-count="${esc(game.placeId)}:${what}">${esc(value)}</span>`;
  return `<span class="gstat${kind ? ' gstat--' + kind : ''}">` +
    `<b>${kind === 'live' ? '<span class="live-dot"></span>' : ''}${number}</b>` +
    `<span class="label">${label}</span></span>`;
}

// Visits lead, in the accent; the player count only appears when there
// is one worth showing (see MIN_PLAYERS_SHOWN).
function gstats(game) {
  const stats   = getStats(game);
  const playing = playingOf(game);
  return `<span class="gstats">` +
    gstat(game, 'visits', stats.plays, 'Visits', 'lead') +
    gstat(game, 'favorites', stats.favorites, 'Favorites') +
    gstat(game, 'rating', stats.rating, 'Rating') +
    (playing > 0 ? gstat(game, 'playing', fmtNum(playing), 'Playing now', 'live') : '') +
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
        ${artImg(game, 'cover', 'width="768" height="432"')}
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
        ${artImg(game, 'cover', 'loading="lazy" width="768" height="432"')}
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
  if (setHTML(lead, flagshipCard(ranked[0]))) countFigures(lead);
  if (setHTML(grid, ranked.slice(1, 1 + HOME_LIMIT).map(g => gameCard(g, rank[g.placeId], false)).join(''))) countFigures(grid);
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

  if (setHTML(host, list.map(g => gameCard(g, view.rank[g.placeId], true)).join(''))) countFigures(host);
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

  // 1. recorded values first, so nothing waits on the network, with the
  //    live art from the last visit if there is any
  Object.assign(liveArt, stored(ART_KEY, ART_TTL));
  refreshArt();
  const offline = GAMES.map(g => Object.assign({}, g, { live: null }));
  if (onGamesPage) initGamesControls();
  paint(offline, false);

  // 2. live values once the API answers, or gives up
  loadGamesOnce().then(games => {
    paint(games.some(g => g.live) ? games : offline, true);
  });

  // 3. the live art, or the copies in img/games where it is late or missing
  setTimeout(() => { useCopies = true; refreshArt(); }, ART_WAIT);
  fetchArt()
    .then(art => { Object.assign(liveArt, art); store(ART_KEY, liveArt); refreshArt(); })
    .catch(() => { useCopies = true; refreshArt(); });
})();
