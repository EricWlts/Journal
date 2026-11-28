// Navigation (Stack), Karte wird Blatt, Aktionen, Löschen, Licht und Farbe
'use strict';
/* ---------- navigation ---------- */
const VIEWS = ['home', 'calendar', 'entry', 'settings'];
function minStack() { return isDesktop() ? 2 : 1; }
function applyStack() {
  const top = S.stack[S.stack.length - 1];
  if (top !== 'entry' && SF.on && !SF.closing) sfReset();
  if (!isDesktop()) { const ap = $('app'); clearTimeout(SF.at); if (top === 'entry') ap.classList.add('sfx'); else SF.at = setTimeout(() => { if (S.stack[S.stack.length - 1] !== 'entry' && !SF.on) ap.classList.remove('sfx', 'card'); }, 1100); }
  for (const v of VIEWS) {
    const el = $(v); const i = S.stack.lastIndexOf(v);
    el.classList.remove('is-top', 'is-under', 'is-off', 'dragging'); el.style.transform = '';
    if (v === top) el.classList.add('is-top');
    else if (i >= 0) el.classList.add('is-under');
    else el.classList.add('is-off');
    el.setAttribute('aria-hidden', v === top || (v === 'home' && isDesktop()) ? 'false' : 'true');
  }
  $('home').classList.toggle('set-open', top === 'settings');
  const under = S.stack[S.stack.length - 2]; // iPhone: unter dem Eintrag liegt die vorige Ansicht als zurückgetretenes Blatt
  for (const v of VIEWS) $(v).classList.toggle('under-sheet', !isDesktop() && top === 'entry' && v === under);
  document.querySelectorAll('.floatbtn.away').forEach((b) => b.classList.remove('away'));
  if (S.hideRail && !isDesktop()) S.hideRail();
  if (S.syncTop) S.syncTop();
  if (isDesktop()) updateSideSel();
  $('homePlus').classList.toggle('off', isDesktop() && top !== 'entry');
  if (top === 'home' && S.homeDirty) renderHome();
}
function go(v) {
  if (v === 'home') { S.stack = isDesktop() ? ['home', 'entry'] : ['home']; applyStack(); return; }
  const i = S.stack.indexOf(v);
  if (i > 0) S.stack = S.stack.slice(0, i + 1); else S.stack.push(v);
  if (isDesktop() && S.stack[1] !== 'entry') S.stack.splice(1, 0, 'entry');
  applyStack();
}
function back() {
  if (S.stack.length <= minStack()) return;
  // Mac: Einstellungen verlassen – erst steigen die Abschnitte gestaffelt aus, dann kommt der Eintrag weich zurück
  if (isDesktop() && S.stack[S.stack.length - 1] === 'settings' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (back.busy) return; back.busy = true;
    $('settings').classList.add('leaving');
    back.lt = setTimeout(() => {
      back.busy = false; setTimeout(() => $('settings').classList.remove('leaving'), 600);
      S.stack.pop(); const e = $('entry'); e.classList.remove('returning'); void e.offsetWidth; e.classList.add('returning');
      applyStack(); if (S.homeDirty) renderHome();
      clearTimeout(back.rt); back.rt = setTimeout(() => e.classList.remove('returning'), 1000);
    }, 300);
    return;
  }
  if (S.stack[S.stack.length - 1] === 'entry' && SF.on && !SF.closing) sfReset(); // Bewegung abbrechen, Blatt schließt dann wie früher
  const leaving = S.stack.pop(), leftDate = leaving === 'entry' && S.cur ? S.cur.date : null;
  if (leaving === 'entry') { if (document.activeElement) document.activeElement.blur(); saveCur(true); }
  applyStack();
  if (leaving === 'entry' || S.homeDirty) { renderHome(); if (S.stack.includes('calendar')) renderCalendar(); }
  if (leftDate && !isDesktop()) setTimeout(() => hmFollow(leftDate), 380);

}

/* ---------- iPhone: Karte wird Blatt ----------
   Die angetippte Karte wächst zum Blatt (Tageszahl gleitet an ihren Platz, der Text setzt sich per Deckkraft dazu),
   beim Schließen läuft alles mit derselben Kurve zurück zur Karte. Bleibt keine Karte im Bild, gleitet das Blatt nach unten. */
