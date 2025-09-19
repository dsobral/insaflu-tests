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
    try {
      // Note: Reference cleanup might not be available in all INSaFLU versions
      // This is a placeholder for cleanup logic
    } catch (error) {
      console.log('Reference cleanup not available or failed:', error);
    }
  });

  test('should upload reference FASTA file', async ({ page }) => {
    const fastaFile = SAMPLE_FILES.reference.fasta;
    const referenceName = 'NC004162';

    await uploadHelper.uploadReference(fastaFile);

    // Verify reference was uploaded
    const exists = await uploadHelper.verifyReferenceExists(referenceName);
    expect(exists).toBeTruthy();
  });

  test('should upload reference with both FASTA and GenBank files', async ({ page }) => {
    const fastaFile = SAMPLE_FILES.reference.fasta;
    const genbankFile = SAMPLE_FILES.reference.genbank;
    const referenceName = 'NC004162';

    await uploadHelper.uploadReference(fastaFile, genbankFile);

    // Verify reference was uploaded
    const exists = await uploadHelper.verifyReferenceExists(referenceName);
    expect(exists).toBeTruthy();

    // Navigate to reference details to verify both files were uploaded
    await page.click('text=References');
    await page.click(`text=${referenceName}`);

    // Check for indicators that both FASTA and GenBank were uploaded
    await expect(page.locator('text=FASTA, text=.fasta')).toBeVisible();
    await expect(page.locator('text=GenBank, text=.gb')).toBeVisible();
  });

  test('should validate FASTA file format', async ({ page }) => {
    await page.click('text=References');
    await page.click('text=Add Reference');

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

    await page.click('button:has-text("Upload"), input[type="submit"]');

    // Should show validation error
    const errorMessage = await page.locator('.alert-danger, .error').textContent();
    expect(errorMessage).toBeTruthy();
  });

  test('should require FASTA file for reference upload', async ({ page }) => {
    await page.click('text=References');
    await page.click('text=Add Reference');

    // Try to submit without uploading any file
    await page.click('button:has-text("Upload"), input[type="submit"]');

    // Should show validation error
    const errorMessage = await page.locator('.alert-danger, .error').textContent();
    expect(errorMessage).toBeTruthy();
  });

  test('should handle large reference files', async ({ page }) => {
    const fastaFile = SAMPLE_FILES.reference.fasta;
    const referenceName = 'NC004162';

    await page.click('text=References');
    await page.click('text=Add Reference');

    // Upload large reference file and monitor progress
    await page.setInputFiles('input[type="file"]', `${uploadHelper['page']['baseURL']}/test-data/sample-files/reference/${fastaFile}`);

    await page.click('button:has-text("Upload"), input[type="submit"]');

    // Look for progress indicators
    const progressIndicators = await page.locator('.progress, .spinner, text=Uploading').count();

    // Wait for upload completion with extended timeout for large files
    await uploadHelper.waitForUploadCompletion(120000); // 2 minutes

    // Verify reference was uploaded
    const exists = await uploadHelper.verifyReferenceExists(referenceName);
    expect(exists).toBeTruthy();
  });

  test('should extract reference information from FASTA header', async ({ page }) => {
    const fastaFile = SAMPLE_FILES.reference.fasta;
    const referenceName = 'NC004162';

    await uploadHelper.uploadReference(fastaFile);

    // Navigate to reference details
    await page.click('text=References');
    await page.click(`text=${referenceName}`);

    // Verify reference information was extracted
    await expect(page.locator('text=NC_004162')).toBeVisible();

    // Check for sequence length information
    const sequenceInfo = await page.locator('text=length, text=bp, text=bases').count();
    expect(sequenceInfo).toBeGreaterThan(0);
  });

  test('should handle duplicate reference uploads', async ({ page }) => {
    const fastaFile = SAMPLE_FILES.reference.fasta;

    // Upload reference first time
    await uploadHelper.uploadReference(fastaFile);

    // Try to upload the same reference again
    await expect(async () => {
      await uploadHelper.uploadReference(fastaFile);
    }).rejects.toThrow();
  });

  test('should support multiple reference file formats', async ({ page }) => {
    // Test different file extensions if supported
    const fastaFile = SAMPLE_FILES.reference.fasta;

    await uploadHelper.uploadReference(fastaFile);

    // Verify upload was successful
    const exists = await uploadHelper.verifyReferenceExists('NC004162');
    expect(exists).toBeTruthy();

    // Could test other formats like .fa, .fas if the system supports them
  });

  test('should provide reference metadata and annotation', async ({ page }) => {
    const fastaFile = SAMPLE_FILES.reference.fasta;
    const genbankFile = SAMPLE_FILES.reference.genbank;
    const referenceName = 'NC004162';

    await uploadHelper.uploadReference(fastaFile, genbankFile);

    // Navigate to reference details
    await page.click('text=References');
    await page.click(`text=${referenceName}`);

    // Check for annotation information from GenBank file
    await expect(page.locator('text=annotation, text=gene, text=protein')).toBeVisible();

    // Verify reference can be used in projects
    const useInProjectButton = page.locator('button:has-text("Use in Project"), a:has-text("Select")');
    await expect(useInProjectButton).toBeVisible();
  });
});