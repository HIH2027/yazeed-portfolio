/**
 * Yazeed Bin Thnayan — portfolio behaviour.
 * No build step. The only dependency is StringTune (js/vendor), loaded after
 * this file and optional: every feature here works without it. Each concern
 * initialises independently so a failure in one cannot take the page down.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── StringTune ───────────────────────────────────────────────
     The tilt / parallax / magnetic effects declared in the markup
     with string="…" attributes.
     Everything on the page works without it. */

  function initStringTune() {
    if (reduceMotion.matches) return;
    if (!window.StringTune) {
      document.addEventListener('DOMContentLoaded', startStringTune, { once: true });
      return;
    }
    startStringTune();
  }

  function startStringTune() {
    var lib = window.StringTune;
    if (!lib || !lib.StringTune) return;

    // Native scrolling stays in charge: StringTune's smooth mode stalled
    // same-page anchor jumps partway in testing, so it only drives effects.
    var tune = lib.StringTune.getInstance();
    tune.scrollDesktopMode = 'default';
    tune.scrollMobileMode = 'default';
    tune.use(lib.StringParallax);
    tune.use(lib.StringTilt);
    tune.use(lib.StringMagnetic);
    tune.start(60);
  }

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
    }

    toggle.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', root.dataset.theme);
      } catch (e) { /* storage blocked */ }
      sync();
    });

    sync();
  }

  /* ── Reveal on scroll ─────────────────────────────────────── */

  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion.matches) return;
    root.classList.add('reveal-ready');

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

  /* ── Scroll progress ──────────────────────────────────────── */

  function initProgress() {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;

    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--page-progress', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── Card glow ────────────────────────────────────────────── */

  function initCardGlow() {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var box = card.getBoundingClientRect();
        card.style.setProperty('--mx', (event.clientX - box.left) + 'px');
        card.style.setProperty('--my', (event.clientY - box.top) + 'px');
      });
    });
  }

  /* ── XO ───────────────────────────────────────────────────────
     You are X; the first move alternates between you and the computer.
     The computer always takes a win and always blocks yours, opens in a
     corner, and otherwise plays a perfect move except for a rare slip.
     Simulated against a casual player (spots most wins, misses some
     blocks) this wins about two games in three; a player who knows the
     game can still always force a draw. */

  var XO_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  var XO_SLIP = 0.08;   // chance of a non-perfect move when nothing is urgent

  var XO_TEXT = {
    turn:  ['Your move.', 'دورك.'],
    mine:  ['I start this round.', 'أبدأ أنا هذه الجولة.'],
    think: ['Thinking…', 'أفكّر…'],
    win:   ['You win. Nicely done.', 'فزت. أحسنت.'],
    lose:  ['I win this one.', 'فزتُ هذه المرة.'],
    draw:  ['A draw. Another round?', 'تعادل. جولة أخرى؟']
  };

  var XO_SVG = {
    X: '<svg class="mark-x" viewBox="0 0 100 100" aria-hidden="true"><line x1="18" y1="18" x2="82" y2="82"/><line x1="82" y1="18" x2="18" y2="82"/></svg>',
    O: '<svg class="mark-o" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="34"/></svg>'
  };

  function xoWinner(board) {
    for (var i = 0; i < XO_LINES.length; i++) {
      var l = XO_LINES[i];
      if (board[l[0]] && board[l[0]] === board[l[1]] && board[l[0]] === board[l[2]]) {
        return { mark: board[l[0]], line: l };
      }
    }
    return board.indexOf(null) === -1 ? { mark: 'draw', line: [] } : null;
  }

  // Plain minimax; the board is only 3×3, so no pruning is needed.
  function xoScore(board, turn, depth) {
    var result = xoWinner(board);
    if (result) return result.mark === 'O' ? 10 - depth : result.mark === 'X' ? depth - 10 : 0;

    var best = turn === 'O' ? -Infinity : Infinity;
    for (var i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = turn;
      var score = xoScore(board, turn === 'O' ? 'X' : 'O', depth + 1);
      board[i] = null;
      best = turn === 'O' ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
  }

  // The square that completes a line for `mark`, if there is one.
  function xoFinisher(board, mark) {
    for (var i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = mark;
      var wins = xoWinner(board);
      board[i] = null;
      if (wins && wins.mark === mark) return i;
    }
    return -1;
  }

  function xoPick(board) {
    var empty = [];
    board.forEach(function (v, i) { if (!v) empty.push(i); });

    var win = xoFinisher(board, 'O');
    if (win !== -1) return win;
    var block = xoFinisher(board, 'X');
    if (block !== -1) return block;

    // Opening a corner sets the most traps for a casual player.
    if (empty.length === 9) return [0, 2, 6, 8][Math.floor(Math.random() * 4)];
    if (Math.random() < XO_SLIP) return empty[Math.floor(Math.random() * empty.length)];

    // Among equally good moves pick at random, so games don't repeat.
    var best = -Infinity, moves = [];
    empty.forEach(function (i) {
      board[i] = 'O';
      var score = xoScore(board, 'X', 1);
      board[i] = null;
      if (score > best) { best = score; moves = [i]; }
      else if (score === best) moves.push(i);
    });
    return moves[Math.floor(Math.random() * moves.length)];
  }

  function initXO() {
    var grid = document.getElementById('xo');
    var status = document.getElementById('xo-status');
    var reset = document.getElementById('xo-reset');
    if (!grid || !status || !reset) return;

    var tally = { X: 0, O: 0, draw: 0 };
    var tallyEl = {
      X: document.getElementById('xo-score-x'),
      O: document.getElementById('xo-score-o'),
      draw: document.getElementById('xo-score-d')
    };
    var board, locked, pending, cells = [];
    var round = 0;   // finished games so far: even → you start, odd → the computer does

    for (var i = 0; i < 9; i++) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'xo__cell';
      cell.dataset.index = String(i);
      grid.appendChild(cell);
      cells.push(cell);
    }

    function where(i, ar) {
      var row = Math.floor(i / 3) + 1, col = i % 3 + 1;
      return ar ? 'الصف ' + row + '، العمود ' + col : 'row ' + row + ', column ' + col;
    }

    // `played` (optional) says where the computer just moved, so screen
    // reader users hear the move and not only whose turn it is.
    function say(key, played) {
      var en = XO_TEXT[key][0], ar = XO_TEXT[key][1];
      if (played !== undefined) {
        en = 'I played ' + where(played) + '. ' + en;
        ar = 'لعبتُ في ' + where(played, true) + '. ' + ar;
      }
      status.innerHTML = '<span lang="en">' + en + '</span><span lang="ar">' + ar + '</span>';
    }

    function label(i) {
      var ar = root.dataset.lang === 'ar';
      var state = board[i] || (ar ? 'فارغ' : 'empty');
      return where(i, ar).replace(/^r/, 'R') + (ar ? '، ' : ', ') + state;
    }

    // aria-disabled rather than disabled: a disabled button drops keyboard
    // focus to <body> on every move.
    function render() {
      grid.setAttribute('aria-label', root.dataset.lang === 'ar' ? 'لوحة XO' : 'XO board');
      cells.forEach(function (cell, i) {
        cell.setAttribute('aria-disabled', String(locked || !!board[i]));
        cell.setAttribute('aria-label', label(i));
      });
    }

    function place(i, mark) {
      board[i] = mark;
      cells[i].innerHTML = XO_SVG[mark];
    }

    function finish(result, played) {
      locked = true;
      round += 1;   // next round, the other side opens
      result.line.forEach(function (i) { cells[i].classList.add('is-win'); });
      tally[result.mark] += 1;
      var el = tallyEl[result.mark];
      el.textContent = String(tally[result.mark]);
      el.classList.remove('bump');
      void el.offsetWidth;   // restart the animation
      el.classList.add('bump');
      say(result.mark === 'X' ? 'win' : result.mark === 'O' ? 'lose' : 'draw', played);
      render();
    }

    function computerMove() {
      locked = true;
      render();
      pending = window.setTimeout(function () {
        var move = xoPick(board);
        place(move, 'O');
        locked = false;
        var after = xoWinner(board);
        if (after) { finish(after, move); return; }
        say('turn', move);
        render();
      }, reduceMotion.matches ? 0 : 420);
    }

    function start() {
      window.clearTimeout(pending);   // a pending computer move must not land on the new board
      board = [null, null, null, null, null, null, null, null, null];
      locked = false;
      cells.forEach(function (cell) { cell.innerHTML = ''; cell.classList.remove('is-win'); });
      var computerFirst = round % 2 === 1;
      if (computerFirst) {
        say('mine');
        computerMove();
      } else {
        say('turn');
        render();
      }
    }

    grid.addEventListener('click', function (event) {
      var cell = event.target.closest('.xo__cell');
      if (!cell || locked) return;
      var i = Number(cell.dataset.index);
      if (board[i]) return;

      place(i, 'X');
      var result = xoWinner(board);
      if (result) { finish(result); return; }

      say('think');
      computerMove();
    });

    reset.addEventListener('click', start);
    var langToggle = document.getElementById('lang-toggle');
    if (langToggle) langToggle.addEventListener('click', render);
    start();
  }

  /* ── Command menu ─────────────────────────────────────────────
     Ctrl/⌘ K, or the header button. Theme and language reuse the
     existing toggles so there is one code path for each. */

  function initCommandMenu() {
    var dialog = document.getElementById('cmd');
    var input = document.getElementById('cmd-input');
    var list = document.getElementById('cmd-list');
    var trigger = document.getElementById('cmd-open');
    if (!dialog || !input || !list || !trigger || typeof dialog.showModal !== 'function') {
      if (trigger) trigger.hidden = true;
      return;
    }

    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    var kbd = document.getElementById('cmd-kbd');
    if (kbd) kbd.textContent = isMac ? '⌘ K' : 'Ctrl K';

    function go(id) {
      return function () {
        var target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      };
    }
    function open(url) {
      return function () { window.open(url, '_blank', 'noopener'); };
    }
    function click(id) {
      return function () { var el = document.getElementById(id); if (el) el.click(); };
    }

    var commands = [
      { group: ['Go to', 'انتقل إلى'], label: ['Work', 'الأعمال'], run: go('work') },
      { group: ['Go to', 'انتقل إلى'], label: ['About', 'نبذة'], run: go('about') },
      { group: ['Go to', 'انتقل إلى'], label: ['Contact', 'تواصل'], run: go('contact') },
      { group: ['Go to', 'انتقل إلى'], label: ['Play XO', 'العب XO'], run: go('play') },
      { group: ['Projects', 'المشاريع'], label: ['Open WhySOAP', 'افتح WhySOAP'], hint: 'whysoap.app', run: open('https://whysoap.app') },
      { group: ['Projects', 'المشاريع'], label: ['Open Plants of the Kingdom', 'افتح نباتات المملكة'], hint: 'spssc.vercel.app', run: open('https://spssc.vercel.app') },
      { group: ['Projects', 'المشاريع'], label: ['Open the HIH7 website', 'افتح موقع الهاكاثون'], run: open('https://hih2027.github.io/Health-Innovation-hackathon/') },
      { group: ['Projects', 'المشاريع'], label: ['Open Atheera', 'افتح أثيرا'], hint: 'atheera-rho.vercel.app', run: open('https://atheera-rho.vercel.app') },
      { group: ['Settings', 'الإعدادات'], label: ['Switch theme', 'تبديل المظهر'], run: click('theme-toggle') },
      { group: ['Settings', 'الإعدادات'], label: ['Switch language', 'تبديل اللغة'], hint: 'EN / عربي', run: click('lang-toggle') },
      { group: ['Contact', 'تواصل'], label: ['Request my CV', 'اطلب سيرتي الذاتية'], run: function () { requestCv(trigger); window.location.href = cvMailto(); } },
      { group: ['Contact', 'تواصل'], label: ['Copy email', 'انسخ البريد'], hint: 'binthnayan@gmail.com', run: function () { copyEmail(trigger); } },
      { group: ['Contact', 'تواصل'], label: ['Open LinkedIn', 'افتح LinkedIn'], run: open('https://www.linkedin.com/in/yazeedbinthnayan') }
    ];

    var shown = [];
    var active = 0;
    var lastFocus = null;

    var empty = document.getElementById('cmd-empty');

    function lang() { return root.dataset.lang === 'ar' ? 1 : 0; }

    function render() {
      var q = input.value.trim().toLowerCase();
      var l = lang();
      shown = commands.filter(function (c) {
        if (!q) return true;
        return (c.label[0] + ' ' + c.label[1] + ' ' + (c.hint || '')).toLowerCase().indexOf(q) !== -1;
      });
      if (active >= shown.length) active = 0;

      list.innerHTML = '';
      if (!shown.length) {
        if (empty) empty.textContent = l ? 'لا نتائج' : 'No results';
        input.removeAttribute('aria-activedescendant');
        return;
      }
      if (empty) empty.textContent = '';

      var lastGroup = null;
      shown.forEach(function (c, i) {
        if (c.group[l] !== lastGroup) {
          lastGroup = c.group[l];
          var head = document.createElement('li');
          head.className = 'cmd__group';
          head.setAttribute('role', 'presentation');
          head.textContent = lastGroup;
          list.appendChild(head);
        }
        var item = document.createElement('li');
        item.className = 'cmd__item';
        item.id = 'cmd-item-' + i;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(i === active));
        item.dataset.index = String(i);
        var name = document.createElement('span');
        name.textContent = c.label[l];
        item.appendChild(name);
        if (c.hint) {
          var hint = document.createElement('small');
          hint.dir = 'ltr';
          hint.textContent = c.hint;
          item.appendChild(hint);
        }
        list.appendChild(item);
      });
      input.setAttribute('aria-activedescendant', 'cmd-item-' + active);
      var current = document.getElementById('cmd-item-' + active);
      if (current) current.scrollIntoView({ block: 'nearest' });
    }

    function show() {
      if (dialog.open) return;
      lastFocus = document.activeElement;
      input.value = '';
      input.placeholder = lang() ? input.dataset.placeholderAr : 'Type a command…';
      active = 0;
      render();
      dialog.showModal();
      // On touch screens, focusing would pop the keyboard over the list.
      if (window.matchMedia('(hover: hover)').matches) input.focus();
    }

    function hide() {
      if (dialog.open) dialog.close();
    }

    function choose(i) {
      var c = shown[i];
      if (!c) return;
      hide();
      c.run();
    }

    // preventScroll: returning focus must not undo a "Go to" jump.
    dialog.addEventListener('close', function () {
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    });

    // A click on the backdrop lands on the dialog element itself.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) hide();
    });

    trigger.addEventListener('click', show);
    input.addEventListener('input', function () { active = 0; render(); });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!shown.length) return;
        active = (active + (event.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length;
        render();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        choose(active);
      }
    });

    list.addEventListener('click', function (event) {
      var item = event.target.closest('.cmd__item');
      if (item) choose(Number(item.dataset.index));
    });
    list.addEventListener('pointermove', function (event) {
      var item = event.target.closest('.cmd__item');
      if (!item || Number(item.dataset.index) === active) return;
      active = Number(item.dataset.index);
      render();
    });

    document.addEventListener('keydown', function (event) {
      // event.code, not event.key: on an Arabic layout the K key reports a different letter.
      if ((event.metaKey || event.ctrlKey) && event.code === 'KeyK') {
        event.preventDefault();
        dialog.open ? hide() : show();
      }
    });
  }

  /* ── Copy email ───────────────────────────────────────────────
     Confirms with a short note under the control that asked; if the
     clipboard is unavailable, the note shows the address instead. */

  var EMAIL = 'binthnayan@gmail.com';

  // `note` (optional, [en, ar]) replaces the default "Email copied" text.
  function copyEmail(anchor, note) {
    var ar = root.dataset.lang === 'ar';
    var copied = note || ['Email copied', 'تم نسخ البريد'];
    var done = function (ok) {
      var text = ok ? copied[ar ? 1 : 0] : EMAIL;
      anchor.setAttribute('data-flash', text);
      anchor.classList.add('is-flashing');
      var live = document.getElementById('flash-live');
      if (live) live.textContent = text;
      window.clearTimeout(anchor._flashTimer);
      anchor._flashTimer = window.setTimeout(function () { anchor.classList.remove('is-flashing'); }, 1800);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(false); });
    else done(false);
  }

  /* ── CV request ───────────────────────────────────────────────
     Opens the visitor's mail app with a pre-filled request in the
     page's language, and copies the address at the same moment: on
     a computer with no mail app set up, the link can do nothing,
     and the copied address is the way through. */

  var CV_MAIL = {
    en: {
      subject: 'CV request',
      body: "Hi Yazeed,\n\nI'd like to request your CV.\n\nName:\nOrganisation:\nRole:\n\nThanks,"
    },
    ar: {
      subject: 'طلب السيرة الذاتية',
      body: 'مرحبًا يزيد،\n\nأودّ طلب سيرتك الذاتية.\n\nالاسم:\nالجهة:\nالوظيفة:\n\nشكرًا،'
    }
  };

  function cvMailto() {
    var t = CV_MAIL[root.dataset.lang === 'ar' ? 'ar' : 'en'];
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(t.subject) + '&body=' + encodeURIComponent(t.body);
  }

  function requestCv(anchor) {
    copyEmail(anchor, ['Opening your email app · address copied', 'جارٍ فتح تطبيق البريد · تم نسخ العنوان']);
  }

  function initCvRequest() {
    document.querySelectorAll('[data-cv-request]').forEach(function (link) {
      link.addEventListener('click', function () {
        link.href = cvMailto();   // the browser follows the updated href on this same click
        requestCv(link);
      });
    });
  }

  function initCopyEmail() {
    document.querySelectorAll('[data-copy-email]').forEach(function (button) {
      button.addEventListener('click', function () { copyEmail(button); });
    });
  }

  /* ── Riyadh clock ─────────────────────────────────────────── */

  function initClock() {
    var el = document.getElementById('clock');
    if (!el || !window.Intl) return;

    var format = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit'
    });
    function tick() {
      var now = new Date();
      el.textContent = format.format(now);
      el.setAttribute('datetime', now.toISOString());
    }
    tick();
    window.setInterval(tick, 15000);
  }

  /* ── Footer year ──────────────────────────────────────────── */

  function initYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll('.year').forEach(function (el) { el.textContent = year; });
  }

  /* ── Boot ─────────────────────────────────────────────────── */

  [
    initStringTune,
    initProgress,
    initCardGlow,
    initXO,
    initCommandMenu,
    initCopyEmail,
    initCvRequest,
    initClock,
    initLanguage,
    initTheme,
    initReveal,
    initHeader,
    initScrollSpy,
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
