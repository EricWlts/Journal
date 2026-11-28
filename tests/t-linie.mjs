// Phase 5 · Stille Linie: Haarlinie mit Kupfermarke, Striche beim Berühren, Ziehen wechselt den Eintrag
export default (test, h) => {
  const { ok, seed } = h;
  const ym = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const E = () => [3, 12, 20].map((d) => ({ id: 'l' + d, date: ym() + '-' + String(d).padStart(2, '0'), title: 'Tag ' + d, text: 'Text vom ' + d + '.' }));
  const openAt = async (page, id) => { await seed(page, E()); await page.evaluate((id) => { go('entry'); openEntry(S.entries.find((x) => x.id === id)); }, id); await page.waitForFunction(() => document.getElementById('entry').classList.contains('is-top')); await page.waitForTimeout(700); };
  const rect = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; }, sel);
  const ticks = (page) => page.evaluate(() => [...document.querySelectorAll('.sline .t')].map((t) => { const c = getComputedStyle(t); return { d: +t.dataset.d, h: parseFloat(c.height), o: +c.opacity, cur: t.classList.contains('cur') }; }));
  const touch = async (page, type, x, y) => { const c = page.__cdp || (page.__cdp = await page.context().newCDPSession(page)); await c.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] }); };
  const xOfDay = async (page, d) => page.evaluate((d) => { const r = document.querySelector('.sline').getBoundingClientRect(), n = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(); return r.left + r.width * (d - 1) / (n - 1); }, d);
  const yMid = async (page) => { const r = await rect(page, '.sline'); return r.t + r.h / 2; };

  test('Linie: Ruhe – Haarlinie und Kupfermarke, keine Striche', async ({ page }) => {
    await openAt(page, 'l12');
    const ln = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('.sl-ln')); return { h: c.height, bg: c.backgroundColor, op: +getComputedStyle(document.querySelector('.sline')).opacity }; });
    ok(ln.h === '1px' && ln.op === 1, JSON.stringify(ln));
    const t = await ticks(page); const cur = t.find((x) => x.cur);
    ok(cur && cur.d === 12 && cur.h === 7 && cur.o === 1, 'Marke: ' + JSON.stringify(t));
    ok(t.filter((x) => !x.cur).every((x) => x.h === 0 && x.o === 0), 'Striche sichtbar: ' + JSON.stringify(t));
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.sl-d')).opacity === '0'), 'Datum sichtbar');
  });

  test('Linie: Berühren/Hover zeigt Striche und Datum kursiv', async ({ page, device }) => {
    await openAt(page, 'l12'); const y = await yMid(page), x3 = await xOfDay(page, 3);
    if (device === 'iPhone') await touch(page, 'touchStart', x3, y); else await page.mouse.move(x3, y);
    await page.waitForTimeout(900);
    const t = await ticks(page); ok(t.map((x) => x.d).join() === '3,12,20' && t.every((x) => x.h === 12 && x.o === 1), JSON.stringify(t));
    const d = await page.evaluate(() => { const l = document.querySelector('.sl-d'), c = getComputedStyle(l), r = l.getBoundingClientRect(); return { o: +c.opacity, st: c.fontStyle, f: c.fontFamily, fs: c.fontSize, t: l.textContent, l: r.left, r: r.right, w: innerWidth }; });
    ok(d.o === 1 && d.st === 'italic' && /Instrument/.test(d.f) && d.fs === '15px' && /^\w+, 3\. /.test(d.t) && d.l >= 0 && d.r <= d.w, JSON.stringify(d));
    if (device === 'iPhone') await touch(page, 'touchEnd'); else await page.mouse.move(600, 300);
    await page.waitForTimeout(700);
    ok((await ticks(page)).filter((x) => !x.cur).every((x) => x.h === 0), 'Striche gehen nicht zurück');
  }, undefined, null, { motion: true });

  test('Linie: Ziehen wechselt zum Tag mit Eintrag, Blatt bleibt offen, kein Seitwärts-Wechsel', async ({ page, device }) => {
    await openAt(page, 'l12'); const y = await yMid(page), x12 = await xOfDay(page, 12), x20 = await xOfDay(page, 20);
    const stack = await page.evaluate(() => S.stack.join());
    if (device === 'iPhone') { await touch(page, 'touchStart', x12, y); for (let i = 1; i <= 8; i++) { await touch(page, 'touchMove', x12 + (x20 - x12) * i / 8, y); await page.waitForTimeout(20); } await touch(page, 'touchEnd'); }
    else { await page.mouse.move(x12, y); await page.mouse.down(); await page.mouse.move(x20, y, { steps: 8 }); await page.mouse.up(); }
    await page.waitForFunction(() => S.cur && S.cur.id === 'l20', null, { timeout: 3000 });
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => ({ dn: document.getElementById('eDn').textContent, st: S.stack.join(), top: document.getElementById('entry').classList.contains('is-top'), b: document.getElementById('eBody').textContent, op: +getComputedStyle(document.getElementById('eBody')).opacity, cur: document.querySelector('.sline .t.cur').dataset.d }));
    ok(r.dn === '20' && r.st === stack && r.top && /Tag 20/.test(r.b) && r.op === 1 && r.cur === '20', JSON.stringify(r));
  }, undefined, null, { motion: true });

  test('iPhone: Linie beim Tippen ausgeblendet', async ({ page }) => {
    await openAt(page, 'l12');
    await page.locator('#eBody').tap(); await page.waitForFunction(() => document.activeElement === document.getElementById('eBody'));
    await page.waitForTimeout(500);
    ok(await page.evaluate(() => +getComputedStyle(document.querySelector('.sline')).opacity === 0 && getComputedStyle(document.querySelector('.sline')).pointerEvents === 'none'), 'Linie sichtbar beim Tippen');
  }, ['iPhone']);

  test('iPhone: Linie endet links vom Zurück-Knopf (≥ 12px) und beginnt an der Textkante', async ({ page }) => {
    await openAt(page, 'l12');
    const a = await rect(page, '.sline'), b = await rect(page, '#entryBtn'), t = await rect(page, '#eBody');
    ok(a.r < b.l - 12, 'Linie ' + a.r + ' / Knopf ' + b.l);
    ok(Math.abs(a.l - t.l) < 1, 'Textkante ' + a.l + ' / ' + t.l);
  }, ['iPhone']);

  test('Mac: Linie in Breite der Textspalte, Abstand zum Blattrand', async ({ page }) => {
    await openAt(page, 'l12');
    const a = await rect(page, '.sline'), t = await rect(page, '#eBody'), ln = await rect(page, '.sl-ln'), bl = await rect(page, '#entry');
    ok(Math.abs(a.l - t.l) < 1 && Math.abs(a.w - t.w) < 1, JSON.stringify([a, t]));
    ok(bl.b - ln.b >= 27 && bl.b - ln.b <= 30, 'Abstand ' + (bl.b - ln.b));
  }, ['Mac']);
};
