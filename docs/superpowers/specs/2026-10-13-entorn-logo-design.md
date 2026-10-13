# Entorn web LOGO per a l'alumnat — Disseny

Data: 2026-10-13
Estat: pendent de revisió del docent

## 1. Objectiu

Entorn web, accessible per un enllaç públic, on l'alumnat programa en LOGO amb una
fidelitat alta al llenguatge real (UCBLogo). La disposició segueix la captura
`logo.png`: tela amb quadrícula i tortuga a l'esquerra; pestanyes Editor / Historial /
Manual a la dreta.

### Decisions preses amb el docent

| Tema | Decisió |
|---|---|
| Primitives | Anglès UCBLogo (`FD`, `RT`, `REPEAT`, `TO ... END`) |
| Idioma de la interfície | Català |
| Missatges d'error de l'intèrpret | Anglès (els de jslogo, sense traduir) |
| Accés | GitHub Pages, sense comptes ni servidor |
| Persistència | Navegador (`localStorage`) + descàrrega/càrrega de fitxers `.lgo` |
| Execució | Editor amb botó «Executa» + línia d'ordres immediates |
| Quadrícula | De mesura, mida de cel·la configurable (10/20/50 passos) |
| Base tècnica | Fork de [inexorabletash/jslogo](https://github.com/inexorabletash/jslogo) (Apache 2.0) |

### Fora d'abast

- Comptes d'usuari, desament al núvol, panell del docent.
- Traducció de primitives al català.
- Integració amb Google Classroom.

## 2. Arquitectura

```
/
├── vendor/jslogo/      logo.js, turtle.js, floodfill.js, cm/  (còpia literal, sense modificar)
├── index.html          estructura de la pàgina
├── css/app.css
├── js/
│   ├── app.js          arrencada: crea LogoInterpreter + CanvasTurtle, connecta mòduls
│   ├── grid.js         canvas de quadrícula; mida de cel·la; mostrar/amagar
│   ├── sprite.js       dibuix de la tortuga (imatge) en lloc del triangle de jslogo
│   ├── status.js       indicador X, Y, rumb, estat de la ploma
│   ├── speed.js        control de velocitat (pausa per moviment)
│   ├── storage.js      localStorage + fitxers .lgo + exportació PNG
│   └── panels.js       pestanyes, editor, sortida, historial, línia d'ordres
├── manual/             contingut de la pestanya Manual
├── tests/              proves automàtiques
├── LICENSE             Apache 2.0 (de jslogo)
└── NOTICE              atribució a jslogo i llista de fitxers propis
```

### Principis

- **No es modifica cap fitxer de `vendor/jslogo/`.** Tota la personalització es fa
  per composició: objecte `stream` propi, embolcall de mètodes de `CanvasTurtle`,
  substitució del dibuix de la tortuga. Actualitzar jslogo = substituir la carpeta.
- Web estàtica: HTML + CSS + JS (mòduls ES), sense pas de compilació.
- Si cal un punt d'extensió que jslogo no exposa, es documenta aquí abans
  d'implementar-lo (preferència: embolcall en temps d'execució, no edició del vendor).

### Punts d'integració amb jslogo

| Peça de jslogo | Ús |
|---|---|
| `new LogoInterpreter(turtle, stream, savehook)` | Intèrpret. `stream` propi escriu a l'àrea de Sortida. `savehook(name, def)` desa procediments. |
| `logo.run(text)` → `Promise` | Executa codi de l'editor o de la línia d'ordres. Errors: la promesa es rebutja. |
| `logo.bye()` | Botó «Atura»: força `forceBye`, interromp bucles. |
| `new CanvasTurtle(canvas_ctx, turtle_ctx, w, h, overlay)` | Dos canvas apilats: traç i tortuga. |
| `turtle.position`, `turtle.heading`, `turtle.pendown`, `turtle.visible` | Indicador d'estat i dibuix de la tortuga. |

## 3. Tela i quadrícula

Tres canvas apilats, de la mateixa mida (per defecte 600×600 passos, origen al centre):

1. **`#grid`** (a sota): quadrícula. Només la dibuixa `grid.js`. Ni `CLEARSCREEN`
   ni `FILL` la toquen.
2. **`#sandbox`**: traç (`canvas_ctx` de jslogo). Fons transparent perquè es vegi la
   quadrícula. Si jslogo pinta el fons amb `bgcolor` en netejar, `grid.js` ha de
   continuar visible: la quadrícula es pinta amb transparència sobre el color de fons
   o el fons es trasllada a `#grid`. Es decideix a la implementació i es documenta.
3. **`#turtle`** (a dalt): tortuga (`turtle_ctx` de jslogo).

### Mida de cel·la

- Valors: 10, 20 (per defecte), 50 passos de tortuga.
- Ordre de prioritat: paràmetre d'URL `?cel=10|20|50` → valor desat a `localStorage`
  → 20. Un valor no vàlid a l'URL s'ignora.
- Selector «Cel·la» a la barra: canvia la mida a l'instant i la desa.
- La línia vertical i horitzontal que passen per l'origen (0,0) es dibuixen més marcades.
- Botó «Quadrícula» per mostrar/amagar (estat desat).

## 4. Tortuga

- Imatge de tortuga vista des de dalt (semblant a la captura), fitxer SVG propi a
  `img/tortuga.svg`, uns 32 px.
- Gira segons `turtle.heading` (0° = amunt, sentit horari, com UCBLogo).
- `HT` / `ST` l'amaguen/mostren (`turtle.visible`).
- Implementació: `sprite.js` substitueix la funció que dibuixa la tortuga a `#turtle`.
  Si `_draw` és privada dins `turtle.js`, s'embolcalla el mètode públic que la crida.

