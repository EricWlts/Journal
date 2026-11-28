export default (test, h) => {
  const { ok, seed, dbAll } = h;
  const mk = (id, date, mod, text) => ({ id, date, created: date + 'T10:00:00.000Z', modified: mod, title: text, text, photos: [], source: 'app' });

  test('Sicherung laden: nur Neues und Neueres, mit Bestätigung', async ({ page }) => {
    await seed(page, [{ id: 'a1', date: '2026-03-01', title: 'A alt' }, { id: 'b1', date: '2026-03-02', title: 'B lokal neuer' }]);
    await page.evaluate(async () => { const e = S.entries.find((x) => x.id === 'b1'); e.modified = '2026-09-01T10:00:00.000Z'; await DB.put('entries', e); });
    const backup = { app: 'journal', version: 1, exported: new Date().toISOString(), photos: [], entries: [
      mk('a1', '2026-03-01', '2026-05-01T10:00:00.000Z', 'A neu aus Sicherung'),
      mk('b1', '2026-03-02', '2026-04-01T10:00:00.000Z', 'B alt aus Sicherung'),
      mk('n1', '2026-03-03', '2026-03-03T10:00:00.000Z', 'N neu') ] };
    await page.setInputFiles('#fileBackup', { name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await page.waitForSelector('#confirm.show');
    const txt = await page.locator('#cText').textContent();
    ok(/2 Einträge übernehmen\? 1 neuer, 1 neuere Fassung\. 1 bleiben unverändert\./.test(txt), 'Text: ' + txt);
    await page.locator('#confirm [data-act="confirmdel"]').click();
    await page.waitForFunction(() => S.entries.some((x) => x.id === 'n1'));
    const all = await dbAll(page); const by = Object.fromEntries(all.map((x) => [x.id, x]));
    ok(by.a1.text === 'A neu aus Sicherung' && by.a1._dirty, 'a1 nicht übernommen');
    ok(by.b1.title === 'B lokal neuer', 'b1 wurde überschrieben: ' + by.b1.text);
    ok(by.n1 && by.n1._dirty, 'n1 fehlt');
    ok(await page.evaluate(() => S.entries.length) === 3, 'Bestand ' + await page.evaluate(() => S.entries.length));
  }, ['Mac']);

  test('Sicherung laden: abbrechen und „Nichts Neues“', async ({ page }) => {
    await seed(page, [{ id: 'a1', date: '2026-03-01', title: 'A' }]);
    const send = (entries) => page.setInputFiles('#fileBackup', { name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'journal', version: 1, photos: [], entries })) });
    await send([mk('x1', '2026-03-05', '2026-03-05T10:00:00.000Z', 'X')]);
    await page.waitForSelector('#confirm.show');
    await page.locator('#confirm .btn.ghost').click();
    await page.waitForTimeout(300);
    ok((await dbAll(page)).length === 1, 'trotz Abbrechen übernommen');
    await send([mk('a1', '2026-03-01', '2026-03-01T10:00:00.000Z', 'A')]);
    await page.waitForFunction(() => /Nichts Neues/.test(document.body.textContent));
  }, ['Mac']);

  test('fonts.css lädt alle drei Schriften', async ({ page }) => {
    const base = new URL(page.url()).origin;
    await page.addStyleTag({ url: base + '/fonts/fonts.css' });
    const r = await page.evaluate(async () => {
      await Promise.all(['16px Manrope', '500 16px Manrope', '600 16px Manrope', '16px "Instrument Serif"', 'italic 16px "Instrument Serif"', '16px Newsreader', 'italic 16px Newsreader'].map((f) => document.fonts.load(f)));
      await document.fonts.ready;
      return ['16px Manrope', '16px "Instrument Serif"', '16px Newsreader', 'italic 16px Newsreader'].map((f) => document.fonts.check(f));
    });
    ok(r.every(Boolean), 'Schriften nicht geladen: ' + r.join());
  }, ['Mac']);
};
