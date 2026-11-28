// Eintrag: Blatt „Schlicht“, Tagesimpuls, Meta, Haptik
'use strict';
/* ---------- rendering: entry ---------- */
const photoURLs = new Map();
async function renderEntry(dir) {
  const e = S.cur; const d = new Date(e.created);
  $('eWd').textContent = WDLONG[d.getDay()];
  $('eDt').textContent = d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  $('eDn').textContent = d.getDate(); $('eDtm').textContent = MONTHS[d.getMonth()] + (isDesktop() ? '\n' : ' ') + d.getFullYear(); // Mac: Randspalte, bewusst zwei Zeilen
  syncTrash(); saveMark(null);
  if (window.lineRender) lineRender(); // Phase 5 · Stille Linie
  setBody(fullOf(e));
  writeAids();
  const ph = $('ePhotos'); ph.innerHTML = '';
  for (const pid of (e.photos || [])) {
    let url = photoURLs.get(pid);
    if (!url) { let p = await DB.get('photos', pid); if (!p) p = await Sync.fetchPhoto(pid); if (!p) continue; url = URL.createObjectURL(p.blob); photoURLs.set(pid, url); }
    const img = new Image(); img.src = url; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; ph.appendChild(img);
  }
  const inner = $('entryInner'); inner.classList.remove('in-l', 'in-r'); void inner.offsetWidth;
  if (dir) inner.classList.add(dir < 0 ? 'in-l' : 'in-r');
  $('entry').scrollTop = 0;
  if (isDesktop()) { const d0 = parseKey(e.date);
    updateSideSel(); markCurrentRow(); scrollListTo(e.id, !dir);
    if (S.side.mode === 'week' && weekOf(d0) !== S.side.w) flipTo({ w: weekOf(d0) }); // andere Woche gewählt: ab 3 Wochen Daumenkino, sonst eine Welle
    else if (S.side.mode === 'month' && (d0.getFullYear() !== S.side.y || d0.getMonth() !== S.side.m) && dir) sideJump({ y: d0.getFullYear(), m: d0.getMonth() }); }
}
/* ---------- Blatt „Schlicht“: ein Feld, die erste Zeile ist der Titel (Datenmodell bleibt title + text) ---------- */
const fullOf = (e) => (e.title || '') && (e.text || '') ? e.title + '\n' + e.text : (e.title || e.text || '');
function setBody(full) { // jede Zeile ein eigener Absatz (div) – so bekommen Absätze ihren Abstand
  const b = $('eBody'); b.textContent = '';
  if (!full) { b.innerHTML = '<div class="bl"><br></div>'; markMt(b); return; } // leeres Blatt: die erste Zeile gibt es trotzdem (Anrede-Stil, Schreibmarke darin)
  for (const ln of full.split('\n')) { const d = document.createElement('div'); if (ln) d.textContent = ln; else { d.appendChild(document.createElement('br')); d.className = 'bl'; } b.appendChild(d); }
  markMt(b);
}
function markMt(b) { b.classList.toggle('mt', !b.textContent.replace(/[\u200b\s]/g, '') && !b.querySelector('img')); } // leer = Platzhalter/Vorschlag zeigen
function bodyText(b) { // Text aus dem Feld lesen – unabhängig davon, wie der Browser Zeilen anlegt (div, br oder \n)
  const lines = []; let cur = null;
  const flush = () => { if (cur !== null) { lines.push(cur); cur = null; } };
  const walk = (n) => { for (const c of n.childNodes) {
    if (c.nodeType === 3) cur = (cur || '') + c.data;
    else if (c.nodeName === 'BR') { if (cur === null) cur = ''; flush(); }
    else if (c.nodeType === 1) { if (/^(DIV|P|LI|H\d|BLOCKQUOTE|PRE|SECTION)$/.test(c.nodeName)) { flush(); walk(c); flush(); } else walk(c); }
  } };
  walk(b); flush();
  return lines.join('\n').replace(/\u00a0/g, ' ').replace(/\u200b/g, '');
}
function tidyBody(b) { // erste Zeile in einen eigenen Absatz holen, sobald die Schreibmarke woanders steht; Leerzeilen markieren
  const f = b.firstChild, sel = getSelection(), an = sel.rangeCount ? sel.anchorNode : null;
  if (f && f.nodeType === 3 && b.childNodes.length > 1 && !(an && f.contains(an))) {
    const d = document.createElement('div'); b.insertBefore(d, f);
    while (d.nextSibling && !(d.nextSibling.nodeType === 1 && /^(DIV|P)$/.test(d.nextSibling.nodeName))) { const n = d.nextSibling; d.appendChild(n); if (n.nodeName === 'BR') break; }
  }
  for (const c of b.children) c.classList.toggle('bl', !c.textContent.replace(/[​\s]/g, '') && !c.querySelector('img'));
}

