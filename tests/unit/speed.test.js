import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installSpeed, installRoutineSpeed, DELAYS } from '../../js/speed.js';

function fakeTurtle() {
  const t = { log: [] };
  t.move = function (d) { this.log.push(`move ${d}`); };
  t.turn = function (a) { this.log.push(`turn ${a}`); };
  t.arc = function (a, r) { this.log.push(`arc ${a} ${r}`); };
  return t;
}

test('nivell 0 no espera', async () => {
  const t = fakeTurtle(), sleeps = [];
  installSpeed(t, () => 0, async ms => sleeps.push(ms));
  await t.move(10);
  assert.deepEqual(t.log, ['move 10']);
  assert.deepEqual(sleeps, []);
});

test('cada nivell espera el temps de DELAYS', async () => {
  const t = fakeTurtle(), sleeps = [];
  let level = 3;
  installSpeed(t, () => level, async ms => sleeps.push(ms));
  await t.turn(90);
  level = 5;
  await t.arc(360, 50);
  assert.deepEqual(t.log, ['turn 90', 'arc 360 50']);
  assert.deepEqual(sleeps, [DELAYS[3], DELAYS[5]]);
});

test('manté this', async () => {
  const t = fakeTurtle();
  installSpeed(t, () => 0, async () => {});
  await t.move(5);
  assert.equal(t.log.length, 1);
});

test('installRoutineSpeed: espera després de la rutina i conserva les propietats', async () => {
  const log = [], sleeps = [];
  const setxy = function (x, y) { log.push(`setxy ${x} ${y}`); };
  setxy.minimum = setxy.default = setxy.maximum = 2;
  setxy.primitive = true;
  const routines = new Map([['setxy', setxy]]);
  installRoutineSpeed(routines, ['setxy', 'absent'], () => 4, async ms => sleeps.push(ms));
  const wrapped = routines.get('setxy');
  assert.equal(wrapped.minimum, 2);
  assert.equal(wrapped.default, 2);
  assert.equal(wrapped.primitive, true);
  await wrapped(10, 20);
  assert.deepEqual(log, ['setxy 10 20']);
  assert.deepEqual(sleeps, [DELAYS[4]]);
  assert.equal(routines.has('absent'), false);
});
