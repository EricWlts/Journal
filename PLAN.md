# PLAN – Premium-Runde (aus den Prototypen vom 27.11.2026)

Ziel: Die App soll sich anfühlen wie die hochwertigste Journal-App überhaupt. Sie soll minimalistisch bleiben und ohne Schnickschnack auskommen, aber jedes Detail sitzt.
Canvas mit allen Prototypen: https://claude.ai/artifact/W8y7G1RXm8PdtXMzabVB8Q (nur zur Ansicht).
Quellcode der freigegebenen Prototypen liegt in `entwurf/*.dc.html`. Das ist kein lauffähiges HTML, sondern eine Vorlage. Übernehmen sollst du CSS, Zeiten, Kurven, Werte und Logik, nicht das Template-Format.

## Arbeitsweise (SPARMODUS – gilt ab 27.11.2026 abends)
- **Keine Unteragenten.** Ein Agent pro Chat, **ein Schritt pro Chat**. Unteragenten starten jedes Mal kalt und lesen alles neu – das war zu teuer.
- `index.html` (~220 KB) **nie ganz lesen**: nur `grep -n` und gezielte Ausschnitte (`sed -n 'A,Bp'`, max. ~150 Zeilen am Stück). Aus `entwurf/` nur die eine Datei des Schritts, und davon nur CSS/Logik-Teile.
- **Test ohne Bilder:** Playwright headless, iPhone 390×844 (Touch) und Mac 1280×800; prüfen per `page.evaluate` (Elemente da, Klassen/Zustände richtig, keine Konsolenfehler) – **keine Screenshots ansehen**, höchstens einen einzigen am Ende, wenn etwas unklar ist. Die optische Abnahme macht Eric am iPhone.
- Danach: `sw.js` VERSION +1, Commit (deutsch, kurz), Push auf `main`, Schritt hier abhaken (☑), CLAUDE.md nur mit 1–3 knappen Zeilen ergänzen.
- Antwort an Eric: max. 5 Sätze.
- Nie Bestehendes verschlechtern. Nicht wieder einbauen, was laut CLAUDE.md entfernt wurde (Schreibmaschine/Geräusche, Stapel, Fußzeile, Einrasten der Liste, Fokus-Modus, Feder-/Tinteneffekt).

Testdaten für Playwright: ~40 Einträge in den letzten 60 Tagen in IndexedDB `journal` / Store `entries` (`{id,date:'YYYY-MM-DD',created,modified,title,text,photos:[],source:'local'}`) einfügen, dann neu laden.

## Feste Gestaltungsregeln (gelten für jeden Schritt)
1. **Bewegungssystem:** Nur die Dauern 0,16 / 0,28 / 0,55 / 0,82 s, als CSS-Variablen `--t1..--t4` anlegen. Nur die Kurven `--ease` und `--sheet`. Linear nur beim Daumenkino. Wegblenden ist schneller als Einblenden (etwa 70 %).
2. **Unterbrechbar:** Jede Animation kehrt von ihrer aktuellen Stelle um, wenn mitten drin wieder getippt wird. Kein „erst fertig laufen“.
3. **Herkunft:** Was aufgeht, kommt aus dem, was angetippt wurde, und geht dorthin zurück. Das gilt für Karte → Blatt, für die Einstellungen (aus dem Regler-Symbol) und für die Suche (aus der Lupe).
4. **Haptik iPhone (iOS 18+):** über einen versteckten `<input type="checkbox" switch>`, der per `label.click()` umgeschaltet wird. Einsetzen beim Ring auf einem Tag, beim Speichern und beim Löschen. Leise scheitern, wo es nicht unterstützt wird.
5. **Typografie:**
   - Zähler und Uhrzeiten mit `tabular-nums`, Fließtext mit `oldstyle-nums`.
   - Überschriften mit `text-wrap:balance`, Fließtext mit `text-wrap:pretty`, keine Einzelwörter in der letzten Zeile.
   - Echte „Anführungszeichen“ und Gedankenstriche.
   - Große Serif-Titel mit letter-spacing −0,015em, kleine Versalien mit +0,18em.
