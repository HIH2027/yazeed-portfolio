/**
 * Yazeed Bin Thnayan — portfolio behaviour.
 * No dependencies, no build step. Each concern initialises independently
 * so a failure in one cannot take the rest of the page down.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Language ─────────────────────────────────────────────────
     Both languages are already in the DOM; switching only flips a
     data attribute, plus lang/dir so the browser hyphenates, speaks,
     and lays out correctly. */

  function initLanguage() {
    var toggle = document.getElementById('lang-toggle');
    if (!toggle) return;

    function apply(lang) {
      root.dataset.lang = lang;
      root.lang = lang;
      root.dir = lang === 'ar' ? 'rtl' : 'ltr';
      // The label describes what the button will do, not the current state.
      toggle.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'Switch to Arabic');
    }

    toggle.addEventListener('click', function () {
      var next = root.dataset.lang === 'ar' ? 'en' : 'ar';
      apply(next);
      try {
        localStorage.setItem('lang', next);
      } catch (e) {
        /* Storage blocked: the choice just won't survive a reload. */
      }
    });

    apply(root.dataset.lang === 'ar' ? 'ar' : 'en');
  }

  /* ── Theme ────────────────────────────────────────────────────
     The stored theme is applied by the inline script in <head> before
     first paint; this owns only the toggle and its label. */

  function initTheme() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    function sync() {
      var dark = root.dataset.theme === 'dark';
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    toggle.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', root.dataset.theme);
      } catch (e) { /* storage blocked */ }
      sync();
    });

    // Follow the OS only while the visitor has made no explicit choice.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (event) {
      var chosen = false;
      try { chosen = localStorage.getItem('theme') !== null; } catch (e) { /* treat as unchosen */ }
      if (chosen) return;
      root.dataset.theme = event.matches ? 'dark' : 'light';
      sync();
    });

    sync();
  }

  /* ── Reveal on scroll ─────────────────────────────────────── */

  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    targets.forEach(function (el) { observer.observe(el); });

    // Failsafe. IntersectionObserver does not deliver entries while a tab is
    // hidden, and some embedded webviews never report visible at all. Content
    // must never be permanently invisible, so anything still unrevealed after
    // a beat gets shown outright.
    window.setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains('is-visible')) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    }, 2500);
  }

  /* ── Header state ─────────────────────────────────────────── */

  function initHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ── Scroll spy ───────────────────────────────────────────── */

  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      sections.push(section);
    });

    var visible = Object.create(null);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible[entry.target.id] = true;
        else delete visible[entry.target.id];
      });

      var current = sections.filter(function (s) { return visible[s.id]; })[0];
      links.forEach(function (link) { link.classList.remove('is-active'); });
      if (current && byId[current.id]) byId[current.id].classList.add('is-active');
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ── Mobile menu ──────────────────────────────────────────── */

  function initMobileMenu() {
    var toggle = document.getElementById('menu-toggle');
    var menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    var open = false;

    function show() {
      open = true;
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('is-locked');
    }

    function hide(returnFocus) {
      if (!open) return;
      open = false;
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('is-locked');

      var finish = function () { if (!open) menu.hidden = true; };
      if (reduceMotion.matches) finish();
      else window.setTimeout(finish, 320);   // matches --dur

      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () { open ? hide(false) : show(); });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) hide(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && open) hide(true);
    });

    // Keep focus inside the sheet while it owns the screen.
    menu.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab' || !open) return;
      var focusable = menu.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.matchMedia('(min-width: 721px)').addEventListener('change', function (event) {
      if (event.matches) hide(false);
    });
  }

  /* ── Anchor focus ─────────────────────────────────────────────
     Smooth scrolling is CSS. This only ensures the keyboard lands
     where the eye does, which browsers don't do for same-page anchors. */

  function initAnchorFocus() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;

      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;

      window.setTimeout(function () {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.addEventListener('blur', function handler() {
          target.removeAttribute('tabindex');
          target.removeEventListener('blur', handler);
        });
      }, reduceMotion.matches ? 0 : 500);
    });
  }

  /* ── Footer year ──────────────────────────────────────────── */

  function initYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll('.year').forEach(function (el) { el.textContent = year; });
  }

  /* ── Boot ─────────────────────────────────────────────────── */

  [
    initLanguage,
    initTheme,
    initReveal,
    initHeader,
    initScrollSpy,
    initMobileMenu,
    initAnchorFocus,
    initYear
  ].forEach(function (init) {
    try {
      init();
    } catch (error) {
      console.error('[portfolio] ' + init.name + ' failed', error);
    }
  });
})();