const SF = { on: false, running: false, closing: false, drag: false, row: null, t: 0, at: 0 };
const sfMotion = () => !isDesktop() && !matchMedia('(prefers-reduced-motion: reduce)').matches;
const SF_PROPS = ['top', 'left', 'right', 'bottom', 'borderRadius', 'backgroundColor', 'boxShadow', 'transform'];
function sfRel(el, root) { let x = 0, y = 0, n = el; while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y }; }
function sfBg(card) { // deckende Farbe der Karte (Kartenton über dem Papier)
  const num = (v) => (v.match(/[\d.]+/g) || []).map(Number);
  const f = num(getComputedStyle(document.documentElement).getPropertyValue('--card')); let b = [0, 0, 0, 1], n = card.parentElement;
  while (n) { const c = num(getComputedStyle(n).backgroundColor); if (c.length >= 3 && (c.length < 4 || c[3] > 0.01)) { b = c; break; } n = n.parentElement; }
  const a = f.length > 3 ? f[3] : 1; return 'rgb(' + [0, 1, 2].map((i) => Math.round((f[i] || 0) * a + b[i] * (1 - a))).join(',') + ')';
}
function sfRep(ent, card) { // exakte Kopie der Karte im Blatt
  const old = ent.querySelector('.rep'); if (old) old.remove();
  const rep = document.createElement('div'); rep.className = 'rep'; rep.setAttribute('aria-hidden', 'true');
  rep.style.width = card.offsetWidth + 'px'; rep.style.height = card.offsetHeight + 'px';
  const c = card.cloneNode(true); for (const a of ['data-act', 'data-id', 'data-date', 'style']) c.removeAttribute(a);
  c.classList.remove('swiping', 'is-open', 'snap', 'is-current'); c.tabIndex = -1; rep.appendChild(c); ent.appendChild(rep); return rep;
}
function sfPrep(ent, card) { // Zielwert für die Tageszahl (Karte ⇄ Blatt) als CSS-Variable
  const dn = $('eDn'), px = (el) => parseFloat(getComputedStyle(el).fontSize);
  const n = card.querySelector('.n');
  const fn = sfRel(dn, ent), cn = sfRel(n.offsetParent ? n : card.querySelector('.d'), card);
  ent.style.setProperty('--ntf', 'translate(' + (cn.x - fn.x) + 'px,' + (cn.y - fn.y) + 'px) scale(' + (px(n) / px(dn)) + ')');
}
function sfClear(ent) {
  ent.classList.remove('fx', 'nt', 'pre', 'closing', 'down', 'drag', 'far');
  for (const p of SF_PROPS) ent.style[p] = '';
  for (const v of ['--fw', '--ntf']) ent.style.removeProperty(v);
  const rep = ent.querySelector('.rep'); if (rep) rep.remove();
}
function sfEnd() { // Ende der Bewegung: alles im selben Bild zurücksetzen – die echte Karte ist wieder da, ohne Übergang
  const ent = $('entry'); clearTimeout(SF.t);
  ent.style.transition = 'none'; sfClear(ent);
  if (SF.row) { SF.row.style.visibility = ''; SF.row = null; }
  void ent.offsetWidth; ent.style.transition = '';
  SF.on = SF.running = SF.closing = SF.drag = false;
}
function sfReset() { // sofort in den Ruhezustand (z. B. wenn der Eintrag anders geschlossen wird); das Blatt gleitet dann wie früher nach unten
  if (!SF.on && !$('entry').classList.contains('fx')) return;
  const ent = $('entry'); clearTimeout(SF.t);
  sfClear(ent); if (SF.row) { SF.row.style.visibility = ''; SF.row = null; }
  const u = $(S.stack[S.stack.length - 2] || 'home'); if (u) { u.classList.remove('dragging'); u.style.removeProperty('filter'); }
  SF.on = SF.running = SF.closing = SF.drag = false;
}
function sfSettle() { SF.running = false; if (SF.row) { SF.row.style.visibility = ''; SF.row = null; } if (!SF.closing && SF.on) sfEnd(); }
function sfOpen(row, id) { // true, wenn die Karte zum Blatt wächst
  if (!sfMotion()) return false;
  const e = S.entries.find((x) => x.id === id); if (!e) return false;
  const ent = $('entry'), app = $('app'), W = app.clientWidth, H = app.clientHeight, r = row.getBoundingClientRect();
  if (r.bottom < 60 || r.top > H - 20 || !r.width) return false;
  SF.on = true; SF.running = true; SF.closing = false; clearTimeout(SF.t);
  ent.style.setProperty('--fw', W + 'px'); ent.classList.add('fx', 'nt'); app.classList.add('sfx', 'card');
  go('entry'); openEntry(e);
  sfRep(ent, row); sfPrep(ent, row);
  Object.assign(ent.style, { top: r.top + 'px', left: r.left + 'px', right: (W - r.right) + 'px', bottom: (H - r.bottom) + 'px', borderRadius: getComputedStyle(row).borderTopLeftRadius, backgroundColor: sfBg(row), boxShadow: 'none' });
  ent.classList.add('pre'); row.style.visibility = 'hidden'; SF.row = row;
  void ent.offsetWidth; // Karte steht – ab hier läuft die Bewegung
  ent.classList.remove('nt', 'pre'); for (const p of SF_PROPS) ent.style[p] = '';
  SF.t = setTimeout(sfSettle, 880);
  return true;
}
function sfClose() { // Zurück-Knopf oder Runterziehen: zur Karte des Eintrags, sonst nach unten
  const ent = $('entry'), app = $('app'), W = app.clientWidth, H = app.clientHeight, e = S.cur;
  if (SF.closing || isDesktop() || S.stack[S.stack.length - 1] !== 'entry') return;
  if (typing()) document.activeElement.blur();
  if (!sfMotion()) { back(); return; }
  SF.closing = true; SF.on = true; SF.running = false; clearTimeout(SF.t);
  const settled = !ent.classList.contains('fx'), under = $(S.stack[S.stack.length - 2]);
  app.classList.add('sfx', 'card');
  if (settled) { ent.style.setProperty('--fw', W + 'px'); ent.classList.add('fx', 'nt'); }
  under.style.removeProperty('filter');
  const tf = ent.style.transform; // Zieh-Versatz: applyStack löscht ihn, hier festhalten
  back();
  if (tf) { ent.style.transform = tf; void ent.offsetWidth; }
  if (SF.row) { SF.row.style.visibility = ''; SF.row = null; }
  const view = $(S.stack[S.stack.length - 1]);
  let card = e && e.id ? view.querySelector('#list .row[data-id="' + CSS.escape(e.id) + '"]') : null, fr = null;
  if (card) {
    const p = sfRel(card, view); fr = { left: p.x, top: p.y - view.scrollTop, width: card.offsetWidth, height: card.offsetHeight };
    if (!(fr.top + fr.height > 120 && fr.top < H - 24 && fr.width > 0)) card = null;
  }
  if (!card) { ent.classList.remove('nt', 'drag', 'far'); ent.classList.add('down'); app.classList.remove('card'); ent.style.transform = ''; SF.t = setTimeout(sfEnd, 600); return; }
  sfRep(ent, card); sfPrep(ent, card);
  const bg = sfBg(card), rad = getComputedStyle(card).borderTopLeftRadius; card.style.visibility = 'hidden'; SF.row = card;
  if (settled) void ent.offsetWidth;
  ent.classList.remove('nt', 'drag', 'far'); ent.classList.add('closing');
  Object.assign(ent.style, { top: fr.top + 'px', left: fr.left + 'px', right: (W - fr.left - fr.width) + 'px', bottom: (H - fr.top - fr.height) + 'px', borderRadius: rad, backgroundColor: bg, boxShadow: 'none', transform: '' });
  SF.t = setTimeout(sfEnd, 860);
}
function sfReopen() { // mitten im Schließen wieder getippt: das Blatt kehrt von der aktuellen Stelle um
  const ent = $('entry'); if (!SF.closing) return;
  clearTimeout(SF.t); SF.closing = false; SF.running = true;
  S.stack.push('entry'); applyStack();
  ent.classList.remove('closing', 'down'); for (const p of SF_PROPS) ent.style[p] = '';
  SF.t = setTimeout(sfSettle, 880);
}
$('entry').addEventListener('mousedown', (ev) => { if (SF.closing) ev.preventDefault(); }, true); // kein Fokus (Tastatur), wenn das Blatt nur umkehren soll
$('entry').addEventListener('click', (ev) => { if (SF.closing) { ev.preventDefault(); ev.stopPropagation(); sfReopen(); } }, true);
function sfDragStart(ent, under) { // Runterziehen: Blatt folgt dem Finger, Startseite kommt nach vorn
  if (SF.closing || SF.running || !sfMotion()) return false;
  SF.drag = true; SF.on = true; $('app').classList.add('sfx', 'card');
  ent.style.setProperty('--fw', $('app').clientWidth + 'px'); ent.classList.add('fx', 'drag');
  under.classList.add('dragging'); return true;
}
function sfDragFrame(ent, under, dy) {
  const d = Math.max(0, dy), k = Math.min(1, d / 300);
  ent.style.transform = 'translate3d(0,' + (d * 0.62).toFixed(1) + 'px,0) scale(' + (1 - k * 0.1).toFixed(4) + ')';
  ent.style.borderRadius = (16 + 10 * k).toFixed(1) + 'px'; ent.classList.toggle('far', d > 20);
  under.style.transform = 'translate3d(0,' + (10 * (1 - k)).toFixed(1) + 'px,0) scale(' + (0.94 + 0.06 * k).toFixed(4) + ')';
  under.style.filter = 'brightness(' + (0.6 + 0.4 * k).toFixed(3) + ') saturate(' + (0.85 + 0.15 * k).toFixed(3) + ')';
}
function sfDragEnd(ent, under, commit) {
  SF.drag = false;
  if (commit) { sfClose(); return; }
  ent.classList.remove('drag', 'far'); under.classList.remove('dragging');
  ent.style.transform = ''; ent.style.borderRadius = ''; under.style.transform = ''; under.style.filter = '';
  clearTimeout(SF.t); SF.t = setTimeout(sfEnd, 900);
}

