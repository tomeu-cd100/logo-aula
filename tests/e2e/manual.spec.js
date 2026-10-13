import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { obre } from './helpers.js';

const list = JSON.parse(await readFile(new URL('../../manual/primitives.json', import.meta.url), 'utf8'));

test('totes les primitives del manual existeixen a jslogo', async ({ page }) => {
  await obre(page);
  const noms = list.flatMap(p => [p.nom, ...p.abreviatures]);
  const absents = await page.evaluate(
    ns => ns.filter(n => !window.logoApp.logo.routines.has(n)), noms);
  expect(absents).toEqual([]);
});

test('manual es mostra, filtra i Prova-ho copia a l\'editor', async ({ page }) => {
  await obre(page);
  await page.click('[data-pestanya="manual"]');
  await expect(page.locator('.manual-cat')).toHaveCount(7);
  await page.fill('#cerca-manual', 'fd');
  await expect(page.locator('.primitiva')).toHaveCount(1);
  await page.locator('.primitiva button').click();
  await expect(page.locator('#pestanya-editor')).toBeVisible();
  expect(await page.evaluate(() => window.logoApp.editor.getValue())).toBe('FD 100');
});

test('tots els exemples del manual s\'executen sense error', async ({ page }) => {
  await obre(page);
  // READWORD/READLIST esperen el teclat; FOREVER no acaba; ERASE necessita un procediment.
  const substitut = { forever: 'REPEAT 50 [FD 2 RT 3]', erase: 'TO quadrat\nEND\nERASE "quadrat' };
  const errors = [];
  for (const p of list) {
    if (p.nom === 'readword' || p.nom === 'readlist') continue;
    const err = await page.evaluate(async c => {
      try { await window.logoApp.logo.run(`cs ${c}`); return null; } catch (e) { return e.message; }
    }, substitut[p.nom] ?? p.exemple);
    if (err) errors.push(`${p.nom}: ${err}`);
  }
  expect(errors).toEqual([]);
});
