import { createStream, askDialog, writeError } from './output.js';
import { createRunner } from './runner.js';
import { startSprite } from './sprite.js';
import { startStatus } from './status.js';
import { installSpeed } from './speed.js';
import { addEntry, createRecall, renderHistory } from './history.js';
import { setupTabs } from './tabs.js';
import { createStore, debounce } from './store.js';
import { LGO_NAME, PNG_NAME, isProbablyText, downloadText, downloadDataUrl, composePng } from './files.js';
import { DEFAULT_CELL, parseCellParam, drawGrid } from './grid.js';

const SIZE = 600;
const $ = sel => document.querySelector(sel);

const store = createStore((() => {
  try { return window.localStorage; } catch { return null; }
})());
$('#avis-desat').hidden = store.available;

const sortida = $('#sortida');
const stream = createStream(sortida, askDialog);

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

const prefs = { cel: DEFAULT_CELL, quadricula: true, velocitat: 0, ...store.get('prefs', {}) };
prefs.cel = parseCellParam(location.search) ?? prefs.cel;
const savePrefs = () => store.set('prefs', prefs);

installSpeed(turtle, () => prefs.velocitat);
$('#velocitat').value = String(prefs.velocitat);
$('#velocitat').addEventListener('input', e => {
  prefs.velocitat = Number(e.target.value);
  savePrefs();
});

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
  savePrefs();
});
$('#quadricula').addEventListener('change', e => {
  prefs.quadricula = e.target.checked;
  redrawGrid();
  savePrefs();
});

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

let history = store.get('history', []);
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
  store.set('history', history);
  showHistory();
}

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
editor.setValue(store.get('editor', ''));
editor.on('change', debounce(() => store.set('editor', editor.getValue()), 500));
showHistory();

const runner = createRunner(logo, {
  onRun: recordHistory,
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

$('#esborra-tot').addEventListener('click', async () => {
  if (!confirm("S'esborraran l'editor, els procediments i l'historial. Vols continuar?")) return;
  store.clearAll();
  history = [];
  showHistory();
  editor.setValue('');
  await logo.run('erall cs');
  store.clearAll(); // ERALL torna a cridar el savehook
});

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

window.logoApp = { logo, turtle, editor };
window.logoApp.ready = true;
