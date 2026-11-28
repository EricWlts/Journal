// Kalender und Jahresansicht
'use strict';
/* ---------- rendering: calendar ---------- */
function periodOf(o) { let { y, m } = S.cal; if (S.cal.mode === 'month') { m += o; while (m < 0) { m += 12; y--; } while (m > 11) { m -= 12; y++; } } else y += o; return { y, m }; }
/* ---------- Jahr (PLAN 4b) ---------- */
S.yl = localStorage.getItem('journal.yl') === 'overview' ? 'overview' : 'months'; // Jahr: Monate | Übersicht
function yearGeo(kind, LW) { // Lage aller Tage in der Jahresebene; Koordinaten wie das Feld der Monatsansicht (Ebene und Monatsfeld sind deckungsgleich)
  if (kind === 'p') { // iPhone: 3 Spalten à 120px (bei 342px Breite), Übersicht 36px je Zeile
    const x0 = 24, W = LW - 2 * x0, mw = W * 102 / 342, DW = (W - 34) / 31;
    return { kind, x0, W, cols: 3, sw: mw + (W - 3 * mw) / 2, sh: 116, top: 0, lab: 18, px: mw / 7, py: 14.31, dh: 14.31, H: 472, ow: DW, oxd: (d) => 34 + (d - 1) * DW, ox: 34, rowP: 36,
      oy: (m) => 10 + m * 36, ly: (m) => 12 + m * 36, hh: 30, hy: (m) => 4 + m * 36 };
  }
  const x0 = 16, W = LW - 2 * x0, sw = W / 4, px = (sw - 12) / 7, cw = (W - 68) / 31; // Mac: 4 Spalten × 3 Zeilen in 312px, Übersicht wie bisher in Siebenerblöcken
  return { kind, x0, W, cols: 4, sw, sh: 104, top: 4, lab: 17, px, py: 13.5, dh: 12, H: 312, ow: cw, oxd: (d) => 40 + Math.floor((d - 1) / 7) * (7 * cw + 7) + ((d - 1) % 7) * cw, ox: 40, rowP: 24,
    oy: (m) => 27.5 + m * 24, ly: (m) => 27 + m * 24, hh: 21, hy: (m) => 23 + m * 24 };
}
const yearCache = new Map();
function yearLayerHTML(y, kind, act, LW, id, pre) { // Ergebnis wird je Signatur gemerkt (Mac baut es im Leerlauf vor, siehe yearIdle)
  const key = [y, kind, act, Math.round(LW), id || '', pre ? 1 : 0, S.yl, yearSig(y, LW), keyOf(today())].join('~'), hit = yearCache.get(key); if (hit) return hit;
  const html = yearLayerBuild(y, kind, act, LW, id, pre); if (yearCache.size > 12) yearCache.delete(yearCache.keys().next().value); yearCache.set(key, html); return html;
}
function yearLayerBuild(y, kind, act, LW, id, pre) {
  const g = yearGeo(kind, LW), t = today(), tk = keyOf(t), r = (v) => v.toFixed(2), ov = S.yl === 'overview';
  let h = '<div class="ylay ' + (ov ? 'o' : 'm') + (kind === 'd' ? ' mac' : '') + (pre ? ' pre' : '') + '"' + (id ? ' id="' + id + '"' : '') + ' data-y="' + y + '" data-sig="' + yearSig(y, LW) + '" style="--mw:' + r(g.px) + 'px;--mh:' + r(g.py) + 'px;--ow:' + r(g.ow) + 'px;--oh:' + r(g.dh) + 'px">';
  for (let m = 0; m < 12; m++) {
    const first = mondayIdx(new Date(y, m, 1)), n = daysIn(y, m), cx = g.x0 + (m % g.cols) * g.sw, cy = Math.floor(m / g.cols) * g.sh + g.top;
    let mh = 0; // Treffer-Tage in diesem Monat (Suche): nur Monatsnamen mit Treffern bleiben hell
    for (let d = 1; d <= n; d++) {
      const k = first + d - 1, dd = new Date(y, m, d), st = dayState(dd), c = ({ 'is-entry': 'e', 'is-missed': 'm', 'is-today': 't', 'is-future': 'f' })[st] + (st === 'is-entry' && keyOf(dd) === tk ? ' n' : '');
      if (S.hitDays && st === 'is-entry') mh++;
      h += '<span class="yz ' + c + '" data-m="' + m + '" style="--mx:' + r(cx + (k % 7) * g.px) + 'px;--my:' + r(cy + g.lab + Math.floor(k / 7) * g.py) + 'px;--ox:' + r(g.x0 + g.oxd(d)) + 'px;--oy:' + r(g.oy(m)) + 'px;--sdl:' + (m * 22 + d * 2) + 'ms"><i>' + d + '</i></span>';
    }
    h += '<span class="yl' + (y === t.getFullYear() && m === t.getMonth() ? ' now' : '') + (mh ? ' lit' : '') + '" data-m="' + m + '" style="--lmx:' + r(cx + 3) + 'px;--lmy:' + r(cy) + 'px;--lox:' + r(g.x0) + 'px;--loy:' + r(g.ly(m)) + 'px">' + MSHORT[m] + '</span>';
  }
  for (let m = 0; m < 12; m++) {
    const cx = g.x0 + (m % g.cols) * g.sw, cy = Math.floor(m / g.cols) * g.sh + g.top;
    h += '<button class="yh" data-act="' + act + '" data-m="' + m + '" data-y="' + y + '" aria-label="' + MONTHS[m] + ' ' + y + ' öffnen" style="--hmx:' + r(cx) + 'px;--hmy:' + r(cy) + 'px;--hmw:' + r(g.px * 7) + 'px;--hmh:' + (g.sh - 4) +
      'px;--hox:' + r(g.x0) + 'px;--hoy:' + r(g.hy(m)) + 'px;--how:' + r(g.W) + 'px;--hoh:' + g.hh + 'px"></button>';
  }
  if (kind === 'd') h += '<div class="ymk">' + [1, 8, 15, 22, 29].map((k) => '<span style="left:' + r(g.x0 + g.oxd(k) + g.ow / 2) + 'px">' + k + '</span>').join('') + '</div>';
  return h + '</div>';
}
function yearSig(y, LW) { // ändert sich, sobald Einträge (auch verschobene), Suche, Breite oder der heutige Tag wechseln
  let h = 0; for (const e of S.entries) { const d = e.date; h = (h * 31 + (+d.slice(0, 4) * 372 + +d.slice(5, 7) * 31 + +d.slice(8, 10))) | 0; }
  return [y, S.byDate.size, S.entries.length, h, Math.round(LW), S.hitSig || '', keyOf(today())].join('|');
}
function yearIdle() { // Mac: Jahresebenen (Vorjahr, dieses, Folgejahr) im Leerlauf vorbauen, damit das erste Zoomen nicht blockiert
  clearTimeout(yearIdle.t); if (!isDesktop()) return;
  yearIdle.t = setTimeout(() => { if (S.side.mode === 'year' || S.sz) return; for (const o of [0, -1, 1]) yearLayerHTML(S.side.y + o, 'd', 'sidepick', sideLW()); }, 900);
}
function yearPrep(lay, sel) { // Einflug aus dem gewählten Monat: er bleibt stehen, die anderen kommen von ihm aus nach außen (gestaffelt nach Abstand)
  const g = yearGeo(lay.classList.contains('mac') ? 'd' : 'p', lay.offsetWidth || (lay.classList.contains('mac') ? 456 : 390)), ov = lay.classList.contains('o'), sc = sel % g.cols, sr = Math.floor(sel / g.cols);
  lay.querySelectorAll('.yz, .yl').forEach((el) => {
    const m = +el.dataset.m, c = m % g.cols, r = Math.floor(m / g.cols), dist = ov ? Math.abs(m - sel) : Math.abs(c - sc) + Math.abs(r - sr);
    el.style.setProperty('--edl', (m === sel ? 480 : 140 + dist * (ov ? 36 : 60)) + 'ms');
    if (el.classList.contains('yz')) {
      el.style.setProperty('--ax', ((ov ? 0 : (sc - c) * g.sw) * 0.35).toFixed(1) + 'px'); el.style.setProperty('--ay', ((ov ? (sel - m) * g.rowP : (sr - r) * g.sh) * 0.35).toFixed(1) + 'px');
    }
  });
}
function zoomVars(panel, m, g, ov) { // Monatsfeld (Panel) so verkleinern, dass es genau auf seinem Platz im Jahr liegt – Tage deckungsgleich mit den Jahres-Feldern
  const c0 = panel.querySelector('.mday') || panel.querySelector('.mgrid > *'); if (!c0) return;
  const pr = panel.getBoundingClientRect(), r0 = c0.getBoundingClientRect(), x0 = r0.left - pr.left, y0 = r0.top - pr.top, cw = r0.width, ch = r0.height;
  const rows = Math.max(1, Math.ceil(panel.querySelectorAll('.mday, .mgrid > *').length / 7));
  let sx, sy, tx, ty;
  if (!ov) { sx = g.px / cw; sy = g.py / ch; tx = g.x0 + (m % g.cols) * g.sw - x0 * sx; ty = Math.floor(m / g.cols) * g.sh + g.top + g.lab - y0 * sy; }
  else { sx = (g.W - g.ox) / (7 * cw); sy = g.dh * 2 / (rows * ch); tx = g.x0 + g.ox - x0 * sx; ty = g.oy(m) + g.dh / 2 - rows * ch * sy / 2 - y0 * sy; }
  const st = panel.style; st.setProperty('--zx', tx.toFixed(2) + 'px'); st.setProperty('--zy', ty.toFixed(2) + 'px'); st.setProperty('--zsx', sx.toFixed(4)); st.setProperty('--zsy', sy.toFixed(4));
}
function yearLayout(l) { // Monate | Übersicht: jeder Tag wandert einzeln an seinen neuen Platz (die Lage steckt in den Variablen, CSS animiert)
  if (l === S.yl) return; S.yl = l; try { localStorage.setItem('journal.yl', l); } catch (e) {}
  const ov = l === 'overview';
  document.querySelectorAll('.ylay').forEach((el) => { el.classList.toggle('o', ov); el.classList.toggle('m', !ov); });
  document.querySelectorAll('.yseg').forEach((el) => { el.classList.toggle('o', ov); el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === l))); });
  $('home').classList.toggle('yo', ov);
}
function ySegSync() { const ov = S.yl === 'overview'; document.querySelectorAll('.yseg').forEach((el) => { el.classList.toggle('o', ov); el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === S.yl))); }); $('home').classList.toggle('yo', ov); }
/* iPhone: Tipp auf den großen Monatstitel */
function yrPhoneLayer() { // Jahresebene im Kopf: nur neu aufbauen, wenn Jahr, Einträge oder Breite sich geändert haben
  const wk = $('weekwrap'), lay = $('yearlay'), LW = wk.clientWidth || innerWidth, g = yearGeo('p', LW);
  if (lay.dataset.sig !== yearSig(S.hm.y, LW) || !lay.firstChild) lay.outerHTML = yearLayerHTML(S.hm.y, 'p', 'yrpick', LW, 'yearlay', !S.yr);
  wk.style.setProperty('--yh', g.H + 'px');
  $('yMarks').innerHTML = [1, 8, 15, 22, 29].map((k) => '<span style="left:' + (g.x0 + g.oxd(k) + g.ow / 2).toFixed(1) + 'px">' + k + '</span>').join('');
  ySegSync();
}
function zInit(els, fn) { // Ausgangslage ohne Übergang setzen (Style-Flush davor und danach), damit der Einflug wirklich aus dem Versteck läuft
  els.forEach((e) => e.classList.add('snap')); fn(); void document.body.offsetHeight; els.forEach((e) => e.classList.remove('snap')); void document.body.offsetHeight;
}
function yrEnter() {
  const wk = $('weekwrap'), home = $('home'), mid = !!S.yrT; clearTimeout(S.yrT); S.yrT = 0;
  if (!S.yr) yrPhoneLayer(); // Ebene ist im Leerlauf schon vorbereitet (yrIdle); hier nur nachziehen, wenn sich etwas geändert hat
  S.yr = true; hmStats();
  const lay = $('yearlay'), mp = $('weektrack').children[1], g = yearGeo('p', wk.clientWidth || innerWidth), ov = S.yl === 'overview';
  if (mid) { yearPrep(lay, S.hm.m); zoomVars(mp, S.hm.m, g, ov); mp.classList.add('zmo'); }
  else zInit([lay, mp], () => { lay.classList.add('pre'); yearPrep(lay, S.hm.m); zoomVars(mp, S.hm.m, g, ov); mp.classList.add('zmo'); mp.classList.remove('zhide'); });
  animTitle(S.weekTitle, 0, true); yrPill();
  wk.classList.add('yrt', 'yr'); home.classList.add('yr', 'ylock'); lay.classList.remove('pre'); mp.classList.add('zhide');
}
function yrLeave(m) {
  if (!S.yr) return; const wk = $('weekwrap'), home = $('home'), st = S.hm, t = today(); clearTimeout(S.yrT);
  S.yr = false;
  const same = m === st.m && st.y === (st.y0 == null ? st.y : st.y0);
  animTitle(MONTHS[m] + '|' + st.y, 0, true);
  if (same) hmStats();
  else { S.hm = { y: st.y, m, sel: st.y === t.getFullYear() && m === t.getMonth() ? keyOf(t) : null }; renderHomeMonth(); }
  const lay = $('yearlay'), mp = $('weektrack').children[1], g = yearGeo('p', wk.clientWidth || innerWidth), ov = S.yl === 'overview';
  yearPrep(lay, m); yrPill();
  if (!same) { zoomVars(mp, m, g, ov); mp.classList.add('zmo', 'zhide'); void wk.offsetHeight; }
  wk.classList.remove('yr'); home.classList.remove('yr'); lay.classList.add('pre'); mp.classList.remove('zhide');
  S.yrT = setTimeout(() => { S.yrT = 0; wk.classList.remove('yrt'); home.classList.remove('ylock'); yrIdle(); }, 1250); // Scrollen bleibt bis zum Ende der Animation gesperrt
}
function yrIdle() { clearTimeout(yrIdle.t); if (isDesktop()) return; yrIdle.t = setTimeout(() => { if (!S.yr && !S.yrT) yrPhoneLayer(); }, 700); } // Ebene vorab bauen: der erste Frame nach dem Tipp kommt sofort
function yrToggle() { // Titel getippt: Monat → Jahr, im Jahr zurück in den Monat; eingeklappt erst nach oben
  if (isDesktop()) return; const home = $('home');
  if (S.yr) { yrLeave(S.hm.m); return; }
  if (trackBusy || S.toTodayWk) return;
  if (home.scrollTop > 2) { home.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  yrEnter();
}
function yrPill() { // Heute-Kapsel im Jahr (ohne Pfeil-Paar): nur in einem anderen Jahr
  const mi = $('yrMini'), ty = today().getFullYear(), on = !!S.yr && S.hm.y !== ty; mi.classList.toggle('on', on); mi.tabIndex = on ? 0 : -1; mi.classList.toggle('dir-r', S.hm.y < ty);
}
function yrMove(dir, toY) { // Jahreswechsel im Kopf: Tage wie beim Monat als Welle (alter Inhalt gleitet 12px weg, neuer kommt von 16px), Titel wischt mit
  if (trackBusy || !S.yr) return; trackBusy = true;
  const wk = $('weekwrap'), old = $('yearlay'), st = S.hm, t = today(), y = toY != null ? toY : st.y + dir;
  const dx = parseFloat(old.style.getPropertyValue('--dx')) || 0, dop = old.style.getPropertyValue('--do') ? parseFloat(old.style.getPropertyValue('--do')) : 1;
  const ghost = old.cloneNode(true); ghost.removeAttribute('id'); ghost.classList.remove('dragging'); ghost.style.removeProperty('--dx'); ghost.style.removeProperty('--do'); ghost.style.pointerEvents = 'none';
  ghost.querySelectorAll('.yl, .yh').forEach((x) => { x.style.visibility = 'hidden'; }); wk.appendChild(ghost);
  S.hm = { y, m: st.m, sel: y === t.getFullYear() && st.m === t.getMonth() ? keyOf(t) : null };
  hmStats(); animTitle(S.weekTitle, dir, false); renderHomeMonth(); yrPill();
  const np = $('yearlay'), E = 'cubic-bezier(0.32, 0.72, 0, 1)', ord = (c) => { const r = c.getBoundingClientRect(), col = Math.max(0, Math.min(6, r.left / (wk.clientWidth || 390) * 6)); return dir > 0 ? col : 6 - col; };
  ghost.querySelectorAll('.yz').forEach((c) => c.animate([{ opacity: dop, transform: 'translate3d(' + dx + 'px,0,0)' }, { opacity: 0, transform: 'translate3d(' + (dx - dir * 12) + 'px,0,0)' }], { duration: 220, delay: ord(c) * 14, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'both' }));
  np.querySelectorAll('.yz').forEach((c) => c.animate([{ opacity: 0, transform: 'translate3d(' + (dir * 16) + 'px,0,0)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 80 + ord(c) * 28, easing: E, fill: 'backwards' }));
  setTimeout(() => { ghost.remove(); trackBusy = false; }, 720);
}
function yrToday() { // Daumenkino durch die Jahre (ab 3 Schritten), dann landet die Welle
  const ty = today().getFullYear(), n = ty - S.hm.y, dir = Math.sign(n); if (!dir || trackBusy || !S.yr) return;
  if (Math.abs(n) < 3) { yrMove(dir, ty); return; }
  trackBusy = true; S.flipping = true; const y0 = S.hm.y, inner = Math.abs(n) - 1, count = Math.min(inner, 14), ks = []; let i = 0;
  for (let j = 1; j <= count; j++) { const k = Math.round(j * inner / count); if (!ks.includes(k)) ks.push(k); }
  (function frame() {
    if (i >= ks.length) { S.flipping = false; trackBusy = false; yrMove(dir, ty); return; }
    const gap = [110, 80, 62][i] || 50; S.hm = { y: y0 + dir * ks[i], m: S.hm.m, sel: null }; hmStats(); animTitle(S.weekTitle, dir, false); renderHomeMonth(); yrPill();
    $('yearlay').animate([{ opacity: 0.3, transform: 'translate3d(' + (dir * 9) + 'px,0,0)' }, { opacity: 1, transform: 'none' }], { duration: Math.round(gap * 1.6), easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
    i++; setTimeout(frame, gap);
  })();
}
function hmStats() { // Titel-Text und Zählwerk des Kopfes (Monat, im Jahr: das Jahr)
  const hm = S.hm, t = today(), yr = !!S.yr;
  S.weekTitle = yr ? 'Das Jahr|' + hm.y : MONTHS[hm.m] + '|' + hm.y;
  const first = yr ? new Date(hm.y, 0, 1) : new Date(hm.y, hm.m, 1), last = yr ? new Date(hm.y, 11, 31) : new Date(hm.y, hm.m, daysIn(hm.y, hm.m)), end = last < t ? last : t;
  const elapsed = first > t ? 0 : Math.round((end - first) / 864e5) + 1;
  const norm = setStat($('weekCount'), $('weekLbl'), first, last, elapsed);
  $('weekStat').classList.toggle('is-empty', norm && !elapsed); setAway($('weekAway'), awayText(yr ? 'year' : 'month', yr ? hm.y - t.getFullYear() : (hm.y * 12 + hm.m) - (t.getFullYear() * 12 + t.getMonth())));
  hmPill(); yrPill();
}
function yearHTML(y, act) {
  let h = '<div class="ygrid"><div class="yhead"><span class="ylab"></span><span class="ydots"><span style="grid-column:1">1</span><span style="grid-column:9">8</span><span style="grid-column:17">15</span><span style="grid-column:25">22</span><span style="grid-column:33">29</span></span></div>';
  for (let mm = 0; mm < 12; mm++) {
    h += '<button class="yrow" data-act="' + (act || 'pickmonth') + '" data-m="' + mm + '" data-y="' + y + '" aria-label="' + MONTHS[mm] + ' ' + y + '"><span class="ylab">' + MSHORT[mm] + '</span><span class="ydots">';
    const n = daysIn(y, mm);
    for (let d = 1; d <= 31; d++) {
      if (d > 1 && (d - 1) % 7 === 0) h += '<span></span>'; // Lücke zwischen den Wochenblöcken
      if (d > n) { h += '<span></span>'; continue; }
      const dd = new Date(y, mm, d), stt = dayState(dd);
      h += '<span class="yd ' + ({ 'is-entry': 'e', 'is-missed': 'm', 'is-today': 't', 'is-future': 'f' })[stt] + (stt === 'is-entry' && keyOf(dd) === keyOf(today()) ? ' n' : '') + '"></span>';
    }
    h += '</span></button>';
  }
  return h + '</div>';
}
function renderCalendar() {
  const { mode, y, m } = S.cal; const t = today();
  $('tabMonth').setAttribute('aria-selected', mode === 'month'); $('tabYear').setAttribute('aria-selected', mode === 'year');
  const first = mode === 'month' ? new Date(y, m, 1) : new Date(y, 0, 1);
  const last = mode === 'month' ? new Date(y, m, daysIn(y, m)) : new Date(y, 11, 31);
  $('calTitle').innerHTML = mode === 'month' ? titleHTML(MONTHS[m], y) : titleHTML('Das Jahr', y);
  const end = last < t ? last : t; const elapsed = first > t ? 0 : Math.round((end - first) / 864e5) + 1;
  setCount($('calCount'), elapsed ? countRange(first, end) : 0, elapsed);
  $('calStats').classList.toggle('is-empty', !elapsed);
  const calOff = mode === 'month' ? (y * 12 + m) - (t.getFullYear() * 12 + t.getMonth()) : y - t.getFullYear();
  setAway($('calAway'), awayText(mode, calOff)); setPill($('calTodayBtn'), calOff !== 0 && !S.toTodayCal, calOff > 0);
  $('caltrack').innerHTML = [-1, 0, 1].map((o) => { const p = periodOf(o); return '<div class="calpanel">' + (mode === 'month' ? monthGridHTML(p.y, p.m, false) : yearHTML(p.y)) + '</div>'; }).join('');
  resetTrack($('caltrack'));
  if (S.cal.sel) document.querySelectorAll('#caltrack .cell').forEach((c) => c.classList.toggle('is-sel', c.dataset.key === S.cal.sel));
  $('calLegend').innerHTML = '<span><i style="background:var(--ink)"></i>Geschrieben</span><span><i style="width:4px;height:4px;margin:0 3px;background:var(--ink)"></i>Heute</span>' +
    (mode === 'year' ? '<span><i style="background:var(--empty)"></i>Leer</span>' : '');
  renderOnThisDay();
}
function dayLabel(k) { const d = parseKey(k); return WDLONG[d.getDay()] + ', ' + d.getDate() + '. ' + MONTHS[d.getMonth()]; }
const GO = '<span class="go">Öffnen<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
function renderOnThisDay() {
  const k = S.cal.mode === 'month' ? S.cal.sel : null;
  if (k) { // Vorschau des angetippten Tages: noch einmal tippen öffnet ihn
    const list = S.byDate.get(k) || [], e = list[0], past = parseKey(k) <= today();
    $('otd').innerHTML = '<button class="otd is-prev" data-act="day" data-key="' + k + '"><span class="kicker"><span>' + dayLabel(k) + (list.length > 1 ? ' · ' + list.length + ' Einträge' : '') + '</span>' + GO + '</span>' +
      (e ? '<span class="ti">' + esc(titleOf(e)) + '</span><span class="ex">' + esc(excerptOf(e)) + '</span>'
         : '<span class="ti muted">' + (past ? 'Noch nichts geschrieben' : 'Noch nicht da') + '</span><span class="ex">Tippe noch einmal, um ' + (past ? 'für diesen Tag zu schreiben.' : 'schon etwas vorzumerken.') + '</span>') + '</button>';
    return;
  }
  const t = today(); const md = keyOf(t).slice(5);
  const past = S.entries.filter((e) => e.date.slice(5) === md && e.date < keyOf(t));
  const box = $('otd');
  if (!past.length) { box.innerHTML = '<div class="otd"><span class="kicker">An diesem Tag</span><span class="none">Hier erscheint, was du an diesem Tag in früheren Jahren geschrieben hast.</span></div>'; return; }
  const e = past[0];
  box.innerHTML = '<button class="otd" data-act="open" data-id="' + esc(e.id) + '"><span class="kicker">An diesem Tag · ' + e.date.slice(0, 4) + '</span><span class="ti">' + esc(titleOf(e)) + '</span><span class="ex">' + esc(excerptOf(e)) + '</span></button>';
}
