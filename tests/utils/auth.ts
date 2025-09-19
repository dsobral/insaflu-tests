import { Page, expect } from '@playwright/test';
import { CONFIG } from './config';

export class AuthHelper {
  constructor(private page: Page) {}

  async login(username?: string, password?: string) {
    const user = username || CONFIG.username;
    const pass = password || CONFIG.password;

    if (!user || !pass) {
      throw new Error('Username and password are required. Check your .env file.');
    }

    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');

    // Check if already logged in by looking for logout button
    if (await this.isLoggedIn()) {
      console.log('Already logged in, logging out first');
      await this.logout();
    }

    // Navigate to login page - use the main navigation login link
    await this.page.click('a[href="/accounts/login/"].nav-link');
    await this.page.waitForLoadState('networkidle');

    // Verify we're on the login page
    await expect(this.page).toHaveURL(/.*\/accounts\/login\/.*/);

    // Fill login form using correct selectors
    await this.page.fill('#id_username', user);
    await this.page.fill('#id_password', pass);

    // Submit login form
    await this.page.click('#submit-id-login');

    // Wait for response
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle');

    // Check if login was successful
    const currentUrl = this.page.url();
    const stillOnLoginPage = currentUrl.includes('/accounts/login/');

    if (stillOnLoginPage) {
      // Check for specific error messages
      const errorMessages = await this.getErrorMessages();
      if (errorMessages.length > 0) {
        throw new Error(`Login failed with errors: ${errorMessages.join(', ')}`);
      } else {
        throw new Error('Login failed - still on login page with no visible errors');
      }
    }

    // Verify successful login by checking for authenticated elements
    const loginSuccess = await this.waitForLoginSuccess();
    if (!loginSuccess) {
      throw new Error('Login appeared to redirect but authentication verification failed');
    }

    console.log('Successfully logged in');
  }

  private async waitForLoginSuccess(timeout = 10000): Promise<boolean> {
    try {
      // Wait for any of these success indicators
      await Promise.race([
        this.page.waitForSelector('#id_user_name', { timeout }), // User dropdown
        this.page.waitForSelector('text=Samples', { timeout }),
        this.page.waitForSelector('text=Projects', { timeout }),
        this.page.waitForSelector('text=Dashboard', { timeout })
      ]);
      return true;
    } catch {
      return false;
    }
  }

  private async getErrorMessages(): Promise<string[]> {
    const errorSelectors = [
      '.errorlist',
      '.alert-danger',
      '.field-error',
      '.form-error',
      '[class*="error"]'
    ];

    const errors: string[] = [];

    for (const selector of errorSelectors) {
      try {
        const elements = await this.page.locator(selector).all();
        for (const element of elements) {
          const text = await element.textContent();
          if (text && text.trim()) {
            errors.push(text.trim());
          }
        }
      } catch {
        // Ignore selector errors
      }
    }

    return errors;
  }

  async logout() {
    try {
      // First click the user dropdown to open the logout modal
      const userDropdown = this.page.locator('#id_user_name');
      if (await userDropdown.isVisible()) {
        await userDropdown.click();
        await this.page.waitForTimeout(1000); // Wait for modal to appear

        // Then click the actual logout button
        const logoutButton = this.page.locator('a[href="/accounts/logout/"]');
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
          await this.page.waitForLoadState('networkidle');
          console.log('Successfully logged out');
        }
      }
    } catch (error) {
      console.log('Logout failed:', error.message);
    }
  }

  async ensureLoggedIn() {
    if (!(await this.isLoggedIn())) {
      await this.login();
    }
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      // Check for the user dropdown with the username, which indicates logged in state
      const userDropdown = this.page.locator('#id_user_name');
      if (await userDropdown.isVisible()) {
        return true;
      }

      // Fallback: check for other authentication indicators
      const authIndicators = [
        this.page.locator('text=Samples'),
        this.page.locator('text=Projects'),
        this.page.locator('text=Dashboard')
      ];

      for (const indicator of authIndicators) {
        if (await indicator.isVisible()) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }
}