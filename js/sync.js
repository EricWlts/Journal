// Abgleich mit GitHub (Sync, applyRemote)
'use strict';
/* ---------- Abgleich über ein privates GitHub-Repository ---------- */
async function pool(items, n, fn) { let i = 0; const run = async () => { while (i < items.length) { const k = i++; await fn(items[k]); } }; await Promise.all(Array.from({ length: Math.min(n, items.length) }, run)); }
const b64ToBytes = (b64) => { const bin = atob(b64.replace(/\s/g, '')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const cleanEntry = (e) => Object.assign({ id: e.id, date: e.date, created: e.created, modified: e.modified || e.created, title: e.title || '', text: e.text || '', photos: e.photos || [], source: e.source || 'app' }, e.wx ? { wx: e.wx } : {}, e.sun ? { sun: e.sun } : {});
const deviceName = () => /iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : /Mac/.test(navigator.userAgent) ? 'Mac' : 'Gerät';
function sniffType(u) {
  if (u[0] === 0x89 && u[1] === 0x50) return 'image/png';
  if (u[0] === 0x47 && u[1] === 0x49) return 'image/gif';
  if (u[4] === 0x66 && u[5] === 0x74 && u[6] === 0x79 && u[7] === 0x70) return 'image/heic';
  return 'image/jpeg';
}
const Sync = {
  cfg: null, meta: { shas: {}, deletes: [], last: null, head: null, init: false }, busy: false, again: false, timer: null, remote: new Map(),
  load() {
    try { this.cfg = JSON.parse(localStorage.getItem('journal.sync') || 'null'); } catch (e) { this.cfg = null; }
    try { const m = JSON.parse(localStorage.getItem('journal.syncmeta') || 'null'); if (m) this.meta = Object.assign(this.meta, m); } catch (e) {}
  },
  saveMeta() { try { localStorage.setItem('journal.syncmeta', JSON.stringify(this.meta)); } catch (e) {} },
  on() { return !!(this.cfg && this.cfg.repo && this.cfg.token); },
  status(msg) { const n = $('noteSync'); if (n) n.textContent = msg; },
  branch() { return (this.cfg && this.cfg.branch) || 'main'; },
  markDeleted(id) { if (this.meta.shas['entries/' + id + '.json'] && !this.meta.deletes.includes(id)) { this.meta.deletes.push(id); this.saveMeta(); } },
  soon(ms) { if (!this.on()) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.run(), ms == null ? 2500 : ms); },
  async api(path, opts = {}) {
    const r = await fetch('https://api.github.com/repos/' + this.cfg.repo + path, {
      method: opts.method || 'GET', cache: 'no-store',
      headers: Object.assign({ Authorization: 'Bearer ' + this.cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, opts.body ? { 'Content-Type': 'application/json' } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!r.ok) { const err = new Error('GitHub ' + r.status); err.status = r.status; try { err.detail = (await r.json()).message; } catch (e) {} throw err; }
    return r.status === 204 ? null : r.json();
  },
  errorText(e) {
    if (!navigator.onLine) return 'Offline – der Abgleich läuft, sobald wieder Internet da ist.';
    if (e.status === 401) return 'Der Zugangsschlüssel ist ungültig oder abgelaufen.';
    if (e.status === 403) return 'Kein Zugriff. Der Schlüssel braucht für dieses Repository „Contents: Read and write“.';
    if (e.status === 404) return 'Repository nicht gefunden. Schreibweise prüfen: Konto/Name.';
    return 'Abgleich hat nicht geklappt' + (e.detail ? ': ' + e.detail : (e.message ? ': ' + e.message : '.'));
  },
  async connect(repo, token) {
    repo = String(repo || '').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { this.status('Bitte das Repository als Konto/Name eingeben, z. B. EricWlts/journal-daten.'); return; }
    token = String(token || '').trim() || (this.cfg && this.cfg.repo === repo ? this.cfg.token : '');
    if (!token) { this.status('Bitte den Zugangsschlüssel einfügen.'); return; }
    const changedRepo = !this.cfg || this.cfg.repo !== repo;
    this.cfg = { repo, token, branch: 'main' };
    try { localStorage.setItem('journal.sync', JSON.stringify(this.cfg)); } catch (e) {}
    if (changedRepo) { this.meta = { shas: {}, deletes: [], last: null, head: null, init: false }; this.remote = new Map(); this.saveMeta(); }
    $('syncToken').value = ''; $('syncToken').placeholder = 'Gespeichert – nur zum Ändern neu eingeben';
    this.status('Verbinde …'); await this.run(true); renderAbout();
  },
  async head() {
    try { const ref = await this.api('/git/ref/heads/' + this.branch()); const c = await this.api('/git/commits/' + ref.object.sha); return { commit: ref.object.sha, tree: c.tree.sha }; }
    catch (e) { if (e.status === 409 || e.status === 404) return null; throw e; }
  },
  async ensureRepo() {
    let h = await this.head(); if (h) return h;
    await this.api('/contents/LIESMICH.md', { method: 'PUT', body: { message: 'Journal-Daten anlegen', content: btoa('Daten der Journal-App. Bitte nicht von Hand ändern.\n') } });
    h = await this.head(); if (!h) throw new Error('Repository konnte nicht vorbereitet werden.'); return h;
  },
  async run(verbose) {
    if (!this.on()) return;
    if (!navigator.onLine) { if (verbose) this.status(this.errorText({})); return; }
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    try {
      await this.cycle(verbose);
      this.meta.last = new Date().toISOString(); this.saveMeta();
      this.status('Abgeglichen · ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' · ' + S.entries.length + ' Einträge');
    } catch (e) { console.error(e); this.status(this.errorText(e)); if (verbose) toast('Abgleich fehlgeschlagen'); }
    finally { this.busy = false; if (this.again) { this.again = false; this.soon(400); } }
  },
  async cycle(verbose) {
    let h = await this.ensureRepo();
    const pending = S.entries.some((e) => e._dirty) || this.meta.deletes.length;
    if (h.commit !== this.meta.head || !this.remote.size || !this.meta.init) await this.pull(h);
    if (!this.meta.init) { // erster Abgleich: alles hochladen, was dort noch fehlt
      for (const e of S.entries) if (!this.remote.has('entries/' + e.id + '.json')) e._dirty = true;
      this.meta.init = true; this.saveMeta();
    }
    if (!pending && !S.entries.some((e) => e._dirty)) return;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { await this.push(h); return; }
      catch (e) { if (e.status !== 422 && e.status !== 409) throw e; h = await this.head(); await this.pull(h); }
    }
  },
  async pull(h) {
    const tree = await this.api('/git/trees/' + h.tree + '?recursive=1');
    this.remote = new Map(); for (const it of tree.tree) if (it.type === 'blob') this.remote.set(it.path, it.sha);
    const changed = []; for (const [path, sha] of this.remote) if (path.startsWith('entries/') && path.endsWith('.json') && this.meta.shas[path] !== sha) changed.push([path, sha]);
    const updated = []; let done = 0;
    await pool(changed, 6, async ([path, sha]) => {
      const b = await this.api('/git/blobs/' + sha);
      const r = JSON.parse(new TextDecoder().decode(b64ToBytes(b.content)));
      const local = S.entries.find((x) => x.id === r.id);
      if (!(local && local._dirty && (local.modified || '') >= (r.modified || ''))) updated.push(r);
      this.meta.shas[path] = sha;
      if (++done % 25 === 0) this.status('Lade Einträge … ' + done + ' von ' + changed.length);
    });
    const removed = [];
    for (const path of Object.keys(this.meta.shas)) {
      if (this.remote.has(path)) continue;
      const id = path.slice(8, -5); const local = S.entries.find((x) => x.id === id);
      if (local && !local._dirty) removed.push(id);
      delete this.meta.shas[path];
    }
    this.meta.head = h.commit; this.saveMeta();
    if (updated.length || removed.length) await applyRemote(updated, removed);
  },
  async push(h) {
    const dirty = S.entries.filter((e) => e._dirty);
    const dels = this.meta.deletes.filter((id) => this.remote.has('entries/' + id + '.json'));
    const snap = new Map(dirty.map((e) => [e.id, e.modified]));
    const photoIds = [...new Set(dirty.flatMap((e) => e.photos || []))].filter((pid) => !this.remote.has('photos/' + pid));
    const items = []; let n = 0;
    await pool(photoIds, 3, async (pid) => {
      const p = await DB.get('photos', pid); if (!p) return;
      const b = await this.api('/git/blobs', { method: 'POST', body: { content: await blobToB64(p.blob), encoding: 'base64' } });
      items.push({ path: 'photos/' + pid, mode: '100644', type: 'blob', sha: b.sha });
      if (++n % 5 === 0 || n === photoIds.length) this.status('Lade Fotos hoch … ' + n + ' von ' + photoIds.length);
    });
    for (const e of dirty) items.push({ path: 'entries/' + e.id + '.json', mode: '100644', type: 'blob', content: JSON.stringify(cleanEntry(e), null, 1) });
    for (const id of dels) items.push({ path: 'entries/' + id + '.json', mode: '100644', type: 'blob', sha: null });
    if (!items.length) { this.meta.deletes = []; this.saveMeta(); return; }
    if (dirty.length > 20) this.status('Lade ' + dirty.length + ' Einträge hoch …');
    const tree = await this.api('/git/trees', { method: 'POST', body: { base_tree: h.tree, tree: items } });
    const msg = [dirty.length ? dirty.length + (dirty.length === 1 ? ' Eintrag' : ' Einträge') : '', dels.length ? dels.length + ' gelöscht' : ''].filter(Boolean).join(', ') + ' · ' + deviceName();
    const commit = await this.api('/git/commits', { method: 'POST', body: { message: msg, tree: tree.sha, parents: [h.commit] } });
    await this.api('/git/refs/heads/' + this.branch(), { method: 'PATCH', body: { sha: commit.sha, force: false } });
    const nt = await this.api('/git/trees/' + tree.sha + '?recursive=1');
    this.remote = new Map(); for (const it of nt.tree) if (it.type === 'blob') this.remote.set(it.path, it.sha);
    for (const e of dirty) {
      const path = 'entries/' + e.id + '.json'; if (this.remote.has(path)) this.meta.shas[path] = this.remote.get(path);
      if (e.modified === snap.get(e.id)) { e._dirty = false; await DB.put('entries', e); } // in der Zwischenzeit geändert? Dann beim nächsten Mal
    }
    for (const id of dels) delete this.meta.shas['entries/' + id + '.json'];
    this.meta.deletes = this.meta.deletes.filter((id) => !dels.includes(id));
    this.meta.head = commit.sha; this.saveMeta();
  },
  async fetchPhoto(pid) {
    if (!this.on()) return null;
    const sha = this.remote.get('photos/' + pid); if (!sha) return null;
    try {
      const b = await this.api('/git/blobs/' + sha); const u = b64ToBytes(b.content);
      const p = { id: pid, type: sniffType(u), blob: new Blob([u], { type: sniffType(u) }) };
      await DB.put('photos', p); return p;
    } catch (e) { return null; }
  }
};
async function applyRemote(updated, removed) {
  const curId = S.cur && S.cur.id;
  for (const r of updated) {
    r._dirty = false; r._savedSig = undefined;
    const i = S.entries.findIndex((x) => x.id === r.id);
    if (i >= 0) S.entries[i] = r; else S.entries.push(r);
  }
  if (updated.length) await DB.putMany('entries', updated);
  for (const id of removed) { S.entries = S.entries.filter((x) => x.id !== id); await DB.del('entries', id); }
  reindex(); renderHome();
  if (S.stack.includes('calendar')) renderCalendar();
  if (curId && !typing()) {
    const fresh = S.entries.find((x) => x.id === curId);
    if (fresh && fresh !== S.cur && S.stack.includes('entry')) openEntry(fresh);
  }
}