6. **Kontrast:** Grauer Hilfstext auf Papier mindestens 4,5:1, also `#6f7a71` statt `#8d998f` für Text. `#8d998f` nur noch für Symbole.
7. **Leere Zustände:** ein Satz in kursiver Instrument Serif statt eines Standard-Icons.
8. **Akzent Kupfer `#a35f3a`:** nur sparsam einsetzen, für die Jahreslinie, die Schreibmarke (`caret-color`), die Initiale, die kleine Linie in der Randspalte und die Textmarkierung (`::selection` mit 22 % Deckkraft).
9. **Papier:** Helle Flächen bekommen `box-shadow: inset 0 1px 0 rgba(255,255,255,.55–.7)` und 16px Rundung oben (iPhone-Blätter).

## Schritte
(◐ = gebaut und hochgeladen, aber nicht abgehakt – zu Beginn kurz prüfen, ob es vollständig ist, dann ☑.)

### ☑ 1 · Grundlagen
Regeln 1, 5, 6 und 8 global umsetzen: Variablen, Kontrast-Töne, `::selection`, `caret-color`, Typo-Klassen. Rein visuell, keine Funktionsänderung.

### ☑ 2 · Karte wird Blatt (iPhone) — `entwurf/Blatt5.dc.html`
Ersetzt das heutige Hereingleiten des Eintrags von unten.
- **Öffnen:** Die angetippte Karte wächst zum Blatt (0,8 s `--sheet`). Tageszahl und Titel gleiten an ihren Platz. Der Text wird von oben nach unten freigelegt (Maskenkante wie `revealDown`). Unter dem Datum zieht sich eine feine Linie auf. Die Startseite tritt zurück (scale .94, brightness .6, saturate .85).
- **Schließen per Zurück-Knopf oder Runterziehen:** Die Geometrie *und* der Zieh-Versatz laufen mit derselben Kurve zur Karte (0,82 s), ohne Hochspringen. Im Blatt steckt eine **exakte Kopie der Karte**, die in den letzten 0,34 s einblendet. Die echte Karte wird im selben Bild ohne Übergang sichtbar. Keine Lande-Animation, kein Nachrasten.
- **Zurück-Knopf:** Er bleibt an seinem Platz und verschwindet dort (opacity, scale .86, blur 4px, 0,22 s). Er fährt nicht mit.
- **Runterziehen:** Das Blatt folgt dem Finger (×0,62, scale bis −10 %, runde Ecken), die Startseite kommt dabei nach vorn. Ab 120 px oder mit Schwung (> 0,6 px/ms) schließt es.
- Das bestehende Wischen nach links/rechts zwischen Einträgen und das Löschen müssen weiter funktionieren.

### ☑ 3 · Gedrückt halten (iPhone) — `entwurf/Vorschau3.dc.html`
- Langes Drücken auf eine Karte in Liste oder Suche (480 ms): Die Karte gibt nach (scale .965), dann hebt sie sich als Vorschau ab. Der Hintergrund wird weichgezeichnet (`backdrop-filter: blur(14px)`, 28 % dunkel).
- Darunter ein Menü: Öffnen / Als Markdown teilen (`navigator.share` oder Kopieren) / Löschen … (Ziegelrot, bestehende Bestätigung).
- **Schließen:** Das Menü verschwindet zuerst (0,18 s). Vorschau und Hintergrund laufen mit derselben Kurve und Dauer zurück, die Kartenkopie blendet im Flug ein, die echte Karte ist im selben Bild da. Kein Blinken.
- Das bestehende Wisch-zum-Löschen darf nicht kollidieren: Langes Drücken nur ohne Bewegung (< 8 px).

