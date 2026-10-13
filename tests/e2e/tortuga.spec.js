import { test, expect } from '@playwright/test';
import { obre, logo } from './helpers.js';

const alphaCentre = page => page.evaluate(() =>
  document.getElementById('turtle').getContext('2d').getImageData(300, 300, 1, 1).data[3]);

test('la tortuga es veu al centre i HT/ST l\'amaguen i la mostren', async ({ page }) => {
  await obre(page);
  await expect.poll(() => alphaCentre(page)).toBeGreaterThan(0);
  await logo(page, 'HT');
  await expect.poll(() => alphaCentre(page)).toBe(0);
  await logo(page, 'ST');
  await expect.poll(() => alphaCentre(page)).toBeGreaterThan(0);
});

test('indicador d\'estat', async ({ page }) => {
  await obre(page);
  await logo(page, 'FD 30 RT 45 PU');
  await expect(page.locator('#estat')).toHaveText('X: 0  Y: 30  Rumb: 45°  Ploma: alta');
});
