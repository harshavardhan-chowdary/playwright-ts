import { test, expect } from '@playwright/test';

/**
 * @requirement REQ-003
 */
test('User can login 03', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('input[name="username"]', 'user');
  await page.fill('input[name="password"]', 'pass');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('https://example.com/dashboard');
});

/**
 * @requirement REQ-004
 */
test('User can login 04', async ({ page }) => {
    await page.goto('https://example.com/login');
    await page.fill('input[name="username"]', 'user');
    await page.fill('input[name="password"]', 'pass');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('https://example.com/dashboard');
  });