// Mac-Scrollleiste, Fokus und Tastatur, Pull-to-refresh, Sticky-Titel, Umklappen Monat/Woche
'use strict';
/* Mac: eigene, ruhige Scroll-Leiste neben der Liste. Erscheint beim Scrollen oder wenn die Maus an den Rand kommt und bleibt ein paar Sekunden.
   Fährt man darüber oder zieht daran, zeigt sie die Jahre als Legende; beim Ziehen und schnellen Scrollen wandert der Monat als kleine Pille mit. */
(function rail() {
  /* Mac: scrollt die Liste selbst. iPhone (Teil 2, 25.11.2026): scrollt die ganze Startseite – die Leiste beginnt dann an der Oberkante der Liste
     (wandert beim Einklappen mit hoch bis unter den Kopf) und endet über dem unteren Rand; der helle iOS-Balken ist ausgeblendet. */
  const L = $('list'), HOME = $('home'), R = document.createElement('div'); R.className = 'rail'; R.setAttribute('aria-hidden', 'true');
  R.innerHTML = '<div class="rail-y"></div><div class="rail-t"></div>'; document.body.appendChild(R);
  const Y = R.children[0], T = R.children[1], M = document.createElement('div'); M.className = 'scrub'; M.setAttribute('aria-hidden', 'true'); document.body.appendChild(M);
  const samples = []; let H = 0, th = 0, top = 0, thumbY = 0, hideT = null, mT = null, drag = null, near = false, lastY = 0, lastT = 0, yKey = '', mTxt = '';
  const SC = () => (isDesktop() ? L : HOME);
  const safeB = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-b')) || 0;
  function edge() { // Oberkante, an der die Liste sichtbar beginnt (iPhone: unter dem eingeklappten Kopf)
    if (isDesktop()) return L.getBoundingClientRect().top;
    const bar = $('stickyTitle'); return bar.getBoundingClientRect().bottom + (bar.classList.contains('stuck') ? 14 : 0);
  }
  const ok = () => { const sc = SC(); return (isDesktop() ? S.stack[0] === 'home' : S.stack.length === 1 && S.stack[0] === 'home') && sc.scrollHeight > sc.clientHeight + 4 && L.querySelector('.row'); };
  function geo() {
    const sc = SC(), ch = sc.clientHeight, sh = sc.scrollHeight;
    if (isDesktop()) { const r = L.getBoundingClientRect(); top = r.top + 4; H = r.height - 8; th = Math.max(36, H * ch / sh); R.style.transform = 'translate3d(' + Math.round(r.right - 15) + 'px,' + Math.round(top) + 'px,0)'; }
    else if (drag) { top = drag.top0; H = drag.H0; th = Math.max(44, H * ch / sh); } // beim Ziehen steht die Leiste still, auch wenn der Kopf einklappt
    else { const r = HOME.getBoundingClientRect(); top = Math.max(L.getBoundingClientRect().top, edge()) + 10; H = Math.max(60, window.innerHeight - safeB() - 18 - top); th = Math.max(44, H * ch / sh); R.style.transform = 'translate3d(' + Math.round(r.right - 26) + 'px,' + Math.round(top) + 'px,0)'; }
    R.style.height = H + 'px';
    return { ch, sh };
  }
  function place() {
    const sc = SC(), { ch, sh } = geo(), y = (sh > ch ? sc.scrollTop / (sh - ch) : 0) * (H - th);
    T.style.height = th + 'px'; T.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)'; thumbY = y;
    return top + y + th / 2;
  }
  function years() { // Jahresanfänge als Legende, an der Stelle, an der der Daumen stünde
    const sc = SC(), { ch, sh } = geo(), key = S.listHTML + '|' + sh + '|' + H + '|' + isDesktop(); if (key === yKey) return; yKey = key;
    // Zielposition: die erste Karte des Jahres steht knapp unter der Kante (iPhone: unter dem eingeklappten Kopf)
    const st = getComputedStyle($('stickyTitle')), stuckEdge = isDesktop() ? 0 : (parseFloat(st.top) || 0) + $('stickyTitle').offsetHeight + 14 - HOME.getBoundingClientRect().top;
    const base = sc.getBoundingClientRect().top - sc.scrollTop; let last = '', lastPos = -99, h = '';
    for (const row of L.querySelectorAll('.row')) {
      if (!row.offsetParent) continue; const yr = row.dataset.date.slice(0, 4); if (yr === last) continue; last = yr;
      const target = Math.min(Math.max(0, row.getBoundingClientRect().top - base - 8 - stuckEdge), sh - ch), pos = target / (sh - ch) * (H - th) + th / 2;
      if (pos - lastPos < 24) continue; lastPos = pos;
      h += '<button class="ry" data-y="' + target + '" style="top:' + pos.toFixed(1) + 'px">' + yr + '</button>';
    }
    Y.innerHTML = h;
  }
  function show(ms) { if (!ok()) return; R.classList.add('on'); clearTimeout(hideT); hideT = setTimeout(() => { if (!drag && !near) R.classList.remove('on', 'legend'); }, ms || 2600); }
  function rowAtEdge() {
    if (isDesktop()) return topRowOfList();
    const e = edge() + 6; for (const r of L.querySelectorAll('.row')) { const b = r.getBoundingClientRect(); if (b.bottom > e) return r; } return null;
  }
  function month(cy) {
    const row = rowAtEdge(); if (row) { const d = parseKey(row.dataset.date), t = MONTHS[d.getMonth()] + ' <i>' + d.getFullYear() + '</i>'; if (t !== mTxt) { mTxt = t; M.innerHTML = t; } }
    const right = isDesktop() ? L.getBoundingClientRect().right - 26 : HOME.getBoundingClientRect().right - 34;
    M.style.transform = 'translate3d(' + Math.round(right) + 'px,' + Math.round(cy) + 'px,0) translate(-100%,-50%)';
    M.leaving = false; M.classList.add('on'); clearTimeout(mT); mT = setTimeout(() => { if (!drag) M.classList.remove('on'); }, 900);
  }
  function onScroll(e) {
    if (e.currentTarget !== SC() || !ok()) { if (!isDesktop() && e.currentTarget === HOME) { R.classList.remove('on', 'legend'); M.classList.remove('on'); } return; }
    const sc = SC(), cy = place();
    if (!isDesktop() && sc.scrollTop < 8 && !drag) { R.classList.remove('on'); return; } // ganz oben: keine Leiste (wie iOS)
    show(isDesktop() ? 2600 : 1600);
    // Monats-Pille nur beim Ziehen oder wirklich schnellen Scrollen: Tempo über die letzten ~120 ms geglättet (einzelne Sprünge zählen nicht);
    // ist sie da, bleibt sie nur, solange es schnell weitergeht – beim normalen Lesen-Scrollen verschwindet sie sofort
    const now = performance.now(); samples.push([now, sc.scrollTop]); while (samples.length > 2 && now - samples[0][0] > 120) samples.shift();
    const dt = now - samples[0][0], v = dt > 40 ? Math.abs(sc.scrollTop - samples[0][1]) / dt : 0; lastY = sc.scrollTop; lastT = now;
    const fast = isDesktop() ? 4 : 2.2, keep = isDesktop() ? 2 : 1.2;
    if (drag || v > fast || (M.classList.contains('on') && v > keep)) month(cy);
    else if (M.classList.contains('on') && !drag && !M.leaving) { M.leaving = true; clearTimeout(mT); mT = setTimeout(() => M.classList.remove('on'), 200); }
  }
  L.addEventListener('scroll', onScroll, { passive: true }); HOME.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('mousemove', (e) => { // Maus nah am rechten Rand der Liste: Leiste kommt und bleibt, solange sie dort ist
    if (!isDesktop() || drag) return; const r = L.getBoundingClientRect();
    const n = e.clientX > r.right - 34 && e.clientX < r.right + 6 && e.clientY > r.top && e.clientY < r.bottom;
    if (n !== near) { near = n; if (n && ok()) { place(); years(); R.classList.add('legend'); show(); } else if (!n) { R.classList.remove('legend'); show(1400); } }
  }, { passive: true });
  R.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.ry')) return; e.preventDefault(); const { ch, sh } = geo();
    place(); const ty = thumbY + top, inThumb = e.clientY >= ty - 10 && e.clientY <= ty + th + 10;
    if (!isDesktop() && !inThumb) return; // iPhone: nur der Daumen ist greifbar – ein Tipp daneben soll nicht springen
    drag = { off: inThumb ? Math.max(0, Math.min(th, e.clientY - ty)) : th / 2, ch, sh, top0: top, H0: H }; R.setPointerCapture(e.pointerId); R.classList.add('drag', 'legend'); years();
    if (!isDesktop() && navigator.vibrate) try { navigator.vibrate(8); } catch (err) {}
    move(e);
  });
  function move(e) { if (!drag) return; const f = Math.max(0, Math.min(1, (e.clientY - drag.top0 - drag.off) / (drag.H0 - th))); SC().scrollTop = f * (drag.sh - drag.ch); }
  R.addEventListener('pointermove', move);
  const end = () => { if (!drag) return; drag = null; R.classList.remove('drag'); if (!near) R.classList.remove('legend'); show(); clearTimeout(mT); mT = setTimeout(() => M.classList.remove('on'), 700); };
  R.addEventListener('pointerup', end); R.addEventListener('pointercancel', end);
  Y.addEventListener('click', (e) => { const b = e.target.closest('.ry'); if (b) SC().scrollTo({ top: +b.dataset.y, behavior: 'smooth' }); });
  window.addEventListener('resize', () => { yKey = ''; if (R.classList.contains('on')) place(); });
  S.hideRail = () => { R.classList.remove('on', 'legend'); M.classList.remove('on'); };
})();
$('confirm').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeConfirm(); closeRow(); } });
$('home').addEventListener('scroll', () => { if (S.openRow) closeRow(); }, { passive: true });
function focusEnd(el) { el.focus({ preventScroll: true }); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
$('eBody').addEventListener('input', onEdit);
$('eBody').addEventListener('paste', (e) => { // nur reiner Text
  e.preventDefault(); const txt = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, txt);
});
$('eBody').addEventListener('drop', (e) => { const txt = e.dataTransfer && e.dataTransfer.getData('text/plain'); e.preventDefault(); if (txt) document.execCommand('insertText', false, txt); });
$('eBody').addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && /^[biu]$/i.test(e.key)) e.preventDefault(); }); // keine Formatierung – nur Text
$('eBody').addEventListener('beforeinput', (e) => { if (/^format/.test(e.inputType)) e.preventDefault(); });
$('eBody').addEventListener('blur', () => { const b = $('eBody'); if (b.firstChild && b.firstChild.nodeType === 3) setBody(bodyText(b)); }); // ordnen, sobald nicht mehr geschrieben wird (Initiale braucht eine erste Zeile)
document.addEventListener('visibilitychange', () => { if (document.hidden) saveCur(); else { renderHome(); Sync.soon(200); } });
window.addEventListener('pagehide', saveCur);

