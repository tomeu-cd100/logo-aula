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
