// Phase 5 · Stille Linie: Haarlinie des Monats unten im Blatt, Berühren zeigt die Tage mit Eintrag, Ziehen wechselt den Eintrag
'use strict';
(function line() {
  const entry = $('entry'); if (!entry) return;
  const el = document.createElement('div'); el.className = 'sline'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="sl-ln"></span><span class="sl-ts"></span><span class="sl-d"></span>';
  entry.appendChild(el);
  const ts = el.querySelector('.sl-ts'), lab = el.querySelector('.sl-d');
  let sig = '', days = [], n = 30, cur = 1, ym = '', hover = null, live = false, down = false, busy = false, want = null;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (d) => { const t = parseKey(ym + '-' + String(d).padStart(2, '0')); return WDLONG[t.getDay()] + ', ' + d + '. ' + MONTHS[t.getMonth()]; };
  const xOf = (d) => n > 1 ? (d - 1) / (n - 1) : 0;
  function layout() { // Mac: Breite und Lage der Textspalte aus den Layout-Maßen (unabhängig von Skalierung beim Öffnen); iPhone: per CSS
    if (!isDesktop()) { el.style.left = el.style.width = el.style.bottom = ''; return; }
    const b = $('eBody'), inner = $('entryInner'); if (!b.offsetWidth) return;
    const moved = getComputedStyle(entry).transform !== 'none', r = entry.getBoundingClientRect();
    const bx = moved ? 0 : r.left, by = moved ? 0 : innerHeight - r.bottom; // mit Transform am Blatt zählt das Blatt als Bezugsrahmen
    el.style.width = b.offsetWidth + 'px'; el.style.left = (bx + inner.offsetLeft + b.offsetLeft) + 'px'; el.style.bottom = (by + 6) + 'px';
  }
  function lineRender() {
    const e = S.cur; if (!e) return; const key = e.date || keyOf(new Date(e.created));
    ym = key.slice(0, 7); cur = +key.slice(8, 10);
    const d0 = parseKey(key); n = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
    const set = new Set([cur]); for (const k of S.byDate.keys()) if (k.slice(0, 7) === ym && (S.byDate.get(k) || []).length) set.add(+k.slice(8, 10));
    days = [...set].sort((a, b) => a - b);
    layout();
    const s = ym + '|' + days.join(',') + '|' + cur; if (s === sig) return; sig = s;
    ts.innerHTML = days.map((d) => '<i class="t' + (d === cur ? ' cur' : '') + '" data-d="' + d + '" style="left:calc(' + (xOf(d) * 100).toFixed(3) + '% - .5px);--d:' + (reduce() ? 0 : Math.abs(d - cur) * 16) + 'ms"></i>').join('');
  }
  window.lineRender = lineRender;
  const nearest = (cx) => { const r = el.getBoundingClientRect(), p = Math.max(0, Math.min(1, (cx - r.left) / (r.width || 1))), t = p * (n - 1) + 1; let b = days[0], bd = 1e9; for (const d of days) { const k = Math.abs(d - t); if (k < bd) { bd = k; b = d; } } return b; };
  function place(d) { // Datum mittig über dem Strich, im Blatt bleibend
    const r = el.getBoundingClientRect(); lab.textContent = fmt(d);
    const w = lab.offsetWidth, lo = isDesktop() ? 0 : 16 - r.left, hi = isDesktop() ? r.width : innerWidth - 16 - r.left;
    const x = Math.max(lo + w / 2, Math.min(hi - w / 2, xOf(d) * r.width));
    lab.style.left = x.toFixed(1) + 'px'; hover = d;
  }
  const show = (on) => { live = on; el.classList.toggle('live', on); };
  function pt(ev) { lineRender(); const d = nearest(ev.clientX); if (d !== hover) place(d); return d; }
  function go(d) { if (d === cur) return; const day = S.byDate.get(ym + '-' + String(d).padStart(2, '0')); if (day && day[0]) lineGo(day[0]); }
  const fade = (els, from, to, ms) => els.map((x) => x.animate([{ opacity: from }, { opacity: to }], { duration: ms, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }).finished.catch(() => {}));
  const body = () => [$('eBody'), $('ePhotos'), $('eClose')];
  async function lineGo(e) { // überblenden: alt 0,2 s aus, neu 0,5 s ein – nur Deckkraft; Ziffern rollen wie das Zählwerk
    if (e === S.cur) return; want = e; if (busy) return; busy = true;
    try {
      while (want && want !== S.cur) {
        const t = want; want = null; haptic();
        if (typing()) document.activeElement.blur();
        const rm = reduce(), els = body(), o = +getComputedStyle($('eBody')).opacity;
        if (o > 0) { await Promise.all(fade(els, o, 0, rm ? 80 : 200)); } els.forEach((x) => { x.style.opacity = '0'; });
        saveCur(true);
        const old = $('eDn').textContent; S.cur = t; if (t._savedSig === undefined) t._savedSig = sigOf(t);
        const p = renderEntry(0); $('eDn').dataset.v = old; setCount($('eDn'), new Date(t.created).getDate(), null);
        await p; lineRender();
        els.forEach((x) => { x.style.opacity = ''; }); await Promise.all(fade(els, 0, 1, rm ? 120 : 500));
      }
    } finally { busy = false; body().forEach((x) => { if (!want) x.style.opacity = ''; }); }
  }
  // Maus und Finger (Pointer-Events; die Fläche hat touch-action:none, die Blatt-Gesten ignorieren sie)
  el.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') { pt(ev); show(true); } });
  el.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse' && !down) show(false); });
  el.addEventListener('pointerdown', (ev) => {
    if (ev.button > 0) return; down = true; try { el.setPointerCapture(ev.pointerId); } catch (x) {}
    const d = pt(ev); show(true); if (ev.pointerType === 'mouse') go(d);
  });
  el.addEventListener('mousedown', (ev) => ev.preventDefault());
  el.addEventListener('pointermove', (ev) => { const d = pt(ev); if (!live) show(true); if (down && d !== cur) go(d); });
  const up = (ev) => { if (!down) return; down = false; if (ev.type === 'pointerup' && ev.pointerType !== 'mouse') go(hover); if (ev.pointerType !== 'mouse' || !el.matches(':hover')) show(false); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', (ev) => { if (down) up({ type: 'x', pointerType: ev.pointerType }); });
  addEventListener('resize', () => { if (S.cur) layout(); });
  entry.addEventListener('transitionend', (ev) => { if (ev.target === entry && S.cur) layout(); });
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (S.cur) layout(); }); ro.observe($('eBody')); ro.observe(entry); }
})();
