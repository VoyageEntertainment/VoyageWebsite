'use strict';

// ===== GAME DATA =====
// universeId: costante per ogni gioco (ottenuto da apis.roblox.com/universes/v1/places/{placeId}/universe)
// fallback.rating: statico perché l'API pubblica restituisce sempre null per positiveRatingPercentage
const GAMES = [
  {
    placeId:    '117782023218098',
    universeId: '8153647770',
    title: 'Kick a Brainrot',
    genre: 'Simulator',
    description: 'Hatch eggs, collect Brainrots and kick them to trigger mutations. Over 100 unique characters to discover.',
    image: 'img/kick-a-brainrot.png',
    url: 'https://www.roblox.com/games/117782023218098/Kick-a-Brainrot',
    fallback: { plays: '52.4M', rating: '98%', favorites: '2.1M' },
    featured: true
  },
  {
    placeId:    '95275361430060',
    universeId: '8068146529',
    title: 'Steal a Mob',
    genre: 'Simulator',
    description: 'Buy mobs, steal from other players and generate money. Rebirth for upgrades and troll your enemies.',
    image: 'img/steal-a-mob.png',
    url: 'https://www.roblox.com/games/95275361430060/Steal-a-Mob',
    fallback: { plays: '2.4M', rating: '96%', favorites: '179K' }
  },
  {
    placeId:    '119749960243257',
    universeId: '8626842369',
    title: 'Brainrot Balloon',
    genre: 'Simulator',
    description: 'Pop balloons, collect Brainrots and find mutations. Over 100 unique characters to discover.',
    image: 'img/brainrot-balloon.png',
    url: 'https://www.roblox.com/games/119749960243257/Brainrot-Balloon',
    fallback: { plays: '2.1M', rating: '94%', favorites: '221K' }
  },
  {
    placeId:    '103134341448025',
    universeId: '10076620742',
    title: 'Grow Trees for Brainrots',
    genre: 'Simulator',
    description: 'Plant trees, collect Brainrots and earn cash offline. An addictive idle experience with endless progression.',
    image: 'img/grow-trees.png',
    url: 'https://www.roblox.com/games/103134341448025/Grow-Trees-For-Brainrots',
    fallback: { plays: '245K', rating: '94%', favorites: '25.5K' }
  }
];

// ===== HELPERS =====
function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function fmtNumRounded(n) {
  if (n >= 1e9) return Math.floor(n / 1e9) + 'B';
  if (n >= 1e6) return Math.floor(n / 1e6) + 'M';
  if (n >= 1e3) return Math.floor(n / 1e3) + 'K';
  return String(n);
}

function parseNum(s) {
  const n = parseFloat(s);
  if (!n) return 0;
  if (s.includes('B')) return n * 1e9;
  if (s.includes('M')) return n * 1e6;
  if (s.includes('K')) return n * 1e3;
  return n;
}

function getStats(game) {
  return game.live ?? game.fallback;
}

// ===== ROBLOX API FETCH =====
// Multiple CORS proxies tried in order — falls through to next on failure.
const CORS_PROXIES = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

async function robloxFetch(url) {
  for (const makeProxy of CORS_PROXIES) {
    try {
      const r = await fetch(makeProxy(url));
      if (r.ok) return r.json();
    } catch (_) {}
  }
  throw new Error('all proxies failed');
}

async function fetchRobloxStats() {
  const uIds = GAMES.map(g => g.universeId).join(',');

  const { data: gamesData } = await robloxFetch(
    `https://games.roblox.com/v1/games?universeIds=${uIds}`
  );

  const byUId = {};
  gamesData.forEach(g => {
    byUId[String(g.id)] = {
      plays:     fmtNum(g.visits),
      favorites: fmtNum(g.favoritedCount),
      playing:   g.playing > 0 ? fmtNum(g.playing) : null,
    };
  });

  return GAMES.map(game => {
    const live = byUId[game.universeId];
    if (!live) return { ...game, live: null };
    return {
      ...game,
      live: { ...live, rating: game.fallback.rating }
    };
  });
}

// ===== TOTALI GLOBALI =====
function updateGlobalStats(games) {
  const totalPlays     = games.reduce((s, g) => s + parseNum(getStats(g).plays),     0);
  const totalFavorites = games.reduce((s, g) => s + parseNum(getStats(g).favorites), 0);
  const avgRating      = Math.round(
    games.reduce((s, g) => s + parseInt(g.fallback.rating), 0) / games.length
  );

  const vals = {
    plays:     fmtNumRounded(totalPlays) + '+',
    games:     String(games.length),
    rating:    avgRating + '%+',
    favorites: fmtNumRounded(totalFavorites) + '+'
  };

  document.querySelectorAll('[data-stat]').forEach(el => {
    const v = vals[el.dataset.stat];
    if (v !== undefined) el.textContent = v;
  });
}

