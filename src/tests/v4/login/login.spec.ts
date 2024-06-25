import { test, expect } from '@playwright/test';

/**
 * @requirement REQ-001
 */
test('User can login with valid credentials Test',{tag:['@Smaoke','@UI' ]} ,async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('input[name="username"]', 'user');
  await page.fill('input[name="password"]', 'pass');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('https://example.com/dashboard');
});

/**
 * @requirement REQ-001
 */
test('User can login with Invalid credentials Test',{tag:['@UI']}, async ({ page }) => {
    await page.goto('https://example.com/login');
    await page.fill('input[name="username"]', 'user');
    await page.fill('input[name="password"]', 'pass');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('https://example.com/dashboard');
  });

  // node rtm/generateRTM.js --root='src/tests/v4' --reqfile='rtm/req.json' --key='REQ-'
