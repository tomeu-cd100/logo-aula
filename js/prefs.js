// Preferències desades, validades: un valor no vàlid torna al valor per defecte.

import { CELL_SIZES, DEFAULT_CELL, parseCellParam } from './grid.js';
import { DELAYS } from './speed.js';

export function loadPrefs(saved, search) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const prefs = {
    cel: CELL_SIZES.includes(s.cel) ? s.cel : DEFAULT_CELL,
    quadricula: typeof s.quadricula === 'boolean' ? s.quadricula : true,
    velocitat: Number.isInteger(s.velocitat) && s.velocitat >= 0 && s.velocitat < DELAYS.length
      ? s.velocitat : 0,
  };
  prefs.cel = parseCellParam(search) ?? prefs.cel;
  return prefs;
}
