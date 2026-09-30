'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =============================================================
   Theme. The inline script in <head> has already applied the
   saved choice, or the system setting, before first paint.
   ============================================================= */
(function themeToggle() {
  const root    = document.documentElement;
  const meta    = document.querySelector('meta[name="theme-color"]');
  const buttons = document.querySelectorAll('[data-theme-toggle]');
  const KEY     = 'voyage_theme';

  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#130f27' : '#fbf5ea');
    buttons.forEach(b => b.setAttribute('aria-pressed', String(theme === 'dark')));
  };

  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  buttons.forEach(b => b.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch { /* storage blocked, still switches */ }
  }));

  // keep following the system until the visitor picks a theme
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch { /* ignore */ }
    if (saved !== 'light' && saved !== 'dark') apply(e.matches ? 'dark' : 'light');
  });
})();

/* =============================================================
   Header: background appears once the page has scrolled
   ============================================================= */
(function stickyHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  let ticking = false;
  const update = () => {
    header.classList.toggle('is-stuck', window.scrollY > 8);
    ticking = false;
  };

  update();
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
})();

/* =============================================================
   Mobile navigation
   ============================================================= */
(function mobileNav() {
  const toggle = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileNav');
  if (!toggle || !drawer) return;

  const setOpen = (open) => {
    drawer.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // any link inside the drawer closes it
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (!drawer.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // the drawer is a mobile-only affordance
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
})();

/* =============================================================
   Contact form
   Status goes to a live region instead of overwriting the button
   ============================================================= */
(function contactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const button = document.getElementById('submitBtn');
  const status = document.getElementById('formStatus');
  const ENDPOINT = 'https://formspree.io/f/mdabqwzz';

  const say = (message, state) => {
    status.textContent = message;
    if (state) status.setAttribute('data-state', state);
    else status.removeAttribute('data-state');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      say('Fill in your name, email and message, and confirm your age.', 'error');
      form.reportValidity();
      return;
    }

    // honeypot: only a bot fills this in
    if (form.elements.company && form.elements.company.value) return;

    const payload = {
      name:      form.elements.name.value.trim(),
      email:     form.elements.email.value.trim(),
      game_link: form.elements.game_link.value.trim(),
      message:   form.elements.message.value.trim()
    };

    button.disabled = true;
    button.textContent = 'Sending';
    say('Sending your message.');

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        form.reset();
        say('Message sent. We reply to every enquiry, usually within a couple of days.', 'ok');
      } else {
        say('That did not go through. Email voyagenoirtype@gmail.com and we will pick it up there.', 'error');
      }
    } catch {
      say('Network error. Email voyagenoirtype@gmail.com and we will pick it up there.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Send message';
    }
  });
})();

/* =============================================================
   Blocks rise into place the first time they scroll into view
   ============================================================= */
(function reveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

  targets.forEach(el => io.observe(el));
})();

/* =============================================================
   Footer year
   ============================================================= */
(function currentYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = String(new Date().getFullYear());
})();
