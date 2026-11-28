import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { createMock } from './mock-github.mjs';

export const DEVICES = {
  iPhone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' },
  Mac: { viewport: { width: 1280, height: 800 } }
};
export const SYNC_CFG = '{"repo":"test/journal-daten","token":"test-dummy","branch":"main"}';
let browser;
export async function launch() { browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] }); }
export async function shutdown() { if (browser) await browser.close(); }

// Frischer Kontext + Seite; opts: sync (bool) -> Abgleich mit Mock aktiv
export async function open(device, url, opts = {}) {
  const ctx = await browser.newContext({ ...DEVICES[device], locale: 'de-DE', timezoneId: 'Europe/Berlin', reducedMotion: opts.motion ? 'no-preference' : 'reduce', serviceWorkers: 'block' });
  const mock = createMock(); const external = [];
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (route) => {
    const u = route.request().url(); const host = new URL(u).host; external.push(u);
    if (/fonts\.(googleapis|gstatic)\.com/.test(host)) return route.abort();
    if (/bigdatacloud|open-meteo/.test(host)) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if (host === 'api.github.com') {
      const r = mock.handle(route.request().method(), u, route.request().postData());
      return route.fulfill({ status: r.status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(r.body) });
    }
    return route.abort();
  });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
  if (opts.sync) await page.addInitScript((c) => { if (!localStorage.getItem('journal.sync')) localStorage.setItem('journal.sync', c); }, SYNC_CFG);
  await page.goto(url);
  await page.waitForFunction(() => typeof S !== 'undefined' && document.getElementById('home') && S.stack && typeof DB !== 'undefined' && DB.db);
  return { ctx, page, mock, errors, external };
}
export const dbAll = (page) => page.evaluate(() => new Promise((res, rej) => {
  const r = indexedDB.open('journal'); r.onerror = () => rej(r.error);
  r.onsuccess = () => { const db = r.result; const q = db.transaction('entries').objectStore('entries').getAll(); q.onsuccess = () => { db.close(); res(q.result); }; q.onerror = () => rej(q.error); };
}));
// Einträge direkt in IndexedDB + S.entries legen
export async function seed(page, list) {
  await page.evaluate(async (list) => {
    for (const x of list) {
      const e = { id: x.id, date: x.date, created: x.date + 'T10:00:00.000Z', modified: x.date + 'T10:00:00.000Z', title: x.title, text: x.text || '', photos: [], source: 'app' };
      await DB.put('entries', e); S.entries.push(e);
    }
    S.entries.sort((a, b) => (b.created > a.created ? 1 : -1)); reindex(); S.homeDirty = true; renderHome();
  }, list);
}
export const visibleEntries = (page) => page.evaluate(() => S.entries.filter((e) => !e.deleted));
// focus: false -> nur öffnen; sonst zusätzlich ins Feld tippen/klicken, falls die App den Fokus nicht selbst setzt
export async function openNew(page, device) {
  if (device === 'iPhone') await page.locator('#homePlus').tap(); else await page.keyboard.press('Control+n');
  await page.waitForFunction(() => S.stack[S.stack.length - 1] === 'entry' && document.getElementById('entry').classList.contains('is-top'), null, { timeout: 4000 });
}
export async function newEntryViaUI(page, device) {
  await openNew(page, device);
  await page.waitForTimeout(300);
  if (!(await page.evaluate(() => document.activeElement === document.getElementById('eBody')))) {
    await (device === 'iPhone' ? page.locator('#eBody').tap() : page.locator('#eBody').click());
  }
  await page.waitForFunction(() => document.activeElement === document.getElementById('eBody'), null, { timeout: 4000 });
}
export async function typeEntry(page) { await page.keyboard.type('Titelzeile'); await page.keyboard.press('Enter'); await page.keyboard.type('Zweite Zeile Text'); }
export async function waitSaved(page, n = 1) { await page.waitForFunction(() => 1); const t = Date.now(); for (;;) { const a = await dbAll(page); if (a.length >= n) return a; if (Date.now() - t > 3000) return a; await page.waitForTimeout(100); } }
