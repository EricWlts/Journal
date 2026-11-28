// Feinschliff: Fokus bei reduzierter Bewegung, heute im dunklen Kopf, Auszug, Impuls-Lücke, Tastatur-Fokusrahmen
export default (test, h) => {
  const { ok, newEntryViaUI } = h;

  test('Feinschliff: visibility geht bei reduzierter Bewegung nie verzögert über', async ({ page, device }) => {
    await newEntryViaUI(page, device); await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const bad = []; for (const id of ['entry', 'eBody']) { const cs = getComputedStyle(document.getElementById(id)); const p = cs.transitionProperty.split(',').map((x) => x.trim()); if (p.includes('all') || p.includes('visibility')) bad.push(id + ':' + cs.transitionProperty + ' ' + cs.transitionDuration); }
      return { bad, tr: getComputedStyle(document.getElementById('eBody')).transitionProperty.includes('opacity') };
    });
    ok(!r.bad.length || r.bad.every((b) => /^entry:/.test(b)), 'visibility/all im Übergang: ' + r.bad.join(' | '));
    ok(r.tr, 'opacity-Übergang fehlt auf #eBody');
  });

  test('Feinschliff: heute ohne Eintrag im dunklen Kopf ist hell', async ({ page }) => {
    const r = await page.evaluate(() => {
      const out = []; document.querySelectorAll('.dark .is-today .dot, .dark .is-missed .dot').forEach((d) => { out.push([d.parentElement.className, getComputedStyle(d).color]); });
      return out;
    });
    const t = r.filter((x) => /is-today/.test(x[0])); ok(t.length, 'kein heutiger Tag ohne Eintrag gefunden');
    ok(t.every((x) => x[1] === 'rgb(242, 243, 239)'), 'Farbe heute: ' + JSON.stringify(t));
  });

  test('Feinschliff: Auszug endet nie auf „.…“', async ({ page }) => {
    const r = await page.evaluate(() => {
      const mk = (t) => excerptOf({ title: 'T', text: t });
      const long = 'Das ist ein ganz normaler Satz über den Tag. '.repeat(10);
      const edge = 'a'.repeat(100) + ' ' + 'b'.repeat(38) + '. Danach kommt noch viel mehr Text, der weit über die Grenze hinausgeht und lang ist.';
      return [mk(long), mk(edge), mk('Kurz und gut.')];
    });
    for (const s of r.slice(0, 2)) ok(s.endsWith('…') && !/[.,;:–-]…$/.test(s) && s.length <= 141, 'Auszug: ' + s);
    ok(r[2] === 'Kurz und gut.', 'kurzer Text verändert: ' + r[2]);
  });

  test('Feinschliff: Lücke unter dem kleinen Impuls höchstens 18 px', async ({ page, device }) => {
    await newEntryViaUI(page, device); await page.waitForTimeout(600);
    await page.keyboard.type('Hallo'); await page.waitForTimeout(1500);
    const g = await page.evaluate(() => {
      ok_ = document.getElementById('eImp').classList.contains('wr');
      const pb = document.getElementById('eImpT'); const rg = document.createRange(); rg.selectNodeContents(pb); const tb = rg.getBoundingClientRect();
      const eb = document.getElementById('eBody').getBoundingClientRect();
      return { wr: ok_, gap: eb.top - tb.bottom };
    });
    ok(g.wr, 'Impuls nicht im kleinen Zustand');
    ok(g.gap <= 18.5, 'Lücke ' + g.gap.toFixed(1) + ' px');
  });

  test('Feinschliff: Tastatur-Fokusrahmen kupfer, Maus ohne', async ({ page, device }) => {
    await page.keyboard.press('Tab'); await page.waitForTimeout(100);
    const r = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, w: cs.outlineWidth, st: cs.outlineStyle, c: cs.outlineColor, o: cs.outlineOffset, fv: a.matches(':focus-visible') }; });
    ok(r.fv && r.st === 'solid' && /^1(\.5)?px$/.test(r.w) && r.o === '2px', 'Rahmen: ' + JSON.stringify(r));
    ok(/^rgb\(163, 95, 58\)$|^rgba\(242, 243, 239, 0\.7\d*\)$/.test(r.c), 'Rahmenfarbe: ' + r.c);
  }, ['Mac']);
};
