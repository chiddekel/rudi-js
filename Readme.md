# Rudi.js

**Zbuduj własny silnik JavaScript.** Darmowy, grywalizowany kurs z maskotką Rudim (czerwona panda): lekser, parser Pratta, AST, interpreter, domknięcia, bytecode VM, GC i JIT. 5 minut dziennie.

**▶ Strona:** https://chiddekel.github.io/rudi-js/ · **Aplikacja:** https://chiddekel.github.io/rudi-js/app.html

Plain HTML + CSS + JS, zero zależności, bez builda. Działa z `file://`, na dowolnym hostingu statycznym, na desktopie i telefonie (PWA).

## Uruchomienie

```sh
git clone https://github.com/chiddekel/rudi-js.git
cd rudi-js
xdg-open app.html        # albo: python3 -m http.server 8080
npm test                 # node --test (Node 18+)
```

## Struktura

| Ścieżka | Co |
|---|---|
| `index.html` | Strona promocyjna (GitHub Pages) |
| `app.html` | Aplikacja: ścieżka lekcji, lekcje, plac zabaw, ranking, profil |
| `design-system.html` | Design system Rudi: tokeny, komponenty, nastroje maskotki |
| `css/` | `tokens.css`, `components.css`, `app.css`, `landing.css` |
| `js/engine.js` | RudiScript: lekser → parser Pratta → AST → interpreter + kompilator bytecode |
| `js/course.js` | Treść kursu: 6 modułów, 15 lekcji, 44 zadania |
| `js/app.js`, `js/rudi.js` | Logika aplikacji, maskotka SVG, ikony, toasty |
| `tests/` | `node:test`: silnik i spójność kursu |
| `stitch/` | Ekrany z Google Stitch użyte jako referencja wizualna |

## Licencja

MIT
