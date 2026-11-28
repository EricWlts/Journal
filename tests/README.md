Automatische Tests der Kernabläufe (Playwright + Chrome, ohne Netz, ohne App-Änderung).
Alle: `node tests/run.mjs` – einzelne: `node tests/run.mjs suche` (Filter auf den Testnamen). Exit 0 = alle grün.
Jeder Test läuft auf iPhone (390×844, Touch) und Mac (1280×800) in frischem Kontext (leere IndexedDB).
Fremdanfragen sind abgefangen; GitHub-Abgleich läuft gegen `mock-github.mjs` (Git-Data-API im Speicher).
Bekannt rote Tests: in run.mjs als viertes Argument von `test(...)` einen Grund eintragen.
