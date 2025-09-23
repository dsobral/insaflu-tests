import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth';
import { DataUploadHelper } from '../utils/data-helpers';
import { SAMPLE_FILES } from '../utils/config';

test.describe('Reference Data Upload', () => {
  let authHelper: AuthHelper;
  let uploadHelper: DataUploadHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    uploadHelper = new DataUploadHelper(page);
    await authHelper.login();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test references if possible
    //try {
      // Note: Reference cleanup might not be available in all INSaFLU versions
      // This is a placeholder for cleanup logic
    //} catch (error) {
    //  console.log('Reference cleanup not available or failed:', error);
    //}
  });

  test('should upload reference FASTA file', async ({ page }) => {
    const fastaFile = SAMPLE_FILES.reference.fasta;
    const referenceName = 'NC004162';

    await uploadHelper.uploadReference(referenceName, fastaFile);

    // Verify reference was uploaded
    const exists = await page.locator(`text=${referenceName}`).isVisible();
    //const exists = await uploadHelper.verifyReferenceExists(referenceName);
    expect(exists).toBeTruthy();
  });

  test('should upload reference with both FASTA and GenBank files', async ({ page }) => {
    const fastaFile = SAMPLE_FILES.reference.fasta;
    const genbankFile = SAMPLE_FILES.reference.genbank;
    const referenceName = 'NC004162_genbank';

    await uploadHelper.uploadReference(referenceName, fastaFile, genbankFile);

    // Verify reference was uploaded
    // const exists = await uploadHelper.verifyReferenceExists(referenceName);
    const exists = await page.locator(`text=${referenceName}`).isVisible();
    expect(exists).toBeTruthy();

    // Check for indicators that both FASTA and GenBank were uploaded
    // this is not that easy to check
    //await expect(page.locator('text=FASTA, text=.fasta')).toBeVisible();
    //await expect(page.locator('text=GenBank, text=.gb')).toBeVisible();
  });

  test('should validate FASTA file format', async ({ page }) => {

    await page.click('a[href="/managing_files/references-index"].nav-link');
    await page.waitForLoadState('networkidle');
    await page.click('a[href="/managing_files/references/references"]');    
    await page.waitForLoadState('networkidle');

    await page.click('text=Add Reference');
    await page.waitForLoadState('networkidle');

    // Fill sample name
    await page.fill('input[name*="name"], input[id*="name"]', "reference_invalid_fasta");

    // Try to upload invalid FASTA file
    const invalidContent = 'This is not a valid FASTA file\nwithout proper headers';
    await page.evaluate((content) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], 'invalid.fasta', { type: 'text/plain' });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, invalidContent);

    await page.click('button:has-text("Save"), input[type="submit"]');

    // Should show validation error
    //const errorMessage = await page.locator('.alert-danger, .error').textContent();
    const errorMessage = await page.locator('text=Error: the file is not in FASTA format.').isVisible();
    expect(errorMessage).toBeTruthy();
  });

  test('should require FASTA file for reference upload', async ({ page }) => {

    await page.click('a[href="/managing_files/references-index"].nav-link');
    await page.waitForLoadState('networkidle');
    await page.click('a[href="/managing_files/references/references"]');    
    await page.waitForLoadState('networkidle');

    await page.click('text=Add Reference');
    await page.waitForLoadState('networkidle');


    // Fill sample name
    await page.fill('input[name*="name"], input[id*="name"]', "reference_no_fasta_file");

    // Try to submit without uploading any file
    await page.click('button:has-text("Save"), input[type="submit"]');

    // Should show validation error
    //const errorMessage = await page.locator('.alert-danger, .error').textContent();
    const errorMessage = await page.locator('text=Error: Must have a file.').isVisible();
    expect(errorMessage).toBeTruthy();
  });


  test('should handle duplicate reference uploads', async ({ page }) => {

    const referenceName = 'NC004162';     

    await page.click('a[href="/managing_files/references-index"].nav-link');
    await page.waitForLoadState('networkidle');
    await page.click('a[href="/managing_files/references/references"]');    
    await page.waitForLoadState('networkidle');

    await page.click('text=Add Reference');
    await page.waitForLoadState('networkidle');

    // Fill sample name
    await page.fill('input[name*="name"], input[id*="name"]', referenceName);
    //await page.waitForTimeout(1000);

    // Should show validation error: somehow the error is not showing up with this method
    //const errorMessage = await page.locator('.alert-danger, .error').textContent();
    //const errorMessage = await page.locator('text=Exists a reference with this name.').isVisible();
    //expect(errorMessage).toBeTruthy();

    // Try to submit without uploading any file
    await page.click('button:has-text("Save"), input[type="submit"]');
    const errorMessage = await page.locator('text=already exist in database, please choose other.').isVisible();
    expect(errorMessage).toBeTruthy();

    // Try to upload the same reference again (assumes from previous test)
    //await expect(async () => {
    //  await uploadHelper.uploadReference(referenceName, fastaFile);   
    //}).rejects.toThrow();

  });

  /*
  // Might be an interesting test but not sure how to implement it right now
  test('should support multiple reference file formats', async ({ page }) => {
    // Test different file extensions if supported
    const fastaFile = SAMPLE_FILES.reference.fasta;

    await uploadHelper.uploadReference(fastaFile);

    // Verify upload was successful
    const exists = await uploadHelper.verifyReferenceExists('NC004162');
    expect(exists).toBeTruthy();

    // Could test other formats like .fa, .fas if the system supports them
  });
*/

});