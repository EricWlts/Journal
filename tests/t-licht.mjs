// Phase 4 · Licht: Stufen färben Kopf, Jahreslinie, Verlauf, Korn, Mondschein, Lampe; Sonnenzeiten; Nachtmodus
export default (test, h) => {
  const { ok } = h;
  // Farbe/Wert einer CSS-Angabe als Computed-Wert (rgb/rgba) lesen
  const col = (page, expr) => page.evaluate((e) => { const p = document.createElement('i'); p.style.color = e; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; }, expr);
  const rgb = (hex) => 'rgb(' + [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ') + ')';
  const alpha = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };
  const stage = async (page, st, night = false) => { await page.evaluate(([s, n]) => { document.documentElement.dataset.light = s; document.documentElement.classList.toggle('night', n); }, [st, night]); await page.waitForTimeout(450); };
  const at = async (page, hour) => { await page.evaluate((hh) => { const D = Date, off = new D().setHours(hh, 5, 0, 0) - D.now(); window.Date = class extends D { constructor(...a) { if (a.length) super(...a); else super(D.now() + off); } static now() { return D.now() + off; } }; }, hour); };
  const heads = { morgen: '#151a17', tag: '#12150f', abend: '#15130f', spaet: '#0d0f0b' };
  const lines = { morgen: '#c9a58f', tag: '#a35f3a', abend: '#c27a52', spaet: '#8f5c40' };
  const glow = { morgen: [226, 176, 150, .24], tag: [226, 176, 150, .04], abend: [198, 124, 82, .34], spaet: null };
  const lamp = { morgen: 0, tag: 0, abend: .45, spaet: 1 };

  test('Licht: Kopfton, Jahreslinie, Verlauf, Lampe je Stufe', async ({ page, device }) => {
    for (const st of ['morgen', 'tag', 'abend', 'spaet']) {
      await stage(page, st);
      const r = await page.evaluate(() => { const q = (s) => document.querySelector(s); return {
        hero: getComputedStyle(q('#home > .hero')).backgroundColor, body: getComputedStyle(document.body).backgroundColor,
        yl: getComputedStyle(device_yl(), '::after').backgroundColor, lamp: getComputedStyle(document.documentElement).getPropertyValue('--lamp').trim(),
        bg: getComputedStyle(q('#entry')).backgroundImage, grad: getComputedStyle(q('.hero.herorest'), '::after').backgroundImage, gpe: getComputedStyle(q('.hero.herorest'), '::after').pointerEvents };
        function device_yl() { return [...document.querySelectorAll('.yline')].find((x) => x.offsetParent) || q('.yline'); } });
      ok(r.hero === rgb(heads[st]) && r.body === rgb(heads[st]), st + ' Kopfton ' + r.hero + ' / ' + r.body);
      ok(r.yl === rgb(lines[st]), st + ' Jahreslinie ' + r.yl);
      ok(parseFloat(r.lamp) === lamp[st], st + ' --lamp ' + r.lamp);
      ok(/radial-gradient/.test(r.bg), 'Lampe fehlt: ' + r.bg);
      ok(/linear-gradient/.test(r.grad) && /to top|0deg/.test(r.grad) && /58%/.test(r.grad) && r.gpe === 'none', st + ' Verlauf ' + r.grad + ' ' + r.gpe);
      const hg = await col(page, 'var(--hglow)'), a = alpha(hg);
      if (glow[st]) { const g = glow[st]; ok(hg.startsWith('rgba(' + g.slice(0, 3).join(', ')) && Math.abs(a - g[3]) < .006, st + ' Verlauffarbe ' + hg); } else ok(a === 0, st + ' Verlauf nachts: ' + hg);
      ok(parseFloat(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--mglow'))) === (st === 'spaet' ? 1 : 0), st + ' Mondschein');
    }
  });

  test('Licht: Korn 5,5 %, statisch, ohne Klicks; Mondschein nachts', async ({ page, device }) => {
    await stage(page, 'tag');
    const r = await page.evaluate((dev) => { const q = (s) => document.querySelector(s), g = (el, p) => getComputedStyle(el, '::before');
      const els = dev === 'iPhone' ? ['#home > .hero', '#stickyTitle', '#yLineW', '#skyH'] : ['#home > .hero', '#stickyTitle', '.hero.herorest'];
      return { grain: els.map((s) => { const c = g(q(s)); return [s, c.opacity, c.pointerEvents, c.animationName, /data:image\/svg/.test(c.backgroundImage), c.position]; }),
        sky: [...document.querySelectorAll('.sky')].map((s) => { const c = getComputedStyle(s, '::before'); return [c.pointerEvents, /radial-gradient/.test(c.backgroundImage), c.width]; }) }; }, device);
    for (const x of r.grain) ok(x[1] === '0.055' && x[2] === 'none' && x[3] === 'none' && x[4] && x[5] === 'absolute', 'Korn ' + JSON.stringify(x));
    for (const x of r.sky) ok(x[0] === 'none' && x[1] && x[2] === '102px', 'Mondschein ' + JSON.stringify(x));
    await stage(page, 'tag'); const o1 = await page.evaluate(() => getComputedStyle(document.querySelector('.sky'), '::before').opacity);
    await stage(page, 'spaet'); const o2 = await page.evaluate(() => getComputedStyle(document.querySelector('.sky'), '::before').opacity);
    ok(o1 === '0' && o2 === '1', 'Mondschein tags/nachts: ' + o1 + ' ' + o2);
  });

  test('Licht: Lampe auf dem Blatt – Stärke, hinter dem Text, ohne Klicks, scrollt nicht mit', async ({ page, device }) => {
    await h.newEntryViaUI(page, device);
    for (const [st, k] of [['tag', 0], ['abend', .45], ['spaet', 1]]) {
      await stage(page, st);
      const r = await page.evaluate(() => { const e = document.getElementById('entry'), c = getComputedStyle(e); return { bg: c.backgroundImage, att: c.backgroundAttachment, col: c.backgroundColor, lamp: getComputedStyle(document.documentElement).getPropertyValue('--lamp').trim() }; });
      const top = /rgba\(255, 236, 205, ([\d.]+)\)/.exec(r.bg);
      ok(/^scroll(, scroll)*$/.test(r.att) && parseFloat(r.lamp) === k, st + ': ' + r.att + ' ' + r.lamp);
      ok(k === 0 ? (!top || parseFloat(top[1]) === 0) : top && Math.abs(parseFloat(top[1]) - .3 * k) < .01, st + ' Schein oben ' + r.bg);
      ok(k === 0 || /rgba\(60, 40, 20, ([\d.]+)\)/.test(r.bg), st + ' unten dunkler: ' + r.bg);
    }
    // Text bleibt gleich lesbar: Textfarbe unverändert, Lampe nur als Hintergrundebene (kein Overlay-Element über dem Text)
    const t = await page.evaluate(() => { const b = document.getElementById('eBody'); return [getComputedStyle(b).color, getComputedStyle(document.getElementById('entry'), '::before').content, getComputedStyle(document.getElementById('entry'), '::after').content]; });
    ok(t[1] === 'none', 'Overlay über dem Text: ' + JSON.stringify(t));
  });

  test('Licht: Nachtmodus – Kopf, Verlauf aus, Mondschein, Lampe 100 %', async ({ page }) => {
    await stage(page, 'tag', true);
    const r = await page.evaluate(() => { const rs = getComputedStyle(document.documentElement); return { hero: getComputedStyle(document.querySelector('#home > .hero')).backgroundColor, lamp: rs.getPropertyValue('--lamp').trim(), mg: rs.getPropertyValue('--mglow').trim(), bg: getComputedStyle(document.getElementById('entry')).backgroundImage,
      tc: document.querySelector('meta[name=theme-color]').content }; });
    ok(r.hero === rgb('#0b0d0a'), 'Nacht-Kopf ' + r.hero); ok(parseFloat(r.lamp) === 1 && parseFloat(r.mg) === 1, 'Nacht Lampe/Mond ' + r.lamp + ' ' + r.mg);
    ok(alpha(await col(page, 'var(--hglow)')) === 0, 'Nacht: Verlauf'); ok(alpha(await col(page, 'var(--yc)')) === 1 && (await col(page, 'var(--yc)')) === rgb('#c27a52'), 'Nacht: Jahreslinie');
    ok(/rgba\(255, 236, 205, 0\.06\)/.test(r.bg) && /rgba\(0, 0, 0, 0\.22\)/.test(r.bg), 'Nacht-Lampe ' + r.bg);
    ok(await page.evaluate(() => { setTheme(); return true; }), 'setTheme');
  });

  test('Licht: Stufenregel mit Sonnenzeiten schon beim ersten Bild; ohne passende Zeiten nach Uhrzeit', async ({ page, ctx }) => {
    // 12:30 Ortszeit; Aufgang 11:40, Untergang 13:00 → nach Sonne „morgen“, nach Uhrzeit „tag“
    await ctx.addInitScript(() => {
      const D = Date, off = new D().setHours(12, 30, 0, 0) - D.now();
      window.Date = class extends D { constructor(...a) { if (a.length) super(...a); else super(D.now() + off); } static now() { return D.now() + off; } };
      const n = new Date(), k = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
      if (!localStorage.getItem('t.once')) { localStorage.setItem('t.once', '1'); localStorage.setItem('journal.sunday', JSON.stringify({ d: location.hash === '#alt' ? '2020-01-01' : k, r: 700, s: 780 })); }
      window.__ls = []; new MutationObserver(() => window.__ls.push(document.documentElement.dataset.light)).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-light'] });
    });
    await page.reload(); await page.waitForFunction(() => typeof S !== 'undefined' && S.stack);
    let r = await page.evaluate(() => ({ ls: window.__ls, now: document.documentElement.dataset.light, ls2: lightStage(new Date()) }));
    ok(r.ls.length && r.ls.every((x) => x === 'morgen') && r.now === 'morgen' && r.ls2 === 'morgen', 'Sonne: ' + JSON.stringify(r));
    // Grenzen: morgen [r−1h, r+3h), tag bis s−1,5h, abend [s−1,5h, s+2h), sonst spät
    const g = await page.evaluate(() => { const f = (m) => { localStorage.setItem('journal.sunday', JSON.stringify({ d: keyOf(new Date()), r: 480, s: 1000 })); const n = new Date(); return lightStage(new Date(n.getFullYear(), n.getMonth(), n.getDate(), Math.floor(m / 60), m % 60)); };
      return { a: f(419), b: f(420), c: f(659), d: f(660), e: f(909), f: f(910), g: f(1119), h: f(1120) }; });
    ok(g.a === 'spaet' && g.b === 'morgen' && g.c === 'morgen' && g.d === 'tag' && g.e === 'tag' && g.f === 'abend' && g.g === 'abend' && g.h === 'spaet', 'Grenzen: ' + JSON.stringify(g));
    // veraltete Zeiten (anderer Tag) werden ignoriert
    const old = await page.evaluate(() => { localStorage.setItem('journal.sunday', JSON.stringify({ d: '2020-01-01', r: 700, s: 780 })); return lightStage(new Date()); });
    ok(old === 'tag', 'alte Zeiten: ' + old);
  });

  test('Licht: Sonnenzeiten werden nur als Minuten gespeichert, keine Koordinaten', async ({ page }) => {
    const s = await page.evaluate(() => { WS.meta = true; SKY.lat = 53.23; SKY.lon = 7.45; SKY.sig = ''; paintSky(); return localStorage.getItem('journal.sunday'); });
    const j = JSON.parse(s); const k = await page.evaluate(() => keyOf(new Date()));
    ok(j.d === k && j.r > 200 && j.r < j.s && j.s < 1300 && Object.keys(j).sort().join() === 'd,r,s', 'sunday: ' + s);
    ok(!/53\.2|7\.45/.test(await page.evaluate(() => JSON.stringify(localStorage))), 'Koordinaten gespeichert');
  });

  test('Licht: Mond immer sichtbar und groß (iPhone ≥ 34, Mac ≥ 30 px), auch mittags', async ({ page, device }) => {
    await at(page, 12); await page.evaluate(() => { SKY.sig = ''; paintSky(); applyLight(); });
    const r = await page.evaluate(() => [...document.querySelectorAll('.sky')].map((s) => { const m = s.querySelector('.moon'), b = m.getBoundingClientRect(), c = getComputedStyle(m); return { w: b.width, hgt: b.height, svg: !!m.querySelector('circle'), disp: c.display, vis: c.visibility, sun: !!s.querySelector('.sunball, .sunicon') }; }));
    const need = device === 'iPhone' ? 34 : 30, el = r.filter((x) => x.w > 0);
    ok(el.length >= 1 && el.every((x) => x.w >= need && x.hgt >= need && x.svg && x.disp !== 'none' && x.vis !== 'hidden' && !x.sun), 'Mond: ' + JSON.stringify(r));
  });

  test('Licht: Übergang 2,4 s, cubic-bezier(.4,0,.2,1) auf Variablen und Papier', async ({ page }) => {
    const r = await page.evaluate(() => { const c = getComputedStyle(document.documentElement), l = getComputedStyle(document.getElementById('list')), hm = getComputedStyle(document.getElementById('home'));
      return { p: c.transitionProperty, d: c.transitionDuration, f: c.transitionTimingFunction, ed: hm.transitionProperty + ' ' + hm.transitionDuration, ef: hm.transitionTimingFunction, ld: l.transitionProperty + ' ' + l.transitionDuration }; });
    ok(/--head/.test(r.p) && /--yc/.test(r.p) && /--hglow/.test(r.p) && /--mglow/.test(r.p) && /--lamp/.test(r.p), 'Eigenschaften: ' + r.p);
    ok(r.d.split(',').every((x) => x.trim() === '2.4s') && r.f.split('),').every((x) => /cubic-bezier\(0\.4, 0, 0\.2, 1/.test(x)), 'html: ' + r.d + ' ' + r.f);
    ok(/background-color 2\.4s/.test(r.ed) && /background-color.*2\.4s/.test(r.ld) && /0\.4, 0, 0\.2, 1/.test(r.ef), 'Papier: ' + r.ed + ' | ' + r.ld + ' | ' + r.ef);
    // Wirkung: nach dem Stufenwechsel ist der Kopf erst nach einiger Zeit am Ziel
    await page.evaluate(() => { document.documentElement.dataset.light = 'tag'; }); await page.waitForTimeout(2800);
    await page.evaluate(() => { document.documentElement.dataset.light = 'spaet'; }); await page.waitForTimeout(600);
    const mid = await page.evaluate(() => getComputedStyle(document.querySelector('#home > .hero')).backgroundColor);
    ok(mid !== 'rgb(13, 15, 11)' && mid !== 'rgb(18, 21, 15)', 'kein weicher Übergang: ' + mid);
    await page.waitForTimeout(2200);
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('#home > .hero')).backgroundColor) === 'rgb(13, 15, 11)', 'Ziel nicht erreicht');
  }, ['iPhone', 'Mac'], null, { motion: true });
};
