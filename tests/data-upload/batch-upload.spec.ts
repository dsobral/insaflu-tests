import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth';
import { DataUploadHelper } from '../utils/data-helpers';
import { SAMPLE_FILES, METADATA_FILES, SAMPLE_NAMES } from '../utils/config';

test.describe('Batch Data Upload', () => {
  let authHelper: AuthHelper;
  let uploadHelper: DataUploadHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    uploadHelper = new DataUploadHelper(page);
    await authHelper.login();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test samples
    //try {
    //  await uploadHelper.cleanupTestSamples();
    //} catch (error) {
    //  console.log('Cleanup error:', error);
    //}
  });

  test('should upload SARS-CoV-2 ONT samples in batch', async ({ page }) => {
    const fastqFiles = SAMPLE_FILES.sarsOnt;

    await uploadHelper.uploadBatchSamples(
      METADATA_FILES.sarsOnt,
      fastqFiles,
      'sars'
    );


    // Verify samples were uploaded using correct sample names from TSV
    for (const sampleName of SAMPLE_NAMES.sarsOnt) {
      const exists = await uploadHelper.verifySampleExists(sampleName);
      expect(exists).toBeTruthy();
    }

  });

  test('should upload Influenza Illumina samples in batch', async ({ page }) => {
    const fastqFiles = SAMPLE_FILES.influenzaIllumina.flatMap(s => [s.r1, s.r2]);

    await uploadHelper.uploadBatchSamples(
      METADATA_FILES.influenzaIllumina,
      fastqFiles,
      'influenza'
    );

    // Verify samples were uploaded using correct sample names from TSV
    for (const sampleName of SAMPLE_NAMES.influenzaIllumina) {
      const exists = await uploadHelper.verifySampleExists(sampleName);
      expect(exists).toBeTruthy();
    }

    // Wait a bit for processing
    await page.waitForTimeout(60000);

    // Check that one of the samples has been processed correctly
    const isvalid =  page.locator('text=A-H3N2').isVisible();
    expect(isvalid).toBeTruthy();

  });


  test('should validate metadata format during batch upload', async ({ page }) => {
    // Try to upload with invalid metadata format
    // This would require creating an invalid metadata file for testing
    await uploadHelper.navigateToSamples();

    //await this.page.click('a[href="/managing_files/samples/sample_add_file"].nav-link');
    await page.click('text=Add Multiple Samples');
    await page.waitForLoadState('networkidle');

    await page.click('text=Load new file');
    await page.waitForLoadState('networkidle');


    // Upload an invalid metadata file (we'll simulate this)
    const invalidContent = 'invalid,metadata,format\ntest1,test2,test3';
    await page.evaluate((content) => {
      const blob = new Blob([content], { type: 'text/csv' });
      const file = new File([blob], 'invalid.csv', { type: 'text/csv' });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, invalidContent);

    // Should show validation error
    await page.click('button:has-text("Upload"), input[type="submit"]');

    // Check for error message
    const errorMessage = await page.locator('.alert-danger, .error').textContent();
    expect(errorMessage).toBeTruthy();
  });

  // Maybe re-enable this test later
  //test('should preserve metadata fields during batch upload', async ({ page }) => {
  //  await uploadHelper.uploadBatchSamples(
  //    METADATA_FILES.sarsOnt,
  //    [SAMPLE_FILES.sarsOnt[0]],
  //    'sars'
  //  );

  //  const sampleName = SAMPLE_NAMES.sarsOnt[0];

    // Navigate to sample details to verify metadata
  //  await uploadHelper.navigateToSamples();
  //  await page.click(`text=${sampleName}`);

    // Verify metadata fields are preserved from TSV
  //  await expect(page.locator('text=experiencia')).toBeVisible();
  //  await expect(page.locator('text=13/12/2017')).toBeVisible();
  //  await expect(page.locator('text=human')).toBeVisible();
  //});


});