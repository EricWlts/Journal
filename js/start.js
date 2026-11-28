// Start (läuft zuletzt)
'use strict';
/* ---------- start ---------- */
(async function start() {
  try { await DB.open(); S.entries = await DB.all('entries'); } catch (e) { console.error(e); toast('Speicher nicht verfügbar'); }
  reindex();
  const t = today(); S.cal.y = S.side.y = t.getFullYear(); S.cal.m = S.side.m = t.getMonth();
  renderHome();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { renderWeek(); renderSide(); });
  Sync.load(); Sync.soon(400);
  setInterval(() => { if (!document.hidden) Sync.run(); }, 30000);
  window.addEventListener('online', () => Sync.soon(300));
  if (isDesktop()) { S.stack = ['home', 'entry']; openEntry((S.byDate.get(keyOf(t)) || [])[0] || draftFor(keyOf(t))); }
  applyStack();
  matchMedia('(min-width: 960px)').addEventListener('change', () => {
    if (isDesktop() && S.stack[1] !== 'entry') { S.stack.splice(1, 0, 'entry'); if (!S.cur) openEntry(draftFor(keyOf(today()))); }
    applyStack(); renderHome();
  });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => { // neue Version verfügbar
      if (!hadController) return;
      if (typing()) { toast('Neue Version – wird beim nächsten Öffnen geladen'); return; }
      saveCur(); location.reload();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {}); });
  }
  let lastDay = keyOf(today()); setInterval(() => { const k = keyOf(today()); if (k !== lastDay) { lastDay = k; renderHome(); } }, 60000);
})();
