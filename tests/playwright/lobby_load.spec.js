// @ts-check
const { test, expect } = require('@playwright/test');

test('index.html loads without fatal error screen', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#fatal-error-screen')).toHaveCount(0);
    await expect(page.locator('#app')).toBeVisible({ timeout: 15_000 });
});
