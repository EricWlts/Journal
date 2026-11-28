# CODEMAP

Stand: 2026-11-28. Zeilen per grep -n ermittelt, Stichproben mit sed geprüft. Skript-Reihenfolge: `<script src>` in index.html (Zeilen 175–187).

## Dateien
- `index.html` (189): HTML-Gerüst, vier Ansichten (Start, Kalender, Eintrag, Einstellungen), Skript-Einbindung
- `styles.css` (1158): alle Stile, Nacht-Palette, iPhone- und Mac-Layout, Animationen
- `js/core.js` (128): Helfer, IndexedDB (DB), Zustand S, Suche-Leuchten, Zählwerk
- `js/home.js` (295): Startseite: Liste, Woche, Monat
- `js/calendar.js` (207): Kalender und Jahresansicht
- `js/side.js` (277): Mac-Seitenleiste (Woche, Monat, Jahr)
- `js/entry.js` (96): Blatt „Schlicht“, Tagesimpuls, Ort-/Wetter-Zeile, Haptik
- `js/sky.js` (90): Mond, Sonne, Wetter, Ort
- `js/save.js` (131): Blatt-Hilfen, Speichern, Eintrag öffnen und wechseln
- `js/nav.js` (336): Navigation (Stack), Karte wird Blatt, Aktionen, Löschen, Licht
- `js/ui.js` (407): Mac-Scrollleiste, Fokus und Tastatur, Pull-to-refresh, Sticky-Titel, Monat/Woche-Umklappen
- `js/gestures.js` (414): Touch-Physik, Gedrückt halten, Schreibmaschine, Trackpad und Tastatur
- `js/io.js` (152): ZIP lesen, Day-One-Import, Sicherung
- `js/sync.js` (167): Abgleich mit GitHub (Sync, applyRemote)
- `js/start.js` (31): Start (läuft zuletzt)
- `sw.js` (33): Service Worker, Cache-Version `journal-v116` (Zeile 2)

## index.html
- `hapL` 25 (haptischer Schalter), `app` 27 (Rahmen)
- Startseite `#home` 30–68: `scWeek`/`scMonth`/`scYear` 33, `dq` 36 (Suchfeld), `searchBtn` 37, `ptr` 40, `stickyTitle`/`homeTitle` 41, `yLineW`/`yrMini` 42, `skyH` 43, `mwd` 44, `weekwrap`/`weektrack`/`yearlay`/`wkMini` 45, `todayLine`/`thisWeekBtn` 47, `sidecal` 48 (Mac-Seitenleiste: `skyM` 48, `scview`/`sctrack` 49, `scStat`/`scCount`/`scAway` 50, `scTodayBtn` 52), `weekStat`/`weekCount`/`weekLbl`/`weekAway` 56, `wkTodayBtn` 57, `list` 61, `fabLabel` 63, `homePlus` 65
- Kalender `#calendar` 69–90: `tabMonth` 74, `tabYear` 75, `calTitle` 78, `calStats`/`calCount`/`calLbl`/`calAway` 79, `calTodayBtn` 80, `calarea`/`caltrack`/`calLegend` 83, `otd` 84
- Eintrag `#entry` 91–114: `entryInner` 92, `eWd`/`eDn`/`eDt`/`eDtm`/`saveDot`/`eMeta` 94, `trashBtn` 95, `doneBtn` 96, `eMetaP` 98, `eImp`/`eGreet` 99–100, `eImpK`/`eImpNo` 101, `eImpPh`/`eImpT`/`eImpS` 102, `eBody` 105, `ePhotos` 106, `etOv` 108, `eMem`/`eMemT`/`eMemX`/`eMemW` 109, `entryBtn` 110
- Einstellungen `#settings` 115–168: `fileDayOne` 121, `noteDayOne` 122, `fileBackup` 129, `noteBackup` 131, `syncRepo` 136, `syncToken` 137, `noteSync` 139, `about` 162
- Global 169–172: `toast` 169, `ctxmenu` 170, `confirm` 171, `cTitle`/`cText` 172

