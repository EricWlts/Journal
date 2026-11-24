# Journal – deine eigene Journal-App

Eine Web-App für iPhone und MacBook. Sie läuft im Browser, lässt sich wie eine App auf den Home-Bildschirm bzw. ins Dock legen und funktioniert auch offline. Kosten: keine.

## Was drin ist

- **Übersicht:** aktuelle Woche, „Tage geschrieben“, alle Einträge, „Heute schreiben“
- **Kalender:** Monat und Jahr, „An diesem Tag“ aus früheren Jahren
- **Schreiben:** Titel und Text, speichert automatisch während du tippst
- **Suche** über alle Einträge
- **Import aus Day One** (JSON-Export als ZIP, mit Fotos)
- **Sicherung** als einzelne Datei speichern und wieder laden

## Gesten und Tasten

- iPhone: vom linken Rand nach rechts wischen = zurück
- Kalender: nach links/rechts wischen = Monat bzw. Jahr wechseln
- Eintrag: nach links/rechts wischen = vorheriger/nächster Eintrag
- MacBook: Zwei-Finger-Wischen auf dem Trackpad, Pfeiltasten, ⌘[ = zurück, ⌘N = heute schreiben, ⌘F = suchen, Esc = Tippen beenden

## Online stellen mit GitHub Pages (kostenlos)

1. Auf github.com anmelden (oder kostenloses Konto anlegen).
2. Neues Repository anlegen, z. B. `journal`, Sichtbarkeit **Public** (für kostenloses GitHub Pages nötig – es liegt nur der App-Code darin, keine Einträge).
3. „Add file“ › „Upload files“ und den **Inhalt** dieses Ordners hineinziehen (index.html, sw.js, manifest.webmanifest, Ordner icons). „Commit changes“.
4. Im Repository: Settings › Pages › Source: „Deploy from a branch“, Branch `main`, Ordner `/ (root)`, Save.
5. Nach ca. einer Minute ist die App erreichbar unter `https://DEINNAME.github.io/journal/`.

## Auf die Geräte holen

- **iPhone:** Adresse in Safari öffnen › Teilen › „Zum Home-Bildschirm“.
- **MacBook:** Adresse in Safari öffnen › Ablage › „Zum Dock hinzufügen“.

## Wichtig zu deinen Daten

Die Einträge werden nur auf dem jeweiligen Gerät gespeichert, nicht bei GitHub. iPhone und MacBook haben vorerst getrennte Einträge. Bis der Abgleich eingebaut ist:
- Day-One-Import auf beiden Geräten machen, oder
- auf einem Gerät „Sicherung speichern“ und auf dem anderen „Sicherung laden“.
Mach ab und zu eine Sicherung.
