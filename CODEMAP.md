# CODEMAP index.html

Stand: 4117 Zeilen. Zeilenangaben über grep -n und Stichproben mit sed geprüft.

## HTML (Zeilen 1–1372)
- `1–21` Kopf: Meta (Viewport, Web-App, Statusleiste), Manifest, Icons, Google-Fonts (Instrument Serif, Manrope, Newsreader)
- `8–11` Licht-Skript vor dem ersten Bild (liest journal.light, setzt Klasse `night`)
- `1211` #hapL: verstecktes Switch-Element für haptisches Tippen (iPhone)
- `1213` #app: Rahmen; `1216–1254` #home (Startseite):
  - `1222–1223` #dq (Suchfeld Mac/iPhone) und #searchBtn
  - `1227` #stickyTitle / #homeTitle (Monatstitel, klebt oben)
  - `1228` #yLineW (Jahreslinie, #yrMini), `1229` #skyH (Mond/Sonne)
  - `1230–1231` #mwd (Wochentage), #weekwrap / #weektrack / #yearlay (Wochen- und Jahresansicht)
  - `1233` #todayLine (Heute-Kapsel), `1234–1246` #sidecal (Mac-Seitenleiste mit #sctrack, #scStat, #scpill)
  - `1247` #list (Einträge), `1249–1251` FAB und #homePlus (neuer Eintrag)
- `1255–1276` #calendar (Kalender): Tabs #tabMonth/#tabYear, #calStats, #caltrack, #calLegend, #otd (An diesem Tag)
- `1277–1300` #entry (Eintrag): #eWd/#eDn/#eDt (Datum), #trashBtn, #doneBtn, #eMetaP, #eTitle (versteckt), #eImp/#eGreet/#eImpT (Tagesimpuls), #eBody (contenteditable), #ePhotos, #eMem (Heute vor einem Jahr), #entryBtn
- `1301–1312` #search (Suchseite), nie erreicht, siehe Toter Code
- `1313–1372` #settings: #fileDayOne (Day One ZIP), #fileBackup (Sicherung laden), Export, #syncRepo / #syncToken / #noteSync (GitHub-Abgleich), Umschalter Licht und Übergänge
- `1367–1369` #toast, #ctxmenu (Kontextmenü), #confirm (Löschbestätigung)

## CSS (Zeilen 22–1208)
- `22–63` :root: Papier-, Tinten-, Nacht-Farben (`--paper`, `--ink`, `--night`), Schriften (`--serif`, `--sans`), Kurven `--ease`/`--sheet`
- `64–72` `.title`, `.title .t`: gemeinsamer Titelstil (Instrument Serif)
- `73–271` `#home`, Monatskopf, `.weekwrap`, Mond/Sonne (`.sky`, `.moon`, 116–138), Jahresansicht `.ylay`/`.yseg` (139–205), Tage und Ringe `.wday`/`.mday`/`.is-entry` (401–441)
- `272–302` Suchtreffer leuchten (`--gl`), `.hitcount`; `301–330` Mac-Scrollleiste und Monatspille
- `363–400` Zeitraum-Kapsel `.scpill`/`.twbtn`
- `473–536` Eintrags-Karten `.row`, `.ti`, Wisch-Löschen (506–525), `.confirm`
- `537–594` Seiten `.view`, Kalender, Einstellungen
- `595–703` `.entry`, `.edate`, `.trash`, `.savedot` (676), Suche iPhone (636–669), Schreibmaschine (686), Licht Tag/Nacht (687–703)
- `704–766` Einstellungen (`.fxseg` 717, `.btn`), Mac-Hintergrund und Nacht-Feinschliff (733–766)
- `767–992` Mac ab 960px: `.stickytitle`, Schreibblatt als Seite (806), Seitenleiste (860–883), Satzspiegel (916–930), reduced-motion (931)
- `936–992` iPhone-Feinschliff: Scrollleiste, Heute-Kapsel, Speicherpunkt (982)
- `993–1027` Blatt „Schlicht“: `.ebody`, Initiale (1010), Schriftgrößen je Breite
- `1028–1076` Tagesimpuls `.ig`, `.iph`, `.pbox` (Impuls); `.emem` (Karte Heute vor einem Jahr, 1064–1076)
- `1077–1087` Federschalter „Beim Schreiben“
- `1088–1146` Karte wird Blatt (iPhone): `.fx`, `.pre`, `.closing` (Animation sf*)
- `1147–1194` iPhone Gedrückt halten (Vorschau + Menü)
- `1195–1207` Einstellungen als Regler-Animation; `1202` reduced-motion für alles