/* iOS schiebt beim Fokussieren manchmal den ganzen App-Rahmen – zurücksetzen */
$('app').addEventListener('scroll', () => { const a = $('app'); if (a.scrollLeft || a.scrollTop) { a.scrollLeft = 0; a.scrollTop = 0; } });
window.addEventListener('scroll', () => { if (window.scrollX) window.scrollTo(0, window.scrollY); });
for (const v of ['home', 'calendar', 'entry', 'settings']) $(v).addEventListener('scroll', (e) => { if (e.target.scrollLeft) e.target.scrollLeft = 0; });

/* Schreib-Modus: Knopf zeigt Haken statt Pfeil; Knopf bleibt über der Tastatur */
for (const ev of ['pointerdown', 'mousedown']) for (const id of ['entryBtn', 'doneBtn']) $(id).addEventListener(ev, (e) => e.preventDefault()); // Fokus nicht vorzeitig verlieren
{
  $('eBody').addEventListener('focus', () => $('entry').classList.add('is-typing'));
  $('eBody').addEventListener('blur', () => setTimeout(() => { if (!typing()) $('entry').classList.remove('is-typing'); }, 0));
}
if (window.visualViewport) {
  const kb = () => { const v = window.visualViewport; const h = Math.max(0, window.innerHeight - v.height - v.offsetTop); document.documentElement.style.setProperty('--kb', (h > 80 ? h : 0) + 'px'); document.documentElement.style.setProperty('--vvtop', Math.max(0, Math.round(v.offsetTop)) + 'px'); };
  visualViewport.addEventListener('resize', kb); visualViewport.addEventListener('scroll', kb);
}