## styles.css
- 1–42 Grundlagen: `:root` 2 (Farben, Schriften, Kurven), `html`/`body` 16/20, `.view` 29, `#home` 38
- 43–51 Titel: `.title` 44, `.iconbtn` 48
- 52–94 Startseite: `.hero` 54, `.stickytitle` 58, `.topbar` 70, `.todayline` 72, `.twbtn` 78, `.mwd` 88, `.yline` 91, `.ylinew` 93
- 95–117 Mond und Sonne `.sky` 96; Monatsblock iPhone `.weekwrap` 106
- 118–250 Jahr: `.ylay` 124, `.yz`/`.yl`/`.yh` 129–153, `.yseg` 160, `.hfr` 165
- 251–279 Suche leuchtet (`--gl`, `@keyframes glowin` 253), `.qchip` 269, `.searchbtn` 271
- 280–319 Mac-Scrollleiste `.rail` 282, `.scrub` 300, `.newbtn` 278
- 320–341 Seitenleiste (Mac) `#sidecal`; 342–379 Zeitraum-Kapsel `.scpill` 344, `.scview` 368
- 380–444 Tage und Ringe `#sidecal .dot` 381–392, `.mday` 186, `.weekpanel` 200
- 445–507 Karten `.list` 425, `.row` 427, `.row.is-current` 437, `.row::after` (Löschen) 481
- 486–497 `.confirm` (Löschbestätigung)
- 508–565 Seiten: `.tabs` 511, `.mgrid` 539, `.cell` 540, `.otd` 557
- 566–661 Blatt: `#entry` 567, `.entry` 568, `.edate` 571, `.trash` 586, `.ctxmenu` 591, `.ebody` 603, `.savedot` 637, `.entry.in-l` 660
- 662–719 Einstellungen: `.fxseg` 672, `.ptr` 687, `.toast` 716
- 720–887 Mac ab 960 px: Schreibblatt, Seite, Seitenleiste (812), Blatt-Randspalte (834–838), Satzspiegel (868–882), reduced-motion (883)
- 888–944 iPhone-Feinschliff: Scrollleiste 890, Heute-Kapsel 901, Woche 912, Speicherpunkt 934
- 945–978 Blatt „Schlicht“: `.ebody` 956, Initiale 961–962
- 979–1027 Tagesimpuls `.ig`/`.iph`/`.pbox` 986; Karte „Heute vor einem Jahr” `.emem` 1015
- 1028–1038 Federschalter „Beim Schreiben”
- 1039–1097 Karte wird Blatt (iPhone): `.fx`, `.pre`, `.closing` 1056
- 1098–1145 iPhone Gedrückt halten (Vorschau und Menü)
- 1146–1152 Einstellungen als Regler-Animation
- 1153–1158 prefers-reduced-motion

## js/<datei>.js
- `core.js` (128): Helfer 3–19 (`$` 4, `keyOf` 6, `esc` 14, `toast` 18) · DB 20–48 (`DB` 21, `open` 23, `tx` 35, `all` 42, `get` 43, `put` 44, `putMany` 45, `del` 46) · Zustand `S` 50, `reindex` 62, `hasEntry` 67, `setStat` 68 · Suche leuchten 73–89 (`initLit` 85) · Zählwerk `setCount` 90, `countRange` 108 · `dayState` 113, `titleOf` 119, `excerptOf` 124
- `home.js` (295): Titel/Chips 3–20 (`chipsHTML` 17) · Liste `renderHome` 21–64 · Woche 65–159 (`weekPanelHTML` 66, `renderWeek` 75, `flipTrack` 94, `weekToToday` 121, `calToday` 140, `slideTrack` 152, `shiftWeek` 159) · Monat 160–270 (`hmNext` 169, `monthPanelHTML` 186, `renderHomeMonth` 197, `hmSelect` 212, `hmPick` 220, `hmFollow` 226, `hmMove` 242) · `rowHTML` 271, `markCurrentRow` 278, `monthGridHTML` 283
- `calendar.js` (207): `periodOf` 4 · Jahr 5–156 (`yearGeo` 7, `yearLayerBuild` 22, `yearSig` 43, `yearPrep` 51, `yearLayout` 70, `yrPhoneLayer` 79, `yrEnter` 89, `yrLeave` 99, `yrToggle` 113, `yrMove` 123, `yrToday` 136, `hmStats` 148, `yearHTML` 157) · `renderCalendar` 172 · `dayLabel` 190, `renderOnThisDay` 192
- `side.js` (277): `renderSide` 16 · `animTitle` 38, `wipe` 70, `placeStat` 78 · `sideMove` 103 · `sideToday` 152, `stepPeriod` 168, `flipTo` 173, `markToday` 192 · `setSideMode` 204 · Monat ⇄ Jahr 226–271 (`sideZoom` 240, `morphSwap` 260) · `selectCalDay` 272, `shiftCal` 277
- `entry.js` (96): `renderEntry` 5 · Blatt 27–52 (`setBody` 29, `bodyText` 33, `tidyBody` 44) · Beim Schreiben 53–93 (`toggleW` 56, `loadImp` 58, `paintImp` 64, `impNext` 83, `metaHTML` 93) · `haptic` 95
- `sky.js` (90): `moonInfo` 9, `moonSVG` 17, `sunTimes` 27, `sunStr` 43, `paintSky` 44 · Ort/Wetter `locate` 62, `fetchWx` 72 · `fillMeta` 84
- `save.js` (131): `writeAids` 3, `draftFor` 23, `saveMark` 29, `onEdit` 36 (Debounce 350 ms), `syncTrash` 49, `saveCur` 51, `openEntry` 69, `openDay` 71, `newEntry` 77, `adjacent` 95, `deskFade` 102, `revealDown` 113, `switchEntry` 122
- `nav.js` (336): Stack `VIEWS` 4, `applyStack` 6, `go` 28, `back` 35 · Karte→Blatt `SF` 61, `sfEnd` 99, `sfOpen` 114, `sfClose` 130, `sfReopen` 158, `sfDragStart` 167, `sfDragEnd` 181 · Aktionen `deskSearch` 247, `dqRun` 256 · Löschen `setRow` 261, `askDelete` 267, `closeConfirm` 274, `deleteEntry` 275 · Licht `applyLight` 303, `setTheme` 312, `hideCtx` 327 · Mac-Listener 328–336
- `ui.js` (407): Mac-Scrollleiste `rail` 5 · `focusEnd` 93 · `toTop` 137 · `yearSwipe` 151 · `searchSwipeClose` 169 · `pullToRefresh` 177 · Sticky-Titel `fitStuck` 202, `listMonthAt` 213, `setTitleNow` 223, `stickyTitle` 236 · `monthSnap` 288 · `topRowOfList` 319, `sideJump` 325, `scrollListTo` 331 · `listSync` 346
- `gestures.js` (414): Touch IIFE `touch` 6–163 · Plus-Feder 164 · `pageMode` 177 · `holdPeek` 205 · `caret` 306 · `typewriter` 320 · `desk` (Trackpad/Tastatur) 354
- `io.js` (152): `readZip` 4 · `localParts` 45, `convertDayOne` 53 · `exportBackup` 115 · `renderAbout` 147
- `sync.js` (167): `pool` 4, `cleanEntry` 6, `sniffType` 8 · `Sync` 14–151 (`load` 16, `saveMeta` 20, `markDeleted` 24, `soon` 25, `api` 26, `connect` 42, `head` 54, `run` 63, `cycle` 75, `pull` 89, `push` 112, `fetchPhoto` 142) · `applyRemote` 152
- `start.js` (31): IIFE `start` 3–31 (DB öffnen, renderHome, Sync.load, 30-s-Intervall, Service Worker)
- `sw.js` (33): `VERSION` 2, `SHELL` 3, `install` 5, `activate` 9, `fetch` 13