## JS (Zeilen 1373–4115)
- `1375–1391` Helfer: `$`, `pad`, `keyOf`, `parseKey`, `MONTHS`, `WD`, `esc`, `today`, `isDesktop`, `typing`, `toast`
- `1392–1420` DB (IndexedDB „journal“, Stores `entries`, `photos`): DB.open/all/get/put/putMany/del
- `1421–1444` State `S` (Startwert `stack: ['home']`), reindex, hasEntry
- `1445–1501` Suche leuchten und Zählwerk: initLit, setCount (Rollziffern), countRange, dayState, titleOf/excerptOf
- `1502–1563` Startseite Liste: renderHome (1520), chipWords/chipsHTML (Suchvorschläge)
- `1564–1661` Woche: weekPanelHTML, renderWeek, weekToToday, slideTrack, shiftWeek
- `1662–1795` Startseite Monat (eingeklappt = Woche): HM-Funktionen, renderHomeMonth (1696), hmPick, hmFollow, hmMove, rowHTML (1770), monthGridHTML (1782)
- `1796–2001` Kalender und Jahr: renderCalendar (1965), yearHTML (1950), yearLayerBuild (1815), yrToggle, yrMove, renderOnThisDay (1985)
- `2002–2278` Mac-Seitenleiste: renderSide (2014), animTitle, sideMove (2103), sideToday, flipTo, setSideMode, sideZoom (2240), selectCalDay (2272)
- `2279–2372` Eintrag: renderEntry (2281), setBody (2305), bodyText (2309), tidyBody, WS/toggleW (Schalter), loadImp, impNext, metaHTML, haptic (2371)
- `2373–2460` Mond, Sonne, Wetter, Ort: moonInfo (2379), moonSVG (2387), sunTimes (2397), paintSky (2414), locate (2432), fetchWx (2442), fillMeta (2454)
- `2461–2524` Blatt-Hilfen und Speichern: writeAids (2461), draftFor (2481), onEdit (2494, Debounce 350 ms), saveCur (2509)
- `2525–2606` Eintrag öffnen und wechseln: openEntry (2527), openDay, newEntry (2535), adjacent (2553), deskFade (2560), revealDown (2571), switchEntry (2580), renderSearch (2592)
- `2607–2661` Navigation: VIEWS, minStack, applyStack (2610), go (2632), back (2639)
- `2662–2792` Karte-zu-Blatt-Animation: SF-Objekt (2665), sfOpen (2718), sfClose (2734), sfReopen, sfDragStart/Frame/End
- `2793–2906` Aktionen (Klick-Delegation `data-act`, 2794): deskSearch (2851), askDelete (2871), deleteEntry (2879)
- `2907–2941` Licht und Farbe: applyLight (2908), setTheme (2917), markFx, hideCtx
- `2942–3031` Mac-Scrollleiste (Jahresstarts, Monatspille)
- `3032–3090` Fokus und Tastatur (focusEnd 3032, visualViewport 3058)
- `3091–3150` Pull-to-refresh (#ptr, 3091)
- `3151–3226` Sticky-Titel: IIFE stickyTitle (3177), Monatstitel-Kopplung
- `3227–3355` iPhone Monat/Woche-Umklappen; Mac Liste und Kalender gekoppelt (3259)
- `3356–3556` Gesten Touch (3356): Physik, Ziehen, Sheet-Schließen; Plus-Feder (3517), Seite (3529)
- `3557–3671` iPhone Gedrückt halten (Vorschau und Menü)
- `3672–3705` Schreibmaschine: IIFE typewriter (3673), Zeile rückt nach oben
- `3706–3768` Trackpad und Tastatur (3706)
- `3769–3809` ZIP lesen: readZip (3770)
- `3810–3878` Day One: convertDayOne (3819), Import-Handler #fileDayOne (3836)
- `3879–3919` Sicherung: exportBackup (3881), Handler #fileBackup (3895, „Sicherung laden“)
- `3920–4085` Abgleich GitHub: Sync-Objekt (3931), markDeleted (3941), soon (3942), api (3943), connect (3959), run (3980), cycle (3992), pull (4006), push (4029), fetchPhoto (4059), applyRemote (4069)
- `4086–4114` Start: start (4087), DB.open, Liste laden, renderHome, Sync.load, 30-s-Intervall

## Schlüsselfunktionen
- `saveCur` – 2509 – speichert geänderten Eintrag in IndexedDB, löscht leere Blätter und stößt den Sync an
- `openEntry` – 2527 – setzt S.cur, merkt die Signatur und rendert das Blatt
- `newEntry` – 2535 – öffnet ein neues leeres Blatt für heute (mehrere pro Tag erlaubt)
- `deleteEntry` – 2879 – Löschanimation, DB.del, Sync.markDeleted, auf dem iPhone zurück zur Liste
- `askDelete` – 2871 – öffnet die Löschbestätigung für eine ID
- `setBody` – 2305 – schreibt den Text ins Feld, jede Zeile als eigener div
- `bodyText` – 2309 – liest den Text aus dem Feld, unabhängig von div, br oder \n
- `rowHTML` – 1770 – baut die HTML-Karte eines Eintrags (gleicher Tag: nur Uhrzeit)
- `renderList` – nicht vorhanden; die Liste baut `renderHome` (1520)
- `applyRemote` – 4069 – übernimmt Einträge aus dem Abgleich und entfernt gelöschte
- `Sync` (Objekt) – 3931 – Konfiguration, Status und Meta im localStorage, Abgleich mit GitHub
- `Sync.markDeleted` – 3941 – merkt Löschungen für den nächsten Abgleich vor
- `Sync.push` – 4029 – lädt lokale Änderungen per GitHub-API hoch
- `Sync.pull` – 4006 – holt Remote-Stand (Tree, rekursiv) und ruft applyRemote auf
- `DB.put` – 1416 – schreibt Datensatz in Store (readwrite-Transaktion)
- `applyLight` – 2908 – setzt Tag, Nacht oder Automatik nach Tageszeit auf das Papier
- `moonInfo` – 2379 – Mondalter, Phase, Tage bis Voll- und Neumond
- `moonSVG` – 2387 – zeichnet den Mond mit Beleuchtung als SVG
- `sunTimes` – 2397 – Sonnenauf- und -untergang (NOAA-Näherung, Polar-Fälle)
- `fillMeta` – 2454 – füllt Ort, Wetter und Sonnenzeiten nur für das heutige neue Blatt
- `metaHTML` – 2369 – Zeile unter dem Blatt mit Wetter und Sonnenzeit
- `writeAids` – 2461 – setzt Tagesimpuls und Erinnerung „Heute vor einem Jahr“ auf das neue Blatt
- `deskSearch` – 2851 – Suchfeld wächst aus der Lupe, Kopf bleibt sichtbar (aktive Suche)
- `renderSearch` – 2592 – alte Suchseite, nur noch über den toten #q-Pfad erreichbar
- `renderSide` – 2014 – baut die Mac-Seitenleiste (Woche, Monat oder Jahr)
- `renderHomeMonth` – 1696 – Monat als Startseite (drei Felder vorher, jetzt, nachher)
- `sfOpen` – 2718 – lässt die angetippte Karte zum Blatt wachsen (iPhone)
- `sfClose` – 2734 – bringt das Blatt zurück zur Karte oder schiebt es nach unten
- `haptic` – 2371 – kurzer Tipp-Impuls über das versteckte Switch-Element (iPhone)
- `revealDown` – 2571 – weiche Kante, die den Inhalt von oben nach unten freigibt
- `go` / `back` – 2632 / 2639 – Stack-Navigation zwischen Ansichten
- Papier-/Leer-Eintrag-Löschung – 2509–2524 (saveCur, wenn Titel, Text und Fotos leer sind); der Aufruf kommt aus onEdit (2494) mit `setTimeout(saveCur, 350)` (2503). Das Löschen über den Papierkorb nutzt `setTimeout` mit 360 ms (2879–2897) und 480 ms bei iPhone-Blättern
- Sicherung laden – 3895 (Handler #fileBackup) und Day One-Import – 3836 (Handler #fileDayOne, ruft readZip 3770 und convertDayOne 3819)

## Toter Code (Verdacht)
- `#search` (Seite): HTML 1301–1312; Stack startet bei `['home']` (1422–1444), und kein Aufruf pusht 'search' oder ruft `go('search')`. Nur Listener und Prüfungen (3080, 3412, 3640, 2887, 2903) kennen die Ansicht noch. CSS für die Suchseite (636–669) ist ebenfalls zu prüfen
- `renderSearch` – 2592–2606; wird nur von `#q`-Listenern (3041–3042) und Stack-Prüfungen (2887, 2903) aufgerufen
- `#q` – 1305 (Feld), 2593 (Lesen), 3041–3042 (Listener): alles in der nie sichtbaren Suchseite
- `#eTitle` – 1285 (hidden), 3053 und 3549 (Listener). Das Blatt „Schlicht“ hat kein Titelfeld (Kommentar 2303); saveCur liest `e.title` aus dem Objekt, nicht aus dem DOM
- `journal.snd` / `journal.tw` – 2906: werden nur gelöscht, nirgends gelesen oder geschrieben (Altlasten)
- Geräusch / Audio: keine Fundstelle (kein Audio-Code, kein `new Audio`, kein `.play(`)
- `typewriter` (3673) ist aktiv (Schreibmaschinen-Scroll), kein toter Code

## Auffälligkeiten
- Datei mit ca. 4100 Zeilen, Logik in großen IIFEs (stickyTitle 3177, typewriter 3673) und Kommentaren mit Versionsdaten; Zeilenangaben oben beziehen sich auf den Stand vom 28.11.2026
