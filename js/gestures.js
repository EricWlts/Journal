// Gesten: Touch, Gedrückt halten, Schreibmaschine, Trackpad und Tastatur
'use strict';
/* ---------- gestures: touch ---------- */
/* Physik: Geschwindigkeit aus den letzten ~100 ms, Wurfweite wird mitgerechnet,
   Gummiband dort, wo es nicht weitergeht, Dauer der Restanimation passt sich dem Schwung an. */
(function touch() {
  let rowEl = null;
  let sx = 0, sy = 0, cand = null, mode = null, dx = 0, dy = 0, W = 0, H = 0, raf = 0, topEl = null, underEl = null, track = null, canNext = true, canPrev = true;
  let samples = [];
  const app = $('app');
  const rubber = (x, lim) => { const s = Math.sign(x), a = Math.abs(x); return s * lim * (1 - 1 / (a / lim * 0.55 + 1)); };
  const vel = (axis) => { // px/ms, Vorzeichen wie die Bewegung
    const now = performance.now(); const recent = samples.filter((p) => now - p.t < 110);
    if (recent.length < 2) return 0; const f = recent[0], l = recent[recent.length - 1];
    return (l[axis] - f[axis]) / Math.max(1, l.t - f.t);
  };
  const restMs = (remaining, v) => Math.max(160, Math.min(420, Math.abs(remaining) / Math.max(Math.abs(v), 0.9)));
  function frame() {
    raf = 0;
    if (mode === 'row') {
      let x = rowEl._base + dx;
      if (x > 0) x = rubber(x, 14); else if (x < -ROW_OPEN) x = -ROW_OPEN + (x + ROW_OPEN) * 0.6; // weiterziehen geht, aber zäher
      rowEl.style.setProperty('--sx', x.toFixed(1) + 'px');
    } else if (mode === 'edge') {
      const x = dx < 0 ? rubber(dx, 24) : dx;
      topEl.style.transform = 'translate3d(' + x + 'px,0,0)';
      const p = Math.max(0, Math.min(1, x / W));
      underEl.style.transform = 'translate3d(' + (-28 + 28 * p) + '%,0,0)';
      underEl.style.setProperty('--dim', String(0.12 * (1 - p)));
    } else if (mode === 'track' && track.id === 'weektrack') { // wie am Mac: nur die Tage folgen gedämpft dem Finger
      const p = track.children[1]; p.classList.add('dragging');
      const x = dx * 0.38; // gedämpft ×0,38
      p.style.setProperty('--dx', x.toFixed(1) + 'px'); p.style.setProperty('--do', Math.max(0.25, 1 - Math.abs(dx) / 420).toFixed(3));
    } else if (mode === 'track') {
      track.style.transform = 'translate3d(' + trackX(track, dx) + 'px,0,0)';
      const f = Math.max(0, 1 - Math.abs(dx) / (W * 0.45));
      fadeWith(track.id === 'caltrack' ? [$('calStats'), $('calTitle')] : [$('weekStat')], f);
    } else if (mode === 'pull' && SF.drag) {
      sfDragFrame(topEl, underEl, dy);
    } else if (mode === 'pull') {
      const y = dy < 0 ? rubber(dy, 20) : dy; const p = Math.max(0, Math.min(1, y / H));
      topEl.style.transform = 'translate3d(0,' + y + 'px,0)';
      topEl.style.setProperty('--r', Math.max(14, Math.min(18, 14 + Math.max(0, y) * 0.05)).toFixed(1) + 'px');
      // dahinter: Startseite leicht verkleinert und abgedunkelt, wächst mit dem Ziehen zurück
      underEl.style.transform = 'translate3d(0,' + (10 * (1 - p)).toFixed(1) + 'px,0) scale(' + (0.94 + 0.06 * p).toFixed(4) + ')';
      underEl.style.setProperty('--dim', String((0.3 * (1 - p)).toFixed(3)));
    } else if (mode === 'entry') {
      const blocked = (dx < 0 && !canNext) || (dx > 0 && !canPrev);
      const x = blocked ? rubber(dx, 40) : dx * 0.55;
      const el = $('entryInner'); el.style.transform = 'translate3d(' + x + 'px,0,0)';
      el.style.opacity = blocked ? '' : String(1 - Math.min(Math.abs(dx) / W, 0.6));
    }
  }
  app.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || trackBusy) { cand = mode = null; return; }
    if (e.target.closest && e.target.closest('.sline')) { cand = mode = null; return; } // Stille Linie: eigene Geste
    const p = e.touches[0]; sx = p.clientX; sy = p.clientY; dx = dy = 0; W = innerWidth; H = innerHeight; mode = null; cand = null;
    samples = [{ t: performance.now(), x: sx, y: sy }];
    const top = S.stack[S.stack.length - 1];
    const r = !isDesktop() && top === 'home' && sx >= 32 ? e.target.closest('.row') : null;
    rowEl = r && !$('confirm').classList.contains('show') ? r : null;
    if (S.openRow && S.openRow !== rowEl) closeRow();
    if (!isDesktop() && sx < 32 && S.stack.length > minStack() && top !== 'entry') cand = 'edge'; // Eintrag: zurück nach unten, nicht zur Seite
    else if (top === 'calendar' && e.target.closest('#calarea')) { cand = 'track'; track = $('caltrack'); }
    else if (top === 'home' && e.target.closest('#weekwrap') && !S.yr) { cand = 'track'; track = $('weektrack'); }
    else if (top === 'entry' && !typing() && !SF.running && !SF.closing) cand = 'entry';
    else if (top === 'settings') cand = 'pull';
  }, { passive: true });
  app.addEventListener('touchmove', (e) => {
    if (!cand && !mode && !rowEl) return;
    const p = e.touches[0]; dx = p.clientX - sx; dy = p.clientY - sy;
    samples.push({ t: performance.now(), x: p.clientX, y: p.clientY }); if (samples.length > 8) samples.shift();
    if (!mode) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (rowEl && (dx < 0 || rowEl === S.openRow)) { mode = 'row'; cand = null; rowEl.classList.remove('snap'); rowEl.classList.add('swiping'); rowEl._base = rowEl === S.openRow ? -ROW_OPEN : 0; }
        else if (cand === 'pull' || !cand) { cand = null; rowEl = null; return; }
        else { mode = cand; cand = null; }
        if (mode === 'edge') { topEl = $(S.stack[S.stack.length - 1]); underEl = $(S.stack[S.stack.length - 2]); topEl.classList.add('dragging'); underEl.classList.add('dragging'); }
        if (mode === 'track') track.style.transition = 'none';
        if (mode === 'entry') { $('entryInner').style.transition = 'none'; canNext = !!adjacentOf(1); canPrev = !!adjacentOf(-1); }
      } else if ((cand === 'entry' || cand === 'pull') && dy > 0 && $(S.stack[S.stack.length - 1]).scrollTop <= 0 && S.stack.length > minStack() && !isDesktop()) {
        mode = 'pull'; cand = null;
        if (typing()) document.activeElement.blur();
        topEl = $(S.stack[S.stack.length - 1]); underEl = $(S.stack[S.stack.length - 2]);
        if (!(topEl.id === 'entry' && sfDragStart(topEl, underEl))) { topEl.classList.add('dragging', 'sheeting'); underEl.classList.add('dragging', 'sheet-under'); underEl.style.transform = 'translate3d(0,10px,0) scale(.94)'; }
      } else { cand = null; rowEl = null; return; }
    }
    e.preventDefault();
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: false });
  function end() {
    if (!mode) { cand = null; return; }
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    const vx = vel('x'), vy = vel('y'); const m = mode; mode = null;
    const projX = dx + vx * 180, projY = dy + vy * 180; // wohin der Wurf führen würde
    if (m === 'row') {
      const row = rowEl; rowEl = null; row.classList.remove('swiping');
      const x = row._base + dx, px = x + vx * 180;
      if (x < -W * 0.5) { setRow(row, -ROW_OPEN, true); askDelete(row.dataset.id); } // ganz durchgezogen: gleich nachfragen
      else if (px < -ROW_OPEN / 2 && vx < 0.3) setRow(row, -ROW_OPEN, true);
      else { setRow(row, 0, true); }
      return;
    }
    if (m === 'edge') {
      const commit = projX > W * 0.45 && vx > -0.2;
      const ms = commit ? restMs(W - dx, vx) : restMs(dx, vx);
      topEl.classList.remove('dragging'); underEl.classList.remove('dragging'); void topEl.offsetWidth;
      topEl.style.transition = underEl.style.transition = 'transform ' + Math.round(ms) + 'ms var(--sheet), visibility 0s linear ' + Math.round(ms) + 'ms';
      underEl.style.removeProperty('--dim');
      const t = topEl, u = underEl;
      if (commit) { back(); } else { t.style.transform = ''; u.style.transform = ''; }
      setTimeout(() => { t.style.transition = ''; u.style.transition = ''; }, ms + 20);
    } else if (m === 'pull' && SF.drag) {
      sfDragEnd(topEl, underEl, dy > 120 || (dy > 30 && vy > 0.6));
    } else if (m === 'pull') {
      topEl.classList.remove('dragging'); void topEl.offsetWidth;
      const t = topEl, u = underEl;
      const clean = () => { t.classList.remove('sheeting'); t.style.removeProperty('--r'); u.classList.remove('dragging', 'sheet-under'); u.style.removeProperty('--dim'); };
      if (projY > H * 0.35 && vy > -0.2) {
        const ms = Math.round(restMs(H - dy, vy) + 40);
        t.style.transition = 'transform ' + ms + 'ms cubic-bezier(0.2, 0.8, 0.2, 1)';
        t.style.transform = 'translate3d(0,100%,0)';
        u.classList.remove('dragging'); void u.offsetWidth;
        u.style.transition = 'transform ' + ms + 'ms cubic-bezier(0.2, 0.8, 0.2, 1), border-radius ' + ms + 'ms cubic-bezier(0.2, 0.8, 0.2, 1)';
        u.style.transform = 'translate3d(0,0,0) scale(1)'; u.style.borderRadius = '0px'; u.style.setProperty('--dim', '0');
        setTimeout(() => {
          t.style.transition = 'none'; u.style.transition = 'none'; clean(); u.style.borderRadius = ''; back();
          requestAnimationFrame(() => { t.style.transition = ''; u.style.transition = ''; });
        }, ms);
      } else {
        const ms = 380;
        t.style.transition = 'transform ' + ms + 'ms var(--sheet)'; t.style.transform = ''; t.style.setProperty('--r', '0px');
        u.classList.remove('dragging'); void u.offsetWidth;
        u.style.transition = 'transform ' + ms + 'ms var(--sheet)'; u.style.transform = 'translate3d(0,10px,0) scale(.94)'; u.style.setProperty('--dim', '.28');
        setTimeout(() => { u.style.transition = 'none'; u.style.transform = ''; clean(); void u.offsetWidth; t.style.transition = ''; u.style.transition = ''; }, ms);
      }
    } else if (m === 'track') {
      const w = track.parentElement.clientWidth;
      if (Math.abs(projX) > w * 0.4 && Math.sign(projX) === Math.sign(dx) || Math.abs(dx) > w * 0.5) {
        const dir = dx < 0 ? 1 : -1; const ms = restMs(w - Math.abs(dx), vx);
        if (track.id === 'caltrack') shiftCal(dir, ms); else weekMove(dir);
      } else if (track.id === 'weektrack') { // zurückgleiten
        const p = track.children[1], x = p.style.getPropertyValue('--dx') || '0px', o = parseFloat(p.style.getPropertyValue('--do')) || 1;
        p.classList.remove('dragging'); p.style.removeProperty('--dx'); p.style.removeProperty('--do');
        p.querySelectorAll('.wday .dot, .mday .dot').forEach((d) => d.animate([{ transform: 'translate3d(' + x + ',0,0)', opacity: o }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }));
      } else {
        track.style.transition = 'transform .38s var(--sheet)'; track.style.transform = 'translate3d(' + trackX(track) + 'px,0,0)';
        for (const el of (track.id === 'caltrack' ? [$('calStats'), $('calTitle')] : [$('weekStat')])) { el.style.transition = 'opacity .38s var(--ease)'; el.style.opacity = ''; }
      }
    } else if (m === 'entry') {
      const el = $('entryInner'); const dir = dx < 0 ? 1 : -1;
      const ok = dir > 0 ? canNext : canPrev;
      el.style.transition = 'transform .3s var(--sheet), opacity .3s var(--sheet)';
      if (ok && (Math.abs(projX) > W * 0.4 && Math.sign(projX) === Math.sign(dx))) {
        el.style.transform = 'translate3d(' + (dir > 0 ? -W * 0.35 : W * 0.35) + 'px,0,0)'; el.style.opacity = '0';
        setTimeout(() => { el.style.transition = 'none'; el.style.transform = ''; el.style.opacity = ''; adjacent(dir); requestAnimationFrame(() => { el.style.transition = ''; }); }, 170);
      } else { el.style.transform = ''; el.style.opacity = ''; setTimeout(() => { el.style.transition = ''; }, 320); }
    }
  }
  app.addEventListener('touchend', end, { passive: true });
  app.addEventListener('touchcancel', end, { passive: true });
})();

