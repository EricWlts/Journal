# Journal-App – Übergabe für neue Sitzungen

Persönliche Journal-App von Eric (Ersatz für Day One), läuft als Web-App (PWA) auf iPhone und MacBook.
Online: https://ericwlts.github.io/Journal/ (GitHub Pages, Branch `main`, Ordner `/`).
Antworten und Texte in der App immer auf Deutsch.

## Arbeitsweise
- Änderungen direkt in `index.html` machen, committen und auf `main` pushen. GitHub Pages veröffentlicht nach ca. 1–2 Minuten.
- Bei jeder Veröffentlichung in `sw.js` die Konstante `VERSION` hochzählen (`journal-vNN`), sonst bekommen installierte Apps das Update nicht. Die App lädt neue Versionen beim nächsten Öffnen selbst nach.
- Vor dem Push im Browser testen (Playwright mit Chrome: iPhone 390×844 mit Touch, MacBook 1280×800). Touch-Gesten über CDP `Input.dispatchTouchEvent` simulieren.
- Kein Framework, kein Build-Schritt: eine Datei `index.html` mit CSS und JS. Umstieg auf React (Vaul, NumberFlow, cmdk, Sonner) ist besprochen, aber vertagt – frühestens wenn die App stark wächst.
- Eric möchte Premium-Feinschliff: kleine Abstände und Ausrichtungen sind ihm wichtig. Nach jeder Änderung kurz zusammenfassen, was sich ändert.

## Dateien
- `index.html` – gesamte App
- `sw.js` – Service Worker (offline, Updates)
- `manifest.webmanifest`, `icons/` – Installation auf Home-Bildschirm/Dock
- `LIESMICH.md` – Anleitung für Eric

## Design (Entwurf „A · Ausgabe“, angelehnt an WANDER)
- Farben: Papier `#eeece6`, Stein `#e3e2dc`, Tinte `#26302b`, Oliv `#506055`, Linie `#cfd0c8`, Blatt (Schreiben) `#f6f5f1`, Nacht `#12150f`, Leinen `#f2f3ef`, Nebel `#b1bdb3`, gedämpft `#8d998f`, Nachtlinie `#3b4740`.
- Schriften: Instrument Serif (Titel, Zahlen, *Heute* kursiv) + Manrope (UI). Kaum Rundungen, feine Linien statt Schatten.
- Kurven: `--ease` cubic-bezier(0.2,0.7,0.2,1), `--sheet` cubic-bezier(0.32,0.72,0,1) (wie Vaul).
- Titelmuster: großes Wort 64px + Jahr kursiv 44px grau („November *2026*“). Erste Linie liegt auf allen Seiten auf gleicher Höhe.
- Kalender-Zeichen: gefüllter Kreis = geschrieben, Ring = heute, blass = leer/zukünftig.

