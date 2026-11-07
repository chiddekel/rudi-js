# Rudi.js

A gamified course on building a JavaScript engine, with Rudi the red panda as mascot.
Plain HTML + CSS + JS, no build step: open `index.html` (works from `file://`, any static host, desktop and mobile; installable via `manifest.webmanifest`).

| Path | What |
|---|---|
| `index.html` | App: lesson path, lessons, playground, ranking, profile (hash router) |
| `design-system.html` | Design system showcase (tokens, components, mascot moods, Stitch references) |
| `css/tokens.css` | Colors, type, radii, depth, light/dark themes |
| `css/components.css` | DS components: 3D buttons, cards, progress, path nodes, choices, sheet, modal, tabbar… |
| `css/app.css` | Course UI: code cards, token tiles, AST tree, bytecode, console |
| `js/rudi.js` | Mascot SVG (`data-rudi data-mood="happy|joy|wow|wink|sad"`), icons, toast, confetti, theme |
| `js/engine.js` | RudiScript: lexer → Pratt parser → AST → tree-walking interpreter + bytecode compiler |
| `js/course.js` | Course content: 6 modules, 15 lessons, 44 exercises (`choice`, `order`, `input`) |
| `js/app.js` | App logic, progress in `localStorage` |
| `stitch/` | Screens generated in Google Stitch (project "Rudi Design System") used as visual reference |

Progress (XP, streak, hearts, gems) is stored per browser in `localStorage`.
