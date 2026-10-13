# Com continuar la feina en un altre ordinador

Data de l'última sessió: 2026-10-13

## Estat actual

L'entorn està acabat i publicat: **https://tomeu-cd100.github.io/logo-aula/**

- ✅ Especificació: `docs/superpowers/specs/2026-10-13-entorn-logo-design.md`
- ✅ Pla de 10 tasques executat i fusionat a `main` (PR #1).
- ✅ Problemes menors arreglats (PR #2): Neteja atura l'execució, la velocitat també frena
  `SETXY`/`HOME`, i les preferències desades es validen.
- ✅ Repositori públic; GitHub Pages publica des de `main`, carpeta `/`.
- ✅ Provat a Chrome i Firefox. 82 proves en verd (`npm test`).
- ⏳ Pendent (opcional): provar-ho en una tauleta real.
- 💡 Detall conegut, sense efecte a la web: `tests/serve.mjs` (servidor de proves) pot petar
  amb una URL mal codificada.

## Decisions preses

| Tema | Decisió |
|---|---|
| Primitives | Anglès UCBLogo (`FD`, `RT`, `REPEAT`, `TO ... END`) |
| Interfície | Català |
| Accés | GitHub Pages, sense comptes; feina desada al navegador + fitxers `.lgo` |
| Execució | Editor amb «Executa» + línia d'ordres |
| Quadrícula | Configurable: 10, 20 o 50 passos (`?cel=`) |
| Base tècnica | jslogo sense modificar (a `vendor/`); personalització per composició a `js/` |

## Com fer canvis

1. Instal·la [Git](https://git-scm.com/), [Node.js](https://nodejs.org/) (versió 22 o superior)
   i [Claude Code](https://claude.com/claude-code).
2. Clona el repositori (només la primera vegada) i instal·la les eines de prova:
   ```bash
   git clone https://github.com/tomeu-cd100/logo-aula.git
   cd logo-aula
   npm install
   npx playwright install chromium
   ```
3. Abans de començar en qualsevol ordinador: `git pull`.
4. Obre Claude Code dins la carpeta, escriu «Llegeix `CONTINUAR.md`» i explica el canvi que vols.
5. Prova en local amb `npm start` (http://localhost:8123) i `npm test`.
6. Publica: qualsevol canvi que arribi a `main` (amb `git push` o fusionant un PR) actualitza la
   web en un parell de minuts. Si no veus el canvi, recarrega amb **Ctrl+F5**.

## Fitxers

- `README.md` — instruccions per al docent i per a l'alumnat.
- `logo.png` — captura de referència de la disposició.
- `docs/superpowers/specs/` — què es construeix i per què.
- `docs/superpowers/plans/` — com es va construir, pas a pas.
- `js/` — codi propi (un mòdul per peça: quadrícula, tortuga, velocitat, desat…).
- `manual/primitives.json` — contingut de la pestanya Manual.