## Ansichten
- **Startseite**: dunkler Kopf (Lupe + Einstellungen oben rechts), fixierter Monatstitel (folgt beim Scrollen dem Monat der Einträge, Lupe gleitet dann in die Leiste), Wochenleiste (wischbar), darunter Linie mit *Heute* (fest mittig, nur der Pfeil wechselt die Seite), „x/y Tage“ (keine Serien/Streaks – bewusst ohne Druck), rechts Kalender-Symbol (Strich-Icon wie Lupe/Einstellungen, ohne Ring). Bereich unter den Tagen bewusst kompakt. Liste: alle Einträge gleich groß, Monats-Zwischenüberschriften. Runder Plus-Knopf unten rechts (iPhone wie der Zurück-Knopf; Mac rechts unten im Schreibbereich, nur über dem Eintrag) – Seitenleiste am Mac ohne Knopf. Nach unten ziehen = aktualisieren (Ring zeichnet sich).
- **Kalender**: dunkler Kopf, Tabs „Woche · Monat · Jahr“ (Woche = zurück), Monat/Jahr wischbar, Wechsel Monat ⇄ Jahr mit Zoom-Überblendung (`morphSwap`), Jahr in Siebenerblöcken (1·8·15·22·29), „An diesem Tag“ unten. Monat (iPhone): erstes Tippen auf einen Tag zeigt unten eine Vorschau (`S.cal.sel`, Ring um den Tag), zweites Tippen auf Tag oder Vorschau öffnet. Monat und Jahr müssen deckungsgleich bleiben (feste Höhen).
- **Schreiben**: oben links Wochentag fett + Datum, keine Initiale, keine Linie unter dem Titel. Runder Zurück-Knopf unten rechts; beim Tippen verschwindet er und oben rechts erscheint fest der Haken (Fertig = Tastatur schließen). Blatt etwas heller als das Papier. Links/rechts wischen = vorheriger/nächster Eintrag (aus der Suche: nur zwischen Treffern). Nach unten ziehen = schließen (Blatt bekommt runde Ecken, Startseite dahinter leicht verkleinert und abgedunkelt).
- **Suche**: nur Suchfeld „Wonach suchst du?“, Treffer mit Monats-Überschriften, Enter schließt Tastatur, nach unten wischen schließt.
- **Einstellungen**: Day-One-Import (JSON-ZIP mit Fotos), Sicherung speichern/laden, Abgleich.
- **MacBook** (ab 960px): links Seitenleiste 420px (dunkler Kopf mit großem Kalender: Tabs „Woche · Monat · Jahr“ mit gleitender Linie, Pfeile; „Heute“ wie am iPhone als Linie mit kursivem *Heute* unter dem Kalender (`.twbtn`); keine Hover-Ringe auf Tagen, markiert ist nur der geöffnete Tag; Titel blendet nur, wenn sich Monat/Jahr wirklich ändert; Monat/Jahr feste Höhe 312px, Woche 80px, Zustand `S.side`; „x/y Tage“ in allen Ansichten; Kopf steht fest, nur die Liste scrollt (eigener Scrollbalken). Scrollen der Liste schiebt den Kalender 1:1 mit dem Finger ein (erst schrumpft die Leiste, dann scrollt die Liste; beim Loslassen gleitet sie sanft ganz ein/aus), nur Monat + Jahr bleiben (`#home.cal-in`, Titel folgt dann dem obersten Eintrag); am Listenanfang nach oben scrollen oder Klick auf den Titel fährt ihn wieder aus (dort, wo die Liste steht). Klick auf den Titel bei offenem Kalender: Woche ⇄ Monat. Gewählter Eintrag wandert in der Liste nach oben (`scrollListTo`, zählt nicht als Scrollen), Woche/Monat folgt dem Eintrag (`sideJump`)), rechts Schreiben/Suche/Einstellungen linksbündig (64px Rand, Text max. 640px, Fotos zweispaltig). Suche am Mac: Lupe fährt ein Suchfeld nach links aus (Einstellungen blendet aus, Lupe wird zum X), Treffer erscheinen in der Seitenleisten-Liste (`S.dsearch`, `S.deskHits`); der Kalender zeigt dann nur Tage mit Treffern, die Zählung passt sich an (`S.hitDays`, wirkt über `hasEntry`), Esc/X schließt, ⌘F öffnet. Trackpad: eine Wischgeste = ein Wechsel (Schwung wird geschluckt), über dem Kalender folgt er dem Finger und blättert ab ¼ Breite, sonst Eintrag wechseln – auch beim Tippen. Horizontales Wischen ruft nie Zurück/Vor des Browsers auf (`preventDefault` + `overscroll-behavior:none`).
- Mac: Ansichten rechts (z. B. Einstellungen) wechseln per Überblendung mit leichtem Zoom, Abschnitte steigen gestaffelt ein; Einstellungs-Symbol: Regler gleiten auseinander, wenn offen; zweiter Klick schließt.
- Liste wird nur neu aufgebaut, wenn sich ihr Inhalt ändert (`S.listHTML`) – vermeidet Ruckler beim Zurückgehen.
- Gesten mit Schwung/Gummiband (Geschwindigkeit der letzten ~100 ms). Runder Zurück-Knopf weicht beim Runterscrollen aus.

## Daten und Abgleich
- Lokal in IndexedDB (`entries`, `photos`). Einträge: `{id, date, created, modified, title, text, photos, source}`; intern `_dirty`, `_savedSig`.
- Abgleich über privates Repo **EricWlts/journal-daten** per GitHub-REST (Git-Data-API): `entries/<id>.json`, `photos/<id>`. Hochladen ~2 s nach dem Speichern, Abholen beim Öffnen und alle 30 s. Konflikt: zuletzt geänderte Fassung gewinnt. Fotos werden auf dem anderen Gerät erst beim Öffnen geladen.
- Zugangsschlüssel (fine-grained PAT, nur journal-daten, Contents read/write) gibt Eric selbst in der App ein; er liegt nur in localStorage. Niemals einen Schlüssel im Chat annehmen oder verwenden – falls Eric einen schickt, zum Löschen und Neuerstellen raten.

## Offene Ideen
- Feinschliff nach Erics Tests auf dem iPhone.
- Evtl. sanfte abendliche Erinnerung, ⌘K-Suche auf dem Mac, NumberFlow für die Zählung.
- Mac-Ansicht und Import-Seite im Canvas-Entwurf „Journal-App – Entwurf“ (claude.ai Artifact) gibt es als Design-Vorlage.
