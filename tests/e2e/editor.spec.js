import { test, expect } from '@playwright/test';
import { obre, posicio } from './helpers.js';

const posaCodi = (page, code) =>
  page.evaluate(c => window.logoApp.editor.setValue(c), code);

test('editor amb números de línia', async ({ page }) => {
  await obre(page);
  await expect(page.locator('.CodeMirror-linenumber').first()).toBeVisible();
});

test('Executa corre el programa', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'TO quadrat :c\n  REPEAT 4 [FD :c RT 90]\nEND\nquadrat 100\nFD 40');
  await page.click('#executa');
  await expect.poll(() => posicio(page)).toEqual([0, 40]);
});

test('Ctrl+Enter executa', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'FD 50');
  await page.click('.CodeMirror');
  await page.keyboard.press('Control+Enter');
  await expect.poll(() => posicio(page)).toEqual([0, 50]);
});

test('error en vermell a Sortida', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'FDD 10');
  await page.click('#executa');
  await expect(page.locator('#sortida .error')).toContainText(/FDD/i);
  await expect(page.locator('#executa')).toBeEnabled();
});

test('FOREVER + Atura; Executa desactivat mentre corre', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'FOREVER [FD 1 RT 1]');
  await page.click('#executa');
  await expect(page.locator('#executa')).toBeDisabled();
  await expect(page.locator('#atura')).toBeEnabled();
  await page.click('#atura');
  await expect(page.locator('#executa')).toBeEnabled({ timeout: 2000 });
  await expect(page.locator('#atura')).toBeDisabled();
});

test('Neteja esborra el traç i torna a l\'origen', async ({ page }) => {
  await obre(page);
  await posaCodi(page, 'FD 70');
  await page.click('#executa');
  await expect.poll(() => posicio(page)).toEqual([0, 70]);
  await page.click('#neteja');
  await expect.poll(() => posicio(page)).toEqual([0, 0]);
});