window.addEventListener('resize', () => { resetTrack($('weektrack')); resetTrack($('caltrack')); resetTrack($('sctrack')); });

/* runder Knopf weicht beim Runterscrollen aus und kommt beim Hochscrollen zurück */
for (const v of ['home', 'calendar', 'entry', 'settings']) {
  const view = $(v), btn = view.querySelector('.floatbtn'); let last = 0;
  view.addEventListener('scroll', () => {
    if (v === 'home' && isDesktop()) return;
    const y = view.scrollTop, atEnd = y + view.clientHeight >= view.scrollHeight - 8;
    if (typing()) btn.classList.remove('away');
    else if (y > last + 6 && y > 40 && !atEnd) btn.classList.add('away');
    else if (y < last - 6 || atEnd || y <= 40) btn.classList.remove('away');
    last = y;
  }, { passive: true });
}

/* iPhone: im weichen Auslauf unten ein kleiner Pfeil nach oben – erscheint, sobald man ein Stück gescrollt hat, und bringt einen ganz nach oben */
(function toTop() {
  const UP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 18.5V6M6.5 11.5L12 6l5.5 5.5"/></svg>';
  const views = ['home', 'settings'].map((v) => {
    const view = $(v), b = document.createElement('button'); b.className = 'totop'; b.setAttribute('aria-label', 'Nach oben'); b.tabIndex = -1; b.innerHTML = UP;
    view.appendChild(b);
    const upd = () => { const on = !isDesktop() && view.scrollTop > Math.max(500, view.clientHeight * 0.9) && S.stack[S.stack.length - 1] === v && !typing(); if (on !== b.classList.contains('on')) { b.classList.toggle('on', on); b.tabIndex = on ? 0 : -1; } };
    view.addEventListener('scroll', upd, { passive: true });
    b.addEventListener('click', (e) => { e.stopPropagation(); b.classList.remove('on'); view.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
    return upd;
  });
  S.syncTop = () => views.forEach((f) => f());
})();

/* Startseite: nach unten ziehen = aktualisieren */
(function yearSwipe() { // iPhone, im Jahr: waagerecht = Jahr wechseln (Tage folgen gedämpft ×0,38), nach oben = zurück in den Monat; die Geste gehört ganz der Jahresebene
  const home = $('home'); let y0 = null, x0 = 0, t0 = 0, mode = null, v = 0, lx = 0, lt = 0;
  const reset = () => { const l = $('yearlay'); l.classList.remove('dragging'); l.style.removeProperty('--dx'); l.style.removeProperty('--do'); };
  home.addEventListener('touchstart', (e) => { mode = null; y0 = S.yr && e.touches.length === 1 ? e.touches[0].clientY : null; x0 = lx = e.touches[0].clientX; t0 = lt = performance.now(); v = 0; }, { passive: true });
  home.addEventListener('touchmove', (e) => {
    if (y0 == null || !S.yr) return; const dy = e.touches[0].clientY - y0, dx = e.touches[0].clientX - x0, n = performance.now(); v = (e.touches[0].clientX - lx) / Math.max(1, n - lt); lx = e.touches[0].clientX; lt = n;
    if (mode !== 'x') { if (dy < -28 && Math.abs(dy) > Math.abs(dx) * 1.5) { mode = 'up'; y0 = null; yrLeave(S.hm.m); return; } if (!mode) { if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) mode = 'x'; else if (Math.abs(dy) > 12) mode = 'y'; } } // 'y' bleibt Kandidat für „nach oben“ (kleine Schritte)
    if (e.cancelable && mode) e.preventDefault();
    if (mode === 'x' && !trackBusy) { const l = $('yearlay'); l.classList.add('dragging'); l.style.setProperty('--dx', (dx * 0.38).toFixed(1) + 'px'); l.style.setProperty('--do', Math.max(0.25, 1 - Math.abs(dx) / 420).toFixed(3)); }
  }, { passive: false });
  const end = (e) => {
    if (mode !== 'x' || !S.yr) { mode = null; return; }
    const dx = (e.changedTouches ? e.changedTouches[0].clientX : lx) - x0; mode = null;
    if (!trackBusy && (Math.abs(dx) > 70 || Math.abs(v) > 0.5)) yrMove(dx < 0 ? 1 : -1);
    else { const l = $('yearlay'), d = l.style.getPropertyValue('--dx') || '0px', o = l.style.getPropertyValue('--do') || '1'; reset(); l.querySelectorAll('.yz').forEach((c) => c.animate([{ transform: 'translate3d(' + d + ',0,0)', opacity: o }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' })); }
  };
  home.addEventListener('touchend', end, { passive: true }); home.addEventListener('touchcancel', () => { mode = null; reset(); }, { passive: true });
})();
(function searchSwipeClose() { // iPhone: bei offener Suche am Listenanfang nach unten wischen schließt sie (Ziehen-zum-Aktualisieren ist dann aus)
  const home = $('home'); let x0 = 0, y0 = null;
  home.addEventListener('touchstart', (e) => { y0 = !isDesktop() && S.dsearch && home.scrollTop <= 8 && e.touches.length === 1 ? e.touches[0].clientY : null; x0 = e.touches[0].clientX; }, { passive: true });
  home.addEventListener('touchmove', (e) => {
    if (y0 == null) return; const dy = e.touches[0].clientY - y0, dx = e.touches[0].clientX - x0;
    if (dy > 90 && dy > Math.abs(dx) * 1.8 && home.scrollTop <= 8) { y0 = null; deskSearch(false); }
  }, { passive: true });
})();
(function pullToRefresh() {
  const home = $('home'), ptr = $('ptr'); const TH = 80; let y0 = null, x0 = 0, dist = 0, busy = false;
  home.addEventListener('touchstart', (e) => { if (busy || isDesktop() || S.yr || S.dsearch || home.scrollTop > 0 || e.touches.length !== 1) { y0 = null; return; } y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dist = 0; }, { passive: true });
  home.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    if (Math.abs(e.touches[0].clientX - x0) > Math.abs(e.touches[0].clientY - y0)) { dist = 0; return; } // waagerecht (Monat wechseln) ist kein Ziehen zum Aktualisieren
    dist = e.touches[0].clientY - y0;
    if (dist <= 0 || home.scrollTop > 0) { if (dist <= 0) { ptr.classList.remove('pulling', 'ready'); ptr.style.opacity = ''; ptr.style.transform = ''; } return; }
    const p = Math.min(1, dist / TH);
    ptr.classList.add('pulling'); ptr.classList.toggle('ready', p >= 1);
    ptr.style.setProperty('--p', p.toFixed(3)); ptr.style.opacity = String(Math.min(1, p * 1.6)); ptr.style.transform = 'translateY(' + (-14 + 18 * p) + 'px)';
  }, { passive: true });
  async function release() {
    if (y0 == null) return; y0 = null;
    ptr.classList.remove('pulling');
    if (dist < TH) { ptr.classList.remove('ready'); ptr.style.opacity = ''; ptr.style.transform = ''; ptr.style.removeProperty('--p'); return; }
    busy = true; ptr.classList.add('spin'); ptr.style.opacity = '1'; ptr.style.transform = 'translateY(4px)';
    const t0 = Date.now();
    try { await saveCur(); if (Sync.on()) await Sync.run(true); renderHome(); } catch (e) {}
    setTimeout(() => { ptr.style.opacity = ''; ptr.style.transform = ''; setTimeout(() => { ptr.classList.remove('spin', 'ready'); ptr.style.removeProperty('--p'); busy = false; }, 350); }, Math.max(0, 700 - (Date.now() - t0)));
  }
  home.addEventListener('touchend', release, { passive: true });
  home.addEventListener('touchcancel', release, { passive: true });
})();

function fitStuck(stuck) { // eingeklappt: Titel so weit verkleinern, dass er die Lupe nicht berührt
  for (const h of [$('homeTitle'), $('homeTitleNext')]) {
    const t = h.querySelector('.t'), y = h.querySelector('.y'); if (!t || !y) continue;
    const w = t.offsetWidth + 12 + y.offsetWidth, room = $('stickyTitle').clientWidth - 24 - 58;
    const k = stuck && w > room ? Math.max(0.7, room / w) : 1;
    h.style.scale = k < 1 ? k.toFixed(3) : '';
  }
}
/* Monatstitel an die Liste gekoppelt: kommt der kleine Monat der Liste unten an der Kante an,
   schiebt sich der große Monat im selben Tempo nach oben weg und der neue gleitet von unten nach. */
const monthLabel = (mk) => { const d = parseKey(mk + '-01'); return MONTHS[d.getMonth()] + '|' + d.getFullYear(); };
function listMonthAt(edge) { // aktueller Monat an der Kante + der nächste kleine Monat darunter samt Fortschritt
  const L = $('list'), Z = 96; let cur = null, next = null, p = 0;
  for (const s of L.querySelectorAll('.sep[data-month]')) {
    const top = s.getBoundingClientRect().top;
    if (top <= edge) cur = s.dataset.month;
    else { if (top < edge + Z) { next = s.dataset.month; p = 1 - (top - edge) / Z; } break; }
  }
  if (!cur) { const r = L.querySelector('.row'); cur = r ? r.dataset.date.slice(0, 7) : null; }
  return { cur: cur && monthLabel(cur), next: next && monthLabel(next), p };
}
function setTitleNow(label) {
  const h = $('homeTitle'), [m, y] = label.split('|'); const t = h.querySelector('.t'), yy = h.querySelector('.y');
  if (t && yy && (t.dataset.to || t.textContent) === m && (yy.dataset.to || yy.textContent) === y) return false;
  h.innerHTML = titleHTML(m, y); return true;
}
function linkTitle(next, p) {
  const h = $('homeTitle'), n = $('homeTitleNext');
  if (next && n.dataset.l !== next) { const [m, y] = next.split('|'); n.innerHTML = titleHTML(m, y); n.dataset.l = next; }
  const e = p * p * (3 - 2 * p), D = 34; // weich beschleunigen und abbremsen
  h.style.translate = e ? '0 ' + (-e * D).toFixed(1) + 'px' : ''; h.style.opacity = e ? String(Math.max(0, 1 - e * 1.5).toFixed(3)) : '';
  n.style.translate = '0 ' + ((1 - e) * D).toFixed(1) + 'px'; n.style.opacity = next ? String(Math.max(0, (e - 0.25) / 0.75).toFixed(3)) : '0';
}
/* Startseite: Monatstitel bleibt oben stehen und folgt dem Monat der Einträge darunter */
(function stickyTitle() {
  const home = $('home'), bar = $('stickyTitle'); let raf = 0, shown = '';
  function update() {
    raf = 0;
    const barRect = bar.getBoundingClientRect(), homeRect = home.getBoundingClientRect();
    const stuck = home.scrollTop > 0 && barRect.top <= homeRect.top + (parseFloat(getComputedStyle(bar).top) || 0) + 0.5;
    bar.classList.toggle('stuck', stuck); bar.querySelector('.stickysearch').tabIndex = stuck ? 0 : -1;
    home.classList.toggle('sqstuck', stuck && !!S.dsearch && !isDesktop()); // Suche + eingeklappt: das Feld rückt an die Stelle des Titels
    if (!isDesktop()) fitStuck(stuck);
    let label = isDesktop() ? (S.listTitle || S.sideTitle) : S.weekTitle;
    if (isDesktop()) {
      if (!label) return; shown = label;
      if (S.listTitle) setTitleNow(label); else { linkTitle(null, 0); animTitle(label, S.titleDir || 0, S.titleVert); }
      S.titleDir = 0; S.titleVert = false; return;
    }
    // Monatsblock: --p (0 offen … 1 eingeklappt) kommt direkt aus der Scrollposition, damit die Zeilen 1:1 dem Finger folgen
    const wk = $('weekwrap'), tb = bar.offsetHeight;
    if (tb && S.tb !== tb) { S.tb = tb; home.style.setProperty('--tb', tb + 'px'); }
    const safeT = parseFloat(getComputedStyle(bar).top) || 0, hero = home.querySelector(':scope > .hero');
    const skyEl = $('skyH'), skyH = skyEl ? skyEl.offsetHeight : 0;
    const d0 = S.d0 = (hero ? Math.max(0, hero.offsetHeight - safeT) : 0) + skyH; // so weit scrollt der obere Streifen (und die Mondzeile) weg, bevor der Monat einklappt
    if (skyEl) { const yb = $('yLineW').getBoundingClientRect().bottom, sr = skyEl.getBoundingClientRect(); const f = Math.max(0, Math.min(1, (sr.bottom - 12 - yb) / Math.max(1, sr.height - 12))); skyEl.style.opacity = f < 1 ? (f * f).toFixed(3) : ''; }
    const p = Math.max(0, Math.min(1, (home.scrollTop - d0) / (S.hch || HM_CH)));
    if (p !== S.hp) {
      const was = (S.hp || 0) > 0.999; S.hp = p; wk.style.setProperty('--p', p.toFixed(4));
      const col = p > 0.5; if (col !== wk.classList.contains('col')) { wk.classList.toggle('col', col); hmPill(); }
      if ((p > 0.999) !== was) hmPill();
    }
    // was unter den Monatsblock gleitet, blendet weich aus – keine halben Ringe oder Punkte unter dem Monat
    const blockBottom = Math.max(barRect.bottom, wk.getBoundingClientRect().bottom);
    const heroR = home.querySelector(':scope > .herorest'); // Band mit runden Ecken erst, wenn Zählzeile und Kapsel ganz unter dem Block sind
    const pin = p > 0.999 && !!heroR && heroR.getBoundingClientRect().bottom <= blockBottom + 28;
    if (pin !== wk.classList.contains('pinned')) { wk.classList.toggle('pinned', pin); hmPill(); }
    for (const [el, pt, pb] of [[$('todayLine'), 0, 0], [document.querySelector('#home .herofoot'), 6, 6]]) {
      if (!el) continue; const r = el.getBoundingClientRect(), t0 = r.top + pt, b0 = r.bottom - pb;
      const f = Math.max(0, Math.min(1, (b0 - blockBottom) / Math.max(1, b0 - t0)));
      el.style.opacity = f < 1 ? (f * f).toFixed(3) : '';
    }
    const edge = blockBottom + (stuck ? 14 : 0);
    let link = { next: null, p: 0 };
    if (stuck && $('list').getBoundingClientRect().top < edge) { link = listMonthAt(edge); if (link.cur) label = link.cur; }
    S.listLinked = !!(stuck && link.cur && link.p !== undefined && $('list').getBoundingClientRect().top < edge);
    if (label && label !== shown) { shown = label; if (setTitleNow(label)) fitStuck(stuck); }
    linkTitle(link.next, link.p);
  }
  home.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  S.updateHomeTitle = () => { shown = ''; update(); };
  S.updateHomeTitleSoft = () => update();
})();

/* iPhone: Monat ⇄ Woche. Das Einklappen folgt dem Finger 1:1 (--p aus der Scrollposition, siehe stickyTitle); lässt man in der Mitte los,
   gleitet es ganz zu oder ganz auf – Schwung zählt, ohne Schwung entscheidet die Hälfte. Ganz oben nach oben scrollen klappt wieder auf. */
(function monthSnap() {
  const home = $('home'); let touching = false, t = 0, tw = 0, y1 = 0, t1 = 0, v = 0;
  const bez = (x1, y1_, x2, y2) => (x) => { // cubic-bezier wie --sheet
    let a = 0, b = 1, m = 0; for (let i = 0; i < 18; i++) { m = (a + b) / 2; const cx = 3 * (1 - m) * (1 - m) * m * x1 + 3 * (1 - m) * m * m * x2 + m * m * m; if (cx < x) a = m; else b = m; }
    return 3 * (1 - m) * (1 - m) * m * y1_ + 3 * (1 - m) * m * m * y2 + m * m * m;
  };
  const sheet = bez(0.32, 0.72, 0, 1);
  const stop = () => { if (tw) { cancelAnimationFrame(tw); tw = 0; } };
  function tween(to) {
    stop(); const from = home.scrollTop, t0 = performance.now(), D = 550; // --t3
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { home.scrollTop = to; return; }
    (function step(now) { const k = Math.min(1, (now - t0) / D); home.scrollTop = from + (to - from) * sheet(k); tw = k < 1 ? requestAnimationFrame(step) : 0; })(t0);
  }
  function settle() {
    t = 0; if (touching || isDesktop() || tw) return;
    const p = S.hp || 0; if (p <= 0.001 || p >= 0.999) return;
    const toCol = Math.abs(v) > 0.3 ? v > 0 : p > 0.5; // v > 0: Finger bewegt sich nach oben (Liste läuft nach unten)
    const target = toCol ? home.scrollTop + (1 - p) * (S.hch || HM_CH) : 0;
    tween(Math.max(0, target));
  }
  S.foldMonth = () => { if (!isDesktop() && !S.yr && (S.hp || 0) < 0.999) tween((S.d0 || 0) + (S.hch || HM_CH)); }; // Suche: Monat weich zur Woche einklappen
  const arm = () => { clearTimeout(t); t = setTimeout(settle, 110); };
  home.addEventListener('scroll', () => { if (!isDesktop() && !tw) arm(); }, { passive: true });
  home.addEventListener('touchstart', (e) => { stop(); touching = true; clearTimeout(t); v = 0; y1 = e.touches[0].clientY; t1 = performance.now(); }, { passive: true });
  home.addEventListener('touchmove', (e) => { const y = e.touches[0].clientY, n = performance.now(); v = (y1 - y) / Math.max(1, n - t1); y1 = y; t1 = n; }, { passive: true });
  const up = () => { touching = false; if (performance.now() - t1 > 120) v = 0; arm(); };
  home.addEventListener('touchend', up, { passive: true }); home.addEventListener('touchcancel', up, { passive: true });
  home.addEventListener('wheel', () => { stop(); }, { passive: true });
})();

/* Mac: Liste und Kalender gehen zusammen */
function topRowOfList() {
  const L = $('list'), r = L.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + 60, r.top + 52); let row = el && el.closest('.row, .sep');
  if (row && row.classList.contains('sep')) row = row.nextElementSibling;
  return row && row.classList.contains('row') ? row : null;
}
function sideJump(next, manual, after) { // zu einem Zeitraum gleiten; der Zielinhalt liegt schon im Nachbarfeld bereit
  const cur = S.side; const dir = cur.mode === 'week' ? Math.sign(next.w - cur.w) : cur.mode === 'month' ? Math.sign((next.y * 12 + next.m) - (cur.y * 12 + cur.m)) : Math.sign(next.y - cur.y);
  if (!dir || trackBusy) return;
  if (manual) S.listTitle = null;
  sideMove(dir, next, 460, after);
}
function scrollListTo(id, gentle) { // Wischen/Pfeile: Eintrag wandert nach oben; Klick: nur nachführen, wenn er nicht ganz sichtbar ist
  if (!isDesktop() || !id) return; const L = $('list'), pad = 0;
  const row = L.querySelector('.row[data-id="' + CSS.escape(id) + '"]'); if (!row) return;
  let target;
  if (gentle) {
    const top = row.offsetTop - pad, bottom = row.offsetTop + row.offsetHeight + pad - L.clientHeight;
    if (L.scrollTop > top) target = top; else if (L.scrollTop < bottom) target = bottom; else return;
  } else {
    const prev = row.previousElementSibling;
    target = (prev && prev.classList.contains('sep') ? prev.offsetTop : row.offsetTop) - pad; // immer mit Luft zum dunklen Kopf
  }
  target = Math.max(0, Math.min(target, L.scrollHeight - L.clientHeight));
  if (Math.abs(L.scrollTop - target) < 2) return;
  S.autoScrollUntil = performance.now() + 900; L.scrollTo({ top: target, behavior: 'smooth' });
}
(function listSync() {
  /* Mac: der Kalender fährt beim Scrollen mit dem Finger ein (wie eine einfahrende Leiste in iOS).
     Erst wird die Leiste kleiner, dann scrollt die Liste. Nach oben: am Listenanfang fährt sie wieder aus. */
  const L = $('list'), cal = $('sidecal'), inner = cal.querySelector('.scinner'); let h = null, snapT = null, raf = 0;
  const full = () => inner.offsetHeight;
  function apply(nh, snap) {
    const f = full(); h = Math.max(0, Math.min(f, nh));
    cal.classList.toggle('snapping', !!snap);
    if (h >= f && snap) { cal.style.height = f + 'px'; clearTimeout(apply.t); apply.t = setTimeout(() => { if (h >= full()) { cal.classList.remove('snapping'); cal.style.height = ''; } }, 470); }
    else if (h >= f) { cal.style.height = ''; }
    else cal.style.height = h + 'px';
    const p = f ? h / f : 1;
    inner.style.transition = snap ? 'opacity .45s var(--sheet)' : 'none';
    inner.style.opacity = String(Math.max(0, (p - 0.25) / 0.75).toFixed(3));
    $('home').classList.toggle('cal-in', h <= 0.5);
    updateTitle();
  }
  function updateTitle() {
    if (raf) return; raf = requestAnimationFrame(() => {
      raf = 0; const on = L.scrollTop > 2 && $('home').classList.contains('cal-in');
      const link = on ? listMonthAt(L.getBoundingClientRect().top) : null;
      S.listTitle = link && link.cur ? link.cur : null;
      S.updateHomeTitleSoft && S.updateHomeTitleSoft();
      if (link) linkTitle(link.next, link.p);
    });
  }
  function settle() { // nach dem Loslassen sanft ganz ein- oder ausfahren
    const f = full(); if (h == null || h <= 0 || h >= f) return;
    apply(h > f * 0.5 && L.scrollTop <= 0 ? f : 0, true);
  }
  L.addEventListener('wheel', (e) => {
    if (!isDesktop() || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const f = full(); if (h == null) h = f;
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if (dy > 0 && h > 0) { e.preventDefault(); apply(h - dy); }
    else if (dy < 0 && L.scrollTop <= 0 && h < f) { e.preventDefault(); apply(h - dy); }
    else return;
    clearTimeout(snapT); snapT = setTimeout(settle, 160);
  }, { passive: false });
  L.addEventListener('scroll', () => { if (isDesktop()) updateTitle(); }, { passive: true });
  S.calExpand = () => apply(full(), true);
  S.calIsOpen = () => h == null || h >= full() - 0.5;
  S.calOpen = () => { // auf die volle Höhe der (neuen) Ansicht ausfahren – auch wenn die Ansicht gerade ihre Höhe ändert
    const sc = $('scview'), finalSc = cal.classList.contains('is-week') ? 80 : 312;
    const target = inner.offsetHeight - sc.offsetHeight + finalSc, from = cal.getBoundingClientRect().height;
    cal.classList.remove('snapping'); cal.style.height = from + 'px'; void cal.offsetWidth;
    cal.classList.add('snapping'); cal.style.height = target + 'px'; h = target;
    inner.style.transition = 'opacity .45s var(--sheet)'; inner.style.opacity = '1';
    $('home').classList.remove('cal-in'); updateTitle();
    clearTimeout(apply.t); apply.t = setTimeout(() => { cal.classList.remove('snapping'); cal.style.height = ''; h = full(); }, 520);
  };
  $('homeTitle').addEventListener('click', () => {
    if (!isDesktop()) { yrToggle(); return; } // iPhone: Monat ⇄ Jahr
    if ($('home').classList.contains('cal-in') || (h != null && h < full())) { // ausfahren, und zwar dort, wo die Liste gerade steht
      const row = topRowOfList();
      if (row) { const d = parseKey(row.dataset.date); if (S.side.mode === 'week') S.side.w = weekOf(d); else { S.side.y = d.getFullYear(); S.side.m = d.getMonth(); } }
      S.listTitle = null; renderSide(); updateSideSel(); apply(full(), true); return;
    }
    // Kalender offen: im Monat zoomt der Titel ins Jahr, im Jahr zurück in den Monat (wie am iPhone); in der Woche fährt er den Kalender ein (Woche/Monat/Jahr bleibt, wie es ist)
    if (S.side.mode === 'month') setSideMode('year'); else if (S.side.mode === 'year') setSideMode('month'); else apply(0, true);
  });
})();
