// Startseite: Liste (renderHome), Woche, Monat
'use strict';
/* ---------- rendering: home ---------- */
function titleHTML(t, y) { return '<span class="t">' + esc(t) + '</span><span class="y">' + esc(y) + '</span>'; }
const STOP = new Set('aber alle allem allen aller alles also auch dass dann dazu dein deine denn dich dies diese diesem diesen dieser dieses doch dort durch eine einem einen einer eines einmal euch fuer für gegen habe haben hatte hatten hier ihre immer jetzt kann kein keine mehr mein meine mich mir nach nicht noch nur oder ohne schon sein seine sich sind sehr über unter viel vom von vor war waren was weil wenn werden wie wieder wir wird wurde wurden zum zur zwischen heute gestern morgen tag tage mal'.split(' '));
function chipWords() { // die häufigsten Wörter aus den Titeln (je Titel einmal gezählt), ohne Füllwörter und Kurzes
  const cnt = new Map();
  for (const e of S.entries) {
    const seen = new Set();
    for (const w of (e.title || '').match(/[\p{L}][\p{L}-]*/gu) || []) {
      const k = w.toLowerCase(); if (k.length < 4 || STOP.has(k) || seen.has(k)) continue; seen.add(k);
      const c = cnt.get(k) || { n: 0, f: new Map() }; c.n++; c.f.set(w, (c.f.get(w) || 0) + 1); cnt.set(k, c);
    }
  }
  return [...cnt.values()].filter((c) => c.n >= 2).sort((a, b) => b.n - a.n || 0).slice(0, 6).map((c) => [...c.f.entries()].sort((a, b) => b[1] - a[1])[0][0]);
}
function chipsHTML() {
  const w = chipWords(); if (!w.length) return '';
  return '<div class="qchips" aria-label="Vorschläge">' + w.map((x, i) => '<button class="qchip" data-act="qchip" data-w="' + esc(x) + '" style="--i:' + i + '">' + esc(x) + '</button>').join('') + '</div>';
}
function renderHome() {
  const t = today();
  const q = S.dsearch ? $('dq').value.trim().toLowerCase() : '';
  const allHits = q ? S.entries.filter((e) => ((e.title || '') + '\n' + (e.text || '')).toLowerCase().includes(q)) : null;
  const prevDays = S.hitDays, prevList = S.hitList; initLit();
  S.hitList = allHits; S.hitDays = allHits ? new Set(allHits.map((e) => e.date)) : null; // Kalender zeigt dann nur die Treffer-Tage
  const sig = allHits ? [...S.hitDays].sort().join(',') : ''; S.hitSig = sig ? sig.length + ':' + [...sig].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) : '';
  $('home').classList.toggle('sq', !!q);
  const keep = S.qKeep && S.hitSigLast === S.hitSig && !!q === !!prevList && !S.homeDirty; S.qKeep = false; S.hitSigLast = S.hitSig;
  if (keep) { if (isDesktop()) renderSide(true); else hmStats(); } // gleiche Treffer-Tage: Kalender bleibt stehen (kein Flackern), nur das Zählwerk zieht nach
  else { S.litPrev = prevDays && allHits ? prevDays : null; renderWeek(); renderSide(); setTimeout(() => { S.litPrev = null; }, 0); }
  // Liste nur neu aufbauen, wenn sich etwas geändert hat (spart Ruckler beim Zurückgehen)
  const L = $('list'); let listHTML;
  if (q) { // Suche am Mac: Treffer erscheinen direkt in der Seitenleiste
    const hits = allHits.slice(0, 300);
    S.deskHits = hits; let pv = null, html = hits.length ? '<div class="hitcount kicker">' + allHits.length + ' Treffer insgesamt</div>' : '<p class="qempty">Dazu steht hier noch nichts.</p>', last = '';
    for (const e of hits) { const mk = e.date.slice(0, 7); if (mk !== last) { const d = parseKey(e.date); html += (last ? '</div>' : '') + '<div class="mgroup"><div class="sep kicker" data-month="' + mk + '">' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '</div>'; last = mk; pv = null; } html += rowHTML(e, pv); pv = e; }
    if (last) html += '</div>';
    listHTML = html;
  } else if (!S.entries.length) {
    listHTML = '<p class="emptylist">Noch leer – schreib heute den ersten Eintrag oder hol dir deine alten aus Day One.</p>';
  } else {
    let html = '', lastMonth = '', pv = null;
    const curMonth = t.getFullYear() + '-' + pad(t.getMonth() + 1);
    for (let i = 0; i < S.entries.length; i++) {
      const e = S.entries[i], mk = e.date.slice(0, 7);
      if (mk !== lastMonth) {
        html += (lastMonth ? '</div>' : '') + '<div class="mgroup">';
        if (mk !== curMonth || lastMonth) { const d = parseKey(e.date); html += '<div class="sep kicker" data-month="' + mk + '">' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '</div>'; }
        lastMonth = mk; pv = null;
      }
      html += rowHTML(e, pv); pv = e; // gleicher Tag: weitere Karten zeigen nur die Uhrzeit und rücken näher heran
    }
    listHTML = html + (lastMonth ? '</div>' : '');
  }
  if (S.dsearch && !q && !isDesktop() && S.entries.length) listHTML = chipsHTML() + '<p class="qhint">Titel und Text werden durchsucht.</p>' + listHTML; // iPhone: Vorschläge über der Liste
  if (listHTML !== S.listHTML) { L.innerHTML = listHTML; S.listHTML = listHTML; }
  const tk = keyOf(t);
  $('fabLabel').textContent = S.byDate.has(tk) ? 'Heute weiterschreiben' : 'Heute schreiben';
  $('homePlus').setAttribute('aria-label', $('fabLabel').textContent);
  markCurrentRow();
  S.homeDirty = false;
  if (S.updateHomeTitle) S.updateHomeTitle();
}
function weekStart(off) { const t = today(); const d = new Date(t); d.setDate(t.getDate() - mondayIdx(t) + off * 7); return d; }
function weekPanelHTML(off) {
  const mon = weekStart(off); let h = '<div class="weekpanel">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon); d.setDate(mon.getDate() + i); const st = dayState(d);
    h += '<button class="wday ' + st + (keyOf(d) === keyOf(today()) ? ' is-now' + (isDesktop() ? '' : ' is-sel') : '') + '" data-act="day" data-key="' + keyOf(d) + '" aria-label="' + WDLONG[d.getDay()] + ', ' + d.getDate() + '. ' + MONTHS[d.getMonth()] +
      '"><span class="wd">' + WD[i] + '</span><span class="dot">' + d.getDate() + '</span></button>';
  }
  return h + '</div>';
}
function renderWeek() {
  if (!isDesktop()) { renderHomeMonth(); return; }
  const off = S.weekOff, t = today(), mon = weekStart(off), sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const ref = off === 0 ? t : new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 3); // Donnerstag bestimmt den Monat
  S.weekTitle = MONTHS[ref.getMonth()] + '|' + ref.getFullYear();
  if (S.updateHomeTitle) S.updateHomeTitle(); else $('homeTitle').innerHTML = titleHTML(MONTHS[ref.getMonth()], ref.getFullYear());
  $('weektrack').innerHTML = weekPanelHTML(off - 1) + weekPanelHTML(off) + weekPanelHTML(off + 1);
  resetTrack($('weektrack'));
  const end = sun < t ? sun : t; const elapsed = mon > t ? 0 : Math.round((end - mon) / 864e5) + 1;
  setCount($('weekCount'), elapsed ? countRange(mon, end) : 0, elapsed);
  $('weekStat').classList.toggle('is-empty', !elapsed); setAway($('weekAway'), awayText('week', off));
  setPill($('wkTodayBtn'), off !== 0 && !S.toTodayWk, off > 0);
}
function setPill(b, on, future) { // Heute-Kapsel (iPhone wie Mac): öffnet sich nur außerhalb des aktuellen Zeitraums, der Pfeil Richtung heute leuchtet
  b.classList.toggle('on', on); b.tabIndex = on ? 0 : -1;
  if (on) { b.classList.toggle('dir-l', future); b.classList.toggle('dir-r', !future); }
}
/* iPhone: „Heute“ blättert wie am Mac als Daumenkino durch die Zeiträume dazwischen, die letzte Seite landet normal,
   dann läuft ein feiner Ring um den heutigen Tag. steps = Abstand, frame(k) zeigt den Zeitraum k Schritte weiter, land() gleitet zur letzten Seite. */
