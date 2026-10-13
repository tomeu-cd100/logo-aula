# Entorn web LOGO — Pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web estàtica on l'alumnat programa en LOGO (UCBLogo, via jslogo) amb tela quadriculada, tortuga, editor, línia d'ordres, historial i manual en català.

**Architecture:** Còpia literal de jslogo a `vendor/` (intèrpret + gràfics, sense modificar). Mòduls ES propis a `js/` que s'hi connecten per composició: objecte `stream` propi, `turtle.clear` substituït a la instància, mètodes `move/turn/arc` embolcallats, tortuga dibuixada en un canvas propi. `js/app.js` és l'arrel de composició.

**Tech Stack:** HTML + CSS + JavaScript (mòduls ES, sense compilació), jslogo @ `26dfcac41daa4477182ce7c1a00acbd913ab5fd5`, CodeMirror 5.61.1 (vendoritzat), proves amb `node --test` (unitàries) i `@playwright/test` (e2e), Node ≥ 22.

**Spec:** `docs/superpowers/specs/2026-10-13-entorn-logo-design.md`

## Global Constraints

- Cap fitxer de `vendor/` es modifica després de copiar-lo.
- Primitives en anglès UCBLogo; tots els textos de la interfície en català; missatges d'error de jslogo en anglès.
- Sense servidor ni comptes: tot ha de funcionar servit com a fitxers estàtics (GitHub Pages).
- Cap recurs extern en temps d'execució (ni CDN): tot sota `vendor/`, `img/`, `manual/`.
- Tela de 600×600 passos, origen al centre.
- Mides de cel·la: 10, 20 (per defecte), 50. Prioritat: `?cel=` vàlid → preferència desada → 20.
- Velocitat: nivells 0–5 → pausa per moviment 0, 10, 30, 80, 200, 500 ms.
- Claus de `localStorage` amb prefix `logo-web:` (`editor`, `procs`, `history`, `prefs`).
- Historial: màxim 200 entrades.
- Desat de l'editor: 500 ms després de l'últim canvi.
- Fitxer descarregat: `programa.lgo` (text UTF-8); imatge: `dibuix.png` (quadrícula + traç, sense tortuga).
- Llicència: Apache 2.0, atribució a jslogo (Joshua Bell) a `NOTICE`.
- Commits acabats amb la línia `Co-Authored-By` que indiqui l'entorn.

## Review Focus

1. Accents i caràcters catalans (`PRINT [Què tal, Núria?]`) han de sobreviure editor → `.lgo` → editor intactes. → test a Task 8.
2. Prémer «Executa» dues vegades seguides no ha de llançar dues execucions superposades: el botó es desactiva mentre s'executa. → test a Task 4.
3. `localStorage` bloquejat (llança excepció) no ha de trencar l'entorn: es mostra l'avís i LOGO funciona. → test a Task 7.
4. Un procediment desat que ja no es pot carregar (definició trencada) no ha d'impedir carregar els altres. → test a Task 7.
5. `?cel=abc` o `?cel=15` a l'enllaç s'ignora i s'usa la preferència o 20, sense error. → test a Task 2.

---

### Task 1: Esquelet — vendor, pàgina, intèrpret i sortida

**Files:**
- Create: `vendor/jslogo/{logo.js,turtle.js,floodfill.js,LICENSE.md}`, `vendor/jslogo/cm/{logo.js,logo.css}`
- Create: `vendor/codemirror/{codemirror.min.js,codemirror.min.css,closebrackets.min.js,matchbrackets.min.js}`
- Create: `LICENSE`, `NOTICE`, `.gitignore`, `package.json`, `playwright.config.js`
- Create: `index.html`, `css/app.css`, `js/app.js`, `js/output.js`
- Create: `tests/serve.mjs`, `tests/e2e/helpers.js`, `tests/e2e/basic.spec.js`, `tests/unit/output.test.js`

**Interfaces:**
- Produces:
  - `createStream(el: HTMLElement, ask: (prompt: string) => Promise<string>)` → objecte `stream` per a `LogoInterpreter` (`read`, `write`, `clear`, `readback`, `textsize`, `font`, `color`).
  - `writeError(el: HTMLElement, message: string)` → afegeix `<span class="error">` amb el missatge i `\n`.
  - `askDialog(prompt: string) → Promise<string>` (usa `<dialog id="lectura">`; Esc → `''`).
  - `window.logoApp = { logo, turtle }` i `window.logoApp.ready = true` com a **última línia** de `js/app.js`. Les tasques següents insereixen codi **just abans** de `window.logoApp.ready = true;`.
  - Helpers e2e: `obre(page, url?)`, `logo(page, code)`, `pixel(page, canvasId, x, y) → [r,g,b,a]`, `posicio(page) → [x, y]`, `rumb(page) → number`.

- [ ] **Step 1: Copiar jslogo i CodeMirror a `vendor/`**

```bash
cd "/c/Users/briera2/Documents/Llenguage LOGO"
TMPD=$(mktemp -d)
git clone -q https://github.com/inexorabletash/jslogo.git "$TMPD/jslogo"
git -C "$TMPD/jslogo" checkout -q 26dfcac41daa4477182ce7c1a00acbd913ab5fd5
mkdir -p vendor/jslogo/cm vendor/codemirror
cp "$TMPD"/jslogo/{logo.js,turtle.js,floodfill.js,LICENSE.md} vendor/jslogo/
cp "$TMPD"/jslogo/cm/{logo.js,logo.css} vendor/jslogo/cm/
CM=https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.61.1
curl -fsSL "$CM/codemirror.min.js"                    -o vendor/codemirror/codemirror.min.js
curl -fsSL "$CM/codemirror.min.css"                   -o vendor/codemirror/codemirror.min.css
curl -fsSL "$CM/addon/edit/closebrackets.min.js"      -o vendor/codemirror/closebrackets.min.js
curl -fsSL "$CM/addon/edit/matchbrackets.min.js"      -o vendor/codemirror/matchbrackets.min.js
ls -R vendor
```

Expected: 6 fitxers a `vendor/jslogo` (inclòs `cm/`), 4 a `vendor/codemirror`.

- [ ] **Step 2: Fitxers de projecte**

`LICENSE`: còpia de `vendor/jslogo/LICENSE.md` seguida del text complet d'Apache 2.0:

```bash
cp vendor/jslogo/LICENSE.md LICENSE
curl -fsSL https://www.apache.org/licenses/LICENSE-2.0.txt >> LICENSE
```

`NOTICE`:

```
LOGO a l'aula
Copyright 2026 Consell de Cent

Aquest projecte inclou "Logo in Javascript" (jslogo)
Copyright (C) 2009-2013 Joshua Bell
https://github.com/inexorabletash/jslogo
Llicència Apache 2.0. Fitxers a vendor/jslogo/, sense modificar
(commit 26dfcac41daa4477182ce7c1a00acbd913ab5fd5).

Inclou CodeMirror 5.61.1 (MIT) a vendor/codemirror/.

Fitxers propis: index.html, css/, js/, img/, manual/, tests/.
```

`.gitignore`:

```
node_modules/
test-results/
playwright-report/
```

`package.json`:

```json
{
  "name": "logo-aula",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node tests/serve.mjs 8123",
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "node --test \"tests/unit/*.test.js\"",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "1.64.0"
  }
}
```

`playwright.config.js`:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:8123', acceptDownloads: true },
  webServer: {
    command: 'node tests/serve.mjs 8123',
    url: 'http://localhost:8123',
    reuseExistingServer: true,
  },
});
```

`tests/serve.mjs` (servidor estàtic mínim, sense dependències):

```js
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};
const port = Number(process.argv[2] ?? 8123);

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(normalize(ROOT))) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('No trobat');
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
```

- [ ] **Step 3: Instal·lar dependències de prova**

```bash
npm install
npx playwright install chromium
```

Expected: `node_modules/@playwright/test` existeix; Chromium descarregat.

- [ ] **Step 4: Escriure el test unitari de `output.js` (falla)**

`tests/unit/output.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStream } from '../../js/output.js';

function fakeEl() {
  return {
    textContent: '', scrollTop: 0, scrollHeight: 100,
    append(...parts) { this.textContent += parts.map(String).join(''); },
  };
}

test('write afegeix el text i fa scroll al final', async () => {
  const el = fakeEl();
  const stream = createStream(el, async () => '');
  await stream.write('Hola', '\n');
  assert.equal(el.textContent, 'Hola\n');
  assert.equal(el.scrollTop, 100);
});

test('clear buida i readback retorna el contingut', async () => {
  const el = fakeEl();
  const stream = createStream(el, async () => '');
  await stream.write('abc');
  assert.equal(await stream.readback(), 'abc');
  await stream.clear();
  assert.equal(el.textContent, '');
});

test('read delega en ask', async () => {
  const stream = createStream(fakeEl(), async p => `resposta a ${p}`);
  assert.equal(await stream.read('Nom?'), 'resposta a Nom?');
});
```

Run: `npm run test:unit`
Expected: FAIL, `Cannot find module ... js/output.js`.

- [ ] **Step 5: Implementar `js/output.js`**

```js
// Sortida de text de l'intèrpret (PRINT, SHOW, TYPE) i lectura de teclat.

export function createStream(el, ask) {
  return {
    read: prompt => ask(prompt),
    async write(...parts) {
      el.append(...parts.map(String));
      el.scrollTop = el.scrollHeight;
    },
    async clear() {
      el.textContent = '';
    },
    async readback() {
      return el.textContent;
    },
    // jslogo hi escriu (SETTEXTSIZE, etc.); no tenen efecte visual aquí.
    textsize: 14,
    font: 'monospace',
    color: 'black',
  };
}

export function writeError(el, message) {
  const span = document.createElement('span');
  span.className = 'error';
  span.textContent = `${message}\n`;
  el.append(span);
  el.scrollTop = el.scrollHeight;
}

