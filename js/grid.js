// Quadrícula de mesura: cada cel·la equival a `cell` passos de tortuga.

export const CELL_SIZES = [10, 20, 50];
export const DEFAULT_CELL = 20;

export function parseCellParam(search) {
  const value = Number(new URLSearchParams(search).get('cel'));
  return CELL_SIZES.includes(value) ? value : null;
}

export function gridLines(size, cell) {
  const half = size / 2;
  const lines = [half];
  for (let d = cell; d <= half; d += cell) {
    lines.push(half - d, half + d);
  }
  return lines.sort((a, b) => a - b);
}

export function drawGrid(ctx, size, cell, visible, bgcolor) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = bgcolor;
  ctx.fillRect(0, 0, size, size);
  if (visible) {
    const half = size / 2;
    for (const p of gridLines(size, cell)) {
      const axis = p === half;
      // +0.5 perquè les línies d'1 px caiguin sobre un píxel sencer
      const q = axis ? p : p + 0.5;
      ctx.strokeStyle = axis ? '#888888' : '#cccccc';
      ctx.lineWidth = axis ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(q, 0); ctx.lineTo(q, size);
      ctx.moveTo(0, q); ctx.lineTo(size, q);
      ctx.stroke();
    }
  }
  ctx.restore();
}
