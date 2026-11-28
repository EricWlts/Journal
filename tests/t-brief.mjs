// Phase 3a · Das Blatt „Brief“: Anrede, Schlusszeile, Vorschlag
export default (test, h) => {
  const { ok, newEntryViaUI } = h;
  const rect = (page) => page.evaluate(() => { const k = [...document.getElementById('eBody').children].slice(0, 2).map((d) => { const r = d.getBoundingClientRect(); return [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.height * 10) / 10]; }); return k; });

  test('Brief: keine Initiale, erste Zeile als Anrede', async ({ page, device }) => {
    await newEntryViaUI(page, device); await page.keyboard.type('Liebes Tagebuch'); await page.keyboard.press('Enter'); await page.keyboard.type('Heute war ein ruhiger Tag.'); await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const b = document.getElementById('eBody'), f = b.children[0], s = b.children[1], cf = getComputedStyle(f), cl = getComputedStyle(f, '::first-letter'), cs = getComputedStyle(s);
      return { fl: cl.fontSize, fs: cf.fontSize, fam: cf.fontFamily, st: cf.fontStyle, lh: cf.lineHeight, mb: cf.marginBottom, sfs: cs.fontSize, sfl: getComputedStyle(s, '::first-letter').fontSize, fl2: cl.float };
    });
    const mac = device === 'Mac';
    ok(r.fl === r.fs && r.sfl === r.sfs && r.fl2 === 'none', 'Initiale: ' + JSON.stringify(r));
    ok(r.fs === (mac ? '30px' : '26px'), 'Größe ' + r.fs); ok(/Instrument Serif/.test(r.fam) && r.st === 'italic', 'Schrift ' + r.fam + ' ' + r.st);
    ok(parseFloat(r.lh) === (mac ? 33 : 28.6), 'line-height ' + r.lh); ok(r.mb === (mac ? '20px' : '18px'), 'Abstand ' + r.mb);
    // Position mit und ohne Fokus gleich
    const a = await rect(page); await page.evaluate(() => document.activeElement.blur()); await page.waitForTimeout(300); const b = await rect(page);
    await page.evaluate(() => document.getElementById('eBody').focus()); await page.waitForTimeout(300); const c = await rect(page);
    ok(JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(b) === JSON.stringify(c), 'Position springt: ' + JSON.stringify([a, b, c]));
  });

  test('Brief: Schlusszeile mit Uhrzeit, Kopf ohne Uhrzeit', async ({ page, device }) => {
    await newEntryViaUI(page, device);
    ok(await page.evaluate(() => document.getElementById('eClose').hidden), 'Schlusszeile auf leerem Blatt sichtbar');
    await page.keyboard.type('Hallo'); await page.waitForTimeout(500);
    const r = await page.evaluate(() => { const c = document.getElementById('eClose'); return { hid: c.hidden, t: c.textContent.trim(), exp: (() => { const d = new Date(S.cur.created); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); })(), head: document.getElementById('eDtm').textContent + '|' + document.getElementById('eDt').textContent, meta: !!document.getElementById('eMeta') || !!document.getElementById('eMetaP'), fs: getComputedStyle(c).fontSize, bef: getComputedStyle(c, '::before').width + ' ' + getComputedStyle(c, '::before').height };
      });
    ok(!r.hid && r.t.startsWith(r.exp), 'Schlusszeile: ' + JSON.stringify(r)); ok(!/\d\d:\d\d/.test(r.head), 'Kopf mit Uhrzeit: ' + r.head); ok(!r.meta, 'eMeta noch da');
    ok(r.fs === '12px' && r.bef === '24px 1px', 'Stil: ' + r.fs + ' ' + r.bef);
    const f = await page.evaluate(() => { S.cur.wx = 'Leer · 4° Nebel'; S.cur.sun = '8:12 – 16:21'; writeAids(); return document.getElementById('eClose').textContent.trim(); });
    ok(/ · Leer · 4° Nebel · ↑ 8:12 ↓ 16:21$/.test(f), 'Zusammensetzung: ' + f);
    const g = await page.evaluate(() => { S.cur.wx = ''; writeAids(); return document.getElementById('eClose').textContent.trim(); });
    ok(/^\d\d:\d\d · ↑ 8:12 ↓ 16:21$/.test(g), 'ohne Wetter: ' + g);
  });

  const at = async (page, hour) => { await page.evaluate((h) => { const D = Date, off = new D().setHours(h, 5, 0, 0) - D.now(); window.Date = class extends D { constructor(...a) { if (a.length) super(...a); else super(D.now() + off); } static now() { return D.now() + off; } }; }, hour); };

  test('Brief: Vorschlag, Tab übernimmt', async ({ page, device }) => {
    await at(page, 9); await page.evaluate(() => { WS.imp = false; writeAids(); }); await newEntryViaUI(page, device); await page.waitForTimeout(300); // ohne Tagesimpuls: der klappt beim ersten Inhalt ohnehin zusammen
    const g = await page.evaluate(() => { const b = document.getElementById('eBody'); return { g: b.dataset.g, mt: b.classList.contains('mt'), c: getComputedStyle(b, '::before').content, fs: getComputedStyle(b, '::before').fontSize, op: getComputedStyle(b, '::before').opacity }; });
    ok(g.g === 'Guten Morgen.' && g.mt && /Guten Morgen/.test(g.c), 'Vorschlag: ' + JSON.stringify(g));
    const before = await page.evaluate(() => { const r = document.getElementById('eBody').firstChild.getBoundingClientRect(); return [r.left, r.top]; });
    if (device === 'Mac') await page.keyboard.press('Tab'); else await page.locator('#eBody').tap({ position: { x: 40, y: 12 } });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ t: S.cur.title, x: S.cur.text, n: document.getElementById('eBody').children.length, mt: document.getElementById('eBody').classList.contains('mt'), pos: (() => { const r = document.getElementById('eBody').firstChild.getBoundingClientRect(); return [r.left, r.top]; })(), caret: getSelection().anchorNode === document.getElementById('eBody').children[1] || document.getElementById('eBody').children[1].contains(getSelection().anchorNode) }));
    ok(r.t === 'Guten Morgen.' && r.x === '' && r.n === 2 && !r.mt && r.caret, 'übernommen: ' + JSON.stringify(r));
    ok(Math.abs(r.pos[0] - before[0]) < .5 && Math.abs(r.pos[1] - before[1]) < .5, 'Anrede springt ' + before + ' -> ' + r.pos);
    await page.keyboard.type('Wie geht es'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => S.cur.title === 'Guten Morgen.' && S.cur.text === 'Wie geht es'), 'Text nach Tab');
  });

  test('Brief: Zeitfenster der Anrede', async ({ page, device }) => {
    for (const [hh, w] of [[13, 'Guten Tag.'], [22, 'Guten Abend.']]) { await at(page, hh); const v = await page.evaluate(() => greetWord()); ok(v === w, hh + ': ' + v); }
  });

  test('Brief: Losschreiben ersetzt den Vorschlag', async ({ page, device }) => {
    await newEntryViaUI(page, device); await page.keyboard.type('Mein Anfang'); await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({ t: S.cur.title, mt: document.getElementById('eBody').classList.contains('mt'), n: document.getElementById('eBody').children.length, fs: getComputedStyle(document.getElementById('eBody').firstChild).fontSize }));
    ok(r.t === 'Mein Anfang' && !r.mt && r.n === 1 && r.fs === (device === 'Mac' ? '30px' : '26px'), JSON.stringify(r));
  });

  test('Brief: Schalter aus – kein Vorschlag', async ({ page, device }) => {
    await page.evaluate(() => { toggleW('greet'); });
    await newEntryViaUI(page, device); await page.waitForTimeout(300);
    const r = await page.evaluate(() => { const b = document.getElementById('eBody'); return { g: b.dataset.g || null, af: getComputedStyle(b, '::after').content, on: WS.greet }; });
    ok(r.g === null && !r.on && (r.af === 'none' || r.af === 'normal'), JSON.stringify(r));
  });
};