export function askDialog(prompt) {
  const dialog = document.getElementById('lectura');
  const input = dialog.querySelector('input');
  dialog.querySelector('p').textContent = prompt || 'Escriu:';
  input.value = '';
  dialog.returnValue = '';
  return new Promise(resolve => {
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'ok' ? input.value : '');
    }, { once: true });
    dialog.showModal();
    input.focus();
  });
}
```

Run: `npm run test:unit`
Expected: PASS (3 tests).

- [ ] **Step 6: `index.html` complet**

L'HTML de totes les tasques es crea ara; les tasques següents només hi connecten JS.

```html
<!doctype html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LOGO a l'aula</title>
<link rel="stylesheet" href="vendor/codemirror/codemirror.min.css">
<link rel="stylesheet" href="vendor/jslogo/cm/logo.css">
<link rel="stylesheet" href="css/app.css">
<script src="vendor/codemirror/codemirror.min.js"></script>
<script src="vendor/codemirror/closebrackets.min.js"></script>
<script src="vendor/codemirror/matchbrackets.min.js"></script>
<script src="vendor/jslogo/cm/logo.js"></script>
<script src="vendor/jslogo/floodfill.js"></script>
<script src="vendor/jslogo/logo.js"></script>
<script src="vendor/jslogo/turtle.js"></script>
<script type="module" src="js/app.js"></script>
</head>
<body>
<div id="avis-desat" class="avis" hidden>La feina no es desarà en tancar.</div>
<main class="app">
  <section class="tela-panell" aria-label="Tela">
    <div class="barra">
      <button id="executa" type="button">▶ Executa</button>
      <button id="atura" type="button" disabled>■ Atura</button>
      <button id="neteja" type="button">Neteja</button>
      <label>Cel·la
        <select id="cel">
          <option value="10">10</option>
          <option value="20" selected>20</option>
          <option value="50">50</option>
        </select>
      </label>
      <label><input type="checkbox" id="quadricula" checked> Quadrícula</label>
      <label>Velocitat <input type="range" id="velocitat" min="0" max="5" step="1" value="0"></label>
    </div>
    <div class="tela" id="tela">
      <canvas id="grid" width="600" height="600"></canvas>
      <canvas id="sandbox" width="600" height="600"></canvas>
      <canvas id="turtle" width="600" height="600"></canvas>
    </div>
    <div id="estat" class="estat"></div>
    <form id="ordres" class="ordres" autocomplete="off">
      <span aria-hidden="true">?</span>
      <input id="ordre" type="text" spellcheck="false" aria-label="Línia d'ordres" placeholder="FD 50">
    </form>
  </section>
  <section class="panells" aria-label="Panells">
    <div class="pestanyes" role="tablist">
      <button type="button" role="tab" data-pestanya="editor" aria-selected="true">Editor</button>
      <button type="button" role="tab" data-pestanya="historial" aria-selected="false">Historial</button>
      <button type="button" role="tab" data-pestanya="manual" aria-selected="false">Manual</button>
    </div>
    <div class="pestanya" id="pestanya-editor">
      <textarea id="editor"></textarea>
      <div class="sortida-cap">Sortida <button id="buida-sortida" type="button">Buida</button></div>
      <pre id="sortida" class="sortida"></pre>
      <div class="fitxers">
        <button id="desa-lgo" type="button">💾 Desa .lgo</button>
        <button id="obre-lgo" type="button">📂 Obre .lgo</button>
        <input type="file" id="fitxer-lgo" accept=".lgo,.txt,text/plain" hidden>
        <button id="desa-png" type="button">🖼 Desa PNG</button>
      </div>
    </div>
    <div class="pestanya" id="pestanya-historial" hidden>
      <ol id="historial" class="historial"></ol>
      <button id="esborra-tot" type="button" class="perill">Esborra-ho tot</button>
    </div>
    <div class="pestanya" id="pestanya-manual" hidden>
      <input id="cerca-manual" type="search" placeholder="Cerca una primitiva…" aria-label="Cerca una primitiva">
      <div id="manual"></div>
    </div>
  </section>
</main>
<dialog id="lectura">
  <form method="dialog">
    <p></p>
    <input type="text" aria-label="Resposta">
    <button value="ok">D'acord</button>
  </form>
