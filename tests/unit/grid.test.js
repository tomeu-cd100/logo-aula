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
