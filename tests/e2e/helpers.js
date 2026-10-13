export async function obre(page, url = '/') {
  await page.goto(url);
  await page.waitForFunction(() => window.logoApp?.ready === true);
}

export const logo = (page, code) =>
  page.evaluate(c => window.logoApp.logo.run(c), code);

export const pixel = (page, id, x, y) =>
  page.evaluate(([id, x, y]) =>
    [...document.getElementById(id).getContext('2d').getImageData(x, y, 1, 1).data], [id, x, y]);

export const posicio = page =>
  page.evaluate(() => window.logoApp.turtle.position.map(n => Math.round(n) || 0));

export const rumb = page =>
  page.evaluate(() => Math.round(((window.logoApp.turtle.heading % 360) + 360) % 360));
