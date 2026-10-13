import { test, expect } from '@playwright/test';
import { obre, logo, pixel, posicio, rumb } from './helpers.js';

test('quadrat: la tortuga torna a l\'origen i deixa traç', async ({ page }) => {
  await obre(page);
  await logo(page, 'REPEAT 4 [FD 100 RT 90]');
  expect(await posicio(page)).toEqual([0, 0]);
  expect(await rumb(page)).toBe(0);
  const [, , , alpha] = await pixel(page, 'sandbox', 300, 250);
  expect(alpha).toBeGreaterThan(0);
});

test('PRINT escriu a Sortida', async ({ page }) => {
  await obre(page);
  await logo(page, 'PRINT 2 + 3');
  await expect(page.locator('#sortida')).toHaveText('5\n');
});
