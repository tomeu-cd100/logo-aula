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