</dialog>
</body>
</html>
```

- [ ] **Step 7: `css/app.css` complet**

```css
:root {
  --vora: #c9d6e3;
  --accent: #2f6fb0;
  --text: #222;
  --fons: #fff;
  --suau: #f5f7fa;
  --error: #c0392b;
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
body { margin: 0; font-family: system-ui, sans-serif; color: var(--text); background: var(--fons); }
.avis { background: #fff3cd; border-bottom: 1px solid #e0c36a; padding: 8px 16px; }
.app {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  padding: 16px;
  align-items: start;
}
.tela-panell, .panells { border: 1px solid var(--vora); padding: 12px; min-width: 0; }
.barra { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
button {
  font: inherit; padding: 4px 10px; border: 1px solid var(--vora);
  background: var(--suau); border-radius: 4px; cursor: pointer;
}
button:disabled { opacity: .5; cursor: default; }
#executa { background: var(--accent); color: #fff; border-color: var(--accent); }
.tela { position: relative; width: 100%; max-width: 600px; aspect-ratio: 1; }
.tela canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.estat { font-family: monospace; margin: 8px 0; white-space: pre; }
.ordres { display: flex; gap: 6px; align-items: center; font-family: monospace; }
.ordres input { flex: 1; min-width: 0; font: inherit; padding: 4px; }
.pestanyes { display: flex; border-bottom: 1px solid var(--vora); }
.pestanyes button { border-radius: 0; border-bottom: none; color: #777; }
.pestanyes button[aria-selected="true"] { background: var(--fons); color: var(--text); border-top: 2px solid var(--accent); }
.pestanya { padding-top: 12px; }
.CodeMirror { border: 1px solid #333; height: 380px; }
.sortida-cap { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.sortida { height: 120px; overflow: auto; background: var(--suau); padding: 6px; margin: 4px 0; white-space: pre-wrap; }
.sortida .error { color: var(--error); }
.fitxers { display: flex; gap: 8px; flex-wrap: wrap; }
.historial { max-height: 480px; overflow: auto; font-family: monospace; padding-left: 0; list-style: none; }
.historial li { border-bottom: 1px solid var(--suau); padding: 4px; cursor: pointer; white-space: pre-wrap; }
.historial li:hover { background: var(--suau); }
.historial time { color: #888; margin-right: 8px; }
.perill { color: var(--error); }
#cerca-manual { width: 100%; padding: 6px; font: inherit; }
.manual-cat h3 { margin: 16px 0 4px; }
.primitiva { border-bottom: 1px solid var(--suau); padding: 6px 0; }
.primitiva code { font-weight: bold; }
.primitiva p { margin: 4px 0; }
.primitiva pre { background: var(--suau); padding: 4px; margin: 4px 0; }
dialog p { margin-top: 0; }
@media (max-width: 899px) {
  .app { grid-template-columns: minmax(0, 1fr); }
}
```

- [ ] **Step 8: `js/app.js` inicial**

```js
import { createStream, askDialog } from './output.js';

const SIZE = 600;
const $ = sel => document.querySelector(sel);

const sortida = $('#sortida');
const stream = createStream(sortida, askDialog);

const turtle = new CanvasTurtle(
  $('#sandbox').getContext('2d', { willReadFrequently: true }),
  $('#turtle').getContext('2d'),
  SIZE, SIZE, $('#tela'));

const logo = new LogoInterpreter(turtle, stream, () => {});
await logo.run('cs');

window.logoApp = { logo, turtle };
window.logoApp.ready = true;
```

- [ ] **Step 9: Helpers e2e i tests bàsics (spec §9, proves 1 i 5)**

`tests/e2e/helpers.js`:

```js
export async function obre(page, url = '/') {
  await page.goto(url);
  await page.waitForFunction(() => window.logoApp?.ready === true);
}

export const logo = (page, code) =>
  page.evaluate(c => window.logoApp.logo.run(c), code);

export const pixel = (page, id, x, y) =>
  page.evaluate(([id, x, y]) =>
    [...document.getElementById(id).getContext('2d').getImageData(x, y, 1, 1).data], [id, x, y]);

export const posicio = page =>
  page.evaluate(() => window.logoApp.turtle.position.map(n => Math.round(n)));

export const rumb = page =>
  page.evaluate(() => Math.round(((window.logoApp.turtle.heading % 360) + 360) % 360));
```

`tests/e2e/basic.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { obre, logo, pixel, posicio, rumb } from './helpers.js';

test('quadrat: la tortuga torna a l\'origen i deixa traç', async ({ page }) => {
  await obre(page);
  await logo(page, 'REPEAT 4 [FD 100 RT 90]');
  expect(await posicio(page)).toEqual([0, 0]);
  expect(await rumb(page)).toBe(0);
  const [, , , alpha] = await pixel(page, 'sandbox', 300, 250);
  expect(alpha).toBeGreaterThan(0);
});

test('PRINT escriu a Sortida', async ({ page }) => {
  await obre(page);
  await logo(page, 'PRINT 2 + 3');
  await expect(page.locator('#sortida')).toHaveText('5\n');
});
```

Run: `npm run test:e2e`
Expected: PASS (2 tests). Si falla «quadrat», revisar que `vendor/jslogo/turtle.js` es carrega abans de `js/app.js` (els mòduls són diferits, els `<script>` clàssics no).

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: esquelet amb jslogo, pàgina i sortida de text"
```

---

### Task 2: Quadrícula i fons

**Files:**
- Create: `js/grid.js`, `tests/unit/grid.test.js`, `tests/e2e/grid.spec.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `window.logoApp`, helpers e2e (Task 1).
- Produces:
  - `CELL_SIZES = [10, 20, 50]`, `DEFAULT_CELL = 20`
  - `parseCellParam(search: string) → 10|20|50|null`
  - `gridLines(size: number, cell: number) → number[]` (posicions en píxels, ordenades, dins `[0, size]`)
  - `drawGrid(ctx, size, cell, visible: boolean, bgcolor: string)`
  - A `app.js`: objecte `prefs = { cel, quadricula }` i funció `redrawGrid()`. Task 5 hi afegeix `prefs.velocitat`; Task 7 els desa.

- [ ] **Step 1: Test unitari (falla)**

`tests/unit/grid.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCellParam, gridLines } from '../../js/grid.js';

test('parseCellParam accepta només 10, 20 i 50', () => {
  assert.equal(parseCellParam('?cel=10'), 10);
  assert.equal(parseCellParam('?cel=50'), 50);
  assert.equal(parseCellParam('?cel=15'), null);
  assert.equal(parseCellParam('?cel=abc'), null);
  assert.equal(parseCellParam(''), null);
});

test('gridLines: línies simètriques des del centre', () => {
  const lines = gridLines(600, 50);
  assert.deepEqual(lines, [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600]);
});

test('gridLines: cel·la que no divideix la meitat', () => {
  // 300 / 40 no és enter: les línies surten del centre i no passen de les vores
  const lines = gridLines(600, 40);
  assert.ok(lines.includes(300));
  assert.ok(lines.includes(340) && lines.includes(260));
  assert.ok(lines.every(p => p >= 0 && p <= 600));
});
```

Run: `npm run test:unit`
Expected: FAIL, `Cannot find module ... js/grid.js`.

- [ ] **Step 2: Implementar `js/grid.js`**

```js
// Quadrícula de mesura: cada cel·la equival a `cell` passos de tortuga.

export const CELL_SIZES = [10, 20, 50];
export const DEFAULT_CELL = 20;

export function parseCellParam(search) {
  const value = Number(new URLSearchParams(search).get('cel'));
  return CELL_SIZES.includes(value) ? value : null;
}

export function gridLines(size, cell) {
  const half = size / 2;
  const lines = [half];
  for (let d = cell; d <= half; d += cell) {
    lines.push(half - d, half + d);
  }
  return lines.sort((a, b) => a - b);
}

export function drawGrid(ctx, size, cell, visible, bgcolor) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = bgcolor;
  ctx.fillRect(0, 0, size, size);
  if (visible) {
    const half = size / 2;
    for (const p of gridLines(size, cell)) {
      const axis = p === half;
      // +0.5 perquè les línies d'1 px caiguin sobre un píxel sencer
      const q = axis ? p : p + 0.5;
      ctx.strokeStyle = axis ? '#888888' : '#cccccc';
      ctx.lineWidth = axis ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(q, 0); ctx.lineTo(q, size);
      ctx.moveTo(0, q); ctx.lineTo(size, q);
      ctx.stroke();
    }
  }
  ctx.restore();
}
```

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 3: Test e2e (falla)**

`tests/e2e/grid.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { obre, logo, pixel } from './helpers.js';

const GRIS = [204, 204, 204, 255];
const BLANC = [255, 255, 255, 255];

test('cel·la per defecte 20', async ({ page }) => {
  await obre(page);
  expect(await pixel(page, 'grid', 320, 10)).toEqual(GRIS);
  expect(await pixel(page, 'grid', 310, 10)).toEqual(BLANC);
});

test('?cel=50 dibuixa línies cada 50 passos', async ({ page }) => {
  await obre(page, '/?cel=50');
  expect(await pixel(page, 'grid', 350, 10)).toEqual(GRIS);
  expect(await pixel(page, 'grid', 320, 10)).toEqual(BLANC);
  await expect(page.locator('#cel')).toHaveValue('50');
});

test('?cel=abc s\'ignora', async ({ page }) => {
  await obre(page, '/?cel=abc');
  await expect(page.locator('#cel')).toHaveValue('20');
});

test('CS no esborra la quadrícula i el traç és transparent', async ({ page }) => {
  await obre(page);
  await logo(page, 'FD 50 CS');
  expect(await pixel(page, 'grid', 320, 10)).toEqual(GRIS);
  expect((await pixel(page, 'sandbox', 10, 10))[3]).toBe(0);
});

test('SETBG pinta el fons sota la quadrícula', async ({ page }) => {
  await obre(page);
  await logo(page, 'SETBG 0');
  expect(await pixel(page, 'grid', 310, 10)).toEqual([0, 0, 0, 255]);
});

test('selector i casella', async ({ page }) => {
  await obre(page);
  await page.selectOption('#cel', '10');
  expect(await pixel(page, 'grid', 310, 10)).toEqual(GRIS);
  await page.uncheck('#quadricula');
  expect(await pixel(page, 'grid', 310, 10)).toEqual(BLANC);
});
```

Run: `npx playwright test tests/e2e/grid.spec.js`
Expected: FAIL (el canvas `#grid` és transparent).

- [ ] **Step 4: Connectar a `js/app.js`**

Afegir l'import a dalt:

```js
import { DEFAULT_CELL, parseCellParam, drawGrid } from './grid.js';
```

Substituir:

```js
const logo = new LogoInterpreter(turtle, stream, () => {});
await logo.run('cs');
```

per:

```js
const prefs = { cel: DEFAULT_CELL, quadricula: true };
prefs.cel = parseCellParam(location.search) ?? prefs.cel;

const gridCtx = $('#grid').getContext('2d');
function redrawGrid() {
  drawGrid(gridCtx, SIZE, prefs.cel, prefs.quadricula, turtle.bgcolor);
}

// jslogo pinta el fons al canvas del traç i taparia la quadrícula:
// el traç queda transparent i el color de fons es pinta a #grid.
turtle.clear = function clear() {
  const ctx = this.canvas_ctx;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, this.width, this.height);
  ctx.restore();
  redrawGrid();
};

$('#cel').value = String(prefs.cel);
$('#quadricula').checked = prefs.quadricula;
$('#cel').addEventListener('change', e => {
  prefs.cel = Number(e.target.value);
  redrawGrid();
});
$('#quadricula').addEventListener('change', e => {
  prefs.quadricula = e.target.checked;
  redrawGrid();
});

const logo = new LogoInterpreter(turtle, stream, () => {});
await logo.run('cs');
```

Run: `npm test`
Expected: PASS (tots els unitaris i e2e).

- [ ] **Step 5: Commit**

```bash
git add js/grid.js js/app.js tests/unit/grid.test.js tests/e2e/grid.spec.js
git commit -m "feat: quadrícula de mesura configurable"
```

---

### Task 3: Tortuga dibuixada i indicador d'estat

**Files:**
- Create: `img/tortuga.svg`, `js/sprite.js`, `js/status.js`, `tests/unit/sprite.test.js`, `tests/unit/status.test.js`, `tests/e2e/tortuga.spec.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `turtle` (jslogo): camps públics `x`, `y`, `r`, `visible`, `heading`, `position`, `pendown`, `scrunch`.
- Produces:
  - `spriteTransform(turtle, size) → { x, y, angle }` (píxels del canvas i radians, sentit horari des d'amunt)
  - `startSprite(ctx, turtle, img, size)` (bucle `requestAnimationFrame`)
  - `formatStatus({ position, heading, pendown }) → string` p. ex. `'X: 0  Y: 30  Rumb: 45°  Ploma: alta'`
  - `startStatus(el, turtle)`

Nota: amb diverses tortugues (`SETTURTLE`) només es dibuixa l'actual.

- [ ] **Step 1: Tests unitaris (fallen)**

`tests/unit/sprite.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spriteTransform } from '../../js/sprite.js';

test('origen al centre, mirant amunt', () => {
  assert.deepEqual(
    spriteTransform({ x: 0, y: 0, heading: 0, scrunch: [1, 1] }, 600),
    { x: 300, y: 300, angle: 0 });
});

test('y lògica cap amunt = y de canvas cap avall', () => {
  const t = spriteTransform({ x: 100, y: 50, heading: 90, scrunch: [1, 1] }, 600);
  assert.equal(t.x, 400);
  assert.equal(t.y, 250);
  assert.equal(t.angle, Math.PI / 2);
});
```

`tests/unit/status.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatStatus } from '../../js/status.js';

test('arrodoneix i normalitza el rumb', () => {
  assert.equal(
    formatStatus({ position: [1e-15, 29.6], heading: -315, pendown: false }),
    'X: 0  Y: 30  Rumb: 45°  Ploma: alta');
});

test('ploma baixa', () => {
  assert.equal(
    formatStatus({ position: [-10, 0], heading: 360, pendown: true }),
    'X: -10  Y: 0  Rumb: 0°  Ploma: baixa');
});
```

Run: `npm run test:unit`
Expected: FAIL (mòduls inexistents).

- [ ] **Step 2: Implementar `js/sprite.js` i `js/status.js`**

`js/sprite.js`:

```js
// Dibuixa la tortuga com a imatge. jslogo dibuixa la seva en un canvas
// fora de pantalla (vegeu app.js); aquí només llegim l'estat públic.

export function spriteTransform(turtle, size) {
  const [sx, sy] = turtle.scrunch;
  return {
    x: size / 2 + turtle.x * sx,
    y: size / 2 - turtle.y * sy,
    angle: turtle.heading * Math.PI / 180,
  };
}

export function startSprite(ctx, turtle, img, size) {
  const SPRITE = 32;
  let last = '';
  function frame() {
    requestAnimationFrame(frame);
    const key = [turtle.x, turtle.y, turtle.r, turtle.visible, img.complete].join();
    if (key === last) return;
    last = key;
    ctx.clearRect(0, 0, size, size);
    if (!turtle.visible || !img.complete) return;
    const t = spriteTransform(turtle, size);
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.drawImage(img, -SPRITE / 2, -SPRITE / 2, SPRITE, SPRITE);
    ctx.restore();
  }
  frame();
}
```

`js/status.js`:

```js
export function formatStatus({ position: [x, y], heading, pendown }) {
  const rumb = ((Math.round(heading) % 360) + 360) % 360;
  const fmt = n => String(Math.round(n) || 0); // evita "-0"
  return `X: ${fmt(x)}  Y: ${fmt(y)}  Rumb: ${rumb}°  Ploma: ${pendown ? 'baixa' : 'alta'}`;
}

export function startStatus(el, turtle) {
  function frame() {
    requestAnimationFrame(frame);
    const text = formatStatus(turtle);
    if (el.textContent !== text) el.textContent = text;
  }
  frame();
}
```

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 3: `img/tortuga.svg`** (cap amunt, centrada)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -16 32 32" width="32" height="32">
  <g fill="#7a8f3a" stroke="#4a5a20" stroke-width="1">
    <ellipse cx="0" cy="-12" rx="3.5" ry="4"/>
    <ellipse cx="-9" cy="-7" rx="3" ry="2.2"/>
    <ellipse cx="9" cy="-7" rx="3" ry="2.2"/>
    <ellipse cx="-9" cy="8" rx="3" ry="2.2"/>
    <ellipse cx="9" cy="8" rx="3" ry="2.2"/>
    <path d="M0 11 L-1.5 15 L1.5 15 Z"/>
  </g>
  <ellipse cx="0" cy="0" rx="8" ry="10" fill="#b8742a" stroke="#6b3f12" stroke-width="1.2"/>
  <path d="M0 -6 L4 -2 L4 3 L0 6 L-4 3 L-4 -2 Z" fill="#d9954a" stroke="#6b3f12" stroke-width="0.8"/>
</svg>
```

- [ ] **Step 4: Test e2e (falla)**

`tests/e2e/tortuga.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { obre, logo } from './helpers.js';

const alphaCentre = page => page.evaluate(() =>
  document.getElementById('turtle').getContext('2d').getImageData(300, 300, 1, 1).data[3]);

test('la tortuga es veu al centre i HT/ST l\'amaguen i la mostren', async ({ page }) => {
  await obre(page);
  await expect.poll(() => alphaCentre(page)).toBeGreaterThan(0);
  await logo(page, 'HT');
  await expect.poll(() => alphaCentre(page)).toBe(0);
  await logo(page, 'ST');
  await expect.poll(() => alphaCentre(page)).toBeGreaterThan(0);
});

test('indicador d\'estat', async ({ page }) => {
  await obre(page);
  await logo(page, 'FD 30 RT 45 PU');
  await expect(page.locator('#estat')).toHaveText('X: 0  Y: 30  Rumb: 45°  Ploma: alta');
});
```

Run: `npx playwright test tests/e2e/tortuga.spec.js`
Expected: FAIL (`#estat` buit; al centre hi ha el triangle verd de jslogo, no la imatge — el primer test pot passar per casualitat; el segon falla).

- [ ] **Step 5: Connectar a `js/app.js`**

Imports:

```js
import { startSprite } from './sprite.js';
import { startStatus } from './status.js';
```

Substituir:

```js
const turtle = new CanvasTurtle(
  $('#sandbox').getContext('2d', { willReadFrequently: true }),
  $('#turtle').getContext('2d'),
  SIZE, SIZE, $('#tela'));
```

per:

```js
// jslogo dibuixa la seva tortuga en aquest canvas fora de pantalla;
// la visible la dibuixa sprite.js a #turtle.
const offscreen = document.createElement('canvas');
offscreen.width = offscreen.height = SIZE;

const turtle = new CanvasTurtle(
  $('#sandbox').getContext('2d', { willReadFrequently: true }),
  offscreen.getContext('2d'),
  SIZE, SIZE, $('#tela'));

const sprite = new Image();
sprite.src = 'img/tortuga.svg';
startSprite($('#turtle').getContext('2d'), turtle, sprite, SIZE);
startStatus($('#estat'), turtle);
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add img js/sprite.js js/status.js js/app.js tests/unit/sprite.test.js tests/unit/status.test.js tests/e2e/tortuga.spec.js
git commit -m "feat: tortuga dibuixada i indicador d'estat"
```

---

### Task 4: Editor, Executa, Atura, Neteja i errors

**Files:**
- Create: `js/runner.js`, `tests/unit/runner.test.js`, `tests/e2e/editor.spec.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `writeError` (Task 1), `logo` (`run`, `bye`, `forceBye`).
- Produces:
  - `createRunner(logo, { onRun(code), onStart(), onEnd(), onError(message) }) → { run(code): Promise<void>, stop(), running: boolean }`
  - A `app.js`: `editor` (CodeMirror) i `runner`; `window.logoApp.editor = editor`.
  - `onRun` és el punt on Task 6 enganxa l'historial.

- [ ] **Step 1: Test unitari (falla)**

`tests/unit/runner.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRunner } from '../../js/runner.js';

function fakeLogo() {
  return {
    forceBye: false,
    calls: [],
    async run(code) {
      this.calls.push(code);
      if (code === 'error') throw new Error('Malament');
    },
    bye() { this.forceBye = true; },
  };
}

function hooks() {
  const log = [];
  return {
    log,
    onRun: c => log.push(`run:${c}`),
    onStart: () => log.push('start'),
    onEnd: () => log.push('end'),
    onError: m => log.push(`error:${m}`),
  };
}

test('executa i notifica', async () => {
  const logo = fakeLogo(), h = hooks();
  const runner = createRunner(logo, h);
  await runner.run('FD 10');
  assert.deepEqual(h.log, ['run:FD 10', 'start', 'end']);
});

test('codi buit no fa res', async () => {
  const logo = fakeLogo(), h = hooks();
  await createRunner(logo, h).run('   \n');
  assert.deepEqual(logo.calls, []);
  assert.deepEqual(h.log, []);
});

test('error es notifica i acaba igualment', async () => {
  const h = hooks();
  await createRunner(fakeLogo(), h).run('error');
  assert.deepEqual(h.log, ['run:error', 'start', 'error:Malament', 'end']);
});

test('stop sense execució no deixa forceBye activat', () => {
  const logo = fakeLogo();
  createRunner(logo, hooks()).stop();
  assert.equal(logo.forceBye, false);
});

test('en acabar es neteja forceBye', async () => {
  const logo = fakeLogo();
  const runner = createRunner(logo, hooks());
  const p = runner.run('FD 10');
  runner.stop();
  await p;
  assert.equal(logo.forceBye, false);
  assert.equal(runner.running, false);
});
```

Run: `npm run test:unit`
Expected: FAIL (mòdul inexistent).

- [ ] **Step 2: Implementar `js/runner.js`**

```js
// Envolta logo.run amb l'estat «s'està executant» per als botons.

export function createRunner(logo, { onRun, onStart, onEnd, onError }) {
  let running = 0;

  async function run(code) {
    if (!code.trim()) return;
    onRun(code);
    running += 1;
    if (running === 1) onStart();
    try {
      await logo.run(code);
    } catch (e) {
      onError(e?.message ?? String(e));
    } finally {
      running -= 1;
      if (running === 0) {
        // jslogo deixa forceBye activat si BYE arriba quan ja acabava:
        // la següent execució s'aturaria sola.
        logo.forceBye = false;
        onEnd();
      }
    }
  }

  return {
    run,
    stop() {
      if (running) logo.bye();
    },
    get running() {
      return running > 0;
    },
  };
}
```

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 3: Test e2e (falla)**

`tests/e2e/editor.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { obre, posicio } from './helpers.js';

const posaCodi = (page, code) =>
  page.evaluate(c => window.logoApp.editor.setValue(c), code);

test('editor amb números de línia', async ({ page }) => {
  await obre(page);
  await expect(page.locator('.CodeMirror-linenumber').first()).toBeVisible();
});

test('Executa corre el programa', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'TO quadrat :c\n  REPEAT 4 [FD :c RT 90]\nEND\nquadrat 100\nFD 40');
  await page.click('#executa');
  await expect.poll(() => posicio(page)).toEqual([0, 40]);
});

