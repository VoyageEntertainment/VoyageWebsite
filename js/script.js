// ===== HERO CANVAS (Infinite Isometric Game Grid - Perfect Spacing) =====
const canvas = document.getElementById('heroCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');

  const iconSources = [
    'img/kick-a-brainrot.png',
    'img/steal-a-mob.png',
    'img/brainrot-balloon.png',
    'img/grow-trees.png'
  ];

  const images = [];
  iconSources.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => images.push(img);
  });

  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    initGrid();
  });

  const iconSize  = 200;
  const spacingX  = 280;
  const scaleY    = 0.65;
  const spacingY  = Math.round(280 / scaleY);
  const borderRadius = 24;
  const angle     = -25 * Math.PI / 180;
  const speed     = 0.5;

  let gridItems = [];

  function initGrid() {
    gridItems = [];
    const cols = Math.ceil(width  / spacingX) + 8;
    const rows = Math.ceil(height / spacingY) + 8;
    for (let c = -4; c < cols; c++) {
      for (let r = -4; r < rows; r++) {
        gridItems.push({
          x: c * spacingX,
          y: r * spacingY,
          imgIndex: Math.floor(Math.random() * iconSources.length)
        });
      }
    }
  }

  initGrid();

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);

    if (images.length === 0) {
      requestAnimationFrame(animateCanvas);
      return;
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);
    ctx.scale(1, scaleY);
    ctx.translate(-width / 1.3, -height / 1.3);

    gridItems.forEach(item => {
      item.y -= speed;

      const resetLimitY = -400;
      if (item.y < resetLimitY) {
        const screenGridHeight = (Math.ceil(height / spacingY) + 12) * spacingY;
        item.y += screenGridHeight;
        item.imgIndex = Math.floor(Math.random() * iconSources.length);
      }

      const currentImg = images[item.imgIndex % images.length];
      if (currentImg && currentImg.complete) {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.scale(1, 1 / scaleY);
        ctx.globalAlpha = 0.14;

        ctx.beginPath();
        ctx.moveTo(-iconSize / 2 + borderRadius, -iconSize / 2);
        ctx.lineTo( iconSize / 2 - borderRadius, -iconSize / 2);
        ctx.quadraticCurveTo( iconSize / 2, -iconSize / 2,  iconSize / 2, -iconSize / 2 + borderRadius);
        ctx.lineTo( iconSize / 2,  iconSize / 2 - borderRadius);
        ctx.quadraticCurveTo( iconSize / 2,  iconSize / 2,  iconSize / 2 - borderRadius,  iconSize / 2);
        ctx.lineTo(-iconSize / 2 + borderRadius,  iconSize / 2);
        ctx.quadraticCurveTo(-iconSize / 2,  iconSize / 2, -iconSize / 2,  iconSize / 2 - borderRadius);
        ctx.lineTo(-iconSize / 2, -iconSize / 2 + borderRadius);
        ctx.quadraticCurveTo(-iconSize / 2, -iconSize / 2, -iconSize / 2 + borderRadius, -iconSize / 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(currentImg, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
        ctx.restore();
      }
    });

    ctx.restore();
    requestAnimationFrame(animateCanvas);
  }

  animateCanvas();
}

// ===== NAV SCROLL EFFECT =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== HAMBURGER MENU =====
const hamburger    = document.getElementById('hamburger');
const mobileMenu   = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });
}

function closeMenu() {
  if (mobileMenu && hamburger) {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
}

document.addEventListener('click', (e) => {
  if (hamburger && mobileMenu && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
    closeMenu();
  }
});

// ===== CONTACT FORM (Formspree via fetch) =====
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn     = form.querySelector('button[type="submit"]');
    const oldText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled    = true;

    const data = {
      name:      form.querySelector('#nameInput').value,
      email:     form.querySelector('#emailInput').value,
      game_link: form.querySelector('#linkInput').value,
      message:   form.querySelector('#msgInput').value,
    };

    try {
      const res = await fetch('https://formspree.io/f/mdabqwzz', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(data),
      });

      if (res.ok) {
        btn.textContent = '✅ Message sent!';
        form.reset();
      } else {
        btn.textContent = '❌ Error, try again';
        btn.disabled    = false;
      }
    } catch {
      btn.textContent = '❌ Error, try again';
      btn.disabled    = false;
    }

    setTimeout(() => {
      btn.textContent = oldText;
      btn.disabled    = false;
    }, 4000);
  });
}

// ===== SCROLL REVEAL with stagger =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.05 });
window.__revealObserver = observer;

const revealEls = document.querySelectorAll('.animate-reveal, .game-card, .feature, .step');
revealEls.forEach(el => el.classList.add('reveal'));

// Group by parent and set stagger delays
const parentGroups = new Map();
revealEls.forEach(el => {
  const key = el.parentElement;
  if (!parentGroups.has(key)) parentGroups.set(key, []);
  parentGroups.get(key).push(el);
});
parentGroups.forEach(children => {
  children.forEach((el, i) => {
    if (i > 0) el.style.setProperty('--stagger', `${i * 0.09}s`);
  });
});

revealEls.forEach(el => observer.observe(el));

// ===== HERO STATS COUNTER =====
function animateCounter(el) {
  const text = el.textContent.trim();
  const match = text.match(/^([\d.]+)(.*)$/);
  if (!match) return;
  const target = parseFloat(match[1]);
  const suffix = match[2];
  const isFloat = match[1].includes('.');
  const duration = 1600;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = eased * target;
    el.textContent = (isFloat ? val.toFixed(1) : Math.floor(val)) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statsBar = document.querySelector('.hero-stats-bar');
if (statsBar) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.hero-stat-num').forEach(animateCounter);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  statsObserver.observe(statsBar);
}
