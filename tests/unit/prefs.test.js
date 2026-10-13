import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPrefs } from '../../js/prefs.js';

test('sense res desat: valors per defecte', () => {
  assert.deepEqual(loadPrefs(undefined, ''), { cel: 20, quadricula: true, velocitat: 0 });
});

test('valors desats vàlids es conserven', () => {
  assert.deepEqual(loadPrefs({ cel: 50, quadricula: false, velocitat: 3 }, ''),
    { cel: 50, quadricula: false, velocitat: 3 });
});

test('valors desats no vàlids tornen al valor per defecte', () => {
  assert.deepEqual(loadPrefs({ cel: 15, quadricula: 'sí', velocitat: 9, altre: 1 }, ''),
    { cel: 20, quadricula: true, velocitat: 0 });
  assert.deepEqual(loadPrefs({ velocitat: 2.5 }, '').velocitat, 0);
  assert.deepEqual(loadPrefs('trencat', ''), { cel: 20, quadricula: true, velocitat: 0 });
});

test('?cel vàlid té prioritat sobre el desat', () => {
  assert.equal(loadPrefs({ cel: 50 }, '?cel=10').cel, 10);
  assert.equal(loadPrefs({ cel: 50 }, '?cel=15').cel, 50);
});
