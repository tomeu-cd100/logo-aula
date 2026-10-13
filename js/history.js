export const MAX_HISTORY = 200;

export function addEntry(list, code, time = Date.now()) {
  return [...list, { t: time, codi: code }].slice(-MAX_HISTORY);
}

// Ordres anteriors de la línia d'ordres (fletxes ↑ ↓), només de la sessió.
export function createRecall() {
  const items = [];
  let pos = 0;
  return {
    push(code) {
      items.push(code);
      pos = items.length;
    },
    prev() {
      if (pos > 0) pos -= 1;
      return items[pos] ?? '';
    },
    next() {
      if (pos < items.length) pos += 1;
      return items[pos] ?? '';
    },
  };
}

export function renderHistory(ol, entries, onPick) {
  ol.textContent = '';
  for (const { t, codi } of [...entries].reverse()) {
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.textContent = new Date(t).toLocaleTimeString('ca');
    li.append(time, codi);
    li.addEventListener('click', () => onPick(codi));
    ol.append(li);
  }
}