### ☑ 4a · Monat als Startseite (iPhone) — `entwurf/Start4.dc.html`
- **Startseite:** Der dunkle Kopf zeigt den ganzen Monat. Scrollen der Liste klappt den Monat 1:1 mit dem Finger zur Woche des gewählten Tages ein: Reihen laufen zusammen und blenden aus, erst dann scrollt die Liste. Beim Loslassen gleitet es ganz auf oder zu (Schwung zählt). Ganz oben nach oben scrollen klappt es wieder auf.
- **Wechsel wie am Mac** (`sideMove`/`weekMove`):
  - Der alte Inhalt wird als Geist kopiert und gleitet 12 px weg (0,22 s, blur 2px, gestaffelt 14 ms).
  - Die neuen Tage kommen **gleichzeitig** als Welle (von 16 px, 0,6 s `--sheet`, Verzögerung 80 + Reihenfolge × 28 ms).
  - Eine Lücke dazwischen gibt es nie.
  - Wischen mit dem Finger: Die Tage folgen gedämpft (×0,38), die Welle startet dort, wo der Finger losgelassen hat.
- **Auswahl im Monat:** Der Tag ist einfach ausgewählt. Der Ring ist eine eigene Ebene pro Tag (opacity/scale .86→1), wie heute am Mac. Kein Wandern, kein Überschwingen.
- **Daumenkino nur bei Wochen:** Eingeklappt einen Eintrag aus einer anderen Woche wählen, oder *Heute* über mehrere Wochen. Takt 110/80/62 ms, dann 50 ms, höchstens 14 Bilder, die Landung als Welle. *Heute* im Monat blättert durch die Monate. Danach läuft der Ring einmal um heute.
- ***Heute*-Kapsel iPhone:** schlank, mit einem Pfeil, der zu heute zeigt. Sie erscheint nur, wenn man woanders ist. Am iPhone keine Pfeile (dort wischt man), am Mac bleiben die Pfeile.
- **Zählwerk:** „x/y Tage“ rollt Ziffer für Ziffer (gibt es schon: `setCount`).
- **Mac** (`entwurf/MacStart2.dc.html`): dieselbe Welle, dasselbe Daumenkino und dieselbe Ring-Logik in der Seitenleiste. Bestehendes, das schon stimmt, bleibt.

### ☑ 4b · Jahr (iPhone + Mac) — `Start4`
- Ein Tipp auf den großen Monatstitel zoomt den Monat an seinen Platz im Jahr. Der Titel wird zu „Das Jahr *2026*“. Die anderen Monate kommen von ihm aus nach außen.
- Umschalter „Monate | Übersicht“ (Übersicht = heutige Siebenerblöcke, eine Zeile pro Monat). Beim Umschalten wandert jeder Tag einzeln an seinen neuen Platz (0,9 s `--sheet`, gestaffelt nach Monat).
- Ein Tipp auf einen Monat zoomt hinein.

### ☑ 4c · Suche lässt Tage leuchten — `Start4`
- Bei der Suche (iPhone und Mac) leuchten in Monat, Woche und **beiden** Jahresansichten nur passende Tage auf, nacheinander in Datumsreihenfolge, mit einem weichen Lichtschein (`0 0 0 4px rgba(242,243,239,.10), 0 0 22px rgba(242,243,239,.38)`). Alles andere tritt zurück.
- Im Jahr bleiben nur Monatsnamen mit Treffern hell. Zählwerk zeigt „x Treffer“.
- Am iPhone Vorschläge als Chips (die häufigsten Wörter aus den Titeln).

### ☑ 5 · Tagesimpuls — `entwurf/Impuls2.dc.html`, `entwurf/impulse.json`
- **Auswahl:** Impuls des Tages = `impulse[(Tag im Jahr − 1) % 445]`. „Anderer Impuls“ zeigt einen zufälligen.
- **Darstellung:**
  - Feste Höhe für 3 Zeilen, nichts darunter springt.
  - Die Quelle steht klein in einer Zeile mit „…“.
  - Wörter verschwimmen raus und bauen sich gestaffelt auf, danach zieht sich eine Haarlinie neu auf.
  - Kicker „IMPULS DES TAGES · 27. NOVEMBER“, rechts „Nº 331“.
- **Beim Tippen:** Der Impuls wird klein über dem Text und verschwindet nicht.
- **Nur auf neuen, leeren Einträgen.** Am Mac in der Textspalte, mit Begrüßung je nach Tageszeit („Guten Morgen, Eric.“). Die Begrüßung verschwindet beim Tippen und kommt zurück, wenn das Blatt wieder leer ist.
- **Heute vor einem Jahr:** Karte unten auf dem leeren Blatt, nur wenn es einen Eintrag gibt. Antippen klappt sie auf.
- **Einstellungen › Beim Schreiben:** Schalter für Tagesimpuls, Ort & Wetter, Heute vor einem Jahr (Federschalter wie im Entwurf).

