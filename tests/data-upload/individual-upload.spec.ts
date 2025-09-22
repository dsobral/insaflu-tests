import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth';
import { DataUploadHelper } from '../utils/data-helpers';
import { SAMPLE_FILES, SAMPLE_NAMES } from '../utils/config';

test.describe('Individual Sample Upload', () => {
  let authHelper: AuthHelper;
  let uploadHelper: DataUploadHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    uploadHelper = new DataUploadHelper(page);
    await authHelper.login();
  });

  test.afterEach(async ({ page }) => {
    // Not doing anythong for now
    // Cleanup test samples
    //try {
    //  await uploadHelper.cleanupTestSamples();
    //} catch (error) {
    //  console.log('Cleanup error:', error);
    //}
  });

  test('should upload single SARS-CoV-2 ONT sample', async ({ page }) => {
    const sampleName = 'test_sars_individual';
    const fastqFile = SAMPLE_FILES.sarsOnt[0];

    await uploadHelper.uploadIndividualSample(sampleName, fastqFile);

    // Verify sample was uploaded
    const exists = await uploadHelper.verifySampleExists(sampleName);
    expect(exists).toBeTruthy();
  });

  test('should upload paired-end Influenza Illumina sample', async ({ page }) => {
    const sampleData = SAMPLE_FILES.influenzaIllumina[0];
    const sampleName = 'test_influenza_individual';

    await uploadHelper.uploadIndividualSample(sampleName, sampleData.r1, sampleData.r2);

    // Verify sample was uploaded
    const exists = await uploadHelper.verifySampleExists(sampleName);
    expect(exists).toBeTruthy();

    // One minute should be enough for processing
    await page.waitForTimeout(60000);

    const isvalid =  page.locator('text=A-H3N2').isVisible();
    expect(isvalid).toBeTruthy();

  });

  test('should validate sample name format', async ({ page }) => {
    // Test with invalid sample name (spaces, special characters)
    await uploadHelper.navigateToSamples();
    await page.click('text=Add One Sample');

    // Fill invalid sample name
    await page.fill('input[name*="name"], input[id*="name"]', 'invalid sample name!@#');

    // Try to submit
    await page.click('button:has-text("Save"), input[type="submit"]');

    // Should show validation error
    //const errorMessage = await page.locator('.alert-danger, .error').textContent();
    const errorMessage = await page.locator('text=Error: Only letters, numbers and underscores are allowed.').isVisible();
    expect(errorMessage).toBeTruthy();
  });

  test('should require sample name field', async ({ page }) => {
    await uploadHelper.navigateToSamples();
    await page.click('text=Add One Sample');

    // Try to submit without sample name
    await page.click('button:has-text("Save"), input[type="submit"]');

    // Should show validation error
    //const errorMessage = await page.locator('.alert-danger, .error').textContent(); 
    const errorMessage = await page.locator('text=Error: You must give a unique name.').isVisible();
    expect(errorMessage).toBeTruthy();
  });

  test('should require FASTQ file upload', async ({ page }) => {
    await uploadHelper.navigateToSamples();
    await page.click('text=Add One Sample');

    // Fill sample name but don't upload file
    await page.fill('input[name*="name"], input[id*="name"]', 'test_no_file');

    // Try to submit
    await page.click('button:has-text("Save"), input[type="submit"]');

    // Should show validation error
    //const errorMessage = await page.locator('.alert-danger, .error').textContent();
    const errorMessage = await page.locator('text=Error: must have a file.').isVisible();
    expect(errorMessage).toBeTruthy();
  });

  test('should handle duplicate sample names', async ({ page }) => {
    const sampleName = 'test_sars_individual';
    //const fastqFile = SAMPLE_FILES.sarsOnt[0];

    // Upload first sample
    // Assume sample is already uploaded in previous test
    //await uploadHelper.uploadIndividualSample(sampleName, fastqFile);

    // Try to upload second sample with same name
    // TODO Come back to this test using this process... 
    //await expect(async () => {
    //  await uploadHelper.uploadIndividualSample(sampleName, fastqFile);
    //}).rejects.toThrow();

    // Fill sample name but don't upload file
    await uploadHelper.navigateToSamples();
    await page.click('text=Add One Sample');
    await page.fill('input[name*="name"], input[id*="name"]', sampleName);
    await page.click('button:has-text("Save"), input[type="submit"]');

    // Should show validation error
    //const errorMessage = await page.locator('.alert-danger, .error').textContent(); // find .error_1_id_name instead
    const errorMessage = await page.locator('text=already exist in database, please choose other.').isVisible();
    expect(errorMessage).toBeTruthy();

  });

  test('should accept only valid file formats', async ({ page }) => {
    await uploadHelper.navigateToSamples();
    await page.click('text=Add One Sample');

    await page.fill('input[name*="name"], input[id*="name"]', 'test_invalid_format');

    // Try to upload non-FASTQ file (simulate text file)
    const invalidContent = 'This is not a FASTQ file';
    await page.evaluate((content) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], 'invalid.txt', { type: 'text/plain' });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, invalidContent);

    // Try to submit
    await page.click('button:has-text("Save"), input[type="submit"]');

    // Should show validation error
    //const errorMessage = await page.locator('.alert-danger, .error, .error_1_id_name').textContent();
    const errorMessage = await page.locator('text=File need to have suffix').isVisible();
    expect(errorMessage).toBeTruthy();
  });

  /*
  
  // Skipping this test for now as metadata fields may vary and are optional

  test('should allow metadata entry for individual samples', async ({ page }) => {
    const sampleName = 'test_metadata_sample';
    const fastqFile = SAMPLE_FILES.sarsOnt[0];

    await uploadHelper.navigateToSamples();
    await page.click('text=Add One Sample');

    await page.fill('input[name*="name"], input[id*="name"]', sampleName);

    // Fill additional metadata if available
    const datasetField = page.locator('input[name*="dataset"], input[id*="dataset"]');
    if (await datasetField.isVisible()) {
      await datasetField.fill('Test_Dataset');
    }

    const hostField = page.locator('input[name*="host"], select[name*="host"]');
    if (await hostField.isVisible()) {
      await hostField.fill('human');
    }

    // Upload file
    await page.setInputFiles('input[type="file"]', `${uploadHelper['page']['baseURL']}/test-data/sample-files/SARS_ONT/${fastqFile}`);

    await page.click('button:has-text("Upload"), input[type="submit"]');
    await uploadHelper.waitForUploadCompletion();

    // Verify sample and metadata
    const exists = await uploadHelper.verifySampleExists(sampleName);
    expect(exists).toBeTruthy();

    // Check metadata was saved
    await page.click(`text=${sampleName}`);
    await expect(page.locator('text=Test_Dataset')).toBeVisible();
  });

  */

});
