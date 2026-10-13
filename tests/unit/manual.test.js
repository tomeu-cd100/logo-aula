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
