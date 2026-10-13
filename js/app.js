import { createStream, askDialog } from './output.js';
import { DEFAULT_CELL, parseCellParam, drawGrid } from './grid.js';

const SIZE = 600;
const $ = sel => document.querySelector(sel);

const sortida = $('#sortida');
const stream = createStream(sortida, askDialog);

const turtle = new CanvasTurtle(
  $('#sandbox').getContext('2d', { willReadFrequently: true }),
  $('#turtle').getContext('2d'),
  SIZE, SIZE, $('#tela'));

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

window.logoApp = { logo, turtle };
window.logoApp.ready = true;
