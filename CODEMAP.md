# CODEMAP

Stand: 2026-11-28. Zeilen per grep -n ermittelt, Stichproben mit sed geprüft. Skript-Reihenfolge: `<script src>` in index.html (Zeilen 186–199); `js/line.js` steht vor `js/io.js`.

## Dateien
- `index.html` (201): HTML-Gerüst, vier Ansichten (Start, Kalender, Eintrag, Einstellungen), Kopf-Skript `lightStage`, Skript-Einbindung
- `styles.css` (1231): alle Stile, Nacht-Palette, iPhone- und Mac-Layout, Animationen
- `fonts/fonts.css` (plus `fonts/*.woff2`): Schriften (Instrument Serif, Manrope, Newsreader), lokal eingebunden
- `js/core.js` (148): Helfer, IndexedDB (DB), Zustand S, Suche-Leuchten, Zählwerk, Titel und Auszug (`cardExcerpt`)
- `js/home.js` (296): Startseite: Liste, Woche, Monat
- `js/calendar.js` (207): Kalender und Jahresansicht
- `js/side.js` (277): Mac-Seitenleiste (Woche, Monat, Jahr)
- `js/entry.js` (118): Blatt „Schlicht“, Anrede, Tagesimpuls, Schlusszeile (Ort, Wetter, Sonne), Haptik
- `js/sky.js` (91): Mond, Sonne, Wetter, Ort
- `js/save.js` (193): Blatt-Hilfen, Speichern, Papierkorb, Eintrag öffnen und wechseln
- `js/nav.js` (325): Navigation (Stack), Karte wird Blatt, Aktionen, Löschen, Licht
- `js/ui.js` (415): Mac-Scrollleiste, Fokus und Tastatur, Pull-to-refresh, Sticky-Titel, Monat/Woche-Umklappen
- `js/gestures.js` (415): Touch-Physik, Gedrückt halten, Schreibmaschine, Trackpad und Tastatur
- `js/line.js` (74): Stille Linie im Blatt (Haarlinie des Monats, Tage mit Eintrag)
- `js/io.js` (185): ZIP lesen, Day-One-Import, Sicherung, Info
- `js/sync.js` (194): Abgleich mit GitHub (Sync, applyRemote)
- `js/start.js` (31): Start (läuft zuletzt)
- `sw.js` (42): Service Worker, Cache-Version `journal-v116` (Zeile 2), Dateiliste `SHELL` (Zeile 3)

## index.html
- `lightStage` 8–18 (Kopf-Skript: Licht vor dem ersten Bild, Sonnenzeiten aus `journal.sunday`; `window.lightStage` Zeile 10)
- `hapL` 32 (haptischer Schalter), `app` 34 (Rahmen)
- Startseite `#home` 37–73: `scWeek`/`scMonth`/`scYear` 40, `dq` 43 (Suchfeld), `searchBtn` 44, `ptr` 47, `stickyTitle`/`homeTitle` 48, `yLineW`/`yrMini` 49, `skyH` 50, `mwd` 51, `weekwrap`/`weektrack`/`ylay` 52, `todayLine`/`thisWeekBtn` 54, `sidecal` 55 (Mac-Seitenleiste: `skyM`, `scview`/`sctrack` 56, `scStat`/`scCount` 57, `scPill` 59, `scTodayBtn`), `weekStat`/`weekCount`/`weekLbl` 63, `hfr`/`yseg` 64, `list` 68, `fabwrap` 70, `homePlus` 72
- Kalender `#calendar` 76–95: `tabMonth`/`tabYear` 81–82, `calTitle` 85, `calStats`/`calCount`/`calLbl` 86, `calpill` 87, `calarea`/`caltrack` 90, `otd` 91
- Eintrag `#entry` 98–116: `entryInner` 99, `eWd`/`eDn`/`eDt`/`eDtm`/`saveDot` 101 (Datum, Speicherpunkt), `trashBtn` 102, `doneBtn` 103, `eImp` 105 (Tagesimpuls), `eImpK`/`eImpNo` 106, `eImpPh`/`eImpT`/`eImpS` 107, `eBody` 110, `ePhotos` 111, `eClose` 112 (Schlusszeile), `eMem`/`eMemT`/`eMemX`/`eMemW` 114 (Heute vor einem Jahr), `entryBtn` 115
- Einstellungen `#settings` 120–178: `fileDayOne` 126, `noteDayOne` 127, `fileBackup` 134, `noteBackup` 136, `syncRepo` 141, `syncToken` 142, `noteSync` 144, `trashList` 168 (Papierkorb), `about` 173
- Global 180–183: `toast` 180, `ctxmenu` 181, `confirm` 182, `cTitle`/`cText` 183

