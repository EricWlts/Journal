// ZIP lesen, Day-One-Import, Sicherung
'use strict';
/* ---------- ZIP reading (Day One export) ---------- */
async function readZip(file) {
  const buf = new Uint8Array(await file.arrayBuffer()); const dv = new DataView(buf.buffer);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Keine gültige ZIP-Datei.');
  let count = dv.getUint16(eocd + 10, true), cd = dv.getUint32(eocd + 16, true);
  if (cd === 0xffffffff || count === 0xffff) { // ZIP64
    const loc = eocd - 20;
    if (dv.getUint32(loc, true) === 0x07064b50) { const z = Number(dv.getBigUint64(loc + 8, true)); count = Number(dv.getBigUint64(z + 32, true)); cd = Number(dv.getBigUint64(z + 48, true)); }
  }
  const files = new Map(); const dec = new TextDecoder();
  let p = cd;
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    let csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    let off = dv.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nl));
    if (csize === 0xffffffff || usize === 0xffffffff || off === 0xffffffff) { // zip64 extra
      let q = p + 46 + nl; const qe = q + xl;
      while (q < qe) { const id = dv.getUint16(q, true), sz = dv.getUint16(q + 2, true);
        if (id === 1) { let r = q + 4; if (usize === 0xffffffff) { usize = Number(dv.getBigUint64(r, true)); r += 8; } if (csize === 0xffffffff) { csize = Number(dv.getBigUint64(r, true)); r += 8; } if (off === 0xffffffff) { off = Number(dv.getBigUint64(r, true)); } }
        q += 4 + sz; }
    }
    files.set(name, { method, csize, off });
    p += 46 + nl + xl + cl;
  }
  async function get(name) {
    const f = files.get(name); if (!f) return null;
    const lnl = dv.getUint16(f.off + 26, true), lxl = dv.getUint16(f.off + 28, true);
    const start = f.off + 30 + lnl + lxl; const raw = buf.subarray(start, start + f.csize);
    if (f.method === 0) return raw;
    if (f.method !== 8) throw new Error('Nicht unterstützte Komprimierung.');
    const ds = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(ds).arrayBuffer());
  }
  return { names: [...files.keys()], get };
}