test('Ctrl+Enter executa', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'FD 50');
  await page.click('.CodeMirror');
  await page.keyboard.press('Control+Enter');
  await expect.poll(() => posicio(page)).toEqual([0, 50]);
});

test('error en vermell a Sortida', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'FDD 10');
  await page.click('#executa');
  await expect(page.locator('#sortida .error')).toContainText(/FDD/i);
  await expect(page.locator('#executa')).toBeEnabled();
});

test('FOREVER + Atura; Executa desactivat mentre corre', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'FOREVER [FD 1 RT 1]');
  await page.click('#executa');
  await expect(page.locator('#executa')).toBeDisabled();
  await expect(page.locator('#atura')).toBeEnabled();
  await page.click('#atura');
  await expect(page.locator('#executa')).toBeEnabled({ timeout: 2000 });
  await expect(page.locator('#atura')).toBeDisabled();
});

test('Neteja esborra el traç i torna a l\'origen', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'FD 70');
  await page.click('#executa');
  await expect.poll(() => posicio(page)).toEqual([0, 70]);
  await page.click('#neteja');
  await expect.poll(() => posicio(page)).toEqual([0, 0]);
});
```

Run: `npx playwright test tests/e2e/editor.spec.js`
Expected: FAIL (`window.logoApp.editor` no existeix).

- [ ] **Step 4: Connectar a `js/app.js`**

Imports (substituir la línia d'`output.js` i afegir `runner.js`):

```js
import { createStream, askDialog, writeError } from './output.js';
import { createRunner } from './runner.js';
```

Inserir just abans de `window.logoApp = { logo, turtle };`:

```js
const editor = CodeMirror.fromTextArea($('#editor'), {
  mode: 'logo',
  lineNumbers: true,
  matchBrackets: true,
  autoCloseBrackets: '[]()',
  lineComment: ';',
  extraKeys: {
    'Ctrl-Enter': () => runner.run(editor.getValue()),
    'Cmd-Enter': () => runner.run(editor.getValue()),
  },
});

const runner = createRunner(logo, {
  onRun: () => {},
  onStart: () => {
    $('#executa').disabled = true;
    $('#atura').disabled = false;
  },
  onEnd: () => {
    $('#executa').disabled = false;
    $('#atura').disabled = true;
  },
  onError: message => writeError(sortida, message),
});

$('#executa').addEventListener('click', () => runner.run(editor.getValue()));
$('#atura').addEventListener('click', () => runner.stop());
$('#neteja').addEventListener('click', () => logo.run('cs'));
$('#buida-sortida').addEventListener('click', () => { sortida.textContent = ''; });
```

Substituir `window.logoApp = { logo, turtle };` per:

```js
window.logoApp = { logo, turtle, editor };
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/runner.js js/app.js tests/unit/runner.test.js tests/e2e/editor.spec.js
git commit -m "feat: editor amb Executa, Atura, Neteja i errors"
```

---

### Task 5: Velocitat

**Files:**
- Create: `js/speed.js`, `tests/unit/speed.test.js`, `tests/e2e/velocitat.spec.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `turtle.move`, `turtle.turn`, `turtle.arc` (jslogo; l'intèrpret fa `await` del resultat de cada primitiva).
- Produces:
  - `DELAYS = [0, 10, 30, 80, 200, 500]`
  - `installSpeed(turtle, getLevel: () => number, sleep?: (ms) => Promise)`
  - `prefs.velocitat` (0–5) a `app.js`.

- [ ] **Step 1: Test unitari (falla)**

`tests/unit/speed.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installSpeed, DELAYS } from '../../js/speed.js';

function fakeTurtle() {
  const t = { log: [] };
  t.move = function (d) { this.log.push(`move ${d}`); };
  t.turn = function (a) { this.log.push(`turn ${a}`); };
  t.arc = function (a, r) { this.log.push(`arc ${a} ${r}`); };
  return t;
}

test('nivell 0 no espera', async () => {
  const t = fakeTurtle(), sleeps = [];
  installSpeed(t, () => 0, async ms => sleeps.push(ms));
  await t.move(10);
  assert.deepEqual(t.log, ['move 10']);
  assert.deepEqual(sleeps, []);
});

test('cada nivell espera el temps de DELAYS', async () => {
  const t = fakeTurtle(), sleeps = [];
  let level = 3;
  installSpeed(t, () => level, async ms => sleeps.push(ms));
  await t.turn(90);
  level = 5;
  await t.arc(360, 50);
  assert.deepEqual(t.log, ['turn 90', 'arc 360 50']);
  assert.deepEqual(sleeps, [DELAYS[3], DELAYS[5]]);
});

test('manté this', async () => {
  const t = fakeTurtle();
  installSpeed(t, () => 0, async () => {});
  await t.move(5);
  assert.equal(t.log.length, 1);
});
```

Run: `npm run test:unit`
Expected: FAIL (mòdul inexistent).

- [ ] **Step 2: Implementar `js/speed.js`**

```js
// Pausa després de cada moviment perquè es vegi la tortuga caminar.

export const DELAYS = [0, 10, 30, 80, 200, 500];

const defaultSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function installSpeed(turtle, getLevel, sleep = defaultSleep) {
  for (const name of ['move', 'turn', 'arc']) {
    const original = turtle[name].bind(turtle);
    turtle[name] = async (...args) => {
      const result = original(...args);
      const ms = DELAYS[getLevel()] ?? 0;
      if (ms) await sleep(ms);
      return result;
    };
  }
}
```

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 3: Test e2e (falla)**

`tests/e2e/velocitat.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { obre, logo } from './helpers.js';

test('velocitat 5 fa que 4 moviments trigui ≥ 2 s', async ({ page }) => {
  await obre(page);
  await page.locator('#velocitat').fill('5');
  const t0 = Date.now();
  await logo(page, 'REPEAT 2 [FD 10 RT 90]');
  expect(Date.now() - t0).toBeGreaterThanOrEqual(1900);
});

test('velocitat 0 és instantània', async ({ page }) => {
  await obre(page);
  const t0 = Date.now();
  await logo(page, 'REPEAT 36 [FD 10 RT 10]');
  expect(Date.now() - t0).toBeLessThan(1000);
});
```

Run: `npx playwright test tests/e2e/velocitat.spec.js`
Expected: FAIL (primer test: massa ràpid).

- [ ] **Step 4: Connectar a `js/app.js`**

Import:

```js
import { installSpeed } from './speed.js';
```

Substituir `const prefs = { cel: DEFAULT_CELL, quadricula: true };` per:

```js
const prefs = { cel: DEFAULT_CELL, quadricula: true, velocitat: 0 };
```

Inserir just després de `startStatus($('#estat'), turtle);`:

```js
installSpeed(turtle, () => prefs.velocitat);
$('#velocitat').value = String(prefs.velocitat);
$('#velocitat').addEventListener('input', e => {
  prefs.velocitat = Number(e.target.value);
});
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/speed.js js/app.js tests/unit/speed.test.js tests/e2e/velocitat.spec.js
git commit -m "feat: control de velocitat de la tortuga"
```

---

### Task 6: Línia d'ordres, historial i pestanyes

**Files:**
- Create: `js/history.js`, `js/tabs.js`, `tests/unit/history.test.js`, `tests/e2e/ordres.spec.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `runner` amb `onRun` (Task 4), `editor`.
- Produces:
  - `MAX_HISTORY = 200`
  - `addEntry(list: {t:number, codi:string}[], code: string, time?: number) → nova llista` (no muta)
  - `createRecall() → { push(code), prev() → string, next() → string }`
  - `renderHistory(ol, entries, onPick(code))` (més recent a dalt)
  - `setupTabs(root, onShow?(name))`
  - A `app.js`: `let history = []` i `function recordHistory(code)`; Task 7 hi afegeix el desat.

- [ ] **Step 1: Test unitari (falla)**

`tests/unit/history.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addEntry, createRecall, MAX_HISTORY } from '../../js/history.js';

