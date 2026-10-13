import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { obre } from './helpers.js';

const PROGRAMA = 'PRINT [Què tal, Núria?]\nFD 10 ; ç l·l';

test('Desa .lgo conserva els accents', async ({ page }) => {
  await obre(page);
  await page.evaluate(c => window.logoApp.editor.setValue(c), PROGRAMA);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#desa-lgo'),
  ]);
  expect(download.suggestedFilename()).toBe('programa.lgo');
  expect(await readFile(await download.path(), 'utf8')).toBe(PROGRAMA);
});

test('Obre .lgo carrega el text a l\'editor', async ({ page }) => {
  await obre(page);
  await page.setInputFiles('#fitxer-lgo', {
    name: 'prova.lgo', mimeType: 'text/plain', buffer: Buffer.from(PROGRAMA, 'utf8'),
  });
  await expect.poll(() => page.evaluate(() => window.logoApp.editor.getValue())).toBe(PROGRAMA);
});

test('fitxer binari: avís i l\'editor no canvia', async ({ page }) => {
  await obre(page);
  await page.evaluate(() => window.logoApp.editor.setValue('FD 1'));
  await page.setInputFiles('#fitxer-lgo', {
    name: 'imatge.lgo', mimeType: 'application/octet-stream', buffer: Buffer.from([0x89, 0x50, 0x00, 0x01]),
  });
  await expect(page.locator('#sortida .error')).toContainText("No s'ha pogut obrir");
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toBe('FD 1');
});

test('Desa PNG', async ({ page }) => {
  await obre(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#desa-png'),
  ]);
  expect(download.suggestedFilename()).toBe('dibuix.png');
  const bytes = await readFile(await download.path());
  expect([...bytes.subarray(1, 4)].map(b => String.fromCharCode(b)).join('')).toBe('PNG');
});
