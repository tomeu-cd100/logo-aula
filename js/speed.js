// Pausa després de cada moviment perquè es vegi la tortuga caminar.

export const DELAYS = [0, 10, 30, 80, 200, 500];

const defaultSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function installSpeed(turtle, getLevel, sleep = defaultSleep) {
  for (const name of ['move', 'turn', 'arc']) {
    const original = turtle[name].bind(turtle);
    turtle[name] = async (...args) => {
      const result = original(...args);
      const ms = DELAYS[getLevel()] ?? 0;
      if (ms) await sleep(ms);
      return result;
    };
  }
}

// SETXY, SETPOS, HOME… mouen la tortuga amb un setter, que no es pot esperar:
// s'embolcalla la rutina de l'intèrpret, que sí que s'espera (logo.routines).
export function installRoutineSpeed(routines, names, getLevel, sleep = defaultSleep) {
  for (const name of names) {
    const original = routines.get(name);
    if (!original) continue;
    const wrapped = async function (...args) {
      const result = await original.apply(this, args);
      const ms = DELAYS[getLevel()] ?? 0;
      if (ms) await sleep(ms);
      return result;
    };
    // minimum/default/maximum/primitive: l'intèrpret els llegeix per comptar entrades.
    routines.set(name, Object.assign(wrapped, original));
  }
}
