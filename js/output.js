// Sortida de text de l'intèrpret (PRINT, SHOW, TYPE) i lectura de teclat.

export function createStream(el, ask) {
  return {
    read: prompt => ask(prompt),
    async write(...parts) {
      el.append(...parts.map(String));
      el.scrollTop = el.scrollHeight;
    },
    async clear() {
      el.textContent = '';
    },
    async readback() {
      return el.textContent;
    },
    // jslogo hi escriu (SETTEXTSIZE, etc.); no tenen efecte visual aquí.
    textsize: 14,
    font: 'monospace',
    color: 'black',
  };
}

export function writeError(el, message) {
  const span = document.createElement('span');
  span.className = 'error';
  span.textContent = `${message}\n`;
  el.append(span);
  el.scrollTop = el.scrollHeight;
}

export function askDialog(prompt) {
  const dialog = document.getElementById('lectura');
  const input = dialog.querySelector('input');
  dialog.querySelector('p').textContent = prompt || 'Escriu:';
  input.value = '';
  dialog.returnValue = '';
  return new Promise(resolve => {
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'ok' ? input.value : '');
    }, { once: true });
    dialog.showModal();
    input.focus();
  });
}
