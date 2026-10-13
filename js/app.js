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
