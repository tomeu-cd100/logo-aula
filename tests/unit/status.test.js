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
