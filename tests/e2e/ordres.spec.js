import { test, expect } from '@playwright/test';
import { obre, posicio } from './helpers.js';

test('línia d\'ordres executa i recorda', async ({ page }) => {
  await obre(page);
  const ordre = page.locator('#ordre');
  await ordre.fill('FD 50');
  await ordre.press('Enter');
  await expect.poll(() => posicio(page)).toEqual([0, 50]);
  await expect(ordre).toHaveValue('');
  await ordre.press('ArrowUp');
  await expect(ordre).toHaveValue('FD 50');
});

test('historial registra execucions i les copia a l\'editor', async ({ page }) => {
  await obre(page);
  await page.locator('#ordre').fill('RT 90');
  await page.locator('#ordre').press('Enter');
  await page.click('[data-pestanya="historial"]');
  const item = page.locator('#historial li').first();
  await expect(item).toContainText('RT 90');
  await item.click();
  await page.click('[data-pestanya="editor"]');
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toBe('RT 90');
});

test('pestanyes mostren un sol panell', async ({ page }) => {
  await obre(page);
  await page.click('[data-pestanya="manual"]');
  await expect(page.locator('#pestanya-manual')).toBeVisible();
  await expect(page.locator('#pestanya-editor')).toBeHidden();
});
