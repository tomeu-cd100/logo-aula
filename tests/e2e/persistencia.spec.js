import { test, expect } from '@playwright/test';
import { obre, logo, posicio } from './helpers.js';

test('procediments i editor sobreviuen a la recàrrega', async ({ page }) => {
  await obre(page);
  await page.evaluate(() => window.logoApp.editor.setValue('TO quadrat :c\nREPEAT 4 [FD :c RT 90]\nEND'));
  await page.click('#executa');
  await page.waitForTimeout(700); // desat de l'editor: 500 ms
  await page.reload();
  await page.waitForFunction(() => window.logoApp?.ready === true);
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toContain('TO quadrat');
  await logo(page, 'quadrat 50 FD 10');
  expect(await posicio(page)).toEqual([0, 10]);
});

test('preferències i historial sobreviuen a la recàrrega', async ({ page }) => {
  await obre(page);
  await page.selectOption('#cel', '50');
  await page.uncheck('#quadricula');
  await page.locator('#velocitat').fill('2');
  await page.locator('#ordre').fill('RT 30');
  await page.locator('#ordre').press('Enter');
  await page.reload();
  await page.waitForFunction(() => window.logoApp?.ready === true);
  await expect(page.locator('#cel')).toHaveValue('50');
  await expect(page.locator('#quadricula')).not.toBeChecked();
  await expect(page.locator('#velocitat')).toHaveValue('2');
  await expect(page.locator('#historial li').first()).toContainText('RT 30');
});

test('?cel de l\'enllaç té prioritat sobre la preferència', async ({ page }) => {
  await obre(page);
  await page.selectOption('#cel', '50');
  await obre(page, '/?cel=10');
  await expect(page.locator('#cel')).toHaveValue('10');
});

test('localStorage bloquejat: avís i LOGO funciona', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('bloquejat', 'SecurityError'); },
    });
  });
  await obre(page);
  await expect(page.locator('#avis-desat')).toBeVisible();
  await logo(page, 'FD 10');
  expect(await posicio(page)).toEqual([0, 10]);
});

test('un procediment desat trencat no impedeix carregar els altres', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('logo-web:procs', JSON.stringify({
      dolent: 'TO dolent\nFD [\nEND',
      bo: 'TO bo\nFD 10\nEND',
    }));
  });
  await obre(page);
  await logo(page, 'bo');
  expect(await posicio(page)).toEqual([0, 10]);
});

test('Esborra-ho tot', async ({ page }) => {
  await obre(page);
  await logo(page, 'TO salta\nFD 5\nEND');
  await page.evaluate(() => window.logoApp.editor.setValue('FD 1'));
  await page.locator('#ordre').fill('RT 1');
  await page.locator('#ordre').press('Enter');
  page.on('dialog', d => d.accept());
  await page.click('[data-pestanya="historial"]');
  await page.click('#esborra-tot');
  await expect(page.locator('#historial li')).toHaveCount(0);
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toBe('');
  await expect(logo(page, 'salta')).rejects.toThrow();
  await page.reload();
  await page.waitForFunction(() => window.logoApp?.ready === true);
  await expect(logo(page, 'salta')).rejects.toThrow();
});
