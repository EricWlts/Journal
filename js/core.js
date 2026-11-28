// Helfer, IndexedDB (DB), Zustand S, reindex, Suche-Leuchten und Zählwerk
'use strict';
/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MSHORT = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
const WD = ['MO','DI','MI','DO','FR','SA','SO'];
const WDLONG = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const mondayIdx = (d) => (d.getDay() + 6) % 7;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const isDesktop = () => window.matchMedia('(min-width: 960px)').matches;
const typing = () => { const a = document.activeElement; return a && !a.closest('#hapL') && (a.isContentEditable || a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); };
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600); }

/* ---------- storage (IndexedDB) ---------- */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('journal', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' });
      };
      r.onsuccess = () => { DB.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = DB.db.transaction(store, mode); const s = t.objectStore(store); let out;
      Promise.resolve(fn(s)).then((v) => { out = v; });
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  },
  all(store) { return new Promise((res, rej) => { const r = DB.db.transaction(store).objectStore(store).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  get(store, id) { return new Promise((res, rej) => { const r = DB.db.transaction(store).objectStore(store).get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  put(store, val) { return DB.tx(store, 'readwrite', (s) => { s.put(val); }); },
  putMany(store, vals) { return DB.tx(store, 'readwrite', (s) => { vals.forEach((v) => s.put(v)); }); },
  del(store, id) { return DB.tx(store, 'readwrite', (s) => { s.delete(id); }); }
};

/* ---------- state ---------- */
const S = {
  trash: [],              // gelöschte Einträge (Papierkorb, `deleted` = ISO-Zeit); S.entries enthält nur lebende
  entries: [],            // {id, date:'YYYY-MM-DD', created: ISO, title, text, photos:[ids], source}
  byDate: new Map(),
  stack: ['home'],
  cal: { mode: 'month', y: 0, m: 0 },
  side: { mode: 'week', y: 0, m: 0, w: 0 }, // Kalender in der Seitenleiste (Mac)
  cur: null,              // entry being edited (object, may be unsaved draft)
  homeDirty: true,
  weekOff: 0,
  hm: null                // iPhone-Startseite: { y, m, sel } – gezeigter Monat und gewählter Tag (siehe renderHomeMonth)
};
{ const t0 = new Date(); S.hm = { y: t0.getFullYear(), m: t0.getMonth(), sel: t0.getFullYear() + '-' + String(t0.getMonth() + 1).padStart(2, '0') + '-' + String(t0.getDate()).padStart(2, '0') }; }
function reindex() {
  S.entries.sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));
  S.byDate = new Map();
  for (const e of S.entries) { if (!S.byDate.has(e.date)) S.byDate.set(e.date, []); S.byDate.get(e.date).push(e); }
}
const hasEntry = (k) => (S.hitDays ? S.hitDays.has(k) : S.byDate.has(k)); // während der Suche (Mac und iPhone) zählen nur Tage mit Treffern
function setStat(cnt, lbl, first, last, elapsed) { // Zählwerk: sonst „x/y Tage“, in der Suche „x Treffer“ (Einträge im gezeigten Zeitraum)
  if (S.hitList) { const a = keyOf(first), b = keyOf(last); let n = 0; for (const e of S.hitList) if (e.date >= a && e.date <= b) n++; setCount(cnt, n, null); lbl.textContent = 'Treffer'; return false; }
  lbl.textContent = 'Tage'; setCount(cnt, elapsed ? countRange(first, end2(first, last)) : 0, elapsed); return true;
}
const end2 = (first, last) => { const t = today(); return last < t ? last : t; };
/* Suche lässt Tage leuchten: Treffer-Tage in Woche, Monat und beiden Jahresansichten (iPhone + Mac) bekommen nacheinander einen Lichtschein.
   Neu gebaute Ebenen setzen die Verzögerung (--gl) in Datumsreihenfolge, gedeckelt auf ~0,9 s insgesamt; Tage, die schon leuchteten, bleiben ruhig. */
const LIT_SEL = '.wday.is-entry, .mday.is-entry, .mgrid .cell.is-entry, .yz.e';
function litKey(el) { if (el.dataset.key) return el.dataset.key; const l = el.closest('.ylay'); return l ? l.dataset.y + '-' + pad(+el.dataset.m + 1) + '-' + pad(parseInt(el.textContent, 10) || 0) : ''; }
function litStagger(root) {
  const groups = new Map();
  for (const el of (root.matches(LIT_SEL) ? [root] : root.querySelectorAll(LIT_SEL))) { const g = el.closest('.weekpanel, .mpanel, .calpanel, .ylay') || root; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(el); }
  for (const els of groups.values()) {
    const fresh = els.filter((el) => !(S.litPrev && S.litPrev.has(litKey(el)))), step = Math.min(26, 900 / Math.max(1, fresh.length));
    els.forEach((el) => el.style.setProperty('--gl', fresh.includes(el) ? Math.round(fresh.indexOf(el) * step) + 'ms' : '-2s')); // schon leuchtend: Animation gilt als abgelaufen
  }
}
function initLit() {
  if (initLit.done) return; initLit.done = true;
  const mo = new MutationObserver((recs) => { if (!S.hitDays) return; for (const r of recs) for (const n of r.addedNodes) if (n.nodeType === 1) litStagger(n); });
  for (const id of ['weekwrap', 'sidecal']) mo.observe($(id), { childList: true, subtree: true });
}
function setCount(el, a, b) { // „2/7“ – geänderte Ziffern rollen einzeln, rauf beim Zunehmen, runter beim Abnehmen
  const s = b ? a + '/' + b : (b === null ? String(a) : '0'), prev = el.dataset.v; if (prev === s) return; el.dataset.v = s;
  const [na, nb] = s.split('/'), chars = (x) => [...x].map((c) => '<span class="ch"><span>' + c + '</span></span>').join('');
  el.innerHTML = chars(na) + (nb !== undefined ? '<span class="of">/' + chars(nb) + '</span>' : '');
  if (prev === undefined || el.offsetParent === null || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const [pa, pb] = prev.split('/'), up = +na !== +pa ? +na > +pa : +(nb || 0) >= +(pb || 0), d = up ? 1 : -1;
  const roll = (nodes, o, n) => nodes.forEach((ch, i) => {
    const j = o.length - (n.length - i), oc = j >= 0 ? o[j] : ''; if (oc === n[i]) return;
    ch.firstChild && ch.animate([{ transform: 'translate3d(0,' + (d * 0.5) + 'em,0)', opacity: 0, filter: 'blur(1.5px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { duration: 460, delay: (nodes.length - 1 - i) * 40, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'backwards' });
    if (oc) {
      const g = document.createElement('span'); g.className = 'chold'; g.textContent = oc; ch.appendChild(g);
      g.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate3d(0,' + (-d * 0.5) + 'em,0)', opacity: 0, filter: 'blur(1.5px)' }], { duration: 240, delay: (nodes.length - 1 - i) * 40, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'both' }).onfinish = () => g.remove();
    }
  });
  const kids = [...el.children], ofEl = el.querySelector('.of');
  roll(kids.filter((k) => k.classList.contains('ch')), pa || '', na);
  if (ofEl && nb) roll([...ofEl.querySelectorAll('.ch')], pb || '', nb);
}
function countRange(from, to) { // inclusive dates; counts written days
  let n = 0; const d = new Date(from);
  while (d <= to) { if (hasEntry(keyOf(d))) n++; d.setDate(d.getDate() + 1); }
  return n;
}
function dayState(d) {
  const t = today(); const k = keyOf(d);
  if (hasEntry(k)) return 'is-entry';
  if (d.getTime() === t.getTime()) return 'is-today';
  return d < t ? 'is-missed' : 'is-future';
}
function titleOf(e) {
  if (e.title && e.title.trim()) return e.title.trim();
  const first = (e.text || '').trim().split('\n')[0];
  return first ? (first.length > 60 ? first.slice(0, 58) + ' …' : first) : 'Ohne Titel';
}
function excerptOf(e) {
  let t = (e.text || '').trim();
  if (!(e.title && e.title.trim())) t = t.split('\n').slice(1).join(' ');
  t = t.replace(/\s+/g, ' ');
  if (t.length <= 140) return t;
  // an der Wortgrenze kürzen, Satzzeichen vor der Auslassung entfernen („.…“ vermeiden)
  let c = t.slice(0, 140); const sp = c.lastIndexOf(' ');
  if (sp > 60) c = c.slice(0, sp);
  return c.replace(/[\s.,;:–-]+$/, '') + '…';
}
