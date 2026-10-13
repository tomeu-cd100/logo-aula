import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRunner } from '../../js/runner.js';

function fakeLogo() {
  return {
    forceBye: false,
    calls: [],
    async run(code) {
      this.calls.push(code);
      if (code === 'error') throw new Error('Malament');
    },
    bye() { this.forceBye = true; },
  };
}

function hooks() {
  const log = [];
  return {
    log,
    onRun: c => log.push(`run:${c}`),
    onStart: () => log.push('start'),
    onEnd: () => log.push('end'),
    onError: m => log.push(`error:${m}`),
  };
}

test('executa i notifica', async () => {
  const logo = fakeLogo(), h = hooks();
  const runner = createRunner(logo, h);
  await runner.run('FD 10');
  assert.deepEqual(h.log, ['run:FD 10', 'start', 'end']);
});

test('codi buit no fa res', async () => {
  const logo = fakeLogo(), h = hooks();
  await createRunner(logo, h).run('   \n');
  assert.deepEqual(logo.calls, []);
  assert.deepEqual(h.log, []);
});

test('error es notifica i acaba igualment', async () => {
  const h = hooks();
  await createRunner(fakeLogo(), h).run('error');
  assert.deepEqual(h.log, ['run:error', 'start', 'error:Malament', 'end']);
});

test('stop sense execució no deixa forceBye activat', () => {
  const logo = fakeLogo();
  createRunner(logo, hooks()).stop();
  assert.equal(logo.forceBye, false);
});

test('en acabar es neteja forceBye', async () => {
  const logo = fakeLogo();
  const runner = createRunner(logo, hooks());
  const p = runner.run('FD 10');
  runner.stop();
  await p;
  assert.equal(logo.forceBye, false);
  assert.equal(runner.running, false);
});

test('whenIdle es resol quan acaba l\'execució', async () => {
  let release;
  const logo = fakeLogo();
  logo.run = () => new Promise(r => { release = r; });
  const runner = createRunner(logo, hooks());
  runner.run('FOREVER [FD 1]');
  let idle = false;
  const p = runner.whenIdle().then(() => { idle = true; });
  await new Promise(r => setTimeout(r, 10));
  assert.equal(idle, false);
  release();
  await p;
  assert.equal(idle, true);
});

test('whenIdle sense execució es resol de seguida', async () => {
  await createRunner(fakeLogo(), hooks()).whenIdle();
});
