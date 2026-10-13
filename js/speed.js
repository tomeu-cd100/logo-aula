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
