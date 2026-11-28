import { startServer } from './server.mjs';
import { launch, shutdown, open, openNew, dbAll, seed, visibleEntries, newEntryViaUI, typeEntry, waitSaved } from './helpers.mjs';

const filter = (process.argv[2] || '').toLowerCase();
const tests = [];
// known: Text, falls bekannt rot (Test läuft, Ergebnis zählt nicht für den Exit-Code)
const test = (name, fn, devices = ['iPhone', 'Mac'], known, opts = {}) => tests.push({ name, fn, devices, known, opts });
const isTop = (page, id) => page.evaluate((id) => S.stack[S.stack.length - 1] === id, id);
const ok = (c, msg) => { if (!c) throw new Error(msg); };

test('öffnen', async ({ page, errors }) => {
  await page.waitForTimeout(500);
  ok(await page.locator('#home').isVisible(), '#home nicht sichtbar');
  ok(!errors.length, 'Konsolenfehler: ' + errors.join(' | '));
});

test('neuer Eintrag', async ({ page, device }) => {
  await openNew(page, device);
  ok(await page.locator('#entry').isVisible(), '#entry nicht sichtbar');
});

test('neuer Eintrag: Feld sofort fokussiert', async ({ page, device }) => {
  await openNew(page, device); await page.waitForTimeout(500);
  ok(await page.evaluate(() => document.activeElement === document.getElementById('eBody')), '#eBody nicht fokussiert (activeElement: ' + await page.evaluate(() => document.activeElement.id || document.activeElement.tagName) + ')');
}, ['iPhone'], null);

test('tippen + speichern', async ({ page, device }) => {
  await newEntryViaUI(page, device); await typeEntry(page);
  const a = await waitSaved(page);
  ok(a.length === 1, 'Einträge in DB: ' + a.length);
  const e = a[0];
  ok(e.title === 'Titelzeile' && e.text === 'Zweite Zeile Text', `Inhalt falsch: ${JSON.stringify(e.title)} / ${JSON.stringify(e.text)}`);
  for (const f of ['id', 'date', 'created', 'modified', 'title', 'text']) ok(e[f] !== undefined && e[f] !== '', 'Feld fehlt: ' + f);
});

test('schließen', async ({ page, device }) => {
  await newEntryViaUI(page, device); await typeEntry(page);
  const [e] = await waitSaved(page);
  if (device === 'iPhone') {
    if (await page.locator('#doneBtn').isVisible()) { await page.locator('#doneBtn').tap(); await page.waitForTimeout(400); }
    await page.locator('#entryBtn').tap();
    await page.waitForFunction(() => S.stack[S.stack.length - 1] === 'home', null, { timeout: 4000 });
  } else await page.locator('#home').waitFor();
  await page.waitForFunction((id) => !!document.querySelector('#list .row[data-id="' + id + '"]'), e.id, { timeout: 4000 });
});

test('löschen', async ({ page, device }) => {
  await newEntryViaUI(page, device); await typeEntry(page);
  const [e] = await waitSaved(page);
  const tap = (l) => (device === 'iPhone' ? l.tap() : l.click());
  if (device === 'iPhone' && await page.locator('#doneBtn').isVisible()) { await tap(page.locator('#doneBtn')); await page.waitForTimeout(400); } // Tastatur zu, Mülleimer erscheint
  await tap(page.locator('#trashBtn'));
  const del = page.locator('#confirm [data-act=confirmdel]'); await del.waitFor({ state: 'visible' });
  await page.waitForTimeout(500); // Dialog-Einblendung
  await tap(del);
  await page.waitForFunction((id) => !S.entries.some((x) => x.id === id && !x.deleted), e.id, { timeout: 5000 });
  await page.waitForFunction((id) => !document.querySelector('#list .row[data-id="' + id + '"]'), e.id, { timeout: 5000 });
  ok((await visibleEntries(page)).length === 0, 'Eintrag noch in S.entries');
});

test('Suche', async ({ page, device }) => {
  const d = new Date(); const k = (n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n).toLocaleDateString('sv-SE');
  await seed(page, [{ id: 'eseed1', date: k(1), title: 'Spaziergang am Deich', text: 'Wind und Wolken' }, { id: 'eseed2', date: k(2), title: 'Kaffee mit Freunden', text: 'Kuchen' }]);
  if (device === 'iPhone') await page.locator('#home .searchbtn').tap(); else await page.keyboard.press('Control+f');
  await page.waitForFunction(() => document.activeElement === document.getElementById('dq'), null, { timeout: 4000 });
  await page.keyboard.type('Deich');
  await page.waitForFunction(() => document.querySelectorAll('#list .row').length === 1, null, { timeout: 4000 });
  ok(await page.locator('#list .row').getAttribute('data-id') === 'eseed1', 'falsche Trefferkarte');
});

