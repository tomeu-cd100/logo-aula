// Dibuixa la tortuga com a imatge. jslogo dibuixa la seva en un canvas
// fora de pantalla (vegeu app.js); aquí només llegim l'estat públic.

export function spriteTransform(turtle, size) {
  const [sx, sy] = turtle.scrunch;
  return {
    x: size / 2 + turtle.x * sx,
    y: size / 2 - turtle.y * sy,
    angle: turtle.heading * Math.PI / 180,
  };
}

export function startSprite(ctx, turtle, img, size) {
  const SPRITE = 32;
  let last = '';
  function frame() {
    requestAnimationFrame(frame);
    const key = [turtle.x, turtle.y, turtle.r, turtle.visible, img.complete].join();
    if (key === last) return;
    last = key;
    ctx.clearRect(0, 0, size, size);
    if (!turtle.visible || !img.complete) return;
    const t = spriteTransform(turtle, size);
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.drawImage(img, -SPRITE / 2, -SPRITE / 2, SPRITE, SPRITE);
    ctx.restore();
  }
  frame();
}