/* ---------- Day One conversion ---------- */
function localParts(iso, tz) {
  const d = new Date(iso);
  try {
    const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz || undefined, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const o = {}; for (const p of f.formatToParts(d)) o[p.type] = p.value;
    return { date: o.year + '-' + o.month + '-' + o.day, hh: +o.hour, mm: +o.minute };
  } catch (e) { return { date: keyOf(d), hh: d.getHours(), mm: d.getMinutes() }; }
}
function convertDayOne(entry) {
  let text = String(entry.text || '').replace(/\r\n?/g, '\n');
  const photoIds = [];
  text = text.replace(/!\[[^\]]*\]\(dayone-moment:\/\/([^)]+)\)/g, (m, id) => { photoIds.push(id); return ''; });
  text = text.replace(/!\[[^\]]*\]\(dayone-moment:\/[^)]*\)/g, '');
  text = text.replace(/\\([\\`*_{}\[\]()#+\-.!>|~])/g, '$1');
  let lines = text.split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  let title = '';
  if (lines.length && /^#{1,6}\s+/.test(lines[0])) { title = lines.shift().replace(/^#{1,6}\s+/, '').trim(); }
  else if (lines.length > 1 && lines[0].trim().length <= 100) { title = lines.shift().replace(/[*_]{1,2}/g, '').trim(); } // Day One nutzt die erste Zeile als Titel
  let body = lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
  body = body.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
  const lp = localParts(entry.creationDate, entry.timeZone);
  const created = new Date(lp.date + 'T' + pad(lp.hh) + ':' + pad(lp.mm) + ':00').toISOString();
  return { id: 'dayone-' + entry.uuid, date: lp.date, created, title, text: body, photos: [], source: 'dayone', _photoIds: photoIds };
}
$('fileDayOne').addEventListener('change', async (ev) => {
  const file = ev.target.files[0]; ev.target.value = ''; if (!file) return;
  const note = $('noteDayOne');
  try {
    note.textContent = 'Lese die Datei …';
    const zip = await readZip(file);
    const jsons = zip.names.filter((n) => /\.json$/i.test(n) && n.split('/').length <= 2 && !/(^|\/)(photos|videos|audios|pdfs)\//i.test(n) && !/(^|\/)__MACOSX\//.test(n));
    if (!jsons.length) throw new Error('In der ZIP-Datei wurde keine Day-One-JSON-Datei gefunden.');
    const photoFiles = new Map(); // md5 -> name
    for (const n of zip.names) { const m = n.match(/(?:^|\/)photos\/([0-9a-f]{32})\.([a-z0-9]+)$/i); if (m) photoFiles.set(m[1].toLowerCase(), n); }
    let nEntries = 0, nPhotos = 0; const all = [];
    for (const jn of jsons) {
      const data = JSON.parse(new TextDecoder().decode(await zip.get(jn)));
      for (const de of (data.entries || [])) { if (!de.uuid || !de.creationDate) continue; all.push({ de, e: convertDayOne(de) }); }
    }
    let i = 0; const batch = [];
    for (const { de, e } of all) {
      i++; if (i % 25 === 0) note.textContent = 'Übernehme Eintrag ' + i + ' von ' + all.length + ' …';
      const byIdent = new Map((de.photos || []).map((p) => [p.identifier, p]));
      const order = e._photoIds.length ? e._photoIds.map((id) => byIdent.get(id)).filter(Boolean) : (de.photos || []);
      for (const p of order) {
        const fname = p.md5 && photoFiles.get(String(p.md5).toLowerCase()); if (!fname) continue;
        const bytes = await zip.get(fname); const ext = fname.split('.').pop().toLowerCase();
        const type = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
        const pid = 'p-' + p.md5; await DB.put('photos', { id: pid, blob: new Blob([bytes], { type }), type });
        e.photos.push(pid); nPhotos++;
      }
      delete e._photoIds;
      if (!e.title && !e.text && !e.photos.length) continue;
      batch.push(e); nEntries++;
    }
    for (const b of batch) { b._dirty = true; b.modified = b.modified || b.created; }
    await DB.putMany('entries', batch); Sync.soon(500);
    const ids = new Set(batch.map((b) => b.id));
    S.entries = S.entries.filter((x) => !ids.has(x.id)).concat(batch); reindex(); renderHome(); S.homeDirty = false;
    note.textContent = nEntries + (nEntries === 1 ? ' Eintrag' : ' Einträge') + ' und ' + nPhotos + (nPhotos === 1 ? ' Foto' : ' Fotos') + ' übernommen.'; renderAbout();
    toast('Import fertig');
  } catch (err) {
    console.error(err);
    note.textContent = 'Das hat nicht geklappt: ' + (err && err.message ? err.message : err);
  }
});

/* ---------- backup ---------- */
const blobToB64 = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(b); });
async function exportBackup() {
  const note = $('noteBackup'); note.textContent = 'Erstelle Sicherung …';
  const photos = await DB.all('photos'); const out = [];
  for (const p of photos) out.push({ id: p.id, type: p.type, data: await blobToB64(p.blob) });
  const json = JSON.stringify({ app: 'journal', version: 1, exported: new Date().toISOString(), entries: S.entries, photos: out });
  const name = 'journal-sicherung-' + keyOf(new Date()) + '.json';
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    try { await navigator.share({ files: [file], title: name }); note.textContent = 'Sicherung erstellt.'; return; } catch (e) { if (e.name === 'AbortError') { note.textContent = ''; return; } }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  note.textContent = 'Sicherung gespeichert: ' + name;
}
$('fileBackup').addEventListener('change', async (ev) => {
  const file = ev.target.files[0]; ev.target.value = ''; if (!file) return;
  const note = $('noteBackup');
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'journal' || !Array.isArray(data.entries)) throw new Error('Das ist keine Sicherung dieser App.');
    note.textContent = 'Lade Sicherung …';
    for (const p of (data.photos || [])) {
      const bin = atob(p.data); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      await DB.put('photos', { id: p.id, type: p.type, blob: new Blob([u], { type: p.type }) });
    }
    for (const b of data.entries) { b._dirty = true; b.modified = b.modified || b.created; }
    await DB.putMany('entries', data.entries); Sync.soon(500);
    const ids = new Set(data.entries.map((e) => e.id));
    S.entries = S.entries.filter((x) => !ids.has(x.id)).concat(data.entries); reindex(); renderHome();
    note.textContent = data.entries.length + ' Einträge geladen.'; toast('Sicherung geladen'); renderAbout();
  } catch (err) { note.textContent = 'Das hat nicht geklappt: ' + (err.message || err); }
});
async function renderAbout() {
  let persisted = false; try { persisted = navigator.storage && await navigator.storage.persisted(); } catch (e) {}
  $('about').textContent = S.entries.length + ' Einträge auf diesem Gerät. ' + (Sync.on() ? 'Der Abgleich ist eingerichtet.' : (persisted ? 'Der Speicher ist dauerhaft geschützt.' : 'Mach ab und zu eine Sicherung, bis der Abgleich eingerichtet ist.'));
  if (Sync.on()) { $('syncRepo').value = Sync.cfg.repo; $('syncToken').placeholder = 'Gespeichert – nur zum Ändern neu eingeben'; }
  if (Sync.meta && Sync.meta.last && Sync.on() && !Sync.busy) Sync.status('Zuletzt abgeglichen: ' + new Date(Sync.meta.last).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }));
}