function flipTrack(tr, steps, dir, frame, land) {
  if (trackBusy) return;
  const inner = steps - 1;
  if (inner < 1 || matchMedia('(prefers-reduced-motion: reduce)').matches) { if (inner > 0) frame(inner); land(); return; }
  trackBusy = true; const count = Math.min(inner, 14), ks = []; let i = 0;
  for (let j = 1; j <= count; j++) { const k = Math.round(j * inner / count); if (!ks.includes(k)) ks.push(k); }
  (function next() {
    if (i >= ks.length) { trackBusy = false; land(); return; }
    const gap = [110, 80, 62][i] || 50, speed = Math.min(1, (110 - gap) / 60);
    frame(ks[i]);
    const p = tr.children[1], targets = p.querySelector('.yd') ? [p] : [...p.querySelectorAll('.dot')];
    const kf = [{ opacity: 0.25, transform: 'translate3d(' + (dir * 9) + 'px,0,0)', filter: 'blur(' + (0.4 + 1.6 * speed).toFixed(2) + 'px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }];
    targets.forEach((el) => el.animate(kf, { duration: Math.round(gap * 1.6), easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }));
    i++; setTimeout(next, gap);
  })();
}
function pulseToday(tr) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const panel = tr.children[1]; if (!panel) return;
  const dot = panel.querySelector('[data-key="' + keyOf(today()) + '"] .dot') || panel.querySelector('.yd.t, .yd.n'); if (!dot) return;
  Promise.all(dot.getAnimations().map((a) => a.finished.catch(() => {}))).then(() => { // erst wenn die Welle den Tag abgesetzt hat
    if (!dot.isConnected) return;
    const ring = document.createElement('span'); ring.className = 'todaypulse'; if (dot.matches('.yd, .yz i')) { ring.style.position = 'absolute'; dot.style.position = 'relative'; }
    dot.appendChild(ring);
    ring.animate([{ transform: 'scale(1)', opacity: 0.6 }, { transform: 'scale(2)', opacity: 0 }], { duration: 1100, delay: 120, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'both' }).onfinish = () => ring.remove();
  });
}
function weekToToday() { // iPhone: Heute – eingeklappt durch die Wochen, aufgeklappt durch die Monate (Daumenkino), danach läuft der Ring einmal um heute
  if (trackBusy || isDesktop()) return;
  const t = today(), tk = keyOf(t), col = hmCollapsed(), st = S.hm, tr = $('weektrack');
  const done = () => { S.toTodayWk = false; hmPill(); pulseToday(tr); };
  if (col) {
    const cur = st.sel ? parseKey(st.sel) : hmGridStart(st.y, st.m), n = Math.round((hmMonday(t) - hmMonday(cur)) / (7 * 864e5)), dir = Math.sign(n);
    if (!dir) { hmSelect(tk); hmPill(); setTimeout(() => pulseToday(tr), 200); return; }
    S.toTodayWk = true; hmPill();
    flipTrack(tr, Math.abs(n), dir, (k) => { S.hm = hmStepWeeks(cur, dir * k); renderHomeMonth(); },
      () => { S.hm = hmStepWeeks(t, -dir); renderHomeMonth(); hmMove(dir, done, true); });
    return;
  }
  const n = (t.getFullYear() * 12 + t.getMonth()) - (st.y * 12 + st.m), dir = Math.sign(n);
  if (!dir) { hmSelect(tk); setTimeout(() => pulseToday(tr), 250); return; }
  const at = (k) => { const v = st.y * 12 + st.m + k, y = Math.floor(v / 12), m = ((v % 12) + 12) % 12; return { y, m, sel: y === t.getFullYear() && m === t.getMonth() ? tk : null }; };
  S.toTodayWk = true; hmPill();
  flipTrack(tr, Math.abs(n), dir, (k) => { S.hm = at(dir * k); renderHomeMonth(); },
    () => { S.hm = at(n - dir); renderHomeMonth(); hmMove(dir, done, false); });
}
function calToday() {
  const t = today(), { mode, y, m } = S.cal; if (trackBusy) return;
  const diff = mode === 'month' ? (t.getFullYear() - y) * 12 + t.getMonth() - m : t.getFullYear() - y; if (!diff) return;
  const dir = Math.sign(diff), y0 = y, m0 = m; S.cal.sel = null; S.toTodayCal = true; setPill($('calTodayBtn'), false);
  flipTrack($('caltrack'), Math.abs(diff), dir, (k) => { if (mode === 'month') { const v = y0 * 12 + m0 + dir * k; S.cal.y = Math.floor(v / 12); S.cal.m = v % 12; } else S.cal.y = y0 + dir * k; renderCalendar(); },
    () => slideTrack($('caltrack'), dir, () => { S.cal.y = t.getFullYear(); S.cal.m = mode === 'month' ? t.getMonth() : S.cal.m; S.toTodayCal = false; renderCalendar(); pulseToday($('caltrack')); }, 400));
}
function softIn(...els) { for (const el of els) { if (el.classList.contains('is-empty')) { el.style.transition = ''; el.style.opacity = ''; continue; } el.style.transition = ''; el.style.opacity = ''; el.classList.remove('soft-in'); void el.offsetWidth; el.classList.add('soft-in'); } }
function fadeWith(els, f) { for (const el of els) { el.style.transition = 'none'; el.style.opacity = String(el.classList.contains('is-empty') ? 0 : f); } }
const trackX = (tr, extra) => Math.round(-tr.parentElement.clientWidth + (extra || 0)); // ganze Pixel = scharfe Schrift
function resetTrack(tr) { tr.style.transition = 'none'; tr.style.transform = 'translate3d(' + trackX(tr) + 'px,0,0)'; }
let trackBusy = false;
function slideTrack(tr, dir, done, ms) { // dir +1 = weiter (nach links schieben)
  if (trackBusy) return; trackBusy = true;
  const d = Math.round(ms || 340);
  tr.style.transition = 'transform ' + d + 'ms cubic-bezier(0.2, 0.8, 0.2, 1)';
  tr.style.transform = 'translate3d(' + (dir > 0 ? 2 * trackX(tr) : 0) + 'px,0,0)';
  setTimeout(() => { trackBusy = false; done(); }, d + 10);
}
function shiftWeek(dir, ms) { if (!isDesktop()) { weekMove(dir); return; } slideTrack($('weektrack'), dir, () => { S.weekOff += dir; renderWeek(); }, ms); }
/* iPhone-Startseite: Monat (aufgeklappt) oder Woche (eingeklappt) wechselt wie am Mac (sideMove): Wochentage bleiben stehen,
   der alte Inhalt gleitet als Geist 12px weg (0,22s, blur 2px, gestaffelt 14ms), die neuen Tage kommen gleichzeitig als Welle
   (16px, 0,6s --sheet, 80 + Reihenfolge × 28ms) – nie eine Lücke. Hat der Finger die Tage schon verschoben (--dx/--do), startet die Welle dort. */
const HM_CH = 240; // Weg beim Einklappen: sechs Zeilen à 48px werden zu einer
const hmMonday = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - mondayIdx(x)); return x; };
const hmGridStart = (y, m) => hmMonday(new Date(y, m, 1));
const hmRows = (y, m) => Math.ceil((mondayIdx(new Date(y, m, 1)) + daysIn(y, m)) / 7);
function hmRowOf(y, m, key) { if (!key) return 0; const r = Math.floor(Math.round((parseKey(key) - hmGridStart(y, m)) / 864e5) / 7); return r >= 0 && r < hmRows(y, m) ? r : 0; }
function hmStepWeeks(base, n) { const b = new Date(base); b.setDate(b.getDate() + 7 * n); const th = hmMonday(b); th.setDate(th.getDate() + 3); return { y: th.getFullYear(), m: th.getMonth(), sel: keyOf(b) }; } // Donnerstag bestimmt den Monat
function hmNext(dir, col, st) {
  st = st || S.hm;
  if (col) return hmStepWeeks(st.sel ? parseKey(st.sel) : hmGridStart(st.y, st.m), dir);
  let y = st.y, m = st.m + dir; if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
  const t = today(); return { y, m, sel: y === t.getFullYear() && m === t.getMonth() ? keyOf(t) : null };
}
const hmCollapsed = () => (S.hp || 0) > 0.5;
function hmAway(col) { // „Heute“-Kapsel: nur wenn man woanders ist
  const st = S.hm, t = today(); if (st.y !== t.getFullYear() || st.m !== t.getMonth()) return true;
  return !!(col && st.sel && hmRowOf(st.y, st.m, st.sel) !== hmRowOf(st.y, st.m, keyOf(t)));
}
function hmPill() {
  const col = hmCollapsed(), st = S.hm, t = today();
  const fut = col && st.sel ? parseKey(st.sel) > t : (st.y * 12 + st.m) > (t.getFullYear() * 12 + t.getMonth());
  const away = hmAway(col) && !S.toTodayWk; setPill($('wkTodayBtn'), away, fut);
  const mi = $('wkMini'), on = away && $('weekwrap').classList.contains('pinned'); mi.classList.toggle('on', on); mi.tabIndex = on ? 0 : -1; mi.classList.toggle('dir-r', !fut);
}
function monthPanelHTML(st) {
  const g0 = hmGridStart(st.y, st.m), rows = hmRows(st.y, st.m), sr = hmRowOf(st.y, st.m, st.sel), tk = keyOf(today());
  let h = '<div class="mpanel">';
  for (let i = 0; i < rows * 7; i++) {
    const d = new Date(g0); d.setDate(g0.getDate() + i); const k = keyOf(d), r = Math.floor(i / 7);
    h += '<button class="mday ' + dayState(d) + (d.getMonth() !== st.m ? ' out' : '') + (r === sr ? ' srow' : '') + (k === tk ? ' is-now' : '') + (k === st.sel ? ' is-sel' : '') +
      '" style="--r:' + r + '" data-act="day" data-key="' + k + '" aria-label="' + WDLONG[d.getDay()] + ', ' + d.getDate() + '. ' + MONTHS[d.getMonth()] +
      '"><span class="dot">' + d.getDate() + '</span></button>';
  }
  return h + '</div>';
}
function renderHomeMonth() { // Monat als Startseite: drei Felder (vorher · jetzt · nachher), eingeklappt sind es Wochen
  const hm = S.hm, col = hmCollapsed();
  hmStats();
  if (S.updateHomeTitle) S.updateHomeTitle(); else $('homeTitle').innerHTML = titleHTML(MONTHS[hm.m], hm.y);
  $('weektrack').innerHTML = monthPanelHTML(hmNext(-1, col)) + monthPanelHTML(hm) + monthPanelHTML(hmNext(1, col));
  resetTrack($('weektrack'));
  const hch = (hmRows(hm.y, hm.m) - 1) * 48;
  if (S.hch !== hch) { // Höhe passt sich den Zeilen an: aufgeklappt gleitet sie (--sheet), eingeklappt bleibt die Liste durch Nachführen der Scrollposition stehen
    const wk = $('weekwrap'), old = S.hch, home = $('home'); S.hch = hch;
    if (old != null && (S.hp || 0) > 0.5) { wk.style.transition = 'none'; wk.style.setProperty('--hch', hch + 'px'); home.scrollTop += hch - old; void wk.offsetHeight; wk.style.transition = ''; }
    else wk.style.setProperty('--hch', hch + 'px');
  }
  if (S.yr) { yrPhoneLayer(); const mp = $('weektrack').children[1], g = yearGeo('p', $('weekwrap').clientWidth || innerWidth); zInit([mp], () => { zoomVars(mp, hm.m, g, S.yl === 'overview'); mp.classList.add('zmo', 'zhide'); }); }
  else yrIdle();
}
function hmSelect(k) { // Auswahl ohne Neuaufbau: der Ring (eigene Ebene) blendet am neuen Tag ein und am alten aus
  S.hm.sel = k;
  const panel = $('weektrack').children[1]; if (!panel) return;
  const sr = hmRowOf(S.hm.y, S.hm.m, k);
  panel.querySelectorAll('.mday').forEach((c) => { c.classList.toggle('is-sel', c.dataset.key === k); c.classList.toggle('srow', +c.style.getPropertyValue('--r') === sr); });
  const col = hmCollapsed();
  for (const [i, o] of [[0, -1], [2, 1]]) if ($('weektrack').children[i]) $('weektrack').children[i].outerHTML = monthPanelHTML(hmNext(o, col));
}
function hmPick(k) { // Tipp auf einen Tag: auswählen; ist er schon gewählt, öffnet das zweite Tippen den Tag
  if (trackBusy) return;
  if (S.hm.sel === k) { deskFade(() => openDay(k), (S.byDate.get(k) || [{}])[0].id || 'draft' + k); return; }
  hmSelect(k); hmPill(); haptic();
}
function weekMove(dir, after) { hmMove(dir, after, hmCollapsed()); }
function hmFollow(k) { // zurück aus einem Eintrag: die Auswahl geht auf dessen Tag – eingeklappt (andere Woche) mit Daumenkino/Welle, aufgeklappt im Monat
  if (isDesktop() || !k || S.hm.sel === k || trackBusy || S.yr || S.stack[S.stack.length - 1] !== 'home') return;
  const d = parseKey(k), st = S.hm, tr = $('weektrack');
  if (hmCollapsed()) {
    const cur = st.sel ? parseKey(st.sel) : hmGridStart(st.y, st.m), n = Math.round((hmMonday(d) - hmMonday(cur)) / (7 * 864e5)), dir = Math.sign(n);
    if (!dir) { hmSelect(k); hmPill(); return; }
    const land = () => { S.hm = hmStepWeeks(d, -dir); renderHomeMonth(); hmMove(dir, null, true); };
    if (Math.abs(n) >= 2) flipTrack(tr, Math.abs(n), dir, (j) => { S.hm = hmStepWeeks(cur, dir * j); renderHomeMonth(); }, land); else land();
    return;
  }
  const n = (d.getFullYear() * 12 + d.getMonth()) - (st.y * 12 + st.m), dir = Math.sign(n);
  if (!dir) { hmSelect(k); hmPill(); return; }
  const at = (j) => { const v = st.y * 12 + st.m + j; return { y: Math.floor(v / 12), m: ((v % 12) + 12) % 12, sel: null }; };
  const land = () => { S.hm = at(n - dir); renderHomeMonth(); hmMove(dir, () => { hmSelect(k); hmPill(); }, false); };
  if (Math.abs(n) >= 2) flipTrack(tr, Math.abs(n), dir, (j) => { S.hm = at(dir * j); renderHomeMonth(); }, land); else land();
}
function hmMove(dir, after, col) {
  const tr = $('weektrack'); if (trackBusy) return;
  const nx = hmNext(dir, col);
  if (S.fx === 'slide' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const p = tr.children[1]; if (p) { p.classList.remove('dragging'); p.style.removeProperty('--dx'); p.style.removeProperty('--do'); }
    slideTrack(tr, dir, () => { S.hm = nx; renderHomeMonth(); if (after) after(); }, 400); return;
  }
  trackBusy = true;
  const vp = tr.parentElement, old = tr.children[1];
  const dx = parseFloat(old.style.getPropertyValue('--dx')) || 0, dop = old.style.getPropertyValue('--do') ? parseFloat(old.style.getPropertyValue('--do')) : 1;
  const clone = old.cloneNode(true); clone.classList.remove('dragging'); clone.style.removeProperty('--dx'); clone.style.removeProperty('--do');
  const ghost = document.createElement('div'); ghost.className = 'morphghost'; ghost.setAttribute('aria-hidden', 'true'); ghost.appendChild(clone); vp.appendChild(ghost);
  if (!S.listLinked) animTitle(MONTHS[nx.m] + '|' + nx.y, dir, S.fx === 'roll');
  S.hm = nx; renderHomeMonth();
  const np = tr.children[1], E = 'cubic-bezier(0.32, 0.72, 0, 1)', roll = S.fx === 'roll';
  const cells = (p) => [...p.querySelectorAll('.mday')].map((c, i) => ({ dot: c.querySelector('.dot'), col: i % 7, row: Math.floor(i / 7), vis: c.classList.contains('srow') })).filter((c) => c.dot && (!col || c.vis));
  const order = (c) => (dir > 0 ? c.col : 6 - c.col) + c.row * 0.35;
  for (const c of cells(clone)) {
    const from = 'translate3d(' + dx + 'px,0,0)', tx = roll ? 'translate3d(' + dx + 'px,' + (-dir * 10) + 'px,0)' : 'translate3d(' + (dx - dir * 12) + 'px,0,0)';
    c.dot.animate([{ opacity: dop, transform: from, filter: 'blur(0)' }, { opacity: 0, transform: tx, filter: 'blur(2px)' }], { duration: 220, delay: order(c) * 14, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'both' });
  }
  for (const c of cells(np)) {
    const tx = roll ? 'translate3d(0,' + (dir * 12) + 'px,0)' : 'translate3d(' + (dir * 16) + 'px,0,0)';
    c.dot.animate([{ opacity: 0, transform: tx, filter: 'blur(1.5px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 600, delay: 80 + order(c) * 28, easing: E, fill: 'backwards' });
  }
  if (after) setTimeout(after, 260);
  setTimeout(() => { ghost.remove(); trackBusy = false; }, 720);
}
const CAM = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></svg>';
function rowHTML(e, prev) { // prev: Eintrag davor – gleicher Tag: nur Uhrzeit
  const d = parseKey(e.date), c = new Date(e.created), np = (e.photos || []).length;
  const day = prev ? (prev.date === e.date ? ' cont' : ' newday') : '';
  const meta = np ? '<span class="mt"><span class="ph">' + CAM + np + '</span></span>' : ''; // Fotos
  const x = cardExcerpt(e);
  return '<button class="row' + day + '" data-act="open" data-id="' + esc(e.id) + '" data-date="' + esc(e.date) + '"><span class="d"><span class="n">' + d.getDate() + '</span><span class="wd">' + WD[mondayIdx(d)] +
    '</span><span class="tm">' + pad(c.getHours()) + ':' + pad(c.getMinutes()) + '</span></span><span class="tx"><span class="ex' + (x.sal ? ' sal' : '') + '">' + esc(x.t) + '</span>' + meta + '</span></button>';
}
function markCurrentRow() {
  document.querySelectorAll('.row.is-current').forEach((r) => r.classList.remove('is-current'));
  if (!isDesktop()) return;
  if (S.cur && S.cur.id) { const r = document.querySelector('#list .row[data-id="' + CSS.escape(S.cur.id) + '"]'); if (r) r.classList.add('is-current'); }
}
function monthGridHTML(y, m, compact) {
  const first = new Date(y, m, 1); const lead = mondayIdx(first); const n = daysIn(y, m);
  const selKey = S.cur ? S.cur.date : null;
  let h = '<div class="wdhead">' + WD.map((w) => '<span>' + w + '</span>').join('') + '</div><div class="mgrid">';
  for (let i = 0; i < lead; i++) h += '<span class="cell"></span>';
  for (let d = 1; d <= n; d++) {
    const dt = new Date(y, m, d); const st = dayState(dt); const k = keyOf(dt);
    const sel = compact && isDesktop() ? (k === selKey && S.stack[S.stack.length - 1] === 'entry' ? ' is-sel' : '') : (!isDesktop() && !S.cal.sel && k === keyOf(today()) ? ' is-sel' : '');
    h += '<button class="cell ' + st + sel + (k === keyOf(today()) ? ' is-now' : '') + '" data-act="day" data-key="' + k + '"' +
      ' aria-label="' + d + '. ' + MONTHS[m] + (st === 'is-entry' ? ', geschrieben' : '') + '"><span class="dot">' + d + '</span></button>';
  }
  return h + '</div>';
}
