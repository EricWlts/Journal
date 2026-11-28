// Nachgebauter GitHub-Git-Data-Dienst im Speicher (nur was die App nutzt).
import { createHash } from 'node:crypto';
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
export function createMock() {
  const objs = new Map();      // sha -> {type, content(Buffer)} | {type:'tree', tree:Map}
  const commits = new Map();   // sha -> {tree}
  let head = null;
  const blob = (buf) => { const sha = sha1('blob ' + buf.length + '\0' + buf.toString('latin1')); objs.set(sha, { type: 'blob', content: buf }); return sha; };
  const mkTree = (m) => { const sha = sha1('tree' + JSON.stringify([...m].sort())); objs.set(sha, { type: 'tree', map: new Map(m) }); return sha; };
  const mkCommit = (tree, parents, msg) => { const sha = sha1('commit' + tree + parents + msg + Math.random()); commits.set(sha, { tree, parents }); return sha; };
  const treeMap = (sha) => new Map(sha ? objs.get(sha).map : []);
  const json = (status, body) => ({ status, body: body === undefined ? null : body });
  function handle(method, url, bodyText) {
    const u = new URL(url); const m = u.pathname.match(/^\/repos\/[^/]+\/[^/]+(\/.*)$/); if (!m) return json(404, { message: 'Not Found' });
    const p = m[1]; const body = bodyText ? JSON.parse(bodyText) : {};
    let r;
    if (method === 'GET' && p === '/git/ref/heads/main') return head ? json(200, { object: { sha: head } }) : json(404, { message: 'Not Found' });
    if (method === 'GET' && (r = p.match(/^\/git\/commits\/(\w+)$/))) { const c = commits.get(r[1]); return c ? json(200, { sha: r[1], tree: { sha: c.tree } }) : json(404, {}); }
    if (method === 'PUT' && p === '/contents/LIESMICH.md') {
      const t = mkTree(new Map([['LIESMICH.md', blob(Buffer.from(body.content, 'base64'))]]));
      head = mkCommit(t, [], body.message); return json(201, { commit: { sha: head } });
    }
    if (method === 'GET' && (r = p.match(/^\/git\/trees\/(\w+)$/))) {
      const mp = treeMap(r[1]); return json(200, { sha: r[1], tree: [...mp].map(([path, sha]) => ({ path, type: 'blob', sha })) });
    }
    if (method === 'GET' && (r = p.match(/^\/git\/blobs\/(\w+)$/))) { const o = objs.get(r[1]); return o ? json(200, { content: o.content.toString('base64'), encoding: 'base64' }) : json(404, {}); }
    if (method === 'POST' && p === '/git/blobs') return json(201, { sha: blob(Buffer.from(body.content, body.encoding === 'base64' ? 'base64' : 'utf8')) });
    if (method === 'POST' && p === '/git/trees') {
      const mp = treeMap(body.base_tree);
      for (const it of body.tree) { if (it.sha === null) mp.delete(it.path); else mp.set(it.path, it.sha != null ? it.sha : blob(Buffer.from(it.content, 'utf8'))); }
      return json(201, { sha: mkTree(mp) });
    }
    if (method === 'POST' && p === '/git/commits') return json(201, { sha: mkCommit(body.tree, body.parents, body.message) });
    if (method === 'PATCH' && p === '/git/refs/heads/main') { head = body.sha; return json(200, { object: { sha: head } }); }
    return json(404, { message: 'Mock kennt nicht: ' + method + ' ' + p });
  }
  const files = () => { const out = new Map(); if (!head) return out; for (const [path, sha] of treeMap(commits.get(head).tree)) out.set(path, objs.get(sha).content.toString('utf8')); return out; };
  function put(path, text) { // fremdes Gerät: neuer Commit mit Datei
    if (!head) { const t = mkTree(new Map([['LIESMICH.md', blob(Buffer.from('x\n'))]])); head = mkCommit(t, [], 'init'); }
    const mp = treeMap(commits.get(head).tree); mp.set(path, blob(Buffer.from(text, 'utf8')));
    head = mkCommit(mkTree(mp), [head], 'fremdes Gerät');
  }
  return { handle, files, put };
}