test('addEntry afegeix al final sense mutar', () => {
  const a = [];
  const b = addEntry(a, 'FD 10', 1000);
  assert.deepEqual(a, []);
  assert.deepEqual(b, [{ t: 1000, codi: 'FD 10' }]);
});

test('addEntry limita a MAX_HISTORY i descarta les més antigues', () => {
  let list = [];
  for (let i = 0; i < MAX_HISTORY + 5; i++) list = addEntry(list, `FD ${i}`, i);
  assert.equal(list.length, MAX_HISTORY);
  assert.equal(list[0].codi, 'FD 5');
});

test('recall recorre amunt i avall', () => {
  const r = createRecall();
  r.push('FD 10');
  r.push('RT 90');
  assert.equal(r.prev(), 'RT 90');
  assert.equal(r.prev(), 'FD 10');
  assert.equal(r.prev(), 'FD 10');   // no passa del principi
  assert.equal(r.next(), 'RT 90');
  assert.equal(r.next(), '');        // després de l'última, línia buida
});
```

Run: `npm run test:unit`
Expected: FAIL.

- [ ] **Step 2: Implementar `js/history.js` i `js/tabs.js`**

`js/history.js`:

```js
export const MAX_HISTORY = 200;

export function addEntry(list, code, time = Date.now()) {
  return [...list, { t: time, codi: code }].slice(-MAX_HISTORY);
}

// Ordres anteriors de la línia d'ordres (fletxes ↑ ↓), només de la sessió.
export function createRecall() {
  const items = [];
  let pos = 0;
  return {
    push(code) {
      items.push(code);
      pos = items.length;
    },
    prev() {
      if (pos > 0) pos -= 1;
      return items[pos] ?? '';
    },
    next() {
      if (pos < items.length) pos += 1;
      return items[pos] ?? '';
    },
  };
}

export function renderHistory(ol, entries, onPick) {
  ol.textContent = '';
  for (const { t, codi } of [...entries].reverse()) {
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.textContent = new Date(t).toLocaleTimeString('ca');
    li.append(time, codi);
    li.addEventListener('click', () => onPick(codi));
    ol.append(li);
  }
}
```

`js/tabs.js`:

```js
export function setupTabs(root, onShow = () => {}) {
  const buttons = [...root.querySelectorAll('[role="tab"]')];
  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const b of buttons) {
        const active = b === button;
        b.setAttribute('aria-selected', String(active));
        document.getElementById(`pestanya-${b.dataset.pestanya}`).hidden = !active;
      }
      onShow(button.dataset.pestanya);
    });
  }
}
```

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 3: Test e2e (falla)**

`tests/e2e/ordres.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { obre, posicio } from './helpers.js';

test('línia d\'ordres executa i recorda', async ({ page }) => {
  await obre(page);
  const ordre = page.locator('#ordre');
  await ordre.fill('FD 50');
  await ordre.press('Enter');
  await expect.poll(() => posicio(page)).toEqual([0, 50]);
  await expect(ordre).toHaveValue('');
  await ordre.press('ArrowUp');
  await expect(ordre).toHaveValue('FD 50');
});

test('historial registra execucions i les copia a l\'editor', async ({ page }) => {
  await obre(page);
  await page.locator('#ordre').fill('RT 90');
  await page.locator('#ordre').press('Enter');
  await page.click('[data-pestanya="historial"]');
  const item = page.locator('#historial li').first();
  await expect(item).toContainText('RT 90');
  await item.click();
  await page.click('[data-pestanya="editor"]');
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toBe('RT 90');
});

test('pestanyes mostren un sol panell', async ({ page }) => {
  await obre(page);
  await page.click('[data-pestanya="manual"]');
  await expect(page.locator('#pestanya-manual')).toBeVisible();
  await expect(page.locator('#pestanya-editor')).toBeHidden();
});
```

Run: `npx playwright test tests/e2e/ordres.spec.js`
Expected: FAIL.

- [ ] **Step 4: Connectar a `js/app.js`**

Imports:

```js
import { addEntry, createRecall, renderHistory } from './history.js';
import { setupTabs } from './tabs.js';
```

Inserir just abans de `const editor = CodeMirror.fromTextArea(`:

```js
let history = [];
function replaceEditor(code) {
  if (editor.getValue().trim() && !confirm("Vols substituir el contingut de l'editor?")) return false;
  editor.setValue(code);
  return true;
}
function showHistory() {
  renderHistory($('#historial'), history, replaceEditor);
}
function recordHistory(code) {
  history = addEntry(history, code);
  showHistory();
}
```

Al `createRunner`, substituir `onRun: () => {},` per:

```js
  onRun: recordHistory,
```

Inserir just abans de `window.logoApp = { logo, turtle, editor };`:

```js
const recall = createRecall();
$('#ordres').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#ordre');
  const code = input.value;
  if (!code.trim()) return;
  recall.push(code);
  input.value = '';
  runner.run(code);
});
$('#ordre').addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') { e.preventDefault(); e.target.value = recall.prev(); }
  if (e.key === 'ArrowDown') { e.preventDefault(); e.target.value = recall.next(); }
});

setupTabs($('.pestanyes'), name => {
  if (name === 'editor') editor.refresh();
});
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/history.js js/tabs.js js/app.js tests/unit/history.test.js tests/e2e/ordres.spec.js
git commit -m "feat: línia d'ordres, historial i pestanyes"
```

---

### Task 7: Persistència al navegador

**Files:**
- Create: `js/store.js`, `tests/unit/store.test.js`, `tests/e2e/persistencia.spec.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `prefs`, `redrawGrid`, `history`, `showHistory`, `editor`, `logo` (`savehook(name, def)`; `def === undefined` vol dir que s'ha esborrat amb `ERASE`/`ERALL`).
- Produces:
  - `PREFIX = 'logo-web:'`
  - `createStore(storage: Storage|null) → { get(key, fallback), set(key, value), clearAll(), available: boolean }`
  - `debounce(fn, ms) → fn`

- [ ] **Step 1: Test unitari (falla)**

`tests/unit/store.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, debounce } from '../../js/store.js';

function memoryStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    _map: m,
  };
}

test('desa i llegeix JSON amb prefix', () => {
  const s = memoryStorage();
  const store = createStore(s);
  store.set('prefs', { cel: 50 });
  assert.equal(s.getItem('logo-web:prefs'), '{"cel":50}');
  assert.deepEqual(store.get('prefs', {}), { cel: 50 });
  assert.equal(store.available, true);
});

test('valor absent o JSON trencat → fallback', () => {
  const s = memoryStorage();
  s.setItem('logo-web:editor', '{no és json');
  const store = createStore(s);
  assert.equal(store.get('editor', ''), '');
  assert.deepEqual(store.get('history', []), []);
});

test('clearAll només esborra claus pròpies', () => {
  const s = memoryStorage();
  s.setItem('altra', 'x');
  const store = createStore(s);
  store.set('editor', 'FD 10');
  store.set('history', []);
  store.clearAll();
  assert.deepEqual([...s._map.keys()], ['altra']);
});

test('storage que llança → available false, sense excepcions', () => {
  const broken = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
    key() { throw new Error('blocked'); },
    get length() { throw new Error('blocked'); },
  };
  const store = createStore(broken);
  assert.equal(store.available, false);
  assert.equal(store.get('editor', 'x'), 'x');
  store.set('editor', 'y');
  store.clearAll();
});

test('storage null → available false', () => {
  const store = createStore(null);
  assert.equal(store.available, false);
  assert.equal(store.get('a', 1), 1);
});

test('debounce crida una vegada amb l\'últim valor', async () => {
  const calls = [];
  const f = debounce(v => calls.push(v), 20);
  f(1); f(2); f(3);
  await new Promise(r => setTimeout(r, 50));
  assert.deepEqual(calls, [3]);
});
```

Run: `npm run test:unit`
Expected: FAIL.

- [ ] **Step 2: Implementar `js/store.js`**

```js
// localStorage amb prefix i sense excepcions: si el navegador el bloqueja,
// l'entorn continua funcionant (available = false).

export const PREFIX = 'logo-web:';

export function createStore(storage) {
  let available = false;
  if (storage) {
    try {
      storage.setItem(`${PREFIX}prova`, '1');
      storage.removeItem(`${PREFIX}prova`);
      available = true;
    } catch {
      available = false;
    }
  }

  return {
    get available() {
      return available;
    },
    get(key, fallback) {
      if (!available) return fallback;
      try {
        const raw = storage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      if (!available) return;
      try {
        storage.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        available = false;
      }
    },
    clearAll() {
      if (!available) return;
      try {
        const keys = [];
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (k?.startsWith(PREFIX)) keys.push(k);
        }
        keys.forEach(k => storage.removeItem(k));
      } catch {
        available = false;
      }
    },
  };
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 3: Test e2e (falla)**

`tests/e2e/persistencia.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { obre, logo, posicio } from './helpers.js';

test('procediments i editor sobreviuen a la recàrrega', async ({ page }) => {
  await obre(page);
  await page.evaluate(() => window.logoApp.editor.setValue('TO quadrat :c\nREPEAT 4 [FD :c RT 90]\nEND'));
  await page.click('#executa');
  await page.waitForTimeout(700); // desat de l'editor: 500 ms
  await page.reload();
  await page.waitForFunction(() => window.logoApp?.ready === true);
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toContain('TO quadrat');
  await logo(page, 'quadrat 50 FD 10');
  expect(await posicio(page)).toEqual([0, 10]);
});

test('preferències i historial sobreviuen a la recàrrega', async ({ page }) => {
  await obre(page);
  await page.selectOption('#cel', '50');
  await page.uncheck('#quadricula');
  await page.locator('#velocitat').fill('2');
  await page.locator('#ordre').fill('RT 30');
  await page.locator('#ordre').press('Enter');
  await page.reload();
  await page.waitForFunction(() => window.logoApp?.ready === true);
  await expect(page.locator('#cel')).toHaveValue('50');
  await expect(page.locator('#quadricula')).not.toBeChecked();
  await expect(page.locator('#velocitat')).toHaveValue('2');
  await expect(page.locator('#historial li').first()).toContainText('RT 30');
});

test('?cel de l\'enllaç té prioritat sobre la preferència', async ({ page }) => {
  await obre(page);
  await page.selectOption('#cel', '50');
  await obre(page, '/?cel=10');
  await expect(page.locator('#cel')).toHaveValue('10');
});

test('localStorage bloquejat: avís i LOGO funciona', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('bloquejat', 'SecurityError'); },
    });
  });
  await obre(page);
  await expect(page.locator('#avis-desat')).toBeVisible();
  await logo(page, 'FD 10');
  expect(await posicio(page)).toEqual([0, 10]);
});

