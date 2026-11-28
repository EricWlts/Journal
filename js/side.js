// Mac-Seitenleiste (Woche, Monat, Jahr)
'use strict';
/* Seitenleiste (Mac): Monat/Jahr mit eigenem Zustand */
const SIDE_ORDER = { week: 0, month: 1, year: 2 };
const weekOf = (d) => { const mon = new Date(d); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - mondayIdx(mon)); return Math.round((mon - weekStart(0)) / (7 * 864e5)); };
const weekRef = (w) => { if (!w) return today(); const mon = weekStart(w); return new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 3); }; // Donnerstag bestimmt den Monat
function sidePeriod(o) { if (S.side.mode === 'week') return { w: S.side.w + o, y: S.side.y, m: S.side.m }; let { y, m } = S.side; if (S.side.mode === 'month') { m += o; while (m < 0) { m += 12; y--; } while (m > 11) { m -= 12; y++; } } else y += o; return { y, m }; }
function awayText(mode, n) { // wie weit der gezeigte Zeitraum von heute weg ist (nur Zukunft)
  if (n <= 0) return '';
  if (mode === 'week') return n === 1 ? 'nächste Woche' : 'in ' + n + ' Wochen';
  if (mode === 'month') return n === 1 ? 'nächsten Monat' : 'in ' + n + ' Monaten';
  return n === 1 ? 'nächstes Jahr' : 'in ' + n + ' Jahren';
}
function setAway(el, txt) { if (txt) el.textContent = txt; } // Text bleibt beim Ausblenden stehen, damit nichts springt
const sideLW = () => $('scview').clientWidth || 456;
function renderSide(keepPanels) {
  if (!isDesktop()) return;
  const { mode, y, m, w } = S.side; const t = today();
  if (!keepPanels) { $('sctrack').innerHTML = [-1, 0, 1].map((o) => { const p = sidePeriod(o); return mode === 'week' ? weekPanelHTML(p.w) : '<div class="calpanel">' + (mode === 'month' ? monthGridHTML(p.y, p.m, true) : (S.lazyNb && o ? '' : yearLayerHTML(p.y, 'd', 'sidepick', sideLW()))) + '</div>'; }).join('');
    resetTrack($('sctrack')); updateSideSel(); } // Auswahlring auch nach dem Wochenwechsel (z. B. Sonntag) sofort wieder setzen
  $('sidecal').classList.toggle('is-week', mode === 'week'); $('sidecal').classList.toggle('is-year', mode === 'year'); ySegSync(); $('home').classList.toggle('side-week', mode === 'week');
  const ref = weekRef(w);
  S.sideTitle = mode === 'week' ? MONTHS[ref.getMonth()] + '|' + ref.getFullYear() : (mode === 'month' ? MONTHS[m] : 'Das Jahr') + '|' + y;
  const mon = weekStart(w), sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const first = mode === 'week' ? mon : mode === 'month' ? new Date(y, m, 1) : new Date(y, 0, 1);
  const last = mode === 'week' ? sun : mode === 'month' ? new Date(y, m, daysIn(y, m)) : new Date(y, 11, 31);
  const end = last < t ? last : t; const elapsed = first > t ? 0 : Math.round((end - first) / 864e5) + 1;
  const norm = setStat($('scCount'), $('scStat').querySelector('.lbl'), first, last, elapsed);
  $('scStat').classList.toggle('is-empty', norm && !elapsed);
  setAway($('scAway'), awayText(mode, mode === 'week' ? w : mode === 'month' ? (y * 12 + m) - (t.getFullYear() * 12 + t.getMonth()) : y - t.getFullYear()));
  $('scWeek').setAttribute('aria-selected', mode === 'week'); $('scMonth').setAttribute('aria-selected', mode === 'month'); $('scYear').setAttribute('aria-selected', mode === 'year');
  const isNow = mode === 'week' ? !w : y === t.getFullYear() && (mode === 'year' || m === t.getMonth());
  const tl = $('scTodayBtn'), showT = !isNow && !S.toToday; tl.classList.toggle('on', showT); tl.tabIndex = showT ? 0 : -1;
  if (!isNow) { const future = mode === 'week' ? w > 0 : (mode === 'month' ? y * 12 + m > t.getFullYear() * 12 + t.getMonth() : y > t.getFullYear()); tl.classList.toggle('dir-l', future); tl.classList.toggle('dir-r', !future); }
  if (S.updateHomeTitleSoft) S.updateHomeTitleSoft(); else if (S.updateHomeTitle) S.updateHomeTitle();
  placeStat(); yearIdle();
}
function animTitle(label, dir, vertical) { // Monat gleitet seitlich, Jahr rollt senkrecht; was gleich bleibt, bleibt stehen
  const h = $('homeTitle'), [m2, y2] = label.split('|');
  const t = h.querySelector('.t'), y = h.querySelector('.y');
  if (!t || !y) { h.innerHTML = titleHTML(m2, y2); placeStat(); return; }
  h.style.opacity = ''; h.style.transition = '';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const [el, txt, axis] of [[t, m2, 'x'], [y, y2, 'y']]) {
    if ((el.dataset.to || el.textContent) === txt) continue;
    el.dataset.to = txt; el.getAnimations().forEach((a) => a.cancel()); unmask(el);
    if (still) { el.textContent = txt; continue; }
    const vert = vertical || S.fx === 'roll', dist = S.fx === 'fade' ? 8 : 18;
    const d = dir || 1, useX = axis === 'x' && dir && !vert;
    if (S.flipping) {
      unmask(el); el.textContent = txt;
      el.animate([{ opacity: 0.35, transform: useX ? 'translate3d(' + (d * 6) + 'px,0,0)' : 'translate3d(0,' + (d * 0.12) + 'em,0)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
      continue;
    }
    const out = useX ? 'translate3d(' + (-d * dist) + 'px,0,0)' : 'translate3d(0,' + (-d * 0.35) + 'em,0)';
    /* wie die Tage: das alte Wort wird in Laufrichtung weggewischt, das neue in derselben Richtung aufgedeckt */
    const vw = !useX, outT = useX ? 'translate3d(' + (-d * 6) + 'px,0,0)' : 'translate3d(0,' + (-d * 0.12) + 'em,0)', inT = useX ? 'translate3d(' + (d * 10) + 'px,0,0)' : 'translate3d(0,' + (d * 0.16) + 'em,0)';
    wipe(el, false, d, vw, 240);
    el.animate([{ transform: 'none' }, { transform: outT }], { duration: 240, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }).onfinish = () => {
      if (el.dataset.to !== txt) return;
      el.getAnimations().forEach((a) => a.cancel());
      el.textContent = txt; placeStat();
      const w = wipe(el, true, d, vw, 680);
      el.animate([{ transform: inT, filter: 'blur(1.5px)' }, { transform: 'none', filter: 'blur(0)' }], { duration: 680, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'backwards' });
      w.onfinish = () => { w.cancel(); unmask(el); };
    };
  }
  placeStat();
}
function wipe(el, show, dir, vert, dur) { // Maske mit weicher Kante wandert über das Wort
  const ang = vert ? (dir > 0 ? 180 : 0) : (dir > 0 ? 90 : 270);
  const img = 'linear-gradient(' + ang + 'deg, ' + (show ? '#000 40%, transparent 60%' : 'transparent 40%, #000 60%') + ')';
  for (const pre of ['webkitMask', 'mask']) { el.style[pre + 'Image'] = img; el.style[pre + 'Size'] = vert ? '100% 250%' : '250% 100%'; el.style[pre + 'Repeat'] = 'no-repeat'; }
  const a = dir > 0 ? '100%' : '0%', b = dir > 0 ? '0%' : '100%', P = (v) => vert ? '0% ' + v : v + ' 0%';
  return el.animate([{ webkitMaskPosition: P(a), maskPosition: P(a) }, { webkitMaskPosition: P(b), maskPosition: P(b) }], { duration: dur, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'both' });
}
function unmask(el) { for (const pre of ['webkitMask', 'mask']) { el.style[pre + 'Image'] = ''; el.style[pre + 'Size'] = ''; el.style[pre + 'Repeat'] = ''; } }
function placeStat() { // „x/y Tage“ steht jetzt fest unter dem Kalender (wie am iPhone)
  return;
  const st = $('scStat'), bar = $('stickyTitle'), h = $('homeTitle');
  const t = h.querySelector('.t'), y = h.querySelector('.y'); if (!t || !y) return;
  const ar = document.querySelector('.scarrows'), br = bar.getBoundingClientRect();
  const btns = ar.querySelectorAll('button'), r1 = btns[0].getBoundingClientRect(), r2 = btns[btns.length - 1].getBoundingClientRect();
  const center = (r1.left + r2.right) / 2, w = st.offsetWidth, lw = st.querySelector('.lbl').offsetWidth, contentRight = br.right - 24;
  const titleRight = br.left + 24 + t.offsetWidth + 12 + y.offsetWidth;
  if (titleRight + 24 <= center + lw / 2 - w) { // passt: „Tage“ mittig über den Pfeilen, die Zahl links davon
    if (st.parentElement !== bar) bar.appendChild(st);
    st.style.marginLeft = 'auto'; st.style.marginRight = Math.round(contentRight - (center + lw / 2)) + 'px';
  } else if (st.parentElement === bar) { st.style.marginLeft = st.style.marginRight = ''; ar.insertBefore(st, ar.firstChild); }
}
function updateSideSel() {
  const k = S.cur && S.stack[S.stack.length - 1] === 'entry' ? S.cur.date : null;
  document.querySelectorAll('#sctrack .cell, #sctrack .wday').forEach((c) => c.classList.toggle('is-sel', c.dataset.key === k));
}
function sideTitleOf(st) { if (st.mode === 'week') { const r = weekRef(st.w); return MONTHS[r.getMonth()] + '|' + r.getFullYear(); } return (st.mode === 'month' ? MONTHS[st.m] : 'Das Jahr') + '|' + st.y; }
function shiftSide(dir, ms) {
  if (trackBusy) return; S.listTitle = null;
  const p = sidePeriod(dir); sideMove(dir, { y: p.y, m: p.m, w: p.w || 0 }, ms);
}
function sidePanelHTML(st) { return st.mode === 'week' ? weekPanelHTML(st.w) : '<div class="calpanel">' + (st.mode === 'month' ? monthGridHTML(st.y, st.m, true) : yearLayerHTML(st.y, 'd', 'sidepick', sideLW())) + '</div>'; }
/* Wechsel des Zeitraums in der Seitenleiste – drei Varianten (Einstellungen › Übergänge):
   fade = Überblenden mit kleinem Versatz, slide = Gleiten wie eine Seite, roll = senkrecht rollen wie ein Kapitel */
function sideMove(dir, next, ms, after) {
  if (trackBusy) return;
  const target = Object.assign({}, S.side, next), fx = S.fx, tr = $('sctrack');
  if (!S.dsearch && !S.listTitle) animTitle(sideTitleOf(target), dir);
  if (fx === 'slide' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const nb = tr.children[dir > 0 ? 2 : 0]; if (nb) nb.outerHTML = sidePanelHTML(target); updateSideSel();
    slideTrack(tr, dir, () => { Object.assign(S.side, next); renderSide(); if (after) after(); }, ms || 440);
    return;
  }
  trackBusy = true;
  const vp = tr.parentElement, old = tr.children[1];
  const off = Math.round(new DOMMatrix(getComputedStyle(tr).transform).m41 - trackX(tr)); // falls das Trackpad den Kalender schon verschoben hat
  const o0 = parseFloat(getComputedStyle(old).opacity) || 1, clone = old.cloneNode(true); clone.style.opacity = ''; clone.style.transition = '';
  const ghost = document.createElement('div'); ghost.className = 'morphghost'; ghost.setAttribute('aria-hidden', 'true'); ghost.appendChild(clone); vp.appendChild(ghost);
  Object.assign(S.side, next); renderSide();
  const np = tr.children[1], E = 'cubic-bezier(0.32, 0.72, 0, 1)';
  if (!off) { // Woche/Monat/Jahr: Kopfzeilen und Monatsnamen bleiben stehen, nur die Tage wechseln – als Welle in Laufrichtung
    const dx = parseFloat(old.style.getPropertyValue('--dx')) || 0, dop = old.style.getPropertyValue('--do') ? parseFloat(old.style.getPropertyValue('--do')) : 1;
    clone.classList.remove('dragging'); clone.style.removeProperty('--dx'); clone.style.removeProperty('--do');
    clone.querySelectorAll('.wd, .wdhead, .ylab, .yhead, .yl, .ymk').forEach((x) => { x.style.visibility = 'hidden'; });
    const year = target.mode === 'year';
    const cells = (p) => {
      if (year) { const pr = p.getBoundingClientRect(), out = []; p.querySelectorAll('.yz').forEach((c) => { const r = c.getBoundingClientRect(); out.push({ dot: c, col: Math.max(0, Math.min(6, (r.left - pr.left) / pr.width * 6.4)), row: Math.max(0, Math.min(2, (r.top - pr.top) / pr.height * 2)) }); }); return out; }
      return [...p.querySelectorAll('.wday, .mgrid > *')].map((c, i) => ({ dot: c.querySelector('.dot'), col: i % 7, row: Math.floor(i / 7) })).filter((c) => c.dot);
    };
    const nc = cells(np), rows = Math.max(1, ...nc.map((c) => c.row + 1)), roll = fx === 'roll';
    const order = (c) => roll ? (dir > 0 ? c.row : rows - 1 - c.row) + c.col * 0.15 : (dir > 0 ? c.col : 6 - c.col) + c.row * 0.35;
    const blur = (v) => year ? 'blur(0)' : 'blur(' + v + 'px)';
    ghost.style.opacity = String(o0);
    for (const c of cells(clone)) {
      const from = 'translate3d(' + dx + 'px,0,0)', tx = roll ? 'translate3d(' + dx + 'px,' + (-dir * 10) + 'px,0)' : 'translate3d(' + (dx - dir * 12) + 'px,0,0)';
      c.dot.animate([{ opacity: dop, transform: from, filter: blur(0) }, { opacity: 0, transform: tx, filter: blur(2) }],
        { duration: 220, delay: order(c) * 14, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'both' });
    }
    for (const c of nc) {
      const tx = roll ? 'translate3d(0,' + (dir * 12) + 'px,0)' : 'translate3d(' + (dir * 16) + 'px,0,0)';
      c.dot.animate([{ opacity: 0, transform: tx, filter: blur(1.5) }, { opacity: 1, transform: 'none', filter: blur(0) }],
        { duration: 600, delay: 80 + order(c) * 28, easing: E, fill: 'backwards' });
    }
  } else if (fx === 'roll') {
    ghost.animate([{ opacity: o0, transform: 'translate3d(' + off + 'px,0,0)' }, { opacity: 0, transform: 'translate3d(' + off + 'px,' + (-dir * 34) + 'px,0)' }], { duration: 180, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
    np.animate([{ opacity: 0, transform: 'translate3d(0,' + (dir * 38) + 'px,0)' }, { opacity: 1, transform: 'none' }], { duration: 540, delay: 150, easing: E, fill: 'backwards' });
  } else {
    ghost.animate([{ opacity: o0, transform: 'translate3d(' + off + 'px,0,0)' }, { opacity: 0, transform: 'translate3d(' + (off - dir * 18) + 'px,0,0)' }], { duration: 260, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'forwards' });
    np.animate([{ opacity: 0, transform: 'translate3d(' + (dir * 22) + 'px,0,0)' }, { opacity: 1, transform: 'none' }], { duration: 620, delay: 90, easing: E, fill: 'backwards' });
  }
  if (after) setTimeout(after, 260);
  setTimeout(() => { ghost.remove(); trackBusy = false; }, 720);
}
function sideToday() {
  S.listTitle = null;
  const t = today(); const { mode, y, m, w } = S.side;
  const diff = mode === 'week' ? -w : mode === 'month' ? (t.getFullYear() - y) * 12 + t.getMonth() - m : t.getFullYear() - y; if (!diff) return;
  // Heute: der heutige Zeitraum liegt schon im Nachbarfeld, gleitet herein, dann pulsiert der heutige Tag kurz
  // „Heute“ verabschiedet sich sofort beim Klick (gleitet in Richtung heute, verschwimmt, die Kapsel schließt sich) – nicht erst nach dem Blättern
  S.toToday = true; clearTimeout(sideToday.t); sideToday.t = setTimeout(() => { S.toToday = false; }, 4000);
  $('scTodayBtn').classList.remove('on'); $('scTodayBtn').tabIndex = -1;
  flipTo({ y: t.getFullYear(), m: t.getMonth(), w: 0 }, () => {
    S.toToday = false; markToday();
    const k = keyOf(t), list = S.byDate.get(k); // heute geschrieben: den neuesten Eintrag von heute öffnen – der Ring landet auf heute
    if (list && list.length && !(S.cur && S.cur.date === k && S.stack[S.stack.length - 1] === 'entry')) deskFade(() => openDay(k), list[0].id);
  });
}
/* Daumenkino: zu „Heute“ werden die Zeiträume dazwischen kurz angeblättert – erst langsam, dann schnell,
   die letzte Seite landet mit dem normalen Übergang. Höchstens 14 Zwischenbilder. */
function stepPeriod(st, k) {
  if (st.mode === 'week') return { w: st.w + k };
  if (st.mode === 'month') { const t = st.y * 12 + st.m + k; return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 }; }
  return { y: st.y + k };
}
function flipTo(next, after) {
  const cur = S.side, n = cur.mode === 'week' ? next.w - cur.w : cur.mode === 'month' ? (next.y * 12 + next.m) - (cur.y * 12 + cur.m) : next.y - cur.y;
  const dir = Math.sign(n), steps = Math.abs(n);
  if (!dir || trackBusy) return;
  if (steps < 3 || matchMedia('(prefers-reduced-motion: reduce)').matches) { sideJump(next, true, after); return; }
  S.listTitle = null; trackBusy = true; S.flipping = true;
  const st0 = Object.assign({}, cur), inner = steps - 1, count = Math.min(inner, 14), ks = [];
  for (let i = 1; i <= count; i++) { const k = Math.round(i * inner / count); if (!ks.includes(k)) ks.push(k); }
  const tr = $('sctrack'); let i = 0;
  (function frame() {
    if (i >= ks.length) { S.flipping = false; trackBusy = false; sideMove(dir, next, 460, after); return; }
    const gap = [110, 80, 62][i] || 50, speed = Math.min(1, (110 - gap) / 60); // wie ein Daumenkino: kurz anlaufen, dann gleichmäßig – gebremst wird nur bei der Landung
    S.titleDir = dir; Object.assign(S.side, stepPeriod(st0, dir * ks[i])); renderSide(); updateSideSel();
    const p = tr.children[1], targets = S.side.mode === 'year' ? [p] : [...p.querySelectorAll('.dot')];
    const kf = [{ opacity: 0.25, transform: 'translate3d(' + (dir * 9) + 'px,0,0)', filter: 'blur(' + (0.4 + 1.6 * speed).toFixed(2) + 'px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }];
    targets.forEach((el) => el.animate(kf, { duration: Math.round(gap * 1.6), easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }));
    i++; setTimeout(frame, gap);
  })();
}
function markToday() { // „Heute“: erst wenn die Welle den heutigen Tag abgesetzt hat, läuft ein feiner Ring einmal sanft nach außen (vorher sprang der Tag)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const panel = $('sctrack').children[1]; if (!panel) return;
  const dot = panel.querySelector('[data-key="' + keyOf(today()) + '"] .dot') || panel.querySelector('.yz.t i, .yz.n i');
  if (!dot) return;
  Promise.all(dot.getAnimations().map((a) => a.finished.catch(() => {}))).then(() => {
    if (!dot.isConnected) return;
    const ring = document.createElement('span'); ring.className = 'todaypulse'; if (dot.matches('.yd, .yz i')) { ring.style.position = 'absolute'; dot.style.position = 'relative'; }
    dot.appendChild(ring);
    ring.animate([{ transform: 'scale(1)', opacity: 0.6 }, { transform: 'scale(2)', opacity: 0 }], { duration: 1100, delay: 120, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'both' }).onfinish = () => ring.remove();
  });
}
function setSideMode(mode, y, m) {
  const needOpen = S.calIsOpen && !S.calIsOpen(); // teilweise oder ganz eingefahren: nach dem Wechsel ganz ausfahren
  if (mode === S.side.mode && y == null) { if (needOpen) { S.listTitle = null; S.calOpen(); } return; }
  if (mode !== 'week') S.listTitle = null;
  const from = S.side.mode, zoomOut = SIDE_ORDER[mode] > SIDE_ORDER[from], t = today();
  if ((from === 'month' && mode === 'year') || (from === 'year' && mode === 'month')) { // Monat ⇄ Jahr: der Monat zoomt an seinen Platz im Jahr (und zurück)
    sideZoom(mode, y, m); if (needOpen) { S.listTitle = null; S.calOpen(); } softIn($('scStat')); return;
  }
  morphSwap($('sctrack'), zoomOut, () => {
    if (from === 'week' && y == null) { const r = weekRef(S.side.w); S.side.y = r.getFullYear(); S.side.m = r.getMonth(); }
    const topRow = mode === 'week' && $('list').scrollTop > 12 ? topRowOfList() : null;
    if (topRow) S.side.w = weekOf(parseKey(topRow.dataset.date));
    else if (mode === 'week') { // Woche: die aktuelle, wenn sie im gezeigten Zeitraum liegt, sonst die erste
      const inView = from === 'month' ? (S.side.y === t.getFullYear() && S.side.m === t.getMonth()) : S.side.y === t.getFullYear();
      S.side.w = inView ? 0 : weekOf(new Date(S.side.y, from === 'month' ? S.side.m : 0, 1));
    }
    S.side.mode = mode; if (y != null) { S.side.y = y; S.side.m = m; }
    renderSide();
  });
  if (needOpen) { S.listTitle = null; S.calOpen(); }
  softIn($('scStat'));
}
/* Mac: Monat ⇄ Jahr (PLAN 4b). Zwei Flächen: das Monatsfeld (.zmo) und die Jahresebene (.ylay). Vorwärts bleibt die alte Fläche als Geist stehen, die neue steht darunter bzw.
   darüber bereit; ein Umschalten von Klassen (.zhide / .pre) lässt den Monat an seinen Platz im Jahr wandern und die anderen Monate von ihm aus nach außen kommen.
   Tippt man mitten im Zoom noch einmal, kehren die Übergänge von der aktuellen Stelle um (Regel 2). Erst am Ende wird neu aufgebaut. */
function sideZoomApply(z) { z.surfM.classList.toggle('zhide', z.toYear); z.surfY.classList.toggle('pre', !z.toYear); }
function yearFillNb() { // beim Zoomen ins Jahr bleiben die Nachbarjahre zunächst leer (schneller erster Frame) und werden danach gefüllt
  if (S.side.mode !== 'year') return; const tr = $('sctrack');
  [-1, 1].forEach((o, i) => { const el = tr.children[i * 2]; if (el && !el.firstChild) el.innerHTML = yearLayerHTML(sidePeriod(o).y, 'd', 'sidepick', sideLW()); });
}
function sideZoomEnd() {
  const z = S.sz; if (!z) return; clearTimeout(z.t); S.sz = null; setTimeout(yearFillNb, 0);
  const final = z.toYear ? 'year' : 'month';
  if (z.built !== final) { S.side.mode = final; renderSide(); }
  z.ghost.remove(); trackBusy = false;
}
function sideZoom(mode, y, m) {
  const tr = $('sctrack'), vp = tr.parentElement, toYear = mode === 'year', ov = S.yl === 'overview', z = S.sz;
  if (z) {
    if (z.toYear !== toYear && (m == null || m === z.m) && (y == null || y === S.side.y)) { // mitten im Zoom noch einmal getippt: von hier aus zurück
      z.toYear = toYear; S.side.mode = mode; sideZoomApply(z); renderSide(true);
      clearTimeout(z.t); z.t = setTimeout(sideZoomEnd, 1250); return;
    }
    sideZoomEnd();
  }
  if (y != null) { S.side.y = y; S.side.m = m; }
  const old = tr.children[1], ghost = document.createElement('div'); ghost.className = 'morphghost'; ghost.setAttribute('aria-hidden', 'true'); ghost.appendChild(old.cloneNode(true)); vp.appendChild(ghost);
  trackBusy = true; S.side.mode = mode; S.lazyNb = toYear; renderSide(); S.lazyNb = false;
  const np = tr.children[1], gp = ghost.firstElementChild;
  const surfM = toYear ? gp : np, surfY = toYear ? np.querySelector('.ylay') : gp.querySelector('.ylay');
  const g = yearGeo('d', sideLW());
  const zz = { ghost, surfM, surfY, toYear: !toYear, m: S.side.m, built: mode, t: 0 };
  zInit([surfY, surfM], () => { yearPrep(surfY, S.side.m); zoomVars(surfM, S.side.m, g, ov); surfM.classList.add('zmo'); sideZoomApply(zz); }); // Ausgangslage ohne Übergang
  zz.toYear = toYear; sideZoomApply(zz); zz.t = setTimeout(sideZoomEnd, 1250); S.sz = zz;
}
/* Wechsel Monat ⇄ Jahr (Kalender-Ansicht): alter Inhalt zoomt weg und blendet aus, neuer zoomt aus der Gegenrichtung herein */
function morphSwap(track, zoomOut, render) {
  const vp = track.parentElement, old = track.children[1];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || !old || !vp.animate;
  let ghost = null;
  if (!still) { ghost = document.createElement('div'); ghost.className = 'morphghost'; ghost.setAttribute('aria-hidden', 'true'); ghost.appendChild(old.cloneNode(true)); vp.appendChild(ghost); }
  render();
  if (still) return;
  const ease = 'cubic-bezier(0.32, 0.72, 0, 1)';
  ghost.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(' + (zoomOut ? 0.92 : 1.08) + ')' }], { duration: 260, easing: ease, fill: 'forwards' }).onfinish = () => ghost.remove();
  const np = track.children[1];
  if (np) np.animate([{ opacity: 0, transform: 'scale(' + (zoomOut ? 1.06 : 0.94) + ')' }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, delay: 60, easing: ease, fill: 'backwards' });
}
function selectCalDay(k) {
  S.cal.sel = k;
  document.querySelectorAll('#caltrack .cell').forEach((c) => c.classList.toggle('is-sel', c.dataset.key === k));
  renderOnThisDay(); const o = $('otd'); o.classList.remove('swap'); void o.offsetWidth; o.classList.add('swap');
}
function shiftCal(dir, ms) { const hadSel = !!S.cal.sel; S.cal.sel = null; if (hadSel) { const o = $('otd'); o.classList.remove('swap'); void o.offsetWidth; o.classList.add('swap'); } fadeWith([$('calStats'), $('calTitle')], 0); slideTrack($('caltrack'), dir, () => { const p = periodOf(dir); S.cal.y = p.y; S.cal.m = p.m; renderCalendar(); softIn($('calStats'), $('calTitle')); }, ms); }
