import { test, expect } from '@playwright/test';
import { obre, logo } from './helpers.js';

test('velocitat 5 fa que 4 moviments trigui ≥ 2 s', async ({ page }) => {
  await obre(page);
  await page.locator('#velocitat').fill('5');
  const t0 = Date.now();
  await logo(page, 'REPEAT 2 [FD 10 RT 90]');
  expect(Date.now() - t0).toBeGreaterThanOrEqual(1900);
});

test('velocitat 0 és instantània', async ({ page }) => {
  await obre(page);
  const t0 = Date.now();
  await logo(page, 'REPEAT 36 [FD 10 RT 10]');
  expect(Date.now() - t0).toBeLessThan(1000);
});

test('la velocitat també frena SETXY, SETX, SETPOS i HOME', async ({ page }) => {
  await obre(page);
  await page.locator('#velocitat').fill('5');
  const t0 = Date.now();
  await logo(page, 'SETXY 10 10 SETX 20 SETPOS [30 30] HOME');
  expect(Date.now() - t0).toBeGreaterThanOrEqual(1900);
});
