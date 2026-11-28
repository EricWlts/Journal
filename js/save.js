// Blatt-Hilfen, Speichern, Eintrag öffnen und wechseln
'use strict';
function writeAids() {
  const e = S.cur; if (!e) return;
  if (AID.e !== e && !e.id && !hasContent(e)) { AID.e = e; AID.i = -1; AID.mem = false; $('eImp').dataset.for = ''; if (WS.meta) { if (SKY.lat == null) locate(true); else { fetchWx(); setTimeout(fillMeta, 0); } } } // neues, leeres Blatt
  const fresh = AID.e === e, empty = !hasContent(e);
  const mh = metaHTML(e); if ($('eMeta').innerHTML !== mh) { $('eMeta').innerHTML = mh; $('eMetaP').innerHTML = mh; }
  const box = $('eImp'), want = fresh && WS.imp;
  if (want && !IMP) loadImp();
  box.hidden = !(want && IMP); if (!empty && !box.hidden && !box.classList.contains('wr')) fitImpSmall(box); box.classList.toggle('wr', !empty);
  if (!box.hidden) { const g = greetText(); if ($('eGreet').textContent !== g) $('eGreet').textContent = g; if (box.dataset.for !== e.created + '|' + impIdx()) paintImp(); }
  $('eBody').dataset.ph = !box.hidden ? 'Oder einfach losschreiben …' : 'Was möchtest du festhalten?';
  const m = $('eMem'), last = fresh && WS.mem ? yearAgo(e.date) : null;
  m.hidden = !last;
  if (last) {
    if (m.dataset.id !== last.id) { m.dataset.id = last.id; $('eMemT').textContent = titleOf(last); $('eMemX').textContent = (last.text || '').replace(/\s+/g, ' ').trim(); $('eMemW').textContent = last.wx || ''; }
    m.classList.toggle('off', !empty); m.classList.toggle('open', AID.mem && empty);
    if (isDesktop()) { const b = $('eBody').getBoundingClientRect(), r = $('entry').getBoundingClientRect(); m.style.left = Math.round(b.left - r.left) + 'px'; } else m.style.left = '';
  }
}
const writeAidsSoon = writeAids;

function draftFor(k) {
  const now = new Date(); const d = parseKey(k);
  if (k !== keyOf(now)) d.setHours(20, 0, 0, 0); else d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()); // sekundengenau: mehrere Einträge am Tag bleiben richtig sortiert
  return { id: null, date: k, created: d.toISOString(), title: '', text: '', photos: [], source: 'app' };
}
let saveTimer = null;
function saveMark(st) {
  const d = $('saveDot'); clearTimeout(saveMark.t);
  if (!st) { d.className = 'savedot'; return; }
  if (st === 'pending') { d.className = 'savedot pending'; return; }
  if (st === 'error') { d.className = 'savedot error'; return; }
  d.className = 'savedot saved'; void d.offsetWidth; d.classList.add('pop');
  saveMark.t = setTimeout(() => d.classList.add('rest'), 2200);
}
function onEdit() {
  const e = S.cur; if (!e) return;
  const b = $('eBody'), full = bodyText(b), nl = full.indexOf('\n');
  e.title = nl < 0 ? full : full.slice(0, nl); e.text = nl < 0 ? '' : full.slice(nl + 1); // erste Zeile = Titel, der Rest = Text
  if (!full.trim() && nl < 0) b.innerHTML = ''; else tidyBody(b);
  writeAidsSoon();
  if (e.deleted) { delete e.deleted; S.trash = S.trash.filter((x) => x !== e); if (!S.entries.includes(e)) { S.entries.push(e); reindex(); } } // im Papierkorb weitergeschrieben: wieder lebendig
  if (!e.id && (e.title.trim() || e.text.trim())) { e.id = 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); S.entries.push(e); reindex(); }
  syncTrash();
  if (e.id) saveMark('pending');
  clearTimeout(saveTimer); saveTimer = setTimeout(saveCur, 350);
}
// Mülleimer nur, wenn es wirklich etwas zu löschen gibt (gespeichert und nicht leer)
const hasContent = (e) => !!(e && ((e.title || '').trim() || (e.text || '').trim() || (e.photos || []).length));
function syncTrash() { const e = S.cur; $('entry').classList.toggle('has-id', !!(e && e.id && hasContent(e))); }
const sigOf = (e) => (e.title || '') + '\u0001' + (e.text || '') + '\u0001' + (e.photos || []).join(',');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/* Speichern: _savedSig erst nach erfolgreichem DB.put; bis zu 3 neue Versuche (0,5 s, 1,5 s, 4 s), dann sichtbar melden.
   Gearbeitet wird mit dem Objekt, nicht mit S.cur – so geht nichts verloren, wenn das Blatt inzwischen wechselt. */
