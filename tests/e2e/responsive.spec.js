import { test, expect } from '@playwright/test';
import { obre } from './helpers.js';

for (const width of [375, 768]) {
  test(`amplada ${width}px: una columna i sense scroll horitzontal`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await obre(page);
    const noScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth);
    expect(noScroll).toBe(true);
    const tela = await page.locator('#tela').boundingBox();
    const panells = await page.locator('.panells').boundingBox();
    expect(panells.y).toBeGreaterThanOrEqual(tela.y + tela.height);
  });
}

test('escriptori: dues columnes', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await obre(page);
  const tela = await page.locator('.tela-panell').boundingBox();
  const panells = await page.locator('.panells').boundingBox();
  expect(panells.x).toBeGreaterThan(tela.x + tela.width - 1);
});
