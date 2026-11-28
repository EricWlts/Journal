// Journal – Service Worker: macht die App offline nutzbar.
const VERSION = 'journal-v116';
const SHELL = ['./', 'index.html', 'styles.css', 'js/core.js', 'js/home.js', 'js/calendar.js', 'js/side.js', 'js/entry.js', 'js/sky.js', 'js/save.js', 'js/nav.js', 'js/ui.js', 'js/gestures.js', 'js/io.js', 'js/sync.js', 'js/start.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/icon-maskable-512.png', 'impulse.json', 'fonts/fonts.css', 'fonts/instrument-serif-latin-400-italic.woff2', 'fonts/instrument-serif-latin-400-normal.woff2', 'fonts/manrope-latin-400-normal.woff2', 'fonts/manrope-latin-500-normal.woff2', 'fonts/manrope-latin-600-normal.woff2', 'fonts/newsreader-latin-opsz-italic.woff2', 'fonts/newsreader-latin-opsz-normal.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Seite selbst: erst Netz (für Updates); antwortet es nicht binnen 2,5 s, kommt der Cache
  if (req.mode === 'navigate') {
    const net = fetch(req).then((res) => {
      const ct = res.headers.get('content-type') || '';
      if (res.ok && res.type === 'basic' && new URL(res.url).origin === location.origin && ct.includes('text/html')) {
        const copy = res.clone(); caches.open(VERSION).then((c) => c.put('index.html', copy)).catch(() => {});
      }
      return res;
    });
    const cached = () => caches.match('index.html');
    const timer = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
    e.respondWith(Promise.race([net.catch(() => null), timer]).then(async (res) => (res && res.ok) ? res : ((await cached()) || res || net)).catch(async () => (await cached()) || Response.error()));
    e.waitUntil(net.catch(() => {}));
    return;
  }

  // Eigene Dateien: aus dem Cache, im Hintergrund auffrischen (nur erfolgreiche Antworten)
  if (url.origin === location.origin) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