function saveCur(leave) { clearTimeout(saveTimer); const e = S.cur; return e && e.id ? saveEntry(e, leave === true) : Promise.resolve(); }
const SV = new WeakMap(); // laufendes Speichern je Eintrag (nicht am Objekt: IndexedDB kann keine Promises klonen)
const isSaving = (e) => SV.has(e);
function saveEntry(e, leave) {
  const run = SV.get(e);
  if (run) { run.again = true; if (leave) run.leave = true; return run.p; }
  const st = { again: false, leave: !!leave, p: null }; SV.set(e, st);
  st.p = (async () => {
    try {
      do {
        st.again = false;
        if (e.deleted) break;
        if (st.leave) { st.leave = false; if (!hasContent(e)) { await trashEmpty(e); break; } } // leeres Blatt verlassen: letzte Fassung still in den Papierkorb
        if (!hasContent(e)) break; // leer getippt: die gespeicherte Fassung nicht überschreiben – sie geht beim Verlassen in den Papierkorb
        if (sigOf(e) === e._savedSig) break; // nichts geändert
        let done = false;
        for (let i = 0; i < 4 && !done; i++) {
          if (i) await wait([500, 1500, 4000][i - 1]);
          if (e.deleted) break;
          const sig = sigOf(e); e.modified = new Date().toISOString(); e._dirty = true;
          try { await DB.put('entries', e); e._savedSig = sig; done = true; } catch (err) { console.error(err); }
        }
        if (e.deleted) break;
        if (!done) { if (S.cur === e) saveMark('error'); toast('Nicht gespeichert – neuer Versuch beim nächsten Tippen'); break; }
        if (S.cur === e && !st.again) saveMark('saved');
        Sync.soon(); S.homeDirty = true; if (isDesktop()) renderHomeSoon();
      } while (st.again);
    } catch (err) { console.error(err); }
    SV.delete(e);
  })();
  return st.p;
}
/* ---------- Papierkorb ---------- */
const TRASH_DAYS = 30;
function splitEntries(all) { S.entries = all.filter((e) => !e.deleted); S.trash = all.filter((e) => e.deleted); reindex(); }
async function trashEntry(e) { // in den Papierkorb legen: Löschmarke setzen, speichern, abgleichen
  const now = new Date().toISOString();
  e.deleted = now; e.modified = now; e._dirty = true;
  S.entries = S.entries.filter((x) => x !== e); if (!S.trash.includes(e)) S.trash.push(e); reindex();
  if (S.navList) S.navList = S.navList.filter((x) => x !== e);
  S.homeDirty = true;
  try { const sig = sigOf(e); await DB.put('entries', e); e._savedSig = sig; } catch (err) { console.error(err); toast('Nicht gespeichert – neuer Versuch beim nächsten Tippen'); }
  Sync.soon(800);
}
async function trashEmpty(e) { // leer verlassen: zuletzt gespeicherten Inhalt zurückholen und in den Papierkorb; nie Gespeichertes einfach verwerfen
  let st = null; try { st = await DB.get('entries', e.id); } catch (err) {}
  if (st && hasContent(st)) { e.title = st.title; e.text = st.text; e.photos = st.photos || []; await trashEntry(e); return; }
  S.entries = S.entries.filter((x) => x !== e); reindex(); S.homeDirty = true;
  try { await DB.del('entries', e.id); } catch (err) {}
  if (Sync.meta.shas['entries/' + e.id + '.json']) Sync.markDeleted(e.id);
  e.id = null; if (S.cur === e) syncTrash();
}
async function restoreEntry(e) { // aus dem Papierkorb zurück in die Liste
  delete e.deleted; e.modified = new Date().toISOString(); e._dirty = true;
  S.trash = S.trash.filter((x) => x !== e); if (!S.entries.includes(e)) S.entries.push(e); reindex();
  S.homeDirty = true;
  try { const sig = sigOf(e); await DB.put('entries', e); e._savedSig = sig; } catch (err) { console.error(err); }
  Sync.soon(800);
}
async function purgeTrash() { // endgültig nach 30 Tagen: lokal entfernen, Datei im Daten-Repo löschen
  const lim = Date.now() - TRASH_DAYS * 864e5, old = S.trash.filter((e) => Date.parse(e.deleted) < lim);
  if (!old.length) return;
  for (const e of old) { try { await DB.del('entries', e.id); } catch (err) { continue; } S.trash = S.trash.filter((x) => x !== e); Sync.markDeleted(e.id); }
  Sync.soon();
}
function renderTrash() {
  const box = $('trashList'); if (!box) return;
  const L = (S.trash || []).slice().sort((a, b) => (a.deleted < b.deleted ? 1 : -1));
  if (!L.length) { box.innerHTML = '<p class="trashempty">Der Papierkorb ist leer.</p>'; return; }
  box.innerHTML = L.map((e) => { const d = parseKey(e.date); return '<div class="trow"><span><span class="wl">' + esc(titleOf(e)) + '</span><span class="ws">' + d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '</span></span><button class="btn ghost" data-act="untrash" data-id="' + esc(e.id) + '">Wiederherstellen</button></div>'; }).join('');
}
let homeTimer = null;
function renderHomeSoon() { clearTimeout(homeTimer); homeTimer = setTimeout(renderHome, 400); }
function openEntry(e, dir) { S.cur = e; if (e._savedSig === undefined) e._savedSig = sigOf(e); renderEntry(dir); }
function openEntryById(id) { const e = S.entries.find((x) => x.id === id); if (e) { go('entry'); openEntry(e); } }
function openDay(k) {
  S.navList = null;
  const list = S.byDate.get(k);
  go('entry');
  openEntry(list && list.length ? list[0] : draftFor(k));
}
function newEntry() { // Plus / ⌘N: immer ein neues, leeres Blatt für heute – mehrere Einträge am Tag sind erlaubt
  const k = keyOf(today()), top = S.stack[S.stack.length - 1];
  if (top === 'entry' && S.cur && !S.cur.id && S.cur.date === k) { focusEnd($('eBody')); return; } // steht schon ein leeres Blatt offen
  saveCur(true); S.navList = null;
  const open = () => { go('entry'); openEntry(draftFor(k)); focusEnd($('eBody')); };
  if (isDesktop() && top === 'entry') deskFade(open, 'new' + Date.now()); else open();
}
function navNeighbour(dir) { // innerhalb der Suchtreffer (neueste zuerst)
  const L = S.navList, i = L ? L.indexOf(S.cur) : -1;
  return i < 0 ? undefined : (L[i - dir] || null);
}
function adjacentOf(dir) {
  const e = S.cur; if (!e) return null;
  const nn = navNeighbour(dir); if (nn !== undefined) return nn;
  const asc = S.entries.slice().reverse(); const i = e.id ? asc.indexOf(e) : -1;
  if (i >= 0) return asc[i + dir] || null;
  return dir < 0 ? (S.entries.find((x) => x.created < e.created) || null) : (asc.find((x) => x.created > e.created) || null);
}
function adjacent(dir) { // dir -1 = older, +1 = newer
  const n = adjacentOf(dir);
  if (n) { saveCur(true); openEntry(n, dir < 0 ? -1 : 1); return true; }
  return false;
}

