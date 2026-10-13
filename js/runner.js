// Envolta logo.run amb l'estat «s'està executant» per als botons.

export function createRunner(logo, { onRun, onStart, onEnd, onError }) {
  let running = 0;
  let idleWaiters = [];

  async function run(code) {
    if (!code.trim()) return;
    onRun(code);
    running += 1;
    if (running === 1) onStart();
    try {
      await logo.run(code);
    } catch (e) {
      onError(e?.message ?? String(e));
    } finally {
      running -= 1;
      if (running === 0) {
        // jslogo deixa forceBye activat si BYE arriba quan ja acabava:
        // la següent execució s'aturaria sola.
        logo.forceBye = false;
        onEnd();
        idleWaiters.forEach(resolve => resolve());
        idleWaiters = [];
      }
    }
  }

  return {
    run,
    stop() {
      if (running) logo.bye();
    },
    // Es resol quan no queda cap execució en marxa (p. ex. després de stop).
    whenIdle() {
      return running ? new Promise(resolve => idleWaiters.push(resolve)) : Promise.resolve();
    },
    get running() {
      return running > 0;
    },
  };
}