## styles.css
- 1–44 Grundlagen: `:root` 2 (Farben, Schriften, Kurven, Bewegungszeiten), Typografie 45
- 54–87 Startseite (`#home`, Kopf, Titel) · 88–96 iPhone-Startseite (Monat im dunklen Kopf) · 97–119 Mond und Sonne (`.sky`) und `.weekwrap`
- 120–215 Jahr (PLAN 4b): `.ylay` 126, `.ylay .yz` 129, `.ylay .yl` 145; `@keyframes softin` 216
- 254–263 Suche leuchtet (`:root` 255, `@keyframes glowin` 256); 264–282 Vorschläge (`chipin` 273)
- 283–299 Mac-Scrollleiste; 300–306 Monat-Pille beim Ziehen; 307–322 Hinweise beim Darüberfahren
- 323–344 Seitenleiste (Mac); 345–382 Zeitraum-Kapsel; 383–407 Auswahl-Ring; 408–422 Trackpad-Wischen
- 423–444 Zukunft („in 2 Wochen“); 445–509 Karten (Einträge, Löschen wischen ab 479)
- 510–567 Seiten (Kalender, Einstellungen); `@keyframes inl`/`inr` 537–538
- 568–630 Blatt (`#entry`, `.entry`, iPhone-Blatt ab 606); 631–635 Zählwerk; 636–645 Speicherpunkt
- 646–692 Licht und Nacht (`applyLight`-Stufen 646–654, Filmkorn 667, Mondschein 672, Lampenlicht 676)
- 693–750 Einstellungen (`ptrspin` 717, Mac-Hintergrund 719–727, Nacht verfeinert 728)
- 751–912 Mac ab 960 px (Schreibblatt, Seitenleiste, Satzspiegel; großer Bildschirm 898, ab 1800 px 907; reduced-motion 913)
- 918–974 iPhone-Feinschliff
- 975–1010 Blatt „Schlicht“ (Anrede 990, Leerzustand 994, Schlusszeile 998)
- 1011–1045 Tagesimpuls (`.ig`, `.iph`, `.pbox`); 1046–1058 Karte „Heute vor einem Jahr” (`.emem`)
- 1059–1069 Federschalter „Beim Schreiben”
- 1070–1118 Karte wird Blatt (iPhone; Bewegung ab 1081)
- 1119–1166 iPhone Gedrückt halten (Vorschau und Menü)
- 1167–1173 Einstellungen als Regler-Animation; 1174–1182 prefers-reduced-motion
- 1183–1192 Speichern-Fehler und Papierkorb; 1193–1197 Schlusszeile direkt unter dem Text
- 1198–1226 Phase 5 „Stille Linie” (`.sline`); 1227–1231 Abnahme (Mac, iPhone auf breiten Fenstern)