test('un procediment desat trencat no impedeix carregar els altres', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('logo-web:procs', JSON.stringify({
      dolent: 'TO dolent\nFD [\nEND',
      bo: 'TO bo\nFD 10\nEND',
    }));
  });
  await obre(page);
  await logo(page, 'bo');
  expect(await posicio(page)).toEqual([0, 10]);
});

test('Esborra-ho tot', async ({ page }) => {
  await obre(page);
  await logo(page, 'TO salta\nFD 5\nEND');
  await page.evaluate(() => window.logoApp.editor.setValue('FD 1'));
  await page.locator('#ordre').fill('RT 1');
  await page.locator('#ordre').press('Enter');
  page.on('dialog', d => d.accept());
  await page.click('[data-pestanya="historial"]');
  await page.click('#esborra-tot');
  await expect(page.locator('#historial li')).toHaveCount(0);
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toBe('');
  await expect(logo(page, 'salta')).rejects.toThrow();
  await page.reload();
  await page.waitForFunction(() => window.logoApp?.ready === true);
  await expect(logo(page, 'salta')).rejects.toThrow();
});
```

Run: `npx playwright test tests/e2e/persistencia.spec.js`
Expected: FAIL.

- [ ] **Step 4: Connectar a `js/app.js`**

Import:

```js
import { createStore, debounce } from './store.js';
```

Inserir just després de `const $ = sel => document.querySelector(sel);`:

```js
const store = createStore((() => {
  try { return window.localStorage; } catch { return null; }
})());
$('#avis-desat').hidden = store.available;
```

Substituir:

```js
const prefs = { cel: DEFAULT_CELL, quadricula: true, velocitat: 0 };
prefs.cel = parseCellParam(location.search) ?? prefs.cel;
```

per:

```js
const prefs = { cel: DEFAULT_CELL, quadricula: true, velocitat: 0, ...store.get('prefs', {}) };
prefs.cel = parseCellParam(location.search) ?? prefs.cel;
const savePrefs = () => store.set('prefs', prefs);
```

Afegir `savePrefs();` com a última línia dins de cadascun dels tres listeners de `#cel`, `#quadricula` i `#velocitat`.

Substituir:

```js
const logo = new LogoInterpreter(turtle, stream, () => {});
await logo.run('cs');
```

per:

```js
const logo = new LogoInterpreter(turtle, stream, (name, def) => {
  const procs = store.get('procs', {});
  if (def === undefined) delete procs[name];
  else procs[name] = def;
  store.set('procs', procs);
});
await logo.run('cs');
for (const def of Object.values(store.get('procs', {}))) {
  try {
    await logo.run(def);
  } catch {
    // definició desada que ja no és vàlida: se salta
  }
}
```

Substituir `let history = [];` per:

```js
let history = store.get('history', []);
```

Dins de `recordHistory`, després de `history = addEntry(history, code);`, afegir:

```js
  store.set('history', history);
```

Inserir just després del bloc `const editor = CodeMirror.fromTextArea(...)`:

```js
editor.setValue(store.get('editor', ''));
editor.on('change', debounce(() => store.set('editor', editor.getValue()), 500));
showHistory();
```

Inserir just abans de `window.logoApp = { logo, turtle, editor };`:

```js
$('#esborra-tot').addEventListener('click', async () => {
  if (!confirm("S'esborraran l'editor, els procediments i l'historial. Vols continuar?")) return;
  store.clearAll();
  history = [];
  showHistory();
  editor.setValue('');
  await logo.run('erall cs');
  store.clearAll(); // ERALL torna a cridar el savehook
});
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/store.js js/app.js tests/unit/store.test.js tests/e2e/persistencia.spec.js
git commit -m "feat: desat automàtic al navegador"
```

---

### Task 8: Fitxers .lgo i exportació PNG

**Files:**
- Create: `js/files.js`, `tests/unit/files.test.js`, `tests/e2e/fitxers.spec.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `editor`, `replaceEditor(code) → boolean` (Task 6), `writeError` (Task 1).
- Produces:
  - `LGO_NAME = 'programa.lgo'`, `PNG_NAME = 'dibuix.png'`
  - `isProbablyText(text: string) → boolean`
  - `downloadText(filename, text)`, `downloadDataUrl(filename, url)`
  - `composePng(...canvases) → string` (data URL)

- [ ] **Step 1: Test unitari (falla)**

`tests/unit/files.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isProbablyText } from '../../js/files.js';

test('text normal amb accents és text', () => {
  assert.equal(isProbablyText('PRINT [Què tal, Núria?]\nFD 10 ; ç l·l'), true);
});

test('caràcter nul → binari', () => {
  assert.equal(isProbablyText('PNG\u0000\u0001'), false);
});

test('massa caràcters de substitució → binari', () => {
  assert.equal(isProbablyText('�'.repeat(20) + 'FD 10'), false);
});
```

Run: `npm run test:unit`
Expected: FAIL.

- [ ] **Step 2: Implementar `js/files.js`**

```js
export const LGO_NAME = 'programa.lgo';
export const PNG_NAME = 'dibuix.png';

// Un fitxer binari llegit com a UTF-8 conté NUL o molts U+FFFD.
export function isProbablyText(text) {
  if (text.includes('\u0000')) return false;
  const bad = text.split('�').length - 1;
  return bad <= text.length * 0.05;
}

export function downloadDataUrl(filename, url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
}

export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  downloadDataUrl(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function composePng(...canvases) {
  const out = document.createElement('canvas');
  out.width = canvases[0].width;
  out.height = canvases[0].height;
  const ctx = out.getContext('2d');
  for (const c of canvases) ctx.drawImage(c, 0, 0);
  return out.toDataURL('image/png');
}
```

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 3: Test e2e (falla)**

`tests/e2e/fitxers.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { obre } from './helpers.js';

const PROGRAMA = 'PRINT [Què tal, Núria?]\nFD 10 ; ç l·l';

test('Desa .lgo conserva els accents', async ({ page }) => {
  await obre(page);
  await page.evaluate(c => window.logoApp.editor.setValue(c), PROGRAMA);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#desa-lgo'),
  ]);
  expect(download.suggestedFilename()).toBe('programa.lgo');
  expect(await readFile(await download.path(), 'utf8')).toBe(PROGRAMA);
});

test('Obre .lgo carrega el text a l\'editor', async ({ page }) => {
  await obre(page);
  await page.setInputFiles('#fitxer-lgo', {
    name: 'prova.lgo', mimeType: 'text/plain', buffer: Buffer.from(PROGRAMA, 'utf8'),
  });
  await expect.poll(() => page.evaluate(() => window.logoApp.editor.getValue())).toBe(PROGRAMA);
});

test('fitxer binari: avís i l\'editor no canvia', async ({ page }) => {
  await obre(page);
  await page.evaluate(() => window.logoApp.editor.setValue('FD 1'));
  await page.setInputFiles('#fitxer-lgo', {
    name: 'imatge.lgo', mimeType: 'application/octet-stream', buffer: Buffer.from([0x89, 0x50, 0x00, 0x01]),
  });
  await expect(page.locator('#sortida .error')).toContainText("No s'ha pogut obrir");
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toBe('FD 1');
});