## Schlüsselfunktionen
- `saveCur` – save.js:51 – speichert geänderten Eintrag in IndexedDB, löscht leere Blätter und stößt den Sync an
- `openEntry` – save.js:69 – setzt S.cur, merkt die Signatur und rendert das Blatt
- `newEntry` – save.js:77 – öffnet ein neues leeres Blatt für heute (mehrere pro Tag erlaubt)
- `deleteEntry` – nav.js:275 – Löschanimation, DB.del, Sync.markDeleted, auf dem iPhone zurück zur Liste
- `askDelete` – nav.js:267 – öffnet die Löschbestätigung für eine ID
- `setBody` – entry.js:29 – schreibt den Text ins Feld, jede Zeile als eigener div
- `bodyText` – entry.js:33 – liest den Text aus dem Feld, unabhängig von div, br oder \n
- `rowHTML` – home.js:271 – baut die HTML-Karte eines Eintrags (gleicher Tag: nur Uhrzeit)
- `applyRemote` – sync.js:152 – übernimmt Einträge aus dem Abgleich und entfernt gelöschte
- `Sync` (Objekt) – sync.js:14 – Konfiguration, Status und Meta im localStorage, Abgleich mit GitHub
- `Sync.markDeleted` – sync.js:24 – merkt Löschungen für den nächsten Abgleich vor
- `Sync.push` – sync.js:112 – lädt lokale Änderungen per GitHub-API hoch
- `Sync.pull` – sync.js:89 – holt Remote-Stand (Tree, rekursiv) und ruft applyRemote auf
- `DB.put` – core.js:44 – schreibt Datensatz in Store (readwrite-Transaktion)
- `applyLight` – nav.js:303 – setzt Tag, Nacht oder Automatik nach Tageszeit auf das Papier
- `moonInfo` – sky.js:9 – Mondalter, Phase, Tage bis Voll- und Neumond
- `moonSVG` – sky.js:17 – zeichnet den Mond mit Beleuchtung als SVG
- `sunTimes` – sky.js:27 – Sonnenauf- und -untergang (NOAA-Näherung, Polar-Fälle)
- `fillMeta` – sky.js:84 – füllt Ort, Wetter und Sonnenzeiten nur für das heutige neue Blatt
- `metaHTML` – entry.js:93 – Zeile unter dem Blatt mit Wetter und Sonnenzeit
- `writeAids` – save.js:3 – setzt Tagesimpuls und Erinnerung „Heute vor einem Jahr“ auf das neue Blatt
- `deskSearch` – nav.js:247 – Suchfeld wächst aus der Lupe, Kopf bleibt sichtbar (aktive Suche)
- `renderSide` – side.js:16 – baut die Mac-Seitenleiste (Woche, Monat oder Jahr)
- `renderHomeMonth` – home.js:197 – Monat als Startseite (drei Felder vorher, jetzt, nachher)
- `sfOpen` – nav.js:114 – lässt die angetippte Karte zum Blatt wachsen (iPhone)
- `sfClose` – nav.js:130 – bringt das Blatt zurück zur Karte oder schiebt es nach unten
- `haptic` – entry.js:95 – kurzer Tipp-Impuls über das versteckte Switch-Element (iPhone)
- `revealDown` – save.js:113 – weiche Kante, die den Inhalt von oben nach unten freigibt
- `go` / `back` – nav.js:28 / nav.js:35 – Stack-Navigation zwischen Ansichten