/* ---------- Beim Schreiben: Tagesimpuls, Begrüßung, Ort & Wetter, Heute vor einem Jahr ---------- */
const WS = (() => { const d = { greet: true, imp: true, meta: true, mem: true }; try { return Object.assign(d, JSON.parse(localStorage.getItem('journal.write') || '{}')); } catch (e) { return d; } })();
function markW() { document.querySelectorAll('.wrow[data-k]').forEach((r) => r.setAttribute('aria-checked', WS[r.dataset.k] ? 'true' : 'false')); }
function toggleW(k) { WS[k] = !WS[k]; try { localStorage.setItem('journal.write', JSON.stringify(WS)); } catch (e) {} markW(); if (k === 'greet') writeAids(); if (k === 'meta') { SKY.sig = ''; paintSky(); if (WS.meta) locate(true); } }
let IMP = null;
function loadImp() { if (IMP || loadImp.p) return; loadImp.p = fetch('impulse.json').then((r) => r.json()).then((j) => { if (Array.isArray(j) && j.length) { IMP = j; writeAids(); } }).catch(() => { loadImp.p = null; }); }
const AID = { e: null, i: -1, mem: false }; // das neue Blatt, für das Impuls und Erinnerung gelten; i < 0 = Impuls des Tages
const doyOf = (k) => { const d = parseKey(k); return Math.round((d - new Date(d.getFullYear(), 0, 1)) / 864e5) + 1; };
const typo = (t) => String(t || '').replace(/"([^"]*)"/g, '„$1“').replace(/ - /g, ' – ').replace(/\.\.\./g, '…');
function greetWord() { const h = new Date().getHours(); return (h >= 5 && h < 11 ? 'Guten Morgen' : h >= 11 && h < 17 ? 'Guten Tag' : 'Guten Abend') + '.'; }
function acceptGreet() { // Vorschlag übernehmen: die Anrede wird echte erste Zeile, die Schreibmarke steht in der neuen zweiten
  const b = $('eBody'), g = b.dataset.g; if (!g || !b.classList.contains('mt')) return false;
  setBody(g + '\n'); b.focus({ preventScroll: true });
  const r = document.createRange(), l = b.lastChild; r.setStart(l, 0); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  onEdit(); return true;
}
function closeHTML(e) { // Schlusszeile: Uhrzeit · Ort, Wetter · Sonne
  const d = new Date(e.created), p = [pad(d.getHours()) + ':' + pad(d.getMinutes())];
  if (e.wx) p.push(esc(e.wx));
  if (e.sun) { const m = /^(\S+)\s+[–-]\s+(\S+)$/.exec(e.sun); p.push('<span class="sb">' + SUNI + (m ? '↑ ' + esc(m[1]) + ' ↓ ' + esc(m[2]) : esc(e.sun)) + '</span>'); }
  return p.join(' · ');
}
const impIdx = () => AID.i >= 0 ? AID.i : (doyOf(S.cur.date) - 1) % IMP.length;
function paintImp() { // Wörter bauen sich gestaffelt auf, danach zieht sich die Haarlinie neu auf
  const e = S.cur, i = impIdx(), c = IMP[i], d = parseKey(e.date), ph = $('eImpPh'), pb = $('eImpT');
  $('eImpK').textContent = (AID.i < 0 ? 'Impuls des Tages · ' : 'Impuls · ') + d.getDate() + '. ' + MONTHS[d.getMonth()];
  $('eImpNo').textContent = 'Nº ' + (i + 1);
  const ws = typo(c.t).split(' ');
  ph.classList.add('pre'); ph.classList.remove('out');
  pb.innerHTML = ws.map((w, k) => '<span class="wq" style="transition-delay:' + (k * 45) + 'ms">' + esc(w) + '</span>').join(' ');
  $('eImpS').textContent = typo(c.q);
  ph.querySelector('.irl').style.transitionDelay = (ws.length * 45 + 250) + 'ms';
  fitImp();
  $('eImp').dataset.for = e.created + '|' + i;
  void ph.offsetWidth; ph.classList.remove('pre');
}
function fitImp() { // immer drei Zeilen: lange Impulse eine oder zwei Stufen kleiner
  const pb = $('eImpT'); if ($('eImp').classList.contains('wr')) return;
  pb.style.transition = 'none'; pb.classList.remove('sm', 'xs'); if (pb.scrollHeight > pb.clientHeight + 1) { pb.classList.add('sm'); if (pb.scrollHeight > pb.clientHeight + 1) { pb.classList.remove('sm'); pb.classList.add('xs'); } }
  void pb.offsetWidth; pb.style.transition = '';
}
function fitImpSmall(box) { // kleiner Impuls: Höhe passt genau zum Text (keine Lücke bis #eBody), Wert für CSS-Übergang
  const c = box.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id')); c.classList.add('wr');
  c.style.cssText = 'position:absolute;left:0;right:0;visibility:hidden;pointer-events:none;transition:none';
  const pb = c.querySelector('.pbox'); pb.style.cssText = 'height:auto;transition:none'; pb.querySelectorAll('.wq').forEach((w) => { w.style.transition = 'none'; });
  box.parentNode.insertBefore(c, box); const h = Math.round(pb.getBoundingClientRect().height); c.remove();
  if (h > 0) box.style.setProperty('--wh', h + 'px');
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!$('eImp').hidden) fitImp(); });
function impNext() { // anderer Impuls: Wörter verschwimmen raus, die neuen bauen sich auf – mehrfaches Tippen ist erlaubt
  if (!IMP || !S.cur) return; const ph = $('eImpPh'), cur = impIdx(); let ni = cur;
  while (ni === cur) ni = Math.floor(Math.random() * IMP.length);
  AID.i = ni; clearTimeout(impNext.t);
  const ws = ph.querySelectorAll('.wq'); ws.forEach((w, k) => { w.style.transitionDelay = (k * 18) + 'ms'; });
  ph.querySelector('.irl').style.transitionDelay = '0ms'; ph.classList.remove('pre'); ph.classList.add('out');
  impNext.t = setTimeout(paintImp, 300 + ws.length * 18);
}
function yearAgo(k) { const d = parseKey(k); const y = new Date(d.getFullYear() - 1, d.getMonth(), d.getDate()); if (y.getMonth() !== d.getMonth()) return null; const L = S.byDate.get(keyOf(y)); return L && L.length ? L[L.length - 1] : null; }
const SUNI = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 18h18M7 14a5 5 0 0 1 10 0"/></svg>';
/* Haptik iPhone (iOS 18+, Regel 4): ein versteckter Schalter <input switch> gibt beim Umschalten ein leises Tippen. Scheitert leise. */
function haptic() { try { if (isDesktop() || !matchMedia('(pointer:coarse)').matches) return; const l = $('hapL'); if (!l) return; const prev = document.activeElement; l.click(); const i = l.querySelector('input'); i.blur(); if (prev && prev !== document.body && prev !== i && prev.focus) prev.focus({ preventScroll: true }); } catch (e) {} } // Fokus nie behalten
$('hapL').addEventListener('click', (e) => e.stopPropagation());
