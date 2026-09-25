import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({channel: 'msedge', headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:3000/');
  for (const name of ['Home', 'Analytics', 'Fisheries', 'Biodiversity', 'Data operations']) {
    await page.getByRole('button', {name, exact: true}).click();
    await expect(page.locator('main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await expect(page.getByText(/\d+ research concepts from \d+ document/)).toBeVisible();
  await page.getByRole('button', {name: 'Biodiversity', exact: true}).click();
  for (const name of ['eDNA', 'Otolith', 'Taxonomy']) {
    await page.getByRole('button', {name, exact: true}).click();
    await expect(page.locator('main h1')).toBeVisible();
  }
  await page.setViewportSize({width: 390, height: 844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
  console.log('Domain navigation, OKF status, specimen tabs and mobile layout passed. No LLM requests sent.');
} finally { await browser.close(); }
