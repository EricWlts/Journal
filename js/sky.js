// Mond, Sonne, Wetter und Ort
'use strict';
/* PLAN 7 · Jahreslinie, Mond, Ort & Wetter. Gespeichert wird nur „Leer · 4° Nebel“ und die Sonnenzeiten im neuen Eintrag – nie Koordinaten. */
const SKY = { lat: null, lon: null, wx: '', wxAt: 0, day: '', sig: '' };
const pad2 = (n) => (n < 10 ? '0' : '') + n;
const hm = (d) => d.getHours() + ':' + pad2(d.getMinutes());
function moonAge(d) { const jd = d.getTime() / 864e5 + 2440587.5; const x = ((jd - 2451550.1) / 29.530588853) % 1; return x < 0 ? x + 1 : x; }
const moonName = (a) => a < .03 || a > .97 ? 'Neumond' : a < .22 ? 'Zunehmende Sichel' : a < .28 ? 'Erstes Viertel' : a < .47 ? 'Zunehmender Mond' : a < .53 ? 'Vollmond' : a < .72 ? 'Abnehmender Mond' : a < .78 ? 'Letztes Viertel' : 'Abnehmende Sichel';
function moonInfo(now) {
  const at = (k) => moonAge(new Date(now.getFullYear(), now.getMonth(), now.getDate() + k, 21)), a = at(0), nm = moonName(a);
  let toFull = 30, toNew = 30;
  for (let k = 0; k < 31; k++) { const x = at(k), y = at(k + 1); if (toFull === 30 && x <= .5 && y > .5) toFull = k; if (toNew === 30 && y < x) toNew = k; }
  const n = Math.min(toFull, toNew) + 1, what = toFull <= toNew ? 'Vollmond' : 'Neumond';
  const next = nm === 'Vollmond' ? 'Heute Nacht voll' : nm === 'Neumond' ? 'Heute Nacht dunkel' : what + (n === 1 ? ' morgen' : ' in ' + n + ' Tagen');
  return { a, nm, next };
}
function moonSVG(a, id) { // echt beleuchtet: zunehmend rechts hell, weiche Schattengrenze, Mondmeere, schwacher Erdschein
  const r = 15, rx = Math.abs(Math.cos(2 * Math.PI * a)) * r, wax = a < .5, o = wax ? 1 : 0, i = wax ? (a < .25 ? 0 : 1) : (a > .75 ? 1 : 0);
  const lit = a < .012 || a > .988 ? 'M 0 0 Z' : 'M 0 ' + (-r) + ' A ' + r + ' ' + r + ' 0 0 ' + o + ' 0 ' + r + ' A ' + rx.toFixed(2) + ' ' + r + ' 0 0 ' + i + ' 0 ' + (-r) + ' Z';
  return '<defs><radialGradient id="ml' + id + '" cx="38%" cy="36%" r="72%"><stop offset="0" stop-color="#f7f4ea"/><stop offset=".68" stop-color="#e2ddcc"/><stop offset="1" stop-color="#b8b3a2"/></radialGradient>'
    + '<filter id="mf' + id + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".7"/></filter>'
    + '<mask id="mm' + id + '"><rect x="-17" y="-17" width="34" height="34" fill="#000"/><path d="' + lit + '" fill="#fff" filter="url(#mf' + id + ')"/></mask></defs>'
    + '<circle r="15" fill="#1b201c"/><circle r="15" fill="#c9cdc4" opacity=".07"/>'
    + '<g mask="url(#mm' + id + ')"><circle r="15" fill="url(#ml' + id + ')"/><g fill="#8b8676" opacity=".32"><ellipse cx="-5" cy="-5" rx="5" ry="4"/><ellipse cx="3" cy="-3.5" rx="3.4" ry="3"/><ellipse cx="5.5" cy="1.2" rx="4" ry="3.1"/><ellipse cx="10.5" cy="-2" rx="1.9" ry="2.4"/><ellipse cx="-7.5" cy="3.5" rx="4.4" ry="6.2"/><ellipse cx="1.5" cy="7.5" rx="3.2" ry="2"/></g><circle cx="-2" cy="10" r="1.1" fill="#fbf9f1" opacity=".55"/></g>'
    + '<circle r="15" fill="none" stroke="rgba(242,243,239,.14)" stroke-width=".8"/>';
}
function sunTimes(date, lat, lon) { // NOAA-Näherung; Ortszeit inkl. Sommerzeit über Date; Polartag/-nacht abgefangen
  const R = Math.PI / 180, y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
  const n = Date.UTC(y, m, d, 12) / 864e5 + 2440587.5 - 2451545 - lon / 360;
  const g = (357.529 + 0.98560028 * n) * R, q = 280.459 + 0.98564736 * n;
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * R, eps = (23.439 - 0.00000036 * n) * R;
  const dec = Math.asin(Math.sin(eps) * Math.sin(L));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(L), Math.cos(L)) / R / 15;
  let eqt = ((q / 15 - ra) % 24 + 36) % 24 - 12; // Zeitgleichung in Stunden
  const cosH = (Math.sin(-0.833 * R) - Math.sin(lat * R) * Math.sin(dec)) / (Math.cos(lat * R) * Math.cos(dec));
  if (cosH > 1) return { polar: 'Polarnacht' }; if (cosH < -1) return { polar: 'Mitternachtssonne' };
  const H = Math.acos(cosH) / R / 15, noon = 12 - lon / 15 - eqt, base = Date.UTC(y, m, d);
  return { rise: new Date(base + (noon - H) * 36e5), set: new Date(base + (noon + H) * 36e5) };
}
const SUNUP = '<svg viewBox="0 0 24 24" fill="none" stroke="#c9a06a" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 19h18M7 15a5 5 0 0 1 10 0M12 3v6M9 6l3-3 3 3"/></svg>';
const SUNDN = '<svg viewBox="0 0 24 24" fill="none" stroke="#7f8b81" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 19h18M7 15a5 5 0 0 1 10 0M12 9V3M9 6l3 3 3-3"/></svg>';
function sunNow() { if (SKY.lat == null) return null; return sunTimes(new Date(), SKY.lat, SKY.lon); }
function sunStr() { const t = sunNow(); return !t ? '' : t.polar ? t.polar : hm(t.rise) + ' – ' + hm(t.set); }
function paintSky() {
  const now = new Date(), day = keyOf(now), t = WS.meta ? sunNow() : null, sig = day + '|' + (t ? sunStr() : '');
  const y0 = new Date(now.getFullYear(), 0, 1), days = (new Date(now.getFullYear() + 1, 0, 1) - y0) / 864e5;
  const yp = ((now - y0) / 864e5 / days * 100).toFixed(2) + '%', doy = Math.floor((now - y0) / 864e5) + 1;
  document.querySelectorAll('.yline').forEach((l) => { l.style.setProperty('--yp', yp); l.title = 'Tag ' + doy + ' von ' + days; });
  if (sig === SKY.sig) return; SKY.sig = sig;
  if (t && t.rise) { try { localStorage.setItem('journal.sunday', JSON.stringify({ d: day, r: t.rise.getHours() * 60 + t.rise.getMinutes(), s: t.set.getHours() * 60 + t.set.getMinutes() })); } catch (e) {} if (typeof applyLight === 'function') applyLight(); } /* nur heutige Zeiten in Minuten, keine Koordinaten */
  const mi = moonInfo(now);
  document.querySelectorAll('.sky').forEach((el, k) => {
    const sv = el.querySelector('.moon'); sv.innerHTML = moonSVG(mi.a, k); sv.setAttribute('aria-label', mi.nm);
    el.querySelector('.mn').textContent = mi.nm; el.querySelector('.mx').textContent = mi.next;
    const su = el.querySelector('.sun');
    su.innerHTML = !t ? '' : t.polar ? '<span>' + t.polar + '</span>' : '<span aria-label="Sonnenaufgang">' + SUNUP + hm(t.rise) + '</span><span aria-label="Sonnenuntergang">' + SUNDN + hm(t.set) + '</span>';
    su.classList.toggle('on', !!t);
  });
}
const geoSt = () => { try { return localStorage.getItem('journal.geo') || ''; } catch (e) { return ''; } };
const setGeo = (v) => { try { localStorage.setItem('journal.geo', v); } catch (e) {} };
const WXW = (c) => c === 0 ? 'klar' : c === 1 ? 'heiter' : c === 2 ? 'wolkig' : c === 3 ? 'bedeckt' : c === 45 || c === 48 ? 'Nebel' : c >= 51 && c <= 57 ? 'Niesel' : c >= 61 && c <= 67 ? 'Regen' : c >= 71 && c <= 77 ? 'Schnee' : c >= 80 && c <= 82 ? 'Schauer' : c >= 85 && c <= 86 ? 'Schneeschauer' : c >= 95 ? 'Gewitter' : '';
function locate(ask) { // einmal fragen, ungefähr; abgelehnt = nie wieder fragen
  if (!WS.meta || !navigator.geolocation || SKY.locating) return; const st = geoSt();
  if (st === 'no' || (!st && !ask)) return;
  SKY.locating = true;
  navigator.geolocation.getCurrentPosition((p) => {
    SKY.locating = false; setGeo('ok');
    SKY.lat = Math.round(p.coords.latitude * 100) / 100; SKY.lon = Math.round(p.coords.longitude * 100) / 100;
    SKY.sig = ''; paintSky(); fillMeta(); fetchWx();
  }, (err) => { SKY.locating = false; if (err && err.code === 1) setGeo('no'); }, { enableHighAccuracy: false, maximumAge: 3 * 36e5, timeout: 20000 });
}
async function fetchWx() {
  if (SKY.lat == null || !navigator.onLine || Date.now() - SKY.wxAt < 30 * 6e4) return; SKY.wxAt = Date.now();
  const la = SKY.lat, lo = SKY.lon;
  const get = (u) => fetch(u, { cache: 'no-store', referrerPolicy: 'no-referrer' }).then((r) => r.ok ? r.json() : null).catch(() => null);
  const [pl, w] = await Promise.all([
    get('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + la + '&longitude=' + lo + '&localityLanguage=de'),
    get('https://api.open-meteo.com/v1/forecast?latitude=' + la + '&longitude=' + lo + '&current=temperature_2m,weather_code&timezone=auto')]);
  const place = pl ? (pl.city || pl.locality || '') : '';
  const c = w && w.current, wx = c && typeof c.temperature_2m === 'number' ? (Math.round(c.temperature_2m) + '° ' + WXW(c.weather_code)).trim() : '';
  if (!place && !wx) { SKY.wxAt = 0; return; } // offline oder Dienst weg: nichts anzeigen
  SKY.wx = [place, wx].filter(Boolean).join(' · '); fillMeta();
}
function fillMeta() { // nur das neue Blatt von heute bekommt Ort, Wetter und Sonnenzeiten
  const e = S.cur; if (!e || !WS.meta || AID.e !== e || e.date !== keyOf(new Date())) return;
  let ch = false; const ss = sunStr();
  if (SKY.wx && !e.wx) { e.wx = SKY.wx; ch = true; } if (ss && !e.sun) { e.sun = ss; ch = true; }
  if (!ch) return; writeAids();
  if (e.id) { e._dirty = true; DB.put('entries', e).then(() => Sync.soon()).catch(() => {}); }
}