/* Mac: Wechsel per Klick – alter Eintrag blendet weich nach oben aus, der neue steigt gestaffelt ein */
function deskFade(open, id) {
  const top = S.stack[S.stack.length - 1];
  if (!isDesktop() || top !== 'entry' || matchMedia('(prefers-reduced-motion: reduce)').matches) { open(); return; }
  if (S.cur && (S.cur.id || 'draft' + S.cur.date) === id) return; // schon offen
  const el = $('entryInner'), ent = $('entry');
  clearTimeout(deskFade.t); el.getAnimations().forEach((a) => a.cancel());
  const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 170, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' });
  out.onfinish = () => {
    open(); out.cancel(); revealDown();
  };
}
function revealDown() { // wie frisch geschrieben: eine weiche Kante läuft von oben nach unten über das Blatt und gibt den Inhalt frei
  const el = $('entryInner'), V = $('entry').clientHeight, F = 220;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const pre of ['webkitMask', 'mask']) { el.style[pre + 'Image'] = 'linear-gradient(to bottom, #000 0, #000 ' + V + 'px, transparent ' + (V + F) + 'px)'; el.style[pre + 'Size'] = '100% ' + (2 * V + F) + 'px'; el.style[pre + 'Repeat'] = 'no-repeat'; }
  const from = '0px ' + (-(V + F)) + 'px';
  const a = el.animate([{ webkitMaskPosition: from, maskPosition: from }, { webkitMaskPosition: '0px 0px', maskPosition: '0px 0px' }], { duration: 1150, easing: 'cubic-bezier(0.3, 0.15, 0.25, 1)', fill: 'both' });
  const end = () => { a.cancel(); unmask(el); };
  a.onfinish = end; clearTimeout(revealDown.t); revealDown.t = setTimeout(() => { if (a.playState !== 'finished') return; end(); }, 1400);
}
function switchEntry(dir) { // mit kurzer Ausblende, dann blendet der neue Eintrag von der anderen Seite ein
  const el = $('entryInner');
  if (!adjacentOf(dir)) { el.style.transition = 'transform .32s var(--sheet), opacity .32s var(--sheet)'; el.style.transform = ''; el.style.opacity = ''; setTimeout(() => { el.style.transition = ''; }, 340); return false; }
  if (typing()) document.activeElement.blur();
  el.style.transition = 'transform .14s cubic-bezier(0.4, 0, 1, 1), opacity .14s linear';
  el.style.transform = 'translate3d(' + (dir > 0 ? -72 : 72) + 'px,0,0)'; el.style.opacity = '0';
  clearTimeout(switchEntry.t);
  switchEntry.t = setTimeout(() => { el.style.transition = 'none'; el.style.transform = ''; el.style.opacity = ''; adjacent(dir); requestAnimationFrame(() => { el.style.transition = ''; }); }, 140);
  return true;
}
