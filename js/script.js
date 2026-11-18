'use strict';

// The site used to offer a light and a dark theme and remembered the
// choice here. It has one look now, so drop what an earlier visit left.
try { localStorage.removeItem('voyage_theme'); } catch { /* storage blocked */ }

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