/* Plus (Mac): beim Klick dreht sich das Kreuz mit einer kleinen Feder eine Vierteldrehung weiter,
   ein feiner Ring läuft sanft nach außen – wie ein Tropfen Tinte, der aufs Papier fällt */
$('home').querySelector('.newbtn').addEventListener('click', (e) => {
  const b = e.currentTarget, svg = b.querySelector('svg');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  svg.getAnimations().forEach((a) => a.cancel());
  svg.animate([{ transform: 'rotate(0deg) scale(.84)' }, { transform: 'rotate(100deg) scale(1.08)', offset: 0.55 }, { transform: 'rotate(90deg) scale(1)' }],
    { duration: 620, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
  const r = document.createElement('span'); r.className = 'newring'; b.appendChild(r);
  r.animate([{ transform: 'scale(.7)', opacity: 0.55 }, { transform: 'scale(1.9)', opacity: 0 }], { duration: 760, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }).onfinish = () => r.remove();
});

/* Seite (Mac): Klick in den Text oder ⌘N spannt das Blatt als hochkante Seite in die Mitte; Esc oder ein Klick ins Dunkel löst es wieder */
(function pageMode() {
  /* Erst wenn ~3 s am Stück geschrieben wird, tritt alles andere sanft zurück und das Blatt wird zur Seite.
     Nach 10 s ohne Tippen kehrt die Ansicht von allein sanft zurück. Esc oder ein Klick ins Dunkel löst sie sofort. */
  const app = $('app'); let on = false, start = 0, last = 0, idle = null;
  function set(v) {
    clearTimeout(idle);
    if (on === v || (v && (!isDesktop() || S.stack[S.stack.length - 1] !== 'entry'))) return;
    on = v; clearTimeout(set.t);
    if (v) { app.classList.remove('a4-out'); app.classList.add('a4'); }
    else { app.classList.add('a4-out'); app.classList.remove('a4'); set.t = setTimeout(() => app.classList.remove('a4-out'), 1700); }
    setTheme();
  }
  const input = () => {
    if (!isDesktop()) return; const now = performance.now();
    if (now - last > 1500) start = now; // neue Schreibphase beginnt
    last = now;
    if (!on && now - start >= 3000) set(true);
    if (on) { clearTimeout(idle); idle = setTimeout(() => set(false), 10000); }
  };
  $('eBody').addEventListener('input', input);
  app.addEventListener('mousedown', (e) => { if (on && !e.target.closest('#entry, .confirm, .ctxmenu')) { e.preventDefault(); set(false); } });
  window.addEventListener('keydown', (e) => { if (on && e.key === 'Escape') set(false); }, true);
  window.addEventListener('resize', () => { if (on && !isDesktop()) set(false); });
  S.pageOff = () => set(false);
})();

/* Tastatur: Cursor beim Tippen im sichtbaren Bereich halten */
/* ---------- iPhone: Gedrückt halten auf einer Karte (Liste, Suche): Vorschau + Menü ---------- */
(function holdPeek() {
  const app = $('app'), LP = { ph: 'idle', row: null, id: null, x: 0, y: 0, tp: 0, tm: 0, tf: 0, until: 0, hold: false, after: null, dim: null, pv: null, menu: null };
  const rm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IC = {
    open: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    share: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6h14v-6"/></svg>',
    del: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/></svg>'
  };
  function parts(e) { // Titel und Text getrennt (ohne Titel: erste Zeile ist der Titel)
    const t = (e.text || '').trim();
    if (e.title && e.title.trim()) return { ti: e.title.trim(), tx: t };
    const i = t.indexOf('\n'); return { ti: titleOf(e), tx: i < 0 ? '' : t.slice(i + 1).trim() };
  }
  function mdOf(e) { const d = parseKey(e.date), p = parts(e); return '# ' + p.ti + '\n\n*' + WDLONG[d.getDay()] + ', ' + d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '*\n\n' + p.tx + '\n'; }
  async function shareMd(e) {
    const md = mdOf(e);
    try { if (navigator.share) { await navigator.share({ text: md }); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(md); toast('Als Markdown kopiert'); } catch (err) { toast('Kopieren nicht möglich'); }
  }
  const cancelPress = () => { clearTimeout(LP.tp); clearTimeout(LP.tm); if (LP.ph === 'press') { LP.ph = 'idle'; if (LP.row) LP.row.classList.remove('lp-press'); LP.row = null; } };
  const unscaled = (row) => { const r = row.getBoundingClientRect(), w = row.offsetWidth, h = row.offsetHeight; return { left: r.left + r.width / 2 - w / 2, top: r.top + r.height / 2 - h / 2, width: w, height: h, s: w ? r.width / w : 1 }; };
  const put = (el, g) => { el.style.top = g.top + 'px'; el.style.left = g.left + 'px'; el.style.width = g.width + 'px'; el.style.height = g.height + 'px'; };
  function geo() { // Zielgröße der Vorschau und Platz des Menüs
    const ar = app.getBoundingClientRect(), W = ar.width, H = innerHeight, mh = 3 * 49 + 2, pw = Math.min(W - 32, 440);
    const ph = Math.max(180, Math.min(H * 0.46, 400, H - mh - 12 - 100)), total = ph + 12 + mh, top = Math.max(48, (H - total) / 2 - 8), left = ar.left + (W - pw) / 2;
    return { top, left, width: pw, height: ph, mtop: top + ph + 12, mw: Math.min(282, pw), mleft: left + pw - Math.min(282, pw) };
  }
  function build(e, row) {
    const d = parseKey(e.date), p = parts(e), dim = document.createElement('div'), pv = document.createElement('div'), menu = document.createElement('div');
    dim.className = 'lp-dim off'; dim.setAttribute('aria-hidden', 'true');
    pv.className = 'lp-pv'; pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-label', 'Vorschau: ' + p.ti);
    pv.innerHTML = '<div class="inner"><div class="lp-hd"><span class="lp-dn">' + d.getDate() + '</span><span class="lp-dl"><b>' + WDLONG[d.getDay()].toUpperCase() + '</b><i>' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() +
      '</i></span></div><div class="lp-ti">' + esc(p.ti) + '</div><div class="lp-tx">' + esc(p.tx.slice(0, 900)) + '</div></div>';
    menu.className = 'lp-menu off'; menu.setAttribute('role', 'menu');
    menu.innerHTML = '<button class="lp-mi" role="menuitem" data-m="open">Öffnen' + IC.open + '</button><button class="lp-mi" role="menuitem" data-m="share">Als Markdown teilen' + IC.share +
      '</button><button class="lp-mi danger" role="menuitem" data-m="del">Löschen …' + IC.del + '</button>';
    dim.addEventListener('click', () => close()); menu.addEventListener('click', (ev) => { const b = ev.target.closest('[data-m]'); if (b) pick(b.dataset.m); });
    pv.addEventListener('click', () => { if (LP.ph === 'closing') show(); });
    document.body.append(dim, pv, menu); LP.dim = dim; LP.pv = pv; LP.menu = menu;
  }
  function show() { // Vorschau offen (auch: mitten im Schließen wieder getippt – kehrt von der aktuellen Stelle um)
    clearTimeout(LP.tf); LP.after = null; LP.ph = 'open';
    const g = geo(), pv = LP.pv, menu = LP.menu;
    put(pv, g); pv.style.transform = ''; pv.style.borderRadius = ''; pv.style.backgroundColor = ''; pv.style.opacity = '';
    pv.classList.remove('small', 'pre', 'closing', 'gone'); if (rm()) pv.classList.add('in');
    menu.style.top = g.mtop + 'px'; menu.style.left = g.mleft + 'px'; menu.style.width = g.mw + 'px'; menu.classList.remove('off'); LP.dim.classList.remove('off');
  }
  function peek(row) {
    const id = row.dataset.id, e = S.entries.find((x) => x.id === id); if (!e || !row.isConnected) { cancelPress(); return; }
    LP.ph = 'open'; LP.id = id; LP.row = row; LP.hold = true; LP.until = 0; clearTimeout(LP.tp);
    const u = unscaled(row), cs = getComputedStyle(row), bg = sfBg(row), rad = cs.borderTopLeftRadius;
    build(e, row); const pv = LP.pv;
    if (rm()) { pv.classList.add('rm'); row.style.transition = 'none'; row.classList.remove('lp-press'); row.style.visibility = 'hidden'; void pv.offsetWidth; show(); return; }
    pv.classList.add('small', 'pre'); sfRep(pv, row); put(pv, u); pv.style.borderRadius = rad; pv.style.backgroundColor = bg; pv.style.transform = 'scale(' + u.s + ')';
    row.style.transition = 'none'; row.classList.remove('lp-press'); row.style.visibility = 'hidden';
    void pv.offsetWidth; void row.offsetWidth; row.style.transition = '';
    show(); pv.classList.remove('pre');
  }
  function finish() {
    clearTimeout(LP.tf); const row = LP.row, a = LP.after; LP.after = null;
    if (row) { row.style.visibility = ''; row.style.transition = ''; }
    for (const k of ['dim', 'pv', 'menu']) { if (LP[k]) LP[k].remove(); LP[k] = null; }
    LP.ph = 'idle'; LP.row = null; LP.hold = false; LP.until = 0; if (a) a();
  }
  function close(after) { // Menü zuerst weg, Vorschau und Hintergrund laufen mit derselben Kurve zurück, Kartenkopie blendet im Flug ein
    if (LP.ph !== 'open') { if (after && LP.ph === 'closing') LP.after = after; return; }
    LP.ph = 'closing'; LP.after = after || null; const pv = LP.pv, row = LP.row;
    LP.menu.classList.add('off'); LP.dim.classList.add('off');
    const ok = !rm() && row && row.isConnected && (() => { const r = row.getBoundingClientRect(); return r.width > 0 && r.bottom > 60 && r.top < innerHeight - 20; })();
    if (!ok) { pv.classList.add('gone'); pv.classList.remove('in'); LP.tf = setTimeout(finish, 190); return; }
    const u = unscaled(row); if (!pv.querySelector('.rep')) sfRep(pv, row);
    pv.classList.add('small', 'closing'); put(pv, u); pv.style.transform = ''; pv.style.borderRadius = getComputedStyle(row).borderTopLeftRadius; pv.style.backgroundColor = sfBg(row);
    LP.tf = setTimeout(finish, 570);
  }
  function pick(m) {
    const id = LP.id, e = S.entries.find((x) => x.id === id); LP.until = 0;
    if (m === 'share') { if (e) shareMd(e); close(); }
    else if (m === 'open') close(() => { const r = document.querySelector('#list .row[data-id="' + CSS.escape(id) + '"]'); if (r) r.click(); else openEntryById(id); });
    else if (m === 'del') close(() => askDelete(id));
  }
  app.addEventListener('touchstart', (ev) => {
    cancelPress(); if (LP.ph !== 'idle' || ev.touches.length !== 1 || isDesktop()) return;
    const top = S.stack[S.stack.length - 1]; if (top !== 'home') return;
    const p = ev.touches[0]; if (p.clientX < 32) return;
    const row = ev.target.closest && ev.target.closest('#list .row'); if (!row || S.openRow || $('confirm').classList.contains('show')) return;
    LP.ph = 'press'; LP.row = row; LP.x = p.clientX; LP.y = p.clientY;
    LP.tp = setTimeout(() => { if (LP.ph === 'press') row.classList.add('lp-press'); }, 120);
    LP.tm = setTimeout(() => peek(row), 480);
  }, { passive: true });
  app.addEventListener('touchmove', (ev) => {
    if (LP.ph === 'open' || LP.ph === 'closing') { if (ev.cancelable) ev.preventDefault(); ev.stopPropagation(); return; } // kein Wischen/Scrollen unter der Vorschau
    if (LP.ph !== 'press') return; const p = ev.touches[0];
    if (Math.hypot(p.clientX - LP.x, p.clientY - LP.y) >= 8) cancelPress();
  }, { capture: true, passive: false });
  const lift = () => { if (LP.ph === 'press') cancelPress(); else if (LP.hold) { LP.hold = false; LP.until = performance.now() + 450; } };
  document.addEventListener('touchstart', () => { if (LP.hold && LP.ph !== 'idle' && LP.ph !== 'press') { LP.hold = false; LP.until = 0; } }, true);
  document.addEventListener('touchend', lift, true); document.addEventListener('touchcancel', lift, true);
  document.addEventListener('click', (ev) => { if (LP.hold || performance.now() < LP.until) { ev.preventDefault(); ev.stopPropagation(); } }, true); // der Klick nach dem langen Druck öffnet nichts
  document.addEventListener('contextmenu', (ev) => { if (!isDesktop() && ev.target.closest && ev.target.closest('#list .row')) ev.preventDefault(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && LP.ph === 'open') { ev.stopPropagation(); close(); } }, true);
})();
(function caret() {
  const vv = window.visualViewport; if (!vv) return;
  function keep() {
    if (!typing() || S.stack[S.stack.length - 1] !== 'entry') return;
    const sel = getSelection(); if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0).getBoundingClientRect(); if (!r || (!r.top && !r.bottom)) return;
    const limit = vv.height - 36;
    if (r.bottom > limit) $('entry').scrollBy({ top: r.bottom - limit, behavior: 'smooth' });
  }
  vv.addEventListener('resize', () => setTimeout(keep, 60));
  $('eBody').addEventListener('input', () => requestAnimationFrame(keep));
})();

/* Schreibmaschine (Mac): erreicht die Schreibzeile 5/8 der Blatthöhe, rückt das Papier von allein sanft nach oben – die Zeile bleibt dort stehen */
(function typewriter() {
  const v = $('entry'); let anim = null, target = 0;
  function caretBottom() {
    const sel = getSelection(); if (!sel.rangeCount || !sel.isCollapsed) return null;
    const rg = sel.getRangeAt(0); if (!$('eBody').contains(rg.startContainer) && rg.startContainer !== $('eBody')) return null;
    let r = rg.getClientRects()[0], c = rg.startContainer, o = rg.startOffset;
    if (c.nodeType === 1 && o > 0) { const n = c.childNodes[o - 1]; if (n && n.nodeType === 3) { c = n; o = n.length; } } // Cursor zwischen Knoten: am Textende davor messen
    if (c.nodeType === 3 && o === 0 && c.previousSibling && c.previousSibling.nodeType === 3) { c = c.previousSibling; o = c.length; } // nach Enter am Ende legt Chrome einen neuen Textknoten an
    if (c.nodeType === 3 && o > 0 && (!r || (!r.top && !r.bottom) || c.data[o - 1] === '\n')) { // direkt nach Enter: manche Browser melden noch die alte Zeile – dann eine Zeile dazurechnen (ohne den Text anzufassen, Rückgängig bleibt heil)
      const m = document.createRange(); m.setStart(c, o - 1); m.setEnd(c, o); let rs = m.getClientRects(), q = rs[rs.length - 1];
      if (!q && c.data[o - 1] === '\n' && o > 1) { m.setStart(c, o - 2); m.setEnd(c, o - 1); rs = m.getClientRects(); q = rs[rs.length - 1]; } // „\n“ selbst hat keine Fläche: am Zeichen davor messen
      if (q) { if (c.data[o - 1] !== '\n') return q.bottom; if (!(r && r.bottom > q.bottom + 1)) return q.bottom + (parseFloat(getComputedStyle($('eBody')).lineHeight) || 32); }
    }
    return r && r.bottom ? r.bottom : null;
  }
  function glide() {
    if (anim) return; let lastT = performance.now();
    const step = (t) => { const dt = Math.min(48, t - lastT); lastT = t; const d = target - v.scrollTop;
      if (Math.abs(d) < 0.6) { v.scrollTop = target; anim = null; return; }
      v.scrollTop += d * (1 - Math.pow(0.0035, dt / 1000 * 1.6)); anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function keep() {
    if (!isDesktop() || S.stack[S.stack.length - 1] !== 'entry') return;
    const b = caretBottom(); if (b == null) return;
    const vr = v.getBoundingClientRect(), line = vr.top + vr.height * 0.625;
    if (b > line) { const want = Math.min(v.scrollHeight - v.clientHeight, v.scrollTop + (b - line)); target = anim ? Math.max(target, want) : want; glide(); } // gemessen an der aktuellen Lage – nichts doppelt zählen
  }
  $('eBody').addEventListener('input', () => requestAnimationFrame(keep));
  $('eBody').addEventListener('keyup', (e) => { if (/^Arrow(Up|Down)$|^Enter$/.test(e.key)) requestAnimationFrame(keep); });
  v.addEventListener('wheel', () => { if (anim) { cancelAnimationFrame(anim); anim = null; } }, { passive: true });
})();

/* ---------- gestures: trackpad + keyboard (Mac) ---------- */
(function desk() {
  /* Trackpad: eine Wischgeste = höchstens ein Wechsel. Der Schwung danach wird geschluckt,
     und horizontales Wischen löst nie das Zurück/Vor des Browsers aus (das hat die Seite neu geladen). */
  let g = null, last = 0, settleT = null;
  function settle() {
    if (!g || g.fired) return;
    if (g.area === 'side') {
      const tr = $('sctrack'), p = tr.children[1];
      if (p && p.classList.contains('dragging')) { // losgelassen, ohne zu blättern: die Tage gleiten zurück
        const dx = p.style.getPropertyValue('--dx') || '0px', dop = p.style.getPropertyValue('--do') || '1';
        p.classList.remove('dragging'); p.style.removeProperty('--dx'); p.style.removeProperty('--do');
        p.querySelectorAll('.wday .dot, .mgrid .dot, .yd, .yz').forEach((d) => d.animate([{ transform: 'translate3d(' + dx + ',0,0)', opacity: dop }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }));
      }
      tr.style.transition = 'transform .4s var(--sheet)'; tr.style.transform = 'translate3d(' + trackX(tr) + 'px,0,0)'; g.acc = 0; return;
    }
    if (g.area !== 'entry') return;
    const el = $('entryInner'); el.style.transition = 'transform .36s var(--sheet), opacity .36s var(--sheet)'; el.style.transform = ''; el.style.opacity = '';
    setTimeout(() => { if (!g || g.fired || !g.acc) el.style.transition = ''; }, 380); g.acc = 0;
  }
  window.addEventListener('wheel', (e) => {
    const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    const now = performance.now(); if (now - last > 220) g = null; last = now;
    if (!horiz) return;
    e.preventDefault();
    if (!g) {
      const top = S.stack[S.stack.length - 1];
      const area = isDesktop() && e.target.closest && e.target.closest('#sidecal') ? 'side' : top === 'calendar' ? 'cal' : top === 'entry' ? 'entry' : 'other';
      g = { acc: 0, fired: false, area };
    }
    if (g.fired || trackBusy) return;
    g.acc += e.deltaX; clearTimeout(settleT); settleT = setTimeout(settle, 180);
    const dir = g.acc > 0 ? 1 : -1;
    if (g.area === 'side') { // Kalender folgt dem Finger, ab einem Viertel der Breite blättert er weiter
      const tr = $('sctrack'), w = tr.parentElement.clientWidth, a = Math.abs(g.acc), sl = S.fx === 'slide';
      const x = sl ? Math.max(-w, Math.min(w, -g.acc)) : -dir * 30 * (1 - 1 / (a / 110 + 1)); // Gleiten folgt 1:1, sonst ein weicher, gedämpfter Zug nur der Tage
      if (sl) { tr.style.transition = 'none'; tr.style.transform = 'translate3d(' + trackX(tr, x) + 'px,0,0)'; }
      else if (tr.children[1]) { const p = tr.children[1]; p.classList.add('dragging'); p.style.setProperty('--dx', x.toFixed(1) + 'px'); p.style.setProperty('--do', (1 - 0.6 * Math.min(1, a / (w * 0.25))).toFixed(3)); }
      if (a > w * 0.25) { g.fired = true; shiftSide(dir, Math.round(Math.max(200, 380 * (1 - Math.abs(x) / w)))); }
    }
    else if (g.area === 'cal') { if (Math.abs(g.acc) > 90) { g.fired = true; shiftCal(dir); } }
    else if (g.area === 'entry') {
      if (g.has == null || g.dir !== dir) { g.dir = dir; g.has = !!adjacentOf(dir); }
      const has = g.has, el = $('entryInner'), a = Math.abs(g.acc);
      const x = has ? -dir * Math.min(90, a * 0.5) : -dir * 18 * (1 - 1 / (a / 60 + 1));
      if (!g.raf) g.raf = requestAnimationFrame(() => { g.raf = 0; if (g.fired) return; el.style.transition = 'none'; el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)'; el.style.opacity = has ? String(1 - Math.min(a / 300, 0.35)) : ''; });
      if (has && a > 90) { g.fired = true; switchEntry(dir); }
    }
    else if (g.area === 'other' && g.acc < -120 && S.stack.length > minStack()) { g.fired = true; back(); }
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    const top = S.stack[S.stack.length - 1];
    if ((e.metaKey || e.ctrlKey) && e.key === '[') { e.preventDefault(); back(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); newEntry(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); if (S.pageOff) S.pageOff(); if (S.dsearch) $('dq').focus(); else deskSearch(true); return; }
    if (e.key === 'Escape' && S.dsearch && !typing()) { deskSearch(false); return; }
    if (typing()) { if (e.key === 'Escape') { document.activeElement.blur(); saveCur(); } return; }
    if (e.key === 'Escape') back();
    else if (top === 'calendar' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) shiftCal(e.key === 'ArrowLeft' ? -1 : 1);
    else if (top === 'entry' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) switchEntry(e.key === 'ArrowLeft' ? -1 : 1);
  });
})();