test('Desa PNG', async ({ page }) => {
  await obre(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#desa-png'),
  ]);
  expect(download.suggestedFilename()).toBe('dibuix.png');
  const bytes = await readFile(await download.path());
  expect([...bytes.subarray(1, 4)].map(b => String.fromCharCode(b)).join('')).toBe('PNG');
});
```

Run: `npx playwright test tests/e2e/fitxers.spec.js`
Expected: FAIL.

- [ ] **Step 4: Connectar a `js/app.js`**

Import:

```js
import { LGO_NAME, PNG_NAME, isProbablyText, downloadText, downloadDataUrl, composePng } from './files.js';
```

Inserir just abans de `window.logoApp = { logo, turtle, editor };`:

```js
$('#desa-lgo').addEventListener('click', () => downloadText(LGO_NAME, editor.getValue()));
$('#obre-lgo').addEventListener('click', () => $('#fitxer-lgo').click());
$('#fitxer-lgo').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = ''; // permet tornar a obrir el mateix fitxer
  if (!file) return;
  const text = await file.text();
  if (!isProbablyText(text)) {
    writeError(sortida, `No s'ha pogut obrir «${file.name}»: no és un fitxer de text.`);
    return;
  }
  replaceEditor(text);
});
$('#desa-png').addEventListener('click', () =>
  downloadDataUrl(PNG_NAME, composePng($('#grid'), $('#sandbox'))));
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/files.js js/app.js tests/unit/files.test.js tests/e2e/fitxers.spec.js
git commit -m "feat: desar i obrir .lgo i exportar PNG"
```

---

### Task 9: Manual en català

**Files:**
- Create: `manual/primitives.json`, `js/manual.js`, `tests/unit/manual.test.js`, `tests/e2e/manual.spec.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `replaceEditor(code)` (Task 6), `logo.routines` (jslogo `StringMap`, `has(name)`).
- Produces:
  - Format de `manual/primitives.json`: `[{ categoria, nom, abreviatures: string[], sintaxi, descripcio, exemple }]`, noms en minúscules.
  - `filterPrimitives(list, query) → list`
  - `groupByCategory(list) → Map<string, list>` (ordre d'aparició)
  - `renderManual(container, list, onTry(exemple))`

- [ ] **Step 1: Test unitari (falla)**

`tests/unit/manual.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filterPrimitives, groupByCategory } from '../../js/manual.js';

const list = JSON.parse(await readFile(new URL('../../manual/primitives.json', import.meta.url), 'utf8'));

test('cerca per nom o abreviatura, sense distingir majúscules', () => {
  assert.deepEqual(filterPrimitives(list, 'FD').map(p => p.nom), ['forward']);
  assert.ok(filterPrimitives(list, 'repe').some(p => p.nom === 'repeat'));
});

test('cerca buida retorna tot', () => {
  assert.equal(filterPrimitives(list, '  ').length, list.length);
});

test('7 categories en ordre', () => {
  assert.deepEqual([...groupByCategory(list).keys()], [
    'Moviment', 'Ploma i color', 'Control', 'Procediments i variables',
    'Paraules i llistes', 'Matemàtiques', 'Text i sortida',
  ]);
});

test('totes les entrades tenen tots els camps', () => {
  for (const p of list) {
    for (const camp of ['categoria', 'nom', 'sintaxi', 'descripcio', 'exemple']) {
      assert.ok(typeof p[camp] === 'string' && p[camp].length, `${p.nom}: falta ${camp}`);
    }
    assert.ok(Array.isArray(p.abreviatures));
  }
});
```

Run: `npm run test:unit`
Expected: FAIL.

- [ ] **Step 2: `manual/primitives.json`**

```json
[
  { "categoria": "Moviment", "nom": "forward", "abreviatures": ["fd"], "sintaxi": "FORWARD passos", "descripcio": "La tortuga avança els passos indicats en la direcció on mira.", "exemple": "FD 100" },
  { "categoria": "Moviment", "nom": "back", "abreviatures": ["bk"], "sintaxi": "BACK passos", "descripcio": "La tortuga retrocedeix sense girar-se.", "exemple": "BK 50" },
  { "categoria": "Moviment", "nom": "right", "abreviatures": ["rt"], "sintaxi": "RIGHT graus", "descripcio": "Gira a la dreta (sentit horari) els graus indicats.", "exemple": "RT 90" },
  { "categoria": "Moviment", "nom": "left", "abreviatures": ["lt"], "sintaxi": "LEFT graus", "descripcio": "Gira a l'esquerra els graus indicats.", "exemple": "LT 45" },
  { "categoria": "Moviment", "nom": "home", "abreviatures": [], "sintaxi": "HOME", "descripcio": "Torna la tortuga al centre (0, 0) mirant amunt. Si la ploma és baixa, dibuixa el camí.", "exemple": "FD 80 RT 90 FD 40 HOME" },
  { "categoria": "Moviment", "nom": "setxy", "abreviatures": [], "sintaxi": "SETXY x y", "descripcio": "Porta la tortuga a la posició (x, y) sense canviar el rumb.", "exemple": "SETXY 100 50" },
  { "categoria": "Moviment", "nom": "setheading", "abreviatures": ["seth"], "sintaxi": "SETHEADING graus", "descripcio": "Fa mirar la tortuga cap a un rumb: 0 amunt, 90 dreta, 180 avall, 270 esquerra.", "exemple": "SETH 90 FD 50" },
  { "categoria": "Moviment", "nom": "arc", "abreviatures": [], "sintaxi": "ARC graus radi", "descripcio": "Dibuixa un arc al voltant de la tortuga sense moure-la.", "exemple": "ARC 360 50" },

  { "categoria": "Ploma i color", "nom": "penup", "abreviatures": ["pu"], "sintaxi": "PENUP", "descripcio": "Aixeca la ploma: la tortuga es mou sense dibuixar.", "exemple": "PU FD 50 PD FD 50" },
  { "categoria": "Ploma i color", "nom": "pendown", "abreviatures": ["pd"], "sintaxi": "PENDOWN", "descripcio": "Abaixa la ploma: la tortuga torna a dibuixar.", "exemple": "PU FD 30 PD FD 30" },
  { "categoria": "Ploma i color", "nom": "setpencolor", "abreviatures": ["setpc"], "sintaxi": "SETPENCOLOR color", "descripcio": "Canvia el color de la ploma. Pot ser un número (0 negre, 1 blau, 2 verd, 4 vermell…) o una llista [vermell verd blau] de 0 a 255.", "exemple": "SETPC 4 FD 50 SETPC [0 128 255] FD 50" },
  { "categoria": "Ploma i color", "nom": "setpensize", "abreviatures": [], "sintaxi": "SETPENSIZE gruix", "descripcio": "Canvia el gruix de la línia.", "exemple": "SETPENSIZE 5 FD 80" },
  { "categoria": "Ploma i color", "nom": "setbackground", "abreviatures": ["setbg"], "sintaxi": "SETBACKGROUND color", "descripcio": "Canvia el color del fons i esborra el dibuix.", "exemple": "SETBG 6" },
  { "categoria": "Ploma i color", "nom": "fill", "abreviatures": [], "sintaxi": "FILL", "descripcio": "Pinta amb el color de la ploma la zona tancada on és la tortuga.", "exemple": "REPEAT 4 [FD 80 RT 90] PU RT 45 FD 20 PD SETPC 4 FILL" },
  { "categoria": "Ploma i color", "nom": "filled", "abreviatures": [], "sintaxi": "FILLED color [ordres]", "descripcio": "Executa les ordres i omple amb el color la figura que dibuixen.", "exemple": "FILLED 2 [REPEAT 3 [FD 80 RT 120]]" },
  { "categoria": "Ploma i color", "nom": "label", "abreviatures": [], "sintaxi": "LABEL text", "descripcio": "Escriu un text a la posició de la tortuga.", "exemple": "LABEL [Hola!]" },
  { "categoria": "Ploma i color", "nom": "clearscreen", "abreviatures": ["cs"], "sintaxi": "CLEARSCREEN", "descripcio": "Esborra el dibuix i torna la tortuga al centre.", "exemple": "CS" },
  { "categoria": "Ploma i color", "nom": "clean", "abreviatures": [], "sintaxi": "CLEAN", "descripcio": "Esborra el dibuix però la tortuga es queda on és.", "exemple": "FD 50 CLEAN" },
  { "categoria": "Ploma i color", "nom": "hideturtle", "abreviatures": ["ht"], "sintaxi": "HIDETURTLE", "descripcio": "Amaga la tortuga (continua dibuixant).", "exemple": "HT REPEAT 4 [FD 50 RT 90]" },
  { "categoria": "Ploma i color", "nom": "showturtle", "abreviatures": ["st"], "sintaxi": "SHOWTURTLE", "descripcio": "Torna a mostrar la tortuga.", "exemple": "ST" },

  { "categoria": "Control", "nom": "repeat", "abreviatures": [], "sintaxi": "REPEAT vegades [ordres]", "descripcio": "Repeteix les ordres el nombre de vegades indicat.", "exemple": "REPEAT 6 [FD 50 RT 60]" },
  { "categoria": "Control", "nom": "repcount", "abreviatures": [], "sintaxi": "REPCOUNT", "descripcio": "Dins d'un REPEAT, diu quina repetició és (1, 2, 3…).", "exemple": "REPEAT 10 [FD REPCOUNT * 10 RT 90]" },
  { "categoria": "Control", "nom": "forever", "abreviatures": [], "sintaxi": "FOREVER [ordres]", "descripcio": "Repeteix les ordres sense parar. Atura-ho amb el botó ■ Atura.", "exemple": "FOREVER [FD 2 RT 3]" },
  { "categoria": "Control", "nom": "if", "abreviatures": [], "sintaxi": "IF condició [ordres]", "descripcio": "Executa les ordres només si la condició és certa.", "exemple": "MAKE \"n 5\nIF :n > 3 [PRINT [És gran]]" },
  { "categoria": "Control", "nom": "ifelse", "abreviatures": [], "sintaxi": "IFELSE condició [si és cert] [si és fals]", "descripcio": "Tria entre dos grups d'ordres segons la condició.", "exemple": "IFELSE RANDOM 2 = 0 [PRINT [Cara]] [PRINT [Creu]]" },
  { "categoria": "Control", "nom": "stop", "abreviatures": [], "sintaxi": "STOP", "descripcio": "Surt del procediment actual. Útil per acabar una recursió.", "exemple": "TO espiral :c\nIF :c > 100 [STOP]\nFD :c RT 90\nespiral :c + 5\nEND\nespiral 5" },
  { "categoria": "Control", "nom": "for", "abreviatures": [], "sintaxi": "FOR [variable inici final] [ordres]", "descripcio": "Repeteix les ordres donant a la variable els valors de l'inici al final.", "exemple": "FOR [i 1 5] [PRINT :i]" },
  { "categoria": "Control", "nom": "while", "abreviatures": [], "sintaxi": "WHILE [condició] [ordres]", "descripcio": "Repeteix les ordres mentre la condició sigui certa.", "exemple": "MAKE \"n 0\nWHILE [:n < 3] [PRINT :n MAKE \"n :n + 1]" },
  { "categoria": "Control", "nom": "wait", "abreviatures": [], "sintaxi": "WAIT temps", "descripcio": "Espera un temps, en seixantenes de segon (60 = 1 segon).", "exemple": "FD 50 WAIT 60 RT 90 FD 50" },

  { "categoria": "Procediments i variables", "nom": "to", "abreviatures": [], "sintaxi": "TO nom :entrada … END", "descripcio": "Defineix un procediment nou. Acaba amb END. Les entrades porten dos punts davant.", "exemple": "TO quadrat :costat\nREPEAT 4 [FD :costat RT 90]\nEND\nquadrat 80" },
  { "categoria": "Procediments i variables", "nom": "output", "abreviatures": ["op"], "sintaxi": "OUTPUT valor", "descripcio": "Fa que el procediment torni un valor.", "exemple": "TO doble :n\nOUTPUT :n * 2\nEND\nPRINT doble 21" },
  { "categoria": "Procediments i variables", "nom": "make", "abreviatures": [], "sintaxi": "MAKE \"nom valor", "descripcio": "Desa un valor en una variable. Es llegeix amb :nom.", "exemple": "MAKE \"costat 60\nREPEAT 4 [FD :costat RT 90]" },
  { "categoria": "Procediments i variables", "nom": "local", "abreviatures": [], "sintaxi": "LOCAL \"nom", "descripcio": "Crea una variable que només existeix dins del procediment.", "exemple": "TO prova\nLOCAL \"x\nMAKE \"x 5\nPRINT :x\nEND\nprova" },
  { "categoria": "Procediments i variables", "nom": "thing", "abreviatures": [], "sintaxi": "THING \"nom", "descripcio": "Retorna el valor d'una variable (equival a :nom).", "exemple": "MAKE \"x 7\nPRINT THING \"x" },
  { "categoria": "Procediments i variables", "nom": "erase", "abreviatures": [], "sintaxi": "ERASE \"nom", "descripcio": "Esborra un procediment.", "exemple": "ERASE \"quadrat" },
  { "categoria": "Procediments i variables", "nom": "erall", "abreviatures": [], "sintaxi": "ERALL", "descripcio": "Esborra tots els procediments i variables.", "exemple": "ERALL" },

  { "categoria": "Paraules i llistes", "nom": "first", "abreviatures": [], "sintaxi": "FIRST cosa", "descripcio": "Primera lletra d'una paraula o primer element d'una llista.", "exemple": "PRINT FIRST [poma pera prèssec]" },
  { "categoria": "Paraules i llistes", "nom": "butfirst", "abreviatures": ["bf"], "sintaxi": "BUTFIRST cosa", "descripcio": "Tot menys el primer element.", "exemple": "SHOW BF [poma pera prèssec]" },
  { "categoria": "Paraules i llistes", "nom": "last", "abreviatures": [], "sintaxi": "LAST cosa", "descripcio": "Últim element.", "exemple": "PRINT LAST \"tortuga" },
  { "categoria": "Paraules i llistes", "nom": "butlast", "abreviatures": ["bl"], "sintaxi": "BUTLAST cosa", "descripcio": "Tot menys l'últim element.", "exemple": "PRINT BL \"tortuga" },
  { "categoria": "Paraules i llistes", "nom": "item", "abreviatures": [], "sintaxi": "ITEM posició cosa", "descripcio": "Element que hi ha en una posició (comença per 1).", "exemple": "PRINT ITEM 2 [vermell verd blau]" },
  { "categoria": "Paraules i llistes", "nom": "list", "abreviatures": [], "sintaxi": "LIST cosa1 cosa2", "descripcio": "Fa una llista amb les dues coses.", "exemple": "SHOW LIST \"hola [bon dia]" },
  { "categoria": "Paraules i llistes", "nom": "sentence", "abreviatures": ["se"], "sintaxi": "SENTENCE cosa1 cosa2", "descripcio": "Uneix dues coses en una sola llista.", "exemple": "SHOW SE [hola] [bon dia]" },
  { "categoria": "Paraules i llistes", "nom": "word", "abreviatures": [], "sintaxi": "WORD paraula1 paraula2", "descripcio": "Enganxa dues paraules.", "exemple": "PRINT WORD \"tor \"tuga" },
  { "categoria": "Paraules i llistes", "nom": "count", "abreviatures": [], "sintaxi": "COUNT cosa", "descripcio": "Nombre de lletres d'una paraula o d'elements d'una llista.", "exemple": "PRINT COUNT [a b c d]" },

  { "categoria": "Matemàtiques", "nom": "sum", "abreviatures": [], "sintaxi": "SUM a b", "descripcio": "Suma (igual que a + b).", "exemple": "PRINT SUM 3 4" },
  { "categoria": "Matemàtiques", "nom": "difference", "abreviatures": [], "sintaxi": "DIFFERENCE a b", "descripcio": "Resta (igual que a - b).", "exemple": "PRINT DIFFERENCE 10 4" },
  { "categoria": "Matemàtiques", "nom": "product", "abreviatures": [], "sintaxi": "PRODUCT a b", "descripcio": "Multiplicació (igual que a * b).", "exemple": "PRINT PRODUCT 6 7" },
  { "categoria": "Matemàtiques", "nom": "quotient", "abreviatures": [], "sintaxi": "QUOTIENT a b", "descripcio": "Divisió (igual que a / b).", "exemple": "PRINT QUOTIENT 360 8" },
  { "categoria": "Matemàtiques", "nom": "random", "abreviatures": [], "sintaxi": "RANDOM n", "descripcio": "Nombre a l'atzar entre 0 i n - 1.", "exemple": "REPEAT 10 [FD RANDOM 50 RT RANDOM 360]" },
  { "categoria": "Matemàtiques", "nom": "sqrt", "abreviatures": [], "sintaxi": "SQRT n", "descripcio": "Arrel quadrada.", "exemple": "PRINT SQRT 81" },
  { "categoria": "Matemàtiques", "nom": "power", "abreviatures": [], "sintaxi": "POWER base exponent", "descripcio": "Potència.", "exemple": "PRINT POWER 2 10" },
  { "categoria": "Matemàtiques", "nom": "round", "abreviatures": [], "sintaxi": "ROUND n", "descripcio": "Arrodoneix a l'enter més proper.", "exemple": "PRINT ROUND 2.6" },

  { "categoria": "Text i sortida", "nom": "print", "abreviatures": ["pr"], "sintaxi": "PRINT cosa", "descripcio": "Escriu a la Sortida i salta de línia. Les llistes surten sense claudàtors.", "exemple": "PRINT [Hola, món!]" },
  { "categoria": "Text i sortida", "nom": "show", "abreviatures": [], "sintaxi": "SHOW cosa", "descripcio": "Com PRINT, però les llistes surten amb claudàtors.", "exemple": "SHOW [1 2 3]" },
  { "categoria": "Text i sortida", "nom": "type", "abreviatures": [], "sintaxi": "TYPE cosa", "descripcio": "Escriu sense saltar de línia.", "exemple": "TYPE \"Hola TYPE \"| | PRINT \"món" },
  { "categoria": "Text i sortida", "nom": "readword", "abreviatures": [], "sintaxi": "READWORD", "descripcio": "Demana a l'usuari que escrigui una paraula.", "exemple": "MAKE \"nom READWORD\nPRINT SE [Hola] :nom" },
  { "categoria": "Text i sortida", "nom": "readlist", "abreviatures": [], "sintaxi": "READLIST", "descripcio": "Demana a l'usuari una frase i la retorna com a llista.", "exemple": "SHOW READLIST" }
]
```

- [ ] **Step 3: Implementar `js/manual.js`**

```js
export function filterPrimitives(list, query) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(p => [p.nom, ...p.abreviatures].some(n => n.includes(q)));
}

export function groupByCategory(list) {
  const groups = new Map();
  for (const p of list) {
    if (!groups.has(p.categoria)) groups.set(p.categoria, []);
    groups.get(p.categoria).push(p);
  }
  return groups;
}

export function renderManual(container, list, onTry) {
  container.textContent = '';
  for (const [categoria, items] of groupByCategory(list)) {
    const section = document.createElement('section');
    section.className = 'manual-cat';
    const h3 = document.createElement('h3');
    h3.textContent = categoria;
    section.append(h3);
    for (const p of items) {
      const div = document.createElement('div');
      div.className = 'primitiva';
      const code = document.createElement('code');
      code.textContent = [p.nom, ...p.abreviatures].map(n => n.toUpperCase()).join(' · ');
      const sintaxi = document.createElement('div');
      sintaxi.textContent = p.sintaxi;
      const desc = document.createElement('p');
      desc.textContent = p.descripcio;
      const pre = document.createElement('pre');
      pre.textContent = p.exemple;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Prova-ho';
      button.addEventListener('click', () => onTry(p.exemple));
      div.append(code, sintaxi, desc, pre, button);
      section.append(div);
    }
    container.append(section);
  }
}
```

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 4: Test e2e (falla)**

`tests/e2e/manual.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { obre } from './helpers.js';

const list = JSON.parse(await readFile(new URL('../../manual/primitives.json', import.meta.url), 'utf8'));

test('totes les primitives del manual existeixen a jslogo', async ({ page }) => {
  await obre(page);
  const noms = list.flatMap(p => [p.nom, ...p.abreviatures]);
  const absents = await page.evaluate(
    ns => ns.filter(n => !window.logoApp.logo.routines.has(n)), noms);
  expect(absents).toEqual([]);
});

test('manual es mostra, filtra i Prova-ho copia a l\'editor', async ({ page }) => {
  await obre(page);
  await page.click('[data-pestanya="manual"]');
  await expect(page.locator('.manual-cat')).toHaveCount(7);
  await page.fill('#cerca-manual', 'fd');
  await expect(page.locator('.primitiva')).toHaveCount(1);
  await page.locator('.primitiva button').click();
  await expect(page.locator('#pestanya-editor')).toBeVisible();
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toBe('FD 100');
});
```

Run: `npx playwright test tests/e2e/manual.spec.js`
Expected: FAIL (`.manual-cat` no existeix). Si el primer test llista primitives absents, corregir `primitives.json` (no `vendor/`).

- [ ] **Step 5: Connectar a `js/app.js`**

Import:

```js
import { filterPrimitives, renderManual } from './manual.js';
```

Inserir just abans de `window.logoApp = { logo, turtle, editor };`:

```js
function tryExample(code) {
  if (!replaceEditor(code)) return;
  $('[data-pestanya="editor"]').click();
}

try {
  const primitives = await (await fetch('manual/primitives.json')).json();
  const showManual = () => renderManual($('#manual'), filterPrimitives(primitives, $('#cerca-manual').value), tryExample);
  $('#cerca-manual').addEventListener('input', showManual);
  showManual();
} catch {
  $('#manual').textContent = "No s'ha pogut carregar el manual.";
}
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add manual js/manual.js js/app.js tests/unit/manual.test.js tests/e2e/manual.spec.js
git commit -m "feat: manual de primitives en català"
```

---

### Task 10: Pantalles estretes i publicació

**Files:**
- Create: `tests/e2e/responsive.spec.js`, `README.md`
- Modify: `css/app.css` (només si el test falla)

**Interfaces:**
- Consumes: tota la pàgina.
- Produces: `README.md` amb instruccions per al docent.

- [ ] **Step 1: Test e2e**

`tests/e2e/responsive.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { obre } from './helpers.js';

for (const width of [375, 768]) {
  test(`amplada ${width}px: una columna i sense scroll horitzontal`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await obre(page);
    const noScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth);
    expect(noScroll).toBe(true);
    const tela = await page.locator('#tela').boundingBox();
    const panells = await page.locator('.panells').boundingBox();
    expect(panells.y).toBeGreaterThanOrEqual(tela.y + tela.height);
  });
}

test('escriptori: dues columnes', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await obre(page);
  const tela = await page.locator('.tela-panell').boundingBox();
  const panells = await page.locator('.panells').boundingBox();
  expect(panells.x).toBeGreaterThan(tela.x + tela.width - 1);
});
```

Run: `npx playwright test tests/e2e/responsive.spec.js`
Expected: PASS amb el CSS de Task 1. Si falla per scroll horitzontal a 375 px, l'element culpable és normalment `.barra` o `.estat`: afegir a `css/app.css`:

```css
@media (max-width: 899px) {
  .estat { white-space: normal; }
  .barra label { white-space: nowrap; }
}
```

i tornar a executar fins que passi.

- [ ] **Step 2: `README.md`**

```markdown
# LOGO a l'aula

Entorn web per programar en LOGO (primitives UCBLogo en anglès, interfície en català).
Basat en [jslogo](https://github.com/inexorabletash/jslogo) de Joshua Bell (Apache 2.0).

## Per a l'alumnat

Obre l'enllaç que t'ha donat el docent. La feina es desa sola en aquest navegador;
per endur-te-la a un altre ordinador, fes servir **💾 Desa .lgo** i **📂 Obre .lgo**.

## Per al docent

### Enllaç amb mida de quadrícula

Afegeix `?cel=10`, `?cel=20` o `?cel=50` a l'enllaç perquè cada cel·la valgui
aquests passos. Exemple: `https://USUARI.github.io/REPO/?cel=10`

### Publicar a GitHub Pages

1. Crea un repositori a GitHub i puja-hi aquesta carpeta (`git push`).
2. Al repositori: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branca `main`, carpeta `/ (root)`.
3. En un o dos minuts l'entorn és a `https://USUARI.github.io/REPO/`.

### Provar en local

```bash
npm install
npx playwright install chromium
npm start        # http://localhost:8123
npm test         # proves unitàries i de navegador
```

### Actualitzar jslogo

Torna a copiar `logo.js`, `turtle.js`, `floodfill.js` i `cm/` del repositori de jslogo
a `vendor/jslogo/`, actualitza el commit a `NOTICE` i executa `npm test`.
```

- [ ] **Step 3: Verificació completa**

Run: `npm test`
Expected: PASS de totes les proves unitàries i e2e.

Comprovació manual: `npm start`, obrir `http://localhost:8123` a Chrome i Firefox; executar l'exemple de cada categoria del Manual amb «Prova-ho».

- [ ] **Step 4: Commit**

```bash
git add README.md tests/e2e/responsive.spec.js css/app.css
git commit -m "docs: README i proves de pantalla estreta"
```
