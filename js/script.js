'use strict';

// The site used to offer a light and a dark theme and remembered the
// choice here. It has one look now, so drop what an earlier visit left.
try { localStorage.removeItem('voyage_theme'); } catch { /* storage blocked */ }

/* =============================================================
   Hero: the wall of art leans away from the pointer

   The pointer's place over the hero is kept as two numbers from -1
   to 1 in --mx and --my on the wall. Each tile shifts against them
   by its own --depth (css/style.css), the near ones furthest, so
   the wall seems to have depth. The wall does not jump to the
   pointer: every frame it closes part of the gap that is left.
   ============================================================= */
(function wallParallax() {
  const wall = document.getElementById('heroWall');
  const hero = wall && wall.closest('.hero');
  if (!hero) return;

  // only with a mouse, and not for visitors who have asked for less motion
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const aim = { x: 0, y: 0 };   // where the pointer is
  const at  = { x: 0, y: 0 };   // where the wall has got to
  let frame = 0;
  let last  = 0;

  const clamp = v => Math.max(-1, Math.min(1, v));

  const step = (now) => {
    // the same pace whatever the screen's refresh rate
    const share = 1 - Math.pow(0.92, Math.min(64, now - last) / 16.7);
    last = now;
    at.x += (aim.x - at.x) * share;
    at.y += (aim.y - at.y) * share;

    const arrived = Math.abs(aim.x - at.x) < 0.0015 && Math.abs(aim.y - at.y) < 0.0015;
    if (arrived) { at.x = aim.x; at.y = aim.y; }
    wall.style.setProperty('--mx', at.x.toFixed(4));
    wall.style.setProperty('--my', at.y.toFixed(4));
    frame = arrived ? 0 : requestAnimationFrame(step);
  };

  const moveTo = (x, y) => {
    aim.x = x;
    aim.y = y;
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
  };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const box = hero.getBoundingClientRect();
    if (box.bottom <= 0) return;   // the hero has scrolled out of sight
    moveTo(
      clamp((e.clientX - box.left - box.width / 2) / (box.width / 2)),
      clamp((e.clientY - box.top - box.height / 2) / (box.height / 2))
    );
  }, { passive: true });

  // settle back to rest when the pointer leaves the page
  document.documentElement.addEventListener('pointerleave', () => moveTo(0, 0));
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
  const label  = button.querySelector('span');
  const status = document.getElementById('formStatus');
  const text   = status.querySelector('span');
  const ENDPOINT = 'https://formspree.io/f/mdabqwzz';

  // state: 'ok', 'error', or nothing for a neutral progress note
  const say = (message, state) => {
    text.textContent = message;
    status.hidden = !message;
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
    label.textContent = 'Sending';
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
      label.textContent = 'Send message';
    }
  });
})();

/* =============================================================
   Footer year
   ============================================================= */
(function currentYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = String(new Date().getFullYear());
})();