## js/<datei>.js
- `core.js` (148): Helfer 4–18 (`$` 4, `keyOf` 6, `esc` 14, `toast` 18) · DB 21–47 (`DB` 21, `open` 23, `tx` 35, `all` 42, `get` 43, `put` 44, `del` 46) · Zustand `S` 50–61, `reindex` 63, `hasEntry` 68, `setStat` 69 · Suche leuchten 76–89 (`LIT_SEL` 76, `litStagger` 78, `initLit` 86) · Zählwerk `setCount` 91, `countRange` 109 · `dayState` 114, `titleOf` 120, `excerptOf` 125, `cardExcerpt` 136
- `home.js` (296): Titel/Chips 3–20 (`titleHTML` 4, `chipWords` 6, `chipsHTML` 17) · Liste `renderHome` 21–64 · Woche 65–162 (`weekPanelHTML` 66, `renderWeek` 75, `setPill` 88, `flipTrack` 94, `pulseToday` 110, `weekToToday` 121, `calToday` 140, `slideTrack` 152, `shiftWeek` 159) · Monat 163–270 (`hmNext` 169, `hmPill` 180, `monthPanelHTML` 186, `renderHomeMonth` 197, `hmSelect` 212, `hmPick` 220, `weekMove` 225, `hmFollow` 226, `hmMove` 242) · `rowHTML` 271, `markCurrentRow` 279, `monthGridHTML` 284
- `calendar.js` (207): `periodOf` 4 · Jahr 5–171 (`yearGeo` 7, `yearLayerHTML` 18, `yearLayerBuild` 22, `yearSig` 43, `yearIdle` 47, `yearPrep` 51, `yearLayout` 70, `yrPhoneLayer` 79, `yrEnter` 89, `yrLeave` 99, `yrToggle` 113, `yrPill` 120, `yrMove` 123, `yrToday` 136, `hmStats` 148, `yearHTML` 157) · `renderCalendar` 172 · `dayLabel` 190, `renderOnThisDay` 192
- `side.js` (277): `renderSide` 16 · `animTitle` 38, `wipe` 70, `placeStat` 78 · `sideMove` 103 · `sideToday` 152, `stepPeriod` 168, `flipTo` 173, `markToday` 192 · `setSideMode` 204 · Monat ⇄ Jahr: `sideZoom` 240, `morphSwap` 260 · `selectCalDay` 272, `shiftCal` 277
- `entry.js` (118): `renderEntry` 5 · Blatt (`setBody` 30, `markMt` 36, `bodyText` 37, `tidyBody` 48) · Beim Schreiben (`WS` 58, `toggleW` 60, `loadImp` 62, `paintImp` 80, `fitImp` 93, `impNext` 106) · Anrede `greetWord` 66, `acceptGreet` 67 · Schlusszeile `closeHTML` 73 · `haptic` 117
- `sky.js` (91): `moonAge` 7, `moonInfo` 9, `moonSVG` 17, `sunTimes` 27, `sunNow` 42, `sunStr` 43, `paintSky` 44 · Ort/Wetter `geoSt` 60, `locate` 63, `fetchWx` 73 · `fillMeta` 85
- `save.js` (193): `writeAids` 3, `draftFor` 24, `saveMark` 30, `onEdit` 38, `syncTrash` 54, `saveCur` 59, `saveEntry` 62 · Papierkorb: `splitEntries` 93, `trashEntry` 94, `trashEmpty` 103, `restoreEntry` 111, `purgeTrash` 118, `renderTrash` 124 · `openEntry` 132, `openEntryById` 133, `openDay` 134, `newEntry` 140, `adjacent` 158, `deskFade` 165, `switchEntry` 181
- `nav.js` (325): Stack `VIEWS` 4, `applyStack` 6, `go` 28, `back` 35 · Karte→Blatt `SF` 61, `sfEnd` 90, `sfOpen` 105, `sfClose` 121, `sfReopen` 149, `sfDragStart` 158, `sfDragEnd` 171 · Aktionen `deskSearch` 237, `dqRun` 246 · Löschen `setRow` 251, `askDelete` 257, `closeConfirm` 264, `deleteEntry` 265 · Licht `applyLight` 291, `setTheme` 300, `markFx` 312, `hideCtx` 316
- `ui.js` (415): Mac-Scrollleiste `rail` 5–90 · `focusEnd` 93 · `toTop` 138–149 · `yearSwipe` 152–169 · `searchSwipeClose` 170–177 · `pullToRefresh` 178–201 · Sticky-Titel `stickyTitle` 237–285 (`fitStuck` 203, `listMonthAt` 214, `setTitleNow` 224, `linkTitle` 229) · `monthSnap` 289–317 · `topRowOfList` 320, `sideJump` 326, `scrollListTo` 332 · `listSync` 347–408
- `gestures.js` (415): Touch-IIFE `touch` 6–163 (`frame` 18, `end` 92, `set` 182, `input` 190) · Plus-Feder 165 · `pageMode` 178–202 · `holdPeek` 206–306 (`build` 233, `show` 246, `peek` 253, `pick` 280) · `caret` 307–318 · `typewriter` 321–352 (`caretBottom` 323) · `desk` (Trackpad/Tastatur) 355–415
- `line.js` (74): IIFE `line` 3–74 (`layout` 13, `lineRender` 20, `place` 32, `pt` 39, `go` 40, `lineGo` 43, Ende der Geste 68)
- `io.js` (185): `readZip` 4, `localParts` 45, `convertDayOne` 53, `blobToB64` 114, `exportBackup` 115, `askBackupConfirm` 131, `renderAbout` 180
- `sync.js` (194): `pool` 4, `cleanEntry` 6, `sniffType` 8 · `Sync` 14–159 (`load` 16, `saveMeta` 20, `markDeleted` 24, `prune` 27, `api` 32, `connect` 48, `head` 60, `run` 69, `cycle` 81, `pull` 95, `push` 118, `fetchPhoto` 150) · `applyRemote` 160
- `start.js` (31): IIFE `start` 4–31 (`reindex` 6, Sync-Intervall 30 s 11, Service Worker 21–23, Tageswechsel 30)
- `sw.js` (42): `VERSION` 2, `SHELL` 3 (enthält `js/line.js`, `fonts/fonts.css`), `install` 5, `activate` 9, `fetch` 13