### ☑ 6 · Das Blatt „Schlicht“ (Mac + iPhone) — `entwurf/Schrift6.dc.html`
- **Kein Titelfeld mehr:** Die erste Zeile bis zum ersten Enter **ist** der Titel. Datenmodell: `title` = erste Zeile, `text` = der Rest. Beim Laden alter Einträge `title + "\n" + text` in einem Feld zeigen. So bleibt der Abgleich kompatibel.
- **Fließtext:** Newsreader (Google Fonts, `opsz`). Mac 20,5px/1,6, iPhone 17px/1,6. Farbe `#2b2722`, `oldstyle-nums`, `hyphens:auto`, `lang="de"`.
- **Absätze:** mit Leerzeile (`margin-top:1.05em`), keine Einzüge, keine Kapitälchen.
- **Initiale:** erster Buchstabe in Instrument Serif, Kupfer, 3 Zeilen hoch (Mac 96px, iPhone ~78px). Sie gehört nur zur Anzeige. Beim Bearbeiten muss die Schreibmarke stimmen: entweder eine eigene gezeichnete Marke wie im Entwurf oder die Initiale nur außerhalb des Bearbeitens. Wähle die robuste Lösung und teste das Tippen gründlich.
- **Randspalte Mac:** Tageszahl, Wochentag, „November 2026“ / Uhrzeit, kupferne Linie, „Leer · 4° Nebel“, kleiner Sonnenbogen „8:19 – 16:18“ (heller). Mehr nicht. Kein Mond im Eintrag.
- **iPhone-Kopf** entsprechend: Ort und Wetter sowie Sonnenzeiten als eine leise Zeile.

### ☑ 7 · Jahreslinie, Mond, Ort & Wetter — `entwurf/Kopf2.dc.html`
- **Jahreslinie:** Die vorhandene Linie unter dem Monatstitel wird zur Jahreslinie: kupfern gefüllt bis heute, mit einer Marke. Kein neues Element, gilt auf iPhone und Mac.
- **Zeile darunter:**
  - Links der Mond, 34px, **echt beleuchtet**: Phase aus dem Datum (Synodenmonat 29,530588853 d ab JD 2451550,1), zunehmend rechts hell, weiche Schattengrenze, angedeutete Mondmeere, schwacher Erdschein.
  - Daneben „Abnehmender Mond“ / „Neumond in 12 Tagen“.
  - Rechts Sonnenaufgang und -untergang mit Symbol (NOAA-Näherung, siehe `sun()` im Entwurf, Sommerzeit beachten, Polarnacht abfangen).
- **Standort:** `navigator.geolocation` (einmal fragen, ungefähr). Ortsname über einen kostenlosen Dienst ohne Schlüssel, Wetter über Open-Meteo. **Nur** gespeichert wird „Leer · 4° Nebel“ sowie Sonnenauf- und -untergang im neuen Eintrag, **keine Koordinaten**. Offline: weglassen, nichts anzeigen.
- Am Mac denselben Mond und dieselben Sonnenzeiten in der Kalenderkarte unter der Linie.

### ☐ 8 · Feinschliff & Abnahme
- Regel 2 (unterbrechbar) und Regel 3 (Herkunft) für Einstellungen und Suche prüfen und nachziehen.
- Regel 4 (Haptik) einbauen, Regel 7 (leere Zustände).
- `prefers-reduced-motion`: Alle Bewegungen werden zu kurzen Überblendungen.
- Nachtmodus für alle neuen Teile (Kupfer in der Nacht leicht heller, z. B. `#c27a52`).
- **Abschluss-Prüfung durch einen frischen Unteragenten:** iPhone und Mac, hell und Nacht, alle Abläufe aus 2 bis 7. Er liefert eine Liste mit Mängeln. Die Mängel werden behoben, dann folgt der letzte Push.
