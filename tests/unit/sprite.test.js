import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spriteTransform } from '../../js/sprite.js';

test('origen al centre, mirant amunt', () => {
  assert.deepEqual(
    spriteTransform({ x: 0, y: 0, heading: 0, scrunch: [1, 1] }, 600),
    { x: 300, y: 300, angle: 0 });
});

test('y lògica cap amunt = y de canvas cap avall', () => {
  const t = spriteTransform({ x: 100, y: 50, heading: 90, scrunch: [1, 1] }, 600);
  assert.equal(t.x, 400);
  assert.equal(t.y, 250);
  assert.equal(t.angle, Math.PI / 2);
});
