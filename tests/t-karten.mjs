// Phase 3b · Karten ohne Titel (Tageszahl + Uhrzeit, zwei Zeilen Auszug), Karte → Blatt per Deckkraft, Mac-Wechsel ohne Maske
export default (test, h) => {
  const { ok, seed } = h;
  const E = [
    { id: 'k1', date: '2026-11-20', title: 'Liebe Anna', text: 'Heute war ein ruhiger Tag am Deich und ich habe viel nachgedacht.' },
    { id: 'k2', date: '2026-11-19', title: 'Heute war ein ruhiger Tag am Deich', text: 'Danach gab es Tee.' },
    { id: 'k3', date: '2026-11-18', title: 'Guten Morgen.', text: '' },
  ];
  const info = (page, id) => page.evaluate((id) => { const r = document.querySelector('#list .row[data-id="' + id + '"]'), x = r.querySelector('.ex'), c = getComputedStyle(x);
    return { ti: !!r.querySelector('.ti'), fam: c.fontFamily, fs: c.fontSize, lh: c.lineHeight, clamp: c.webkitLineClamp, t: x.textContent, it: c.fontStyle, h: r.offsetHeight, n: !!r.querySelector('.n'), tm: !!r.querySelector('.tm') }; }, id);

  test('Karten: kein Titel, Auszug Newsreader 15,5px / 22,475px, Clamp 2, gleiche Höhe', async ({ page }) => {
    await seed(page, E); await page.waitForTimeout(200);
    const a = await info(page, 'k1'); const b = await info(page, 'k2'); const c = await info(page, 'k3');
    for (const r of [a, b, c]) { ok(!r.ti, 'Titelelement vorhanden'); ok(r.n && r.tm, 'Zahl/Uhrzeit fehlen'); ok(/Newsreader/.test(r.fam) && r.fs === '15.5px' && parseFloat(r.lh) === 22.475 && r.clamp === '2', JSON.stringify(r)); }
    ok(a.h === b.h && b.h === c.h, 'Höhen ungleich: ' + [a.h, b.h, c.h]);
    ok(c.t === 'Guten Morgen.' && c.it === 'italic', 'nur Anrede kursiv: ' + JSON.stringify(c));
  });

  test('Karten: Auszug nach Anrede bzw. mit der ersten Zeile', async ({ page }) => {
    await seed(page, E); await page.waitForTimeout(200);
    const a = await info(page, 'k1'), b = await info(page, 'k2');
    ok(a.t.startsWith('Heute war ein ruhiger Tag') && !/Liebe Anna/.test(a.t), 'Anrede: ' + a.t);
    ok(b.t.startsWith('Heute war ein ruhiger Tag am Deich – Danach'), 'ohne Anrede: ' + b.t);
    ok(!/[.,;:–-]…$/.test(a.t) && !/\.…/.test(a.t), 'endet auf „.…“: ' + a.t);
  });

  test('Karten: kein rv, revealDown entfernt', async ({ page }) => {
    await seed(page, E);
    ok(await page.evaluate(() => !document.querySelector('.rv, .rvpre') && typeof revealDown === 'undefined'), 'rv/revealDown noch da');
  });

  test('Mac: Wechsel ohne Maske, Deckkraft läuft', async ({ page }) => {
    await seed(page, E); await page.waitForTimeout(200);
    await page.locator('#list .row[data-id="k1"]').click(); await page.waitForFunction(() => S.cur && S.cur.id === 'k1'); await page.waitForTimeout(1000);
    await page.locator('#list .row[data-id="k2"]').click();
    const seen = [];
    for (let i = 0; i < 6; i++) { await page.waitForTimeout(80); seen.push(await page.evaluate(() => { const g = (el) => { const c = getComputedStyle(el); return [c.maskImage, c.webkitMaskImage, el.style.maskImage, el.style.webkitMaskImage]; }; return { m: [...g(document.getElementById('entry')), ...g(document.getElementById('entryInner'))], o: +getComputedStyle(document.getElementById('entryInner')).opacity, cur: S.cur.id }; })); }
    ok(seen.every((s) => s.m.every((v) => !v || v === 'none')), 'Maske: ' + JSON.stringify(seen));
    ok(seen.some((s) => s.o < 1), 'keine Überblendung: ' + JSON.stringify(seen));
    await page.waitForTimeout(1000);
    ok(await page.evaluate(() => S.cur.id === 'k2' && +getComputedStyle(document.getElementById('entryInner')).opacity === 1), 'Ende');
  }, ['Mac'], null, { motion: true });

  test('iPhone: Karte → Blatt, Text kommt per Deckkraft', async ({ page }) => {
    await seed(page, E); await page.waitForTimeout(300);
    await page.locator('#list .row[data-id="k1"]').tap();
    const o = []; for (let i = 0; i < 4; i++) { o.push(await page.evaluate(() => { const b = document.getElementById('eBody'), c = getComputedStyle(b); return [+c.opacity, c.transform]; })); await page.waitForTimeout(i ? 150 : 20); }
    ok(o[0][0] < 1, 'startet nicht transparent: ' + JSON.stringify(o));
    await page.waitForFunction(() => +getComputedStyle(document.getElementById('eBody')).opacity === 1, null, { timeout: 3000 });
    await page.waitForTimeout(1000);
    ok(await page.evaluate(() => getComputedStyle(document.getElementById('eBody')).transform === 'none' && !document.getElementById('entry').classList.contains('fx')), 'Ende nicht ruhig');
  }, ['iPhone'], null, { motion: true });
};