async function loadGames() {
  try {
    const games = await fetchRobloxStats();
    lsSave(games);
    console.log('[Voyage] live stats loaded from API');
    return games;
  } catch (err) {
    console.warn('[Voyage] API unavailable:', err.message);
    const cached = lsLoad();
    if (cached) {
      console.log('[Voyage] using cached stats from localStorage');
      return cached;
    }
    return GAMES.map(g => ({ ...g, live: null }));
  }
}

// ===== CARD HTML BUILDER =====
function makeGameCard(game, showPlaying = false) {
  const stats = getStats(game);
  const playingBadge = showPlaying && game.live?.playing
    ? `<span class="game-live"><span class="live-dot"></span>${game.live.playing} playing</span>`
    : '';

  return `
    <a href="${game.url}" target="_blank" rel="noopener" class="game-card animate-reveal">
      <div class="game-card-thumb">
        <img src="${game.image}" alt="${game.title}" loading="lazy" />
        <span class="game-badge">${game.genre}</span>
        <div class="game-card-overlay">
          <div class="game-card-play">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Play on Roblox
          </div>
        </div>
      </div>
      <div class="game-card-body">
        <div class="game-card-header">
          <h3>${game.title}</h3>
          ${playingBadge}
        </div>
        <p>${game.description}</p>
        <div class="game-stats">
          <div class="game-stat"><span class="gs-num">${stats.plays}</span><span class="gs-label">Plays</span></div>
          <div class="game-stat"><span class="gs-num">${stats.rating}</span><span class="gs-label">Rating</span></div>
          <div class="game-stat"><span class="gs-num">${stats.favorites}</span><span class="gs-label">Favorites</span></div>
        </div>
      </div>
    </a>`;
}

// ===== RENDER =====
function renderGrid(container, games) {
  container.innerHTML = games.map(g => makeGameCard(g)).join('');
}

// Update stats in-place (no re-render — preserves reveal classes)
function updateStatsInGrid(container, liveGames) {
  const cards = container.querySelectorAll('.game-card');
  liveGames.forEach((game, i) => {
    if (!game.live || !cards[i]) return;
    const nums = cards[i].querySelectorAll('.gs-num');
    if (nums[0]) nums[0].textContent = game.live.plays;
    if (nums[1]) nums[1].textContent = game.live.rating;
    if (nums[2]) nums[2].textContent = game.live.favorites;

    if (game.live.playing) {
      const header = cards[i].querySelector('.game-card-header');
      if (header && !header.querySelector('.game-live')) {
        header.insertAdjacentHTML('beforeend',
          `<span class="game-live"><span class="live-dot"></span>${game.live.playing} playing</span>`);
      }
    }
  });
}

// ===== LOCALSTORAGE CACHE =====
const LS_KEY = 'voyage_live_stats';
const LS_TTL = 30 * 60 * 1000; // 30 minuti

function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { ts, games } = JSON.parse(raw);
    if (Date.now() - ts > LS_TTL) return null;
    return games;
  } catch { return null; }
}

function lsSave(games) {
  try {
    if (games.some(g => g.live))
      localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), games }));
  } catch {}
}

// ===== CACHED PROMISE (avoid double-fetching) =====
let _gamesPromise = null;
function loadGamesOnce() {
  if (!_gamesPromise) _gamesPromise = loadGames();
  return _gamesPromise;
}

// ===== INIT =====
(function init() {
  const grids = document.querySelectorAll('[data-games-grid]');

  // Render grids con dati statici subito
  if (grids.length) {
    grids.forEach(grid => renderGrid(grid, GAMES));

    function initRevealForGrid(grid) {
      grid.querySelectorAll('.game-card').forEach((el, i) => {
        if (el.classList.contains('reveal')) return;
        el.classList.add('reveal');
        if (i > 0) el.style.setProperty('--stagger', `${i * 0.09}s`);
        if (window.__revealObserver) window.__revealObserver.observe(el);
      });
    }

    grids.forEach(initRevealForGrid);
    setTimeout(() => grids.forEach(initRevealForGrid), 0);
  }

  // Fetch dati live → aggiorna card stats + totali globali (su ogni pagina)
  loadGamesOnce().then(liveGames => {
    if (grids.length) grids.forEach(grid => updateStatsInGrid(grid, liveGames));
    updateGlobalStats(liveGames);
  });
})();