test('Monat wechseln', async ({ page, device }) => {
  const title = () => page.evaluate(() => document.getElementById('homeTitle').textContent.replace(/\s+/g, ' ').trim());
  if (device === 'Mac') { await page.locator('#scMonth').click(); await page.waitForFunction(() => S.side.mode === 'month', null, { timeout: 3000 }); await page.waitForTimeout(1500); }
  const t0 = await title();
  if (device === 'iPhone') await page.evaluate(() => weekMove(-1)); else await page.locator('[data-act=sideshift][data-dir="-1"]').click();
  await page.waitForFunction((t) => document.getElementById('homeTitle').textContent.replace(/\s+/g, ' ').trim() !== t, t0, { timeout: 4000 });
  const t1 = await title(); ok(t1 !== t0, 'Titel unverändert');
  await page.waitForTimeout(1200); // Wischanimation der App läuft noch (sperrt den nächsten Schritt)
  if (device === 'iPhone') await page.evaluate(() => weekMove(1)); else await page.locator('[data-act=sideshift][data-dir="1"]').click();
  await page.waitForFunction((t) => document.getElementById('homeTitle').textContent.replace(/\s+/g, ' ').trim() === t, t0, { timeout: 4000 });
});

test('Nachtmodus', async ({ page, device }) => {
  await page.locator('#home .setbtn').dispatchEvent(device === 'iPhone' ? 'click' : 'click');
  const nacht = page.locator('button[data-act=setlight][data-light=nacht]'); await nacht.waitFor({ state: 'visible' });
  await page.waitForTimeout(600);
  await (device === 'iPhone' ? nacht.tap() : nacht.click());
  await page.waitForFunction(() => document.documentElement.classList.contains('night') && localStorage.getItem('journal.light') === 'nacht', null, { timeout: 3000 });
  const auto = page.locator('button[data-act=setlight][data-light=auto]');
  await (device === 'iPhone' ? auto.tap() : auto.click());
  await page.waitForFunction(() => localStorage.getItem('journal.light') === 'auto', null, { timeout: 3000 });
});

test('Abgleich', async ({ page, device, mock }) => {
  await newEntryViaUI(page, device); await typeEntry(page);
  const [e] = await waitSaved(page);
  const t = Date.now(); let f;
  while (Date.now() - t < 8000) { f = mock.files().get('entries/' + e.id + '.json'); if (f) break; await page.waitForTimeout(200); }
  ok(f, 'Eintrag nicht im Mock');
  const r = JSON.parse(f); ok(r.title === 'Titelzeile' && r.text === 'Zweite Zeile Text', 'Inhalt im Mock abweichend');
  mock.put('entries/efremd1.json', JSON.stringify({ id: 'efremd1', date: '2026-11-01', created: '2026-11-01T09:00:00.000Z', modified: '2026-11-01T09:00:00.000Z', title: 'Fremd', text: 'vom anderen Gerät', photos: [], source: 'app' }));
  await page.evaluate(() => Sync.run());
  await page.waitForFunction(() => S.entries.some((x) => x.id === 'efremd1'), null, { timeout: 6000 });
}, ['iPhone', 'Mac'], null);

// weitere Testdateien: tests/t-*.mjs exportieren default (test, h) => { test('name', fn, devices, known, opts) }
import { readdirSync } from 'node:fs';
import * as H from './helpers.mjs';
for (const f of readdirSync(new URL('.', import.meta.url)).filter((f) => /^t-.*\.mjs$/.test(f)).sort()) (await import('./' + f)).default(test, { ...H, ok, isTop });

const srv = await startServer(); await launch();
let pass = 0, fail = 0, known = 0, total = 0; const t0 = Date.now();
for (const t of tests) {
  if (filter && !t.name.toLowerCase().includes(filter)) continue;
  for (const device of t.devices) {
    total++; const s = Date.now(); let err;
    const env = await open(device, srv.url, { sync: t.name === 'Abgleich' || !!t.opts.sync, motion: !!t.opts.motion });
    try { await t.fn({ ...env, device }); } catch (e) { err = e.message.split('\n')[0]; }
    await env.ctx.close();
    const ms = Date.now() - s;
    if (!err) { pass++; console.log(`✓ ${device} · ${t.name} (${ms} ms)`); }
    else if (t.known) { known++; console.log(`~ ${device} · ${t.name} (${ms} ms) bekannt rot\n    ${err}`); }
    else { fail++; console.log(`✗ ${device} · ${t.name} (${ms} ms)\n    ${err}`); }
  }
}
await shutdown(); srv.close();
console.log(`\n${pass}/${total} grün${fail ? ', ' + fail + ' rot' : ''}${known ? ', ' + known + ' bekannt rot' : ''} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fail ? 1 : 0);