/* ---------- actions ---------- */
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'search') { deskSearch(!S.dsearch); }
  else if (a === 'qchip') { $('dq').value = b.dataset.w; S.qKeep = false; dqRun(); $('dq').blur(); }
  else if (a === 'settings') { if (back.busy && S.stack[S.stack.length - 1] === 'settings') { clearTimeout(back.lt); back.busy = false; $('settings').classList.remove('leaving'); } /* Regel 2: mitten im Schließen wieder auf */ else if (S.stack[S.stack.length - 1] === 'settings') back(); else { const r = b.getBoundingClientRect(), v = $('settings'); v.style.setProperty('--ox', Math.round(r.left + r.width / 2) + 'px'); v.style.setProperty('--oy', Math.round(r.top + r.height / 2) + 'px'); renderAbout(); renderTrash(); go('settings'); } } // zweiter Klick schließt
  else if (a === 'calendar') { const t = today(); S.cal.y = t.getFullYear(); S.cal.m = t.getMonth(); S.cal.sel = null; renderCalendar(); go('calendar'); }
  else if (a === 'calmode') { if (S.cal.mode !== b.dataset.mode) { const zo = b.dataset.mode === 'year'; S.cal.sel = null; morphSwap($('caltrack'), zo, () => { S.cal.mode = b.dataset.mode; renderCalendar(); }); softIn($('calTitle'), $('calStats')); } }
  else if (a === 'pickmonth') { morphSwap($('caltrack'), false, () => { S.cal.mode = 'month'; S.cal.m = +b.dataset.m; S.cal.y = +b.dataset.y; renderCalendar(); }); softIn($('calTitle'), $('calStats')); }
  else if (a === 'sidemode') setSideMode(b.dataset.mode);
  else if (a === 'ylayout') yearLayout(b.dataset.l);
  else if (a === 'yrtoday') yrToday();
  else if (a === 'yrpick') yrLeave(+b.dataset.m);
  else if (a === 'sidepick') setSideMode('month', +b.dataset.y, +b.dataset.m);
  else if (a === 'sideshift') shiftSide(+b.dataset.dir);
  else if (a === 'sidetoday') sideToday();
  else if (a === 'thisweek') weekToToday();
  else if (a === 'weekshift') shiftWeek(+b.dataset.dir);
  else if (a === 'calshift') shiftCal(+b.dataset.dir);
  else if (a === 'caltoday') calToday();
  else if (a === 'day' && b.closest('#weektrack')) hmPick(b.dataset.key); // Startseite iPhone: erst wählen, zweites Tippen öffnet
  else if (a === 'day') { // im Monatskalender (iPhone): erst Vorschau, zweites Tippen öffnet
    const k = b.dataset.key;
    if (b.closest('#sctrack')) document.querySelectorAll('#sctrack .cell, #sctrack .wday').forEach((c) => c.classList.toggle('is-sel', c.dataset.key === k)); // Ring sofort beim Klick, nicht erst nach dem Überblenden
    if (b.closest('#caltrack') && S.cal.sel !== k) selectCalDay(k); else deskFade(() => openDay(k), (S.byDate.get(k) || [{}])[0].id || 'draft' + k);
  }
  else if (a === 'setlight') { S.light = b.dataset.light; try { localStorage.setItem('journal.light', S.light); } catch (e) {} applyLight(); }
  else if (a === 'impnext') impNext();
  else if (a === 'memtoggle') { AID.mem = !AID.mem; writeAids(); }
  else if (a === 'wset') toggleW(b.dataset.k);
  else if (a === 'setfx') { S.fx = b.dataset.fx; try { localStorage.setItem('journal.fx', S.fx); } catch (e) {} markFx(); }
  else if (a === 'trashcur') { if (S.cur && S.cur.id && hasContent(S.cur)) askDelete(S.cur.id); else syncTrash(); }
  else if (a === 'ctxopen') { const id = S.ctxId; hideCtx(); if (id) { S.navList = null; openEntryById(id); } }
  else if (a === 'ctxdel') { const id = S.ctxId; hideCtx(); if (id) askDelete(id); }
  else if (a === 'untrash') { const e = S.trash.find((x) => x.id === b.dataset.id); if (e) restoreEntry(e).then(() => { renderTrash(); renderHome(); if (S.stack.includes('calendar')) renderCalendar(); if (typeof renderAbout === 'function') renderAbout(); toast('Wiederhergestellt'); }); }
  else if (a === 'confirmdel') { const id = S.pendingDel; closeConfirm(); if (id) deleteEntry(id); }
  else if (a === 'canceldel') { closeConfirm(); closeRow(); }
  else if (a === 'open' && S.openRow) { // offene Zeile: Tipp auf „Löschen“ fragt nach, sonst schließt sie sich
    const r = S.openRow.getBoundingClientRect(); if (S.openRow === b && ev.clientX > r.right - ROW_OPEN) askDelete(b.dataset.id); else closeRow();
  }
  else if (a === 'open') {
    S.navList = (S.dsearch && b.closest('#list') && S.deskHits) ? S.deskHits : null; const id = b.dataset.id;
        if (!isDesktop() && b.matches('#list .row')) { if (SF.on) sfEnd(); if (sfOpen(b, id)) return; }
    deskFade(() => openEntryById(id), id);
  }
  else if (a === 'today') newEntry();
  else if (a === 'entryback') {
    if (typing()) { document.activeElement.blur(); saveCur(); if (isDesktop()) { renderHome(); toast('Gespeichert'); } }
    else if (!isDesktop() && S.stack[S.stack.length - 1] === 'entry') sfClose();
    else back();
  }
  else if (a === 'done') { if (document.activeElement) document.activeElement.blur(); if (S.cur && hasContent(S.cur)) haptic(); saveCur(); if (isDesktop()) { renderHome(); toast('Gespeichert'); } }
  else if (a === 'back') back();
  else if (a === 'syncsave') Sync.connect($('syncRepo').value, $('syncToken').value);
  else if (a === 'syncnow') Sync.run(true);
  else if (a === 'backup') exportBackup();
});
function deskSearch(open) { // Mac und iPhone: das Suchfeld wächst aus der Lupe, der Kopf (Monat/Woche/Jahr) bleibt sichtbar und leuchtet
  S.dsearch = open; $('home').classList.toggle('searching', open); $('dq').tabIndex = open ? 0 : -1; clearTimeout(S.dqT);
  $('searchBtn').setAttribute('aria-label', open ? 'Suche schließen' : 'Suchen'); if (S.updateHomeTitleSoft) S.updateHomeTitleSoft();
  if (open) {
    if (isDesktop()) { $('list').scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => $('dq').focus({ preventScroll: true }), 80); }
    else { $('dq').focus({ preventScroll: true }); if (!S.yr) $('home').scrollTo({ top: 0, behavior: 'smooth' }); renderHome(); } // iPhone: Fokus im Tipp (Tastatur), Monat klappt auf, Vorschläge erscheinen
  }
  else { $('dq').value = ''; if (S.navList && S.navList === S.deskHits) S.navList = null; S.deskHits = null; $('dq').blur(); renderHome(); }
}
function dqRun() { clearTimeout(S.dqT); S.qKeep = true; renderHome(); if (isDesktop()) $('list').scrollTop = 0; else if (S.dsearch && $('dq').value.trim() && document.activeElement === $('dq') && S.foldMonth) S.foldMonth(); } // Tastatur offen: der Monat klappt zur Woche ein, die Treffer bekommen Platz
$('dq').addEventListener('input', () => { clearTimeout(S.dqT); if (!$('dq').value.trim()) dqRun(); else S.dqT = setTimeout(dqRun, 160); }); // entprellt: das Licht fängt nicht bei jedem Tastendruck neu an
$('dq').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); deskSearch(false); } else if (e.key === 'Enter') { e.preventDefault(); $('dq').blur(); } });
/* Löschen (iPhone: Zeile nach links wischen) */
const ROW_OPEN = 96;
function setRow(row, x, snap) {
  if (S.openRow && S.openRow !== row) closeRow();
  row.classList.toggle('snap', !!snap); row.style.setProperty('--sx', x + 'px');
  row.classList.toggle('is-open', x < 0); S.openRow = x < 0 ? row : null;
}
function closeRow() { const r = S.openRow; if (!r) return; S.openRow = null; r.classList.add('snap'); r.style.setProperty('--sx', '0px'); setTimeout(() => r.classList.remove('is-open'), 420); }
function askDelete(id) {
  const e = S.entries.find((x) => x.id === id); if (!e) return;
  S.pendingDel = id; const d = parseKey(e.date);
  $('cText').textContent = '„' + titleOf(e) + '“ vom ' + d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' kommt in den Papierkorb und bleibt dort 30 Tage, bevor er auf allen Geräten endgültig verschwindet.';
  const c = $('confirm'); c.hidden = false; void c.offsetWidth; c.classList.add('show');
  setTimeout(() => c.querySelector('[data-act="canceldel"].btn').focus({ preventScroll: true }), 60);
}
function closeConfirm() { const c = $('confirm'); c.classList.remove('show'); S.pendingDel = null; setTimeout(() => { if (!c.classList.contains('show')) c.hidden = true; }, 480); }
async function deleteEntry(id) {
  const e = S.entries.find((x) => x.id === id); if (!e) return;
  haptic();
  const nb = S.cur === e ? (adjacentOf(-1) || adjacentOf(1)) : null;
  let closedSheet = false;
  if (S.cur === e && !isDesktop() && S.stack[S.stack.length - 1] === 'entry') { // iPhone: erst zurück dorthin, wo man war (Liste bleibt an ihrer Stelle), dann faltet sich die Karte dort zusammen
    if (document.activeElement) document.activeElement.blur();
    clearTimeout(saveTimer); e._savedSig = sigOf(e); S.cur = null; closedSheet = true; sfReset();
    S.stack.pop(); applyStack(); if (S.homeDirty) renderHome(); if (e && e.date) setTimeout(() => hmFollow(e.date), 380); if (S.stack.includes('calendar')) renderCalendar();
    await new Promise((r) => setTimeout(r, 480));
  }
  const rows = [...document.querySelectorAll('.row[data-id="' + CSS.escape(id) + '"]')];
  for (const r of rows) { r.style.overflow = 'hidden'; r.animate([{ height: r.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px', borderBottomWidth: '0px' }], { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' }); }
  S.openRow = null;
  await new Promise((r) => setTimeout(r, rows.length ? 360 : 0));
  await trashEntry(e);
  if (S.cur === e) { // offener Eintrag: iPhone zurück zur Liste, Mac zum Nachbarn
    if (isDesktop()) { S.cur = null; openEntry(nb || draftFor(keyOf(today()))); }
    else { S.cur = null; if (!closedSheet && S.stack[S.stack.length - 1] === 'entry') back(); }
  }
  if (S.navList) S.navList = S.navList.filter((x) => x !== e);
  renderHome(); if (S.stack.includes('calendar')) renderCalendar();
  toast('In den Papierkorb gelegt');
}
try { S.light = localStorage.getItem('journal.light') || 'auto'; } catch (e) { S.light = 'auto'; }
/* Licht: Tageszeit (Papier verändert sich ganz leicht), Hell oder Nacht */
function applyLight() {
  const h = new Date().getHours(), html = document.documentElement, night = S.light === 'nacht';
  html.classList.toggle('night', night);
  html.dataset.light = S.light === 'auto' ? (h >= 5 && h < 10 ? 'morgen' : h >= 17 && h < 21 ? 'abend' : (h >= 21 || h < 5) ? 'spaet' : 'tag') : 'tag';
  setTheme();
  document.querySelectorAll('[data-act=setlight]').forEach((x) => x.setAttribute('aria-checked', x.dataset.light === S.light));
}
/* Farbe der Titelleiste (Mac: Safari-Web-App) bzw. Statusleiste (iPhone): am Mac im Papierton, damit Leiste und App eine Fläche sind;
   beim Schreiben in der Mitte dunkel wie der Hintergrund; am iPhone im Ton des dunklen Kopfs */
function setTheme() {
  const tc = document.querySelector('meta[name="theme-color"]'); if (!tc) return;
  const night = document.documentElement.classList.contains('night');
  let c = night ? '#0b0d0a' : '#12150f';
  if (isDesktop()) c = $('app').classList.contains('a4') ? (night ? '#060705' : '#161a14') : getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() || '#eeece6';
  if (tc.content !== c) tc.content = c;
}
window.addEventListener('resize', () => setTheme());
applyLight(); setInterval(applyLight, 5 * 60 * 1000);
paintSky(); locate(false); setInterval(() => { paintSky(); fetchWx(); }, 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) applyLight(); });
function markFx() { document.querySelectorAll('.fxseg button').forEach((x) => x.setAttribute('aria-checked', x.dataset.fx === S.fx)); }
try { S.fx = localStorage.getItem('journal.fx') || 'fade'; } catch (e) { S.fx = 'fade'; }
markW(); loadImp();
markFx();
function hideCtx() { const c = $('ctxmenu'); c.classList.remove('show'); S.ctxId = null; setTimeout(() => { if (!c.classList.contains('show')) c.hidden = true; }, 180); }
document.addEventListener('contextmenu', (e) => { // Mac: Rechtsklick auf einen Eintrag
  const row = e.target.closest && e.target.closest('#list .row'); if (!row || !isDesktop()) return;
  e.preventDefault(); S.ctxId = row.dataset.id; const c = $('ctxmenu'); c.hidden = false;
  const x = Math.min(e.clientX, innerWidth - c.offsetWidth - 8), y = Math.min(e.clientY, innerHeight - c.offsetHeight - 8);
  c.style.left = x + 'px'; c.style.top = y + 'px'; void c.offsetWidth; c.classList.add('show'); c.querySelector('button').focus({ preventScroll: true });
});
document.addEventListener('pointerdown', (e) => { if (S.ctxId && !e.target.closest('#ctxmenu')) hideCtx(); }, true);
document.addEventListener('keydown', (e) => { if (S.ctxId && e.key === 'Escape') { e.stopPropagation(); hideCtx(); } }, true);
$('list').addEventListener('scroll', () => { if (S.ctxId) hideCtx(); }, { passive: true });
