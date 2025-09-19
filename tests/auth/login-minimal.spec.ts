import { test, expect } from '@playwright/test';

test.describe('Minimal Authentication Debug', () => {
  test('debug login flow step by step', async ({ page }) => {
    console.log('🔍 Starting minimal login debug...');

    // Step 1: Navigate to homepage
    console.log('Step 1: Navigate to homepage');
    await page.goto('https://insaflu.insa.pt/');
    await page.waitForLoadState('networkidle');
    console.log('Homepage URL:', page.url());

    // Step 2: Find and click login
    console.log('Step 2: Find login link');
    const loginLink = page.locator('a[href="/accounts/login/"].nav-link');
    const loginVisible = await loginLink.isVisible();
    console.log('Login link visible:', loginVisible);

    if (loginVisible) {
      await loginLink.click();
      await page.waitForLoadState('networkidle');
      console.log('Login page URL:', page.url());
    } else {
      throw new Error('Login link not found');
    }

    // Step 3: Check form elements
    console.log('Step 3: Check form elements');
    const usernameField = page.locator('#id_username');
    const passwordField = page.locator('#id_password');
    const submitButton = page.locator('#submit-id-login');

    const usernameVisible = await usernameField.isVisible();
    const passwordVisible = await passwordField.isVisible();
    const submitVisible = await submitButton.isVisible();

    console.log('Form elements:', { usernameVisible, passwordVisible, submitVisible });

    expect(usernameVisible).toBeTruthy();
    expect(passwordVisible).toBeTruthy();
    expect(submitVisible).toBeTruthy();

    // Step 4: Fill credentials
    console.log('Step 4: Fill credentials');
    const username = process.env.INSAFLU_USERNAME;
    const password = process.env.INSAFLU_PASSWORD;

    if (!username || !password) {
      throw new Error('Missing credentials in environment variables');
    }

    await usernameField.fill(username);
    await passwordField.fill(password);
    console.log('Credentials filled for user:', username);

    // Step 5: Submit and observe
    console.log('Step 5: Submit form');
    await submitButton.click();

    // Wait a bit to see what happens
    await page.waitForTimeout(3000);

    const urlAfterSubmit = page.url();
    console.log('URL after submit:', urlAfterSubmit);

    // Check if we're still on login page
    const stillOnLogin = urlAfterSubmit.includes('/accounts/login/');
    console.log('Still on login page:', stillOnLogin);

    if (stillOnLogin) {
      // Look for error messages
      const errorSelectors = ['.errorlist', '.alert-danger', '.field-error'];
      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector);
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log(`Error found (${selector}):`, errorText);
        }
      }
    } else {
      // Check for success indicators
      console.log('Checking for success indicators...');

      await page.waitForLoadState('networkidle');

      const userDropdown = page.locator('#id_user_name');
      const userDropdownVisible = await userDropdown.isVisible();
      console.log('User dropdown visible:', userDropdownVisible);

      if (userDropdownVisible) {
        console.log('✅ Login appears successful - user dropdown found');
      } else {
        console.log('❌ Login success unclear - no user dropdown');

        // Check for other indicators
        const samplesLink = page.locator('text=Samples');
        const projectsLink = page.locator('text=Projects');

        const samplesVisible = await samplesLink.isVisible();
        const projectsVisible = await projectsLink.isVisible();

        console.log('Navigation links:', { samplesVisible, projectsVisible });
      }
    }

    // Final validation
    expect(stillOnLogin).toBeFalsy(); // Should not be on login page if successful

    // Also verify we have authentication indicators
    const userDropdown = page.locator('#id_user_name');
    const hasUserDropdown = await userDropdown.isVisible();

    if (!hasUserDropdown) {
      // Check for fallback indicators
      const samplesLink = page.locator('text=Samples');
      const projectsLink = page.locator('text=Projects');
      const hasSamples = await samplesLink.isVisible();
      const hasProjects = await projectsLink.isVisible();

      expect(hasSamples || hasProjects).toBeTruthy();
    }
  });
});