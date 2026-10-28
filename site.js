// trialsofterror.com: everything opens in place (the user: "like a drop-down menu of information"; no windows or overlays),
// full width below its row, pushing the page down and never covering it. Nothing is sent or stored. What isn't set up yet is
// greyed out in the page itself and has no behaviour here.
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const OPEN_MS = 150;

  // the bar turns solid as soon as the page moves, so its links never sit on top of the hero's text
  const header = $('.site-header');
  const mini = $('.mini-play');
  const play = $('.main-play');
  // the bar's wordmark shows once the big title has gone under the bar
  const mark = $('.wordmark');
  const title = $('.hero-title');
  const solid = () => {
    header.classList.toggle('solid', window.scrollY > 8);
    if (!mark || !title) return;
    const past = title.getBoundingClientRect().bottom < header.getBoundingClientRect().bottom;
    if (past === header.classList.contains('past-title')) return;
    header.classList.toggle('past-title', past);
    mark.setAttribute('aria-hidden', String(!past));
    mark.tabIndex = past ? 0 : -1;
  };
  window.addEventListener('scroll', solid, { passive: true });
  window.addEventListener('resize', solid);
  solid();
  if (mini && play && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const past = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      header.classList.toggle('scrolled', past);
      mini.setAttribute('aria-hidden', String(!past));
      mini.tabIndex = past ? 0 : -1;
    }).observe(play);
  }

  // A reveal: hidden, then grows from 0 to its height (CSS .reveal / .open); closing shrinks it, then hides it.
  function show(el) {
    clearTimeout(el._t);
    el.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
    // once it has finished growing (the open starts two frames later and runs OPEN_MS), bring the whole of it into view
    // between the fixed header and the screen's bottom, with clear room at both (12 design
    // px, scaled). A Champion's panel brings its card row too: if the row and the panel don't both fit, the row shrinks in
    // place until they do (never a row of faces cut by the header). If it is still taller than the space, its top wins
    setTimeout(() => {
      const room = 12 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z')) || 1);
      const head = $('.site-header').getBoundingClientRect().bottom + room;
      const space = window.innerHeight - room - head;
      let top = el.getBoundingClientRect().top;
      if (el === strip) {
        const row = squad.getBoundingClientRect();
        const panel = el.getBoundingClientRect();
        // the row (with its gap to the panel) is everything in the squad above the panel
        if (panel.bottom - row.top > space) {
          let s = Math.max(0.55, Math.min(1, (space - panel.height) / (panel.top - row.top)));
          champions.style.setProperty('--row-s', String(s));
          champions.classList.add('compact');
          // the gaps don't all shrink with the cards: measure once more and correct
          const above = el.getBoundingClientRect().top - squad.getBoundingClientRect().top;
          s = Math.max(0.55, s * (space - panel.height) / above);
          champions.style.setProperty('--row-s', String(s));
        }
        top = squad.getBoundingClientRect().top;
      }
      const r = el.getBoundingClientRect();
      let dy = Math.max(0, r.bottom + room - window.innerHeight);
      if (top - dy < head) dy = top - head;
      if (r.top - dy < head) dy = r.top - head;
      if (Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior: 'smooth' });
    }, OPEN_MS + 80);
  }
  function hide(el) {
    el.classList.remove('open');
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.hidden = true; }, OPEN_MS);
  }

  // The Champion strip, under the five-card row: tap a card to open it, the same card to close, another to switch
  const strip = $('#champion-info');
  let chosen = null;
  function fillStrip(btn) {
    const d = btn.dataset;
    const art = $('#ci-art');
    const pic = $('img', btn);
    art.srcset = pic.getAttribute('srcset') || '';
    art.src = pic.getAttribute('src');
    $('#ci-name').textContent = d.name;
    // the role line and description, as the user approved them (2026-10-25)
    $('#ci-role').textContent = d.role;
    $('#ci-desc').textContent = d.desc;
    $('#ci-role').hidden = !d.role;
    $('#ci-desc').hidden = !d.desc;
    const start = d.state === 'start';
    $('#ci-locked').hidden = start;
    $('#ci-start').hidden = !start;
    $('#ci-play').hidden = !start;
    $('#ci-rule-start').hidden = !start;
    $('#ci-rule-locked').hidden = start;
  }
  // THE CHAMPION RING (the user): every Champion sits on one ring, five in view with the chosen one in the centre slot.
  // A tap, ‹ ›, the arrow keys and a sideways drag all turn the same ring, so a card always enters at one edge as another
  // leaves the other: never a gap, never a card jumping across in view. Closing a panel turns it home, the Warrior centred.
  const squad = $('.squad');
  const champions = $('.champions');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const HOME = $$('.squad .card');
  const N = HOME.length;
  const SHOWN = Math.min(5, N);
  const MID = Math.floor(SHOWN / 2);
  const WARRIOR = HOME.findIndex((c) => c.classList.contains('c-warrior'));
  const mod = (x, m) => ((x % m) + m) % m;
  let centreAt = WARRIOR;
  // at rest: the five round the centre in order, the rest hidden after them (the centre slot is the third card)
  function settle() {
    for (let s = 0; s < N; s++) {
      const c = HOME[mod(centreAt - MID + s, N)];
      c.hidden = s >= SHOWN;
      squad.insertBefore(c, strip);
    }
  }
  settle();
  // While it turns, every card is placed once, absolutely, and then moved by transform alone: one write per frame.
  // ring.o is the turn in slots (+1 = every card one slot to the right).
  let ring = null;
  function begin() {
    if (ring) return;
    // the five in view, in their order on screen (not the ring's home order)
    const shown = $$('.squad .card').filter((c) => !c.hidden);
    const g = shown.map((c) => ({ cx: c.offsetLeft + c.offsetWidth / 2, w: c.offsetWidth, h: c.offsetHeight }));
    const step = (g[g.length - 1].cx - g[0].cx) / Math.max(1, g.length - 1);
    const cy = shown[MID].offsetTop + shown[MID].offsetHeight / 2;
    const rowH = Math.max(...shown.map((c) => c.offsetTop + c.offsetHeight));
    // the slots: one beyond each edge (-1 and SHOWN) for the cards entering and leaving
    const last = g[g.length - 1];
    const geo = [{ ...g[0], cx: g[0].cx - g[0].w }, ...g, { ...last, cx: last.cx + last.w }];
    const base = HOME.map((c, i) => mod(i - (centreAt - MID), N));
    const box = HOME.map((c, i) => {
      if (!c.hidden) return { x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight };
      const s = geo[Math.min(SHOWN + 1, mod(base[i] + 1, N))];
      return { x: s.cx - s.w / 2, y: cy - s.h / 2, w: s.w, h: s.h };
    });
    ring = { geo, base, box, step, cy, o: 0, target: 0, raf: 0 };
    squad.style.paddingTop = rowH + 'px';
    squad.classList.add('ring');
    HOME.forEach((c, i) => {
      const s = c.style;
      c.hidden = false;
      s.left = box[i].x + 'px'; s.top = box[i].y + 'px'; s.width = box[i].w + 'px'; s.height = box[i].h + 'px';
      s.transformOrigin = '0 0';
    });
  }
  function place(o) {
    ring.o = o;
    HOME.forEach((c, i) => {
      const u = Math.max(-1, Math.min(SHOWN, mod(ring.base[i] + o + 1, N) - 1));
      const f = Math.floor(u), t = u - f;
      const a = ring.geo[f + 1], z = ring.geo[Math.min(f + 2, SHOWN + 1)];
      const cx = a.cx + (z.cx - a.cx) * t, w = a.w + (z.w - a.w) * t, h = a.h + (z.h - a.h) * t;
      const bx = ring.box[i];
      c.style.transform = `translate(${cx - w / 2 - bx.x}px,${ring.cy - h / 2 - bx.y}px) scale(${w / bx.w},${h / bx.h})`;
    });
  }
  function finish() {
    centreAt = mod(centreAt - Math.round(ring.target), N);
    cancelAnimationFrame(ring.raf);
    HOME.forEach((c) => { const s = c.style; s.left = s.top = s.width = s.height = s.transform = s.transformOrigin = ''; });
    squad.classList.remove('ring');
    squad.style.paddingTop = '';
    ring = null;
    settle();
  }
  // a short ease to a whole slot (about 250 ms, no bounce); reduced motion arrives at once
  function turnTo(target) {
    begin();
    cancelAnimationFrame(ring.raf);
    ring.target = target;
    const from = ring.o, t0 = performance.now(), dur = still.matches ? 0 : 250;
    const tick = (now) => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1;
      place(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) ring.raf = requestAnimationFrame(tick); else finish();
    };
    ring.raf = requestAnimationFrame(tick);
  }
  // turn by whole cards (+1 brings the next card on the right to the centre)
  function turn(steps) {
    if (!steps) return;
    const from = ring ? ring.target : 0;
    turnTo(from - steps);
  }
  function closePanel() {
    if (!chosen) return;
    chosen.setAttribute('aria-expanded', 'false');
    chosen.parentElement.classList.remove('selected');
    chosen = null;
    hide(strip);
    // the row returns to its full size once the panel has closed
    setTimeout(() => champions.classList.remove('compact'), OPEN_MS);
  }
  function home() {
    let d = mod(WARRIOR - (ring ? mod(centreAt - Math.round(ring.target), N) : centreAt), N);
    if (d > N / 2) d -= N;
    turn(d);
  }
  function closeChampion() {
    if (!chosen) return;
    closePanel();
    home();
  }
  function choose(btn) {
    // tapping the centred card again closes its details, and the row goes home
    if (chosen === btn) { closeChampion(); return; }
    if (ring) finish();
    if (chosen) {
      chosen.setAttribute('aria-expanded', 'false');
      chosen.parentElement.classList.remove('selected');
    }
    const wasOpen = !!chosen;
    chosen = btn;
    btn.setAttribute('aria-expanded', 'true');
    btn.parentElement.classList.add('selected');
    fillStrip(btn);
    if (!wasOpen) show(strip);
    turn(mod(HOME.indexOf(btn.parentElement) - (centreAt - MID), N) - MID);
  }
  // THE SWIPE: the ring follows a sideways thumb (or mouse) 1:1 and eases on release to the nearest card; a quick flick
  // carries one card, two at most. The first movement picks the axis: up and down stays the page's own scroll.
  let drag = null, swiped = false;
  squad.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || !e.target.closest('.card')) return;
    drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, axis: null, id: e.pointerId, trail: [], dx: 0, frame: 0 };
  });
  squad.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id || drag.axis === 'page') return;
    if (!drag.axis) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'y') { drag.axis = 'page'; return; }
      squad.setPointerCapture(e.pointerId);
      HOME.forEach((c) => c.classList.remove('pressed'));
      closePanel();
      begin();
      cancelAnimationFrame(ring.raf);
      drag.o0 = ring.o;
      drag.x = e.clientX;
      drag.k = squad.getBoundingClientRect().width / squad.offsetWidth || 1;
    }
    drag.dx = e.clientX - drag.x;
    drag.trail.push([e.timeStamp, e.clientX]);
    if (drag.trail.length > 5) drag.trail.shift();
    if (!drag.frame) {
      const d = drag;
      d.frame = requestAnimationFrame(() => { d.frame = 0; if (ring && drag === d) place(d.o0 + d.dx / d.k / ring.step); });
    }
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 8) { swiped = true; setTimeout(() => { swiped = false; }, 0); }
    if (d.axis !== 'x' || !ring) return;
    cancelAnimationFrame(d.frame);
    const o = d.o0 + (e.clientX - d.x) / d.k / ring.step;
    const [t0, x0] = d.trail[0] || [e.timeStamp, e.clientX];
    const v = (e.clientX - x0) / d.k / ring.step / Math.max(1, e.timeStamp - t0) * 1000;
    const start = Math.round(d.o0);
    const target = Math.max(start - 2, Math.min(start + 2, Math.round(o + v * 0.12)));
    turnTo(target);
  }
  squad.addEventListener('pointerup', endDrag);
  squad.addEventListener('pointercancel', endDrag);
  // no native image drag and no long-press image menu on the cards
  squad.addEventListener('dragstart', (e) => e.preventDefault());
  squad.addEventListener('contextmenu', (e) => { if (e.target.closest('.card')) e.preventDefault(); });

  // "Read update": the notes open full width below the two cards; "Show less" closes them
  function toggleMore(btn) {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const opening = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(opening));
    btn.closest('.news-card').classList.toggle('selected', opening);
    $('.read-label', btn).textContent = opening ? 'Show less' : 'Read update';
    $('.read-arrow', btn).textContent = opening ? '↑' : '→';
    if (opening) show(panel); else hide(panel);
  }

  // Support, Privacy and Terms: one line opens in the footer
  const info = $('#footer-info');
  function toggleInfo(btn) {
    const opening = btn.getAttribute('aria-expanded') !== 'true';
    $$('[data-info]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (!opening) { hide(info); return; }
    btn.setAttribute('aria-expanded', 'true');
    $$('p[data-for]', info).forEach((p) => { p.hidden = p.dataset.for !== btn.dataset.info; });
    show(info);
  }

  // THE ARRIVAL HIGHLIGHT: after the Updates link's scroll stops, the live Patch notes card glows once (the greyed Dev card
  // stays quiet); also when already at the bottom, and when the page opens at #updates
  const live = $('.news-card.patch');
  function arrive() {
    let done = false;
    const glow = () => {
      if (done) return;
      done = true;
      live.classList.remove('arrive');
      void live.offsetWidth;
      live.classList.add('arrive');
      clearTimeout(live._a);
      live._a = setTimeout(() => live.classList.remove('arrive'), 1500);
    };
    window.addEventListener('scrollend', glow, { once: true });
    setTimeout(glow, 900);
  }
  if (location.hash === '#updates') window.addEventListener('load', arrive);
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('a[href="#updates"]')) arrive();
    // a swipe never counts as a tap on a card
    if (swiped && t.closest('.squad')) { e.preventDefault(); return; }
    const arrow = t.closest('[data-step]');
    if (arrow) { closePanel(); turn(Number(arrow.dataset.step)); return; }
    const card = t.closest('[data-champion]');
    if (card) { choose(card); return; }
    // the panel's close control, or a tap outside the row and its panel, closes it and the row goes home
    if (t.closest('.ci-close') || (chosen && !t.closest('.squad'))) closeChampion();
    const more = t.closest('.read[aria-controls]');
    if (more) { toggleMore(more); return; }
    const infoBtn = t.closest('[data-info]');
    if (infoBtn) toggleInfo(infoBtn);
  });
  // Terror awaits: a press on a picture brightens and zooms it a touch (hover does the same with a mouse, in CSS)
  // the same touch on the Champion portraits and the news cards' art (hover with a mouse is in CSS)
  $$('.teasers li, .squad .card, .news-card').forEach((li) => {
    const off = () => li.classList.remove('pressed');
    li.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') li.classList.add('pressed'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => li.addEventListener(ev, off));
  });
  document.addEventListener('keydown', (e) => {
    // Left and Right browse the row while it has focus, like the arrows
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && document.activeElement && document.activeElement.closest('.row')) {
      e.preventDefault();
      closePanel();
      turn(e.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (e.key === 'Escape' && chosen) { const b = chosen; closeChampion(); b.focus(); }
  });
})();