## Schlüsselfunktionen
- `saveCur` – save.js:59 – speichert geänderten Eintrag in IndexedDB, löscht leere Blätter und stößt den Sync an
- `saveEntry` – save.js:62 – schreibt einen Eintrag mit Signatur-Abgleich, gemeinsam für Speichern und Verlassen
- `openEntry` – save.js:132 – setzt S.cur, merkt die Signatur und rendert das Blatt
- `newEntry` – save.js:140 – öffnet ein neues leeres Blatt für heute (mehrere pro Tag erlaubt)
- `trashEntry` / `restoreEntry` / `purgeTrash` – save.js:94 / 111 / 118 – Papierkorb: in den Papierkorb, zurückholen, nach 30 Tagen endgültig entfernen
- `deleteEntry` – nav.js:265 – Löschanimation, DB.del, Sync.markDeleted, auf dem iPhone zurück zur Liste
- `askDelete` – nav.js:257 – öffnet die Löschbestätigung für eine ID
- `setBody` – entry.js:30 – schreibt den Text ins Feld, jede Zeile als eigener div
- `bodyText` – entry.js:37 – liest den Text aus dem Feld, unabhängig von div, br oder \n
- `closeHTML` – entry.js:73 – baut die Schlusszeile unter dem Text (Uhrzeit, Ort, Wetter, Sonne)
- `cardExcerpt` – core.js:136 – Textauszug für die Karte in der Liste
- `rowHTML` – home.js:271 – baut die HTML-Karte eines Eintrags (gleicher Tag: nur Uhrzeit)
- `applyRemote` – sync.js:160 – übernimmt Einträge aus dem Abgleich und entfernt gelöschte
- `Sync` (Objekt) – sync.js:14 – Konfiguration, Status und Meta im localStorage, Abgleich mit GitHub
- `Sync.markDeleted` – sync.js:24 – merkt Löschungen für den nächsten Abgleich vor
- `Sync.prune` – sync.js:27 – vergisst vorgemerkte Löschungen, deren Datei remote fehlt
- `Sync.push` – sync.js:118 – lädt lokale Änderungen per GitHub-API hoch
- `Sync.pull` – sync.js:95 – holt Remote-Stand (Tree, rekursiv) und ruft applyRemote auf
- `DB.put` – core.js:44 – schreibt Datensatz in Store (readwrite-Transaktion)
- `applyLight` – nav.js:291 – setzt Tag, Nacht oder Automatik nach Tageszeit auf das Papier
- `lightStage` – index.html:10 – wählt die Lichtstufe schon vor dem ersten Bild
- `moonInfo` – sky.js:9 – Mondalter, Phase, Tage bis Voll- und Neumond
- `moonSVG` – sky.js:17 – zeichnet den Mond mit Beleuchtung als SVG
- `sunTimes` – sky.js:27 – Sonnenauf- und -untergang (NOAA-Näherung, Polar-Fälle)
- `fillMeta` – sky.js:85 – füllt Ort, Wetter und Sonnenzeiten nur für das heutige neue Blatt
- `writeAids` – save.js:3 – setzt Tagesimpuls und Erinnerung „Heute vor einem Jahr“ auf das neue Blatt
- `deskSearch` – nav.js:237 – Suchfeld wächst aus der Lupe, Kopf bleibt sichtbar (aktive Suche)
- `renderSide` – side.js:16 – baut die Mac-Seitenleiste (Woche, Monat oder Jahr)
- `renderHomeMonth` – home.js:197 – Monat als Startseite (drei Felder vorher, jetzt, nachher)
- `sfOpen` – nav.js:105 – lässt die angetippte Karte zum Blatt wachsen (iPhone)
- `sfClose` – nav.js:121 – bringt das Blatt zurück zur Karte oder schiebt es nach unten
- `haptic` – entry.js:117 – kurzer Tipp-Impuls über das versteckte Switch-Element (iPhone)
- `go` / `back` – nav.js:28 / nav.js:35 – Stack-Navigation zwischen Ansichten
