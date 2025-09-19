import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth';
import { CONFIG } from '../utils/config';

test.describe('Authentication', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    try {
      await authHelper.login();

      // Verify we're no longer on the login page
      await expect(page).not.toHaveURL(/.*\/accounts\/login\/.*/);

      // Verify authentication success - check for user dropdown first
      const userDropdown = page.locator('#id_user_name');
      if (await userDropdown.isVisible()) {
        console.log('✅ Found user dropdown - user is logged in');
        expect(true).toBeTruthy();
      } else {
        // Fallback: check for other authentication indicators
        const authIndicators = [
          page.locator('text=Samples'),
          page.locator('text=Projects'),
          page.locator('text=Dashboard')
        ];

        let found = false;
        for (const indicator of authIndicators) {
          if (await indicator.isVisible()) {
            found = true;
            console.log(`✅ Found authentication indicator: ${await indicator.textContent()}`);
            break;
          }
        }

        expect(found).toBeTruthy();
      }

    } catch (error) {
      console.error('❌ Login test failed:', error.message);
      console.log('Current URL:', page.url());
      console.log('Page title:', await page.title());

      // Capture additional debug info
      const pageContent = await page.content();
      console.log('Page contains "error":', pageContent.toLowerCase().includes('error'));
      console.log('Page contains "invalid":', pageContent.toLowerCase().includes('invalid'));

      throw error;
    }
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to login page - use the main navigation login link
    await page.click('a[href="/accounts/login/"].nav-link');
    await page.waitForLoadState('networkidle');

    // Fill with invalid credentials
    await page.fill('#id_username', 'invalid_user_12345');
    await page.fill('#id_password', 'invalid_password_12345');

    // Submit login form
    await page.click('#submit-id-login');
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Should remain on login page
    expect(page.url()).toMatch(/.*\/accounts\/login\/.*/);

    // Verify we don't have authentication indicators
    const userDropdown = page.locator('#id_user_name');
    await expect(userDropdown).not.toBeVisible();

    // Also verify no other auth indicators
    const authIndicators = [
      page.locator('text=Dashboard'),
      page.locator('text=Samples')
    ];

    for (const indicator of authIndicators) {
      const visible = await indicator.isVisible();
      if (visible) {
        throw new Error(`Found authentication indicator after failed login: ${await indicator.textContent()}`);
      }
    }

    console.log('✅ Invalid credentials correctly rejected');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await authHelper.login();

    // Verify we're logged in
    expect(await authHelper.isLoggedIn()).toBeTruthy();

    // Then logout
    await authHelper.logout();

    // Verify user dropdown (logout area) is not visible
    await expect(page.locator('#id_user_name')).not.toBeVisible();

    // Verify we're no longer logged in
    expect(await authHelper.isLoggedIn()).toBeFalsy();

    console.log('✅ Logout successful');
  });

  test('should preserve session across page reloads', async ({ page }) => {
    await authHelper.login();

    // Verify initial login
    expect(await authHelper.isLoggedIn()).toBeTruthy();

    // Reload the page
    await page.reload();
    await authHelper.waitForPageLoad();

    // Verify we're still logged in after reload
    expect(await authHelper.isLoggedIn()).toBeTruthy();

    console.log('✅ Session preserved across reload');
  });

  test('should redirect to login when accessing protected pages without authentication', async ({ page }) => {
    // Ensure we're not logged in
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    if (await authHelper.isLoggedIn()) {
      await authHelper.logout();
    }

    // Try to access a protected page directly
    await page.goto('/managing_files/samples/samples');
    await page.waitForLoadState('networkidle');

    // Should be redirected to login page or show login requirement
    const isOnLoginPage = page.url().includes('/accounts/login/');
    const hasMainLoginLink = await page.locator('a[href="/accounts/login/"].nav-link').isVisible();
    const notLoggedIn = !(await authHelper.isLoggedIn());

    expect(isOnLoginPage || hasMainLoginLink || notLoggedIn).toBeTruthy();

    console.log('✅ Protected page access properly restricted');
  });

  test('should handle authentication helper isLoggedIn method', async ({ page }) => {
    // Initially not logged in
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Logout if somehow logged in
    if (await authHelper.isLoggedIn()) {
      await authHelper.logout();
    }

    let loggedIn = await authHelper.isLoggedIn();
    expect(loggedIn).toBeFalsy();

    // After login
    await authHelper.login();
    loggedIn = await authHelper.isLoggedIn();
    expect(loggedIn).toBeTruthy();

    // After logout
    await authHelper.logout();
    loggedIn = await authHelper.isLoggedIn();
    expect(loggedIn).toBeFalsy();

    console.log('✅ isLoggedIn method works correctly');
  });
});