## 5. Interfície

```
┌───────────────────────────────────────┐ ┌[Editor][Historial][Manual]──────┐
│ [▶ Executa] [■ Atura] [Neteja]        │ │ 1 │ TO quadrat :c                 │
│ Cel·la:[20▾] [# Quadrícula] Vel.:[━●━]│ │ 2 │   REPEAT 4 [FD :c RT 90]      │
│ ┌───────────────────────────────────┐ │ │ 3 │ END                           │
│ │ quadrícula + traç + tortuga       │ │ │ 4 │ quadrat 100                   │
│ └───────────────────────────────────┘ │ ├─ Sortida ───────────────────────┤
│ X: 0  Y: 0  Rumb: 0°  Ploma: baixa    │ │ (PRINT i errors)                │
│ ? FD 50█  (línia d'ordres)            │ │ [Desa .lgo] [Obre .lgo] [PNG]   │
└───────────────────────────────────────┘ └─────────────────────────────────┘
```

### Controls

| Control | Comportament |
|---|---|
| **Executa** / `Ctrl+Enter` | `logo.run(contingut de l'editor)`. Desactivat mentre s'executa. |
| **Atura** | `logo.bye()`. Actiu només mentre s'executa. |
| **Neteja** | `logo.run('cs')`: esborra el traç, tortuga a l'origen. No esborra procediments. |
| **Línia d'ordres** | `Enter` executa; `↑`/`↓` recorre ordres anteriors (sessió). |
| **Velocitat** | Lliscant de 0 (instantani) a 5 (lent). Pausa per moviment: 0, 10, 30, 80, 200, 500 ms. |
| **Indicador** | X, Y (arrodonits a enters), rumb (0–359°), ploma alta/baixa. S'actualitza després de cada moviment. |

### Editor

- CodeMirror (el que inclou jslogo a `vendor/jslogo/cm/`) amb números de línia i
  ressaltat de sintaxi LOGO.
- Àrea **Sortida** sota l'editor: text de `PRINT`/`SHOW`/`TYPE` en negre, errors en
  vermell. Botó per buidar-la.

### Historial

- Cada execució (editor o línia d'ordres) afegeix una entrada: hora + codi.
- Clic en una entrada → la copia a l'editor (amb confirmació si l'editor té canvis).
- Màxim 200 entrades; les més antigues s'eliminen.

### Disposició adaptable

- Amplada ≥ 900 px: dues columnes com la captura.
- Amplada < 900 px: tela a dalt, panells a sota. La tela s'escala per cabre.

## 6. Persistència

Claus de `localStorage` amb prefix `logo-web:`.

| Clau | Contingut |
|---|---|
| `logo-web:editor` | Text de l'editor. Desat 500 ms després de l'últim canvi. |
| `logo-web:procs` | Objecte `{nom: definició}` des del `savehook`. Es recarrega en arrencar amb `logo.run(def)`. |
| `logo-web:history` | Array de `{t, codi}`, màxim 200. |
| `logo-web:prefs` | `{cel, quadricula, velocitat}`. |

- **Desa .lgo**: descarrega l'editor com a `programa.lgo` (text UTF-8).
- **Obre .lgo**: selector de fitxer; confirma si l'editor no és buit; substitueix el contingut.
- **Desa PNG**: compon `#grid` + `#sandbox` (sense tortuga) en un canvas temporal i el descarrega.
- **Esborra-ho tot** (a Historial): confirma i esborra totes les claus `logo-web:*`,
  fa `ERALL` i `CS`.
- Si `localStorage` llança excepció: l'entorn funciona igual i mostra un avís fix
  «La feina no es desarà en tancar».

## 7. Manual

- Pestanya amb les primitives agrupades: Moviment; Ploma i color; Control (`REPEAT`,
  `IF`, `IFELSE`, `STOP`, `OUTPUT`…); Procediments i variables; Paraules i llistes;
  Matemàtiques; Text i sortida.
- Per primitiva: nom, abreviatura, sintaxi, explicació en català (1–2 frases),
  exemple i botó «Prova-ho» (copia l'exemple a l'editor).
- Cercador que filtra per nom o abreviatura.
- Font de veritat: `language.html` de jslogo. Només s'hi documenten primitives que
  jslogo implementa. Dades a `manual/primitives.json`; la pestanya es genera des d'aquí.

## 8. Errors

- Error de sintaxi o d'execució de `logo.run` → missatge a Sortida en vermell; la
  interfície torna a l'estat «no s'executa».
- `READWORD`/`READLIST` (lectura de teclat): `stream.read` obre un diàleg simple
  amb `prompt` propi (no `window.prompt`).
- Fitxer .lgo il·legible → avís, l'editor no es toca.

## 9. Proves

- `tests/` amb Playwright (Node) que obre `index.html` servit localment i comprova:
  1. `REPEAT 4 [FD 100 RT 90]` → tortuga a (0,0), rumb 0, hi ha píxels dibuixats.
  2. `TO quadrat ... END` + recàrrega de pàgina → `quadrat 50` funciona (persistència).
  3. `?cel=50` → la quadrícula té línies cada 50 passos.
  4. `FOREVER [FD 1 RT 1]` + Atura → l'execució s'interromp.
  5. `PRINT 2 + 3` → «5» a Sortida.
  6. Error (`FDD 10`) → missatge en vermell a Sortida.
- Comprovació manual a Chrome i Firefox, i en una tauleta (amplada < 900 px).

## 10. Publicació

- Repositori GitHub del docent, GitHub Pages des de la branca `main`, arrel `/`.
- `LICENSE` i `NOTICE` conserven l'atribució a jslogo (Joshua Bell, Apache 2.0).
