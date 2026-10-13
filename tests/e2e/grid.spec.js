import { test, expect } from '@playwright/test';
import { obre, logo, pixel } from './helpers.js';

const GRIS = [204, 204, 204, 255];
const BLANC = [255, 255, 255, 255];

test('cel·la per defecte 20', async ({ page }) => {
  await obre(page);
  expect(await pixel(page, 'grid', 320, 10)).toEqual(GRIS);
  expect(await pixel(page, 'grid', 310, 10)).toEqual(BLANC);
});

test('?cel=50 dibuixa línies cada 50 passos', async ({ page }) => {
  await obre(page, '/?cel=50');
  expect(await pixel(page, 'grid', 350, 10)).toEqual(GRIS);
  expect(await pixel(page, 'grid', 320, 10)).toEqual(BLANC);
  await expect(page.locator('#cel')).toHaveValue('50');
});

test('?cel=abc s\'ignora', async ({ page }) => {
  await obre(page, '/?cel=abc');
  await expect(page.locator('#cel')).toHaveValue('20');
});

test('CS no esborra la quadrícula i el traç és transparent', async ({ page }) => {
  await obre(page);
  await logo(page, 'FD 50 CS');
  expect(await pixel(page, 'grid', 320, 10)).toEqual(GRIS);
  expect((await pixel(page, 'sandbox', 10, 10))[3]).toBe(0);
});

test('SETBG pinta el fons sota la quadrícula', async ({ page }) => {
  await obre(page);
  await logo(page, 'SETBG 0');
  expect(await pixel(page, 'grid', 310, 10)).toEqual([0, 0, 0, 255]);
});

test('selector i casella', async ({ page }) => {
  await obre(page);
  await page.selectOption('#cel', '10');
  expect(await pixel(page, 'grid', 310, 10)).toEqual(GRIS);
  await page.uncheck('#quadricula');
  expect(await pixel(page, 'grid', 310, 10)).toEqual(BLANC);
});
