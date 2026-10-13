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
