// Zuverlässigkeit: Speichern-Fehler, Papierkorb, Geister-Eintrag, applyRemote mit offenem Eintrag
export default (test, h) => {
  const { ok, newEntryViaUI, typeEntry, waitSaved, dbAll, seed } = h;
  const tap = (device, l) => (device === 'iPhone' ? l.tap() : l.click());
  const day = (n) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - n).toLocaleDateString('sv-SE'); };

  test('Speichern-Fehler: erneuter Versuch klappt', async ({ page, device }) => {
    await newEntryViaUI(page, device);
    await page.evaluate(() => { const o = DB.put.bind(DB); let n = 0; window.__fails = 0; DB.put = (s, v) => { if (s === 'entries' && n++ < 1) { window.__fails++; return Promise.reject(new Error('Test')); } return o(s, v); }; });
    await page.keyboard.type('Zuverlaessig');
    const a = await waitSaved(page);
    ok(a.length === 1 && a[0].title === 'Zuverlaessig', 'nach dem Fehler nicht gespeichert: ' + JSON.stringify(a.map((x) => x.title)));
    ok(await page.evaluate(() => window.__fails === 1), 'Fehler wurde nicht ausgelöst');
    ok(await page.evaluate(() => S.cur._savedSig !== undefined && S.cur._savedSig.startsWith('Zuverlaessig')), '_savedSig nicht gesetzt');
  });

  test('Speichern-Fehler: sichtbar nach drei Fehlversuchen', async ({ page, device }) => {
    await newEntryViaUI(page, device);
    await page.evaluate(() => { DB.put = () => Promise.reject(new Error('Test')); });
    await page.keyboard.type('Weg');
    await page.waitForFunction(() => document.getElementById('saveDot').classList.contains('error') && /Nicht gespeichert/.test(document.getElementById('toast').textContent), null, { timeout: 9000 });
    ok(await page.evaluate(() => S.cur._savedSig !== 'Weg\u0001\u0001'), '_savedSig trotz Fehler gesetzt');
  });

  test('Löschen: Papierkorb zeigt, Wiederherstellen bringt zurück', async ({ page, device }) => {
    await seed(page, [{ id: 'etrash1', date: day(1), title: 'Zum Löschen', text: 'x' }]);
    await page.evaluate(() => askDelete('etrash1'));
    const del = page.locator('#confirm [data-act=confirmdel]'); await del.waitFor({ state: 'visible' });
    await page.waitForTimeout(500); await tap(device, del);
    await page.waitForFunction(() => S.trash.some((e) => e.id === 'etrash1' && e.deleted), null, { timeout: 5000 });
    ok(await page.evaluate(() => !S.entries.some((e) => e.id === 'etrash1') && !document.querySelector('#list .row[data-id="etrash1"]')), 'noch in der Liste');
    ok((await dbAll(page)).find((e) => e.id === 'etrash1').deleted, 'Löschmarke nicht in IndexedDB');
    await page.waitForFunction(() => /Papierkorb gelegt/.test(document.getElementById('toast').textContent), null, { timeout: 3000 });
    await page.evaluate(() => { renderTrash(); });
    ok(await page.evaluate(() => document.getElementById('trashList').textContent.includes('Zum Löschen')), 'nicht im Papierkorb-Abschnitt');
    await page.evaluate(() => document.querySelector('[data-act=untrash][data-id=etrash1]').click());
    await page.waitForFunction(() => S.entries.some((e) => e.id === 'etrash1' && !e.deleted), null, { timeout: 4000 });
    await page.waitForFunction(() => !!document.querySelector('#list .row[data-id="etrash1"]'), null, { timeout: 4000 });
    ok(await page.evaluate(() => /leer/.test(document.getElementById('trashList').textContent)), 'Papierkorb nicht leer');
  }, ['iPhone', 'Mac'], null, { sync: true });

  test('Text komplett löschen und schließen: Papierkorb statt Verlust', async ({ page, device }) => {
    await newEntryViaUI(page, device); await typeEntry(page);
    const [e] = await waitSaved(page);
    await page.keyboard.press('Control+a'); await page.keyboard.press('Backspace');
    await page.waitForTimeout(600);
    ok(await page.evaluate((id) => S.entries.some((x) => x.id === id), e.id), 'beim Tippen darf nichts wandern');
    await page.evaluate(() => { document.activeElement.blur(); });
    if (device === 'iPhone') await page.evaluate(() => back()); else await page.evaluate(() => newEntry());
    await page.waitForFunction((id) => S.trash.some((x) => x.id === id && x.deleted), e.id, { timeout: 4000 });
    const r = (await dbAll(page)).find((x) => x.id === e.id);
    ok(r && r.deleted, 'in IndexedDB nicht mit Löschmarke');
    ok(await page.evaluate((id) => !S.entries.some((x) => x.id === id), e.id), 'noch in S.entries');
  });

  test('Papierkorb: 31 Tage alter Eintrag verschwindet beim Start', async ({ page }) => {
    const old = new Date(Date.now() - 31 * 864e5).toISOString(), young = new Date(Date.now() - 5 * 864e5).toISOString();
    await page.evaluate(async ([old, young]) => {
      for (const [id, del] of [['ealt', old], ['ejung', young]]) await DB.put('entries', { id, date: '2026-10-01', created: '2026-10-01T10:00:00.000Z', modified: del, title: id, text: '', photos: [], source: 'app', deleted: del });
    }, [old, young]);
    await page.reload(); await page.waitForFunction(() => typeof S !== 'undefined' && S.stack && document.getElementById('home'));
    await page.waitForFunction(() => S.trash.length === 1, null, { timeout: 4000 });
    const ids = (await dbAll(page)).map((e) => e.id);
    ok(!ids.includes('ealt') && ids.includes('ejung'), 'DB: ' + ids.join(','));
    ok(await page.evaluate(() => Sync.meta.deletes.includes('ealt') || !Sync.on()), 'Löschung nicht vorgemerkt');
  }, ['iPhone', 'Mac'], null, { sync: true });

  test('Geister-Eintrag: Löschen während des Uploads', async ({ page, device, mock }) => {
    await newEntryViaUI(page, device); await typeEntry(page);
    const [e] = await waitSaved(page);
    await page.evaluate(() => { Sync.soon(0); });
    await page.waitForFunction(() => Sync.busy, null, { timeout: 4000 }).catch(() => {});
    await page.evaluate((id) => deleteEntry(id), e.id);
    const t = Date.now(); let f;
    for (;;) {
      await page.evaluate(() => Sync.run()); await page.waitForFunction(() => !Sync.busy, null, { timeout: 8000 });
      f = mock.files().get('entries/' + e.id + '.json');
      if ((f && JSON.parse(f).deleted) || (!f && Date.now() - t > 1500) || Date.now() - t > 8000) break;
      await page.waitForTimeout(300);
    }
    ok(!f || JSON.parse(f).deleted, 'Eintrag lebt remote weiter (Geist)');
    ok(await page.evaluate((id) => !S.entries.some((x) => x.id === id), e.id), 'lokal noch sichtbar');
  }, ['iPhone', 'Mac'], null, { sync: true });

  test('Geister-Eintrag: vorgemerkte Löschung ohne sha bleibt, bis Datei auftaucht', async ({ page, mock }) => {
    await page.evaluate(() => { Sync.markDeleted('eghost1'); });
    ok(await page.evaluate(() => Sync.meta.deletes.includes('eghost1')), 'ohne sha nicht vorgemerkt');
    await page.evaluate(() => Sync.run()); await page.waitForFunction(() => !Sync.busy);
    ok(await page.evaluate(() => !Sync.meta.deletes.includes('eghost1')), 'bleibt vorgemerkt, obwohl remote nichts liegt');
    mock.put('entries/eghost2.json', JSON.stringify({ id: 'eghost2', date: '2026-11-01', created: '2026-11-01T09:00:00.000Z', modified: '2026-11-01T09:00:00.000Z', title: 'Geist', text: '', photos: [], source: 'app' }));
    await page.evaluate(() => { Sync.markDeleted('eghost2'); Sync.meta.head = null; });
    await page.evaluate(() => Sync.run()); await page.waitForFunction(() => !Sync.busy);
    ok(!mock.files().has('entries/eghost2.json'), 'Datei remote nicht gelöscht');
  }, ['iPhone', 'Mac'], null, { sync: true });

  test('applyRemote: offener Eintrag behält Identität', async ({ page, device }) => {
    await seed(page, [{ id: 'eopen1', date: day(1), title: 'Alt', text: 'vorher' }]);
    await page.evaluate(() => { S.stack = isDesktop() ? ['home', 'entry'] : ['home', 'entry']; applyStack(); openEntry(S.entries.find((e) => e.id === 'eopen1')); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.__c = S.cur; });
    await page.evaluate(() => applyRemote([{ id: 'eopen1', date: S.cur.date, created: S.cur.created, modified: '2099-01-01T00:00:00.000Z', title: 'Neu', text: 'von woanders', photos: [], source: 'app' }], []));
    const r = await page.evaluate(() => ({ same: S.cur === window.__c, inList: S.entries.includes(S.cur), title: S.cur.title, body: document.getElementById('eBody').textContent }));
    ok(r.same && r.inList, 'S.cur nicht mehr das Objekt in S.entries');
    ok(r.title === 'Neu' && r.body.includes('Neu'), 'Blatt nicht aktualisiert: ' + JSON.stringify(r));
    // lokal geändert + remote gelöscht: lokale Fassung bleibt
    await page.evaluate(() => { S.cur.title = 'Lokal'; S.cur._dirty = true; });
    await page.evaluate(() => applyRemote([{ id: 'eopen1', date: S.cur.date, created: S.cur.created, modified: '2099-02-01T00:00:00.000Z', deleted: '2099-02-01T00:00:00.000Z', title: 'Neu', text: '', photos: [], source: 'app' }], []));
    ok(await page.evaluate(() => S.cur && S.cur === window.__c && S.entries.includes(S.cur) && S.cur.title === 'Lokal' && !S.cur.deleted && S.cur._dirty), 'lokale Fassung ging verloren');
  }, ['iPhone', 'Mac'], null, { sync: true });
};
