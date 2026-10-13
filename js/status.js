export function formatStatus({ position: [x, y], heading, pendown }) {
  const rumb = ((Math.round(heading) % 360) + 360) % 360;
  const fmt = n => String(Math.round(n) || 0); // evita "-0"
  return `X: ${fmt(x)}  Y: ${fmt(y)}  Rumb: ${rumb}°  Ploma: ${pendown ? 'baixa' : 'alta'}`;
}

export function startStatus(el, turtle) {
  function frame() {
    requestAnimationFrame(frame);
    const text = formatStatus(turtle);
    if (el.textContent !== text) el.textContent = text;
  }
  frame();
}
