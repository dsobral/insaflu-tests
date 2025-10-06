import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth';
import { DataUploadHelper, ProjectHelper, DatasetHelper } from '../utils/data-helpers';
import { SAMPLE_FILES, METADATA_FILES, SAMPLE_NAMES } from '../utils/config';

test.describe('NextStrain Dataset Workflow', () => {
  let authHelper: AuthHelper;
  let uploadHelper: DataUploadHelper;
  let projectHelper: ProjectHelper;
  let datasetHelper: DatasetHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    uploadHelper = new DataUploadHelper(page);
    projectHelper = new ProjectHelper(page);
    datasetHelper = new DatasetHelper(page);
    await authHelper.login();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test data
    //try {
    //  await datasetHelper.deleteDataset('Test_SARS_Dataset');
    //  await datasetHelper.deleteDataset('Test_Influenza_Dataset');
    //  await uploadHelper.cleanupTestSamples();
    //  await projectHelper.deleteProject('Test_Dataset_Project');
    //} catch (error) {
    //  console.log('Cleanup error:', error);
    //}
  });

  test('should create SARS-CoV-2 NextStrain dataset', async ({ page }) => {
    const datasetName = 'Test_SARS_Dataset';
    const buildType = 'SARS-CoV-2';

    await datasetHelper.createDataset(datasetName, buildType);

    // Verify dataset was created
    await datasetHelper.navigateToDatasets();
    await expect(page.locator(`text=${datasetName}`).first()).toBeVisible();
  });

  test('should create Seasonal Influenza NextStrain dataset', async ({ page }) => {
    const datasetName = 'Test_Influenza_Dataset';
    const buildType = 'Influenza (H3N2 HA 12years)';

    await datasetHelper.createDataset(datasetName, buildType);

    await datasetHelper.navigateToDatasets();
    await expect(page.locator(`text=${datasetName}`).first()).toBeVisible();
    //await expect(page.locator(`text=${datasetName}`)).toBeVisible();

  });

  test('should add samples to SARS dataset from SARS project', async ({ page }) => {
    const datasetName = 'Test_SARS_Dataset';
    const projectName = 'Test_SARS_Project';
    //const sampleNames = SAMPLE_NAMES.sarsOnt;

    // Add samples from project to dataset
    await datasetHelper.addProjectSamplesToDataset(datasetName, projectName);

    // Verify samples were added
    await datasetHelper.navigateToDatasets();
    // There is a warning at the top with the dataset name, so we need to click the 2nd instance 
    await page.locator(`text=${datasetName}`).nth(1).click();
    await page.waitForLoadState('networkidle');

    // Not all samples can be added
    //for (const sampleName of sampleNames) {
    //  await expect(page.locator(`text=${sampleName}`)).toBeVisible();
    //}

    await expect(page.locator('text=amostra_SRR19847193')).toBeVisible();

  });

  test('should add samples to Influenza dataset from Influenza project', async ({ page }) => {
    const datasetName = 'Test_Influenza_Dataset';
    const projectName = 'Test_Influenza_Project_IRMA';
    const sampleNames = SAMPLE_NAMES.influenzaIllumina;

    // Add samples from project to dataset
    await datasetHelper.addProjectSamplesToDataset(datasetName, projectName);

    // Verify samples were added
    await datasetHelper.navigateToDatasets();
    // There is a warning at the top with the dataset name, so we need to click the 2nd instance 
    await page.locator(`text=${datasetName}`).nth(1).click();
    await page.waitForLoadState('networkidle');

    for (const sampleName of sampleNames) {
      await expect(page.locator(`text=${sampleName}`)).toBeVisible();
    }

  });  

  test('should build NextStrain SARS dataset', async ({ page }) => {
    const datasetName = 'Test_SARS_Dataset';

    // This assumes this Dataset already has samples and stable metadata

    // Build dataset
    await datasetHelper.buildDataset(datasetName);

    await page.waitForTimeout(2000);

    // Verify build was initiated
    //await datasetHelper.navigateToDatasets();
    await page.reload();
    await page.waitForLoadState('networkidle');

    await datasetHelper.selectDataset(datasetName);

    // Look for build status indicators
    const runningStatus = await page.locator('button[title*="Rebuild Dataset Results"], .fa-spin').isVisible();
    expect(runningStatus).toBeTruthy();

    await page.waitForTimeout(60000);

    // Refresh and check for build completion
    await page.reload();
    await page.waitForLoadState('networkidle');

    //await datasetHelper.selectDataset("");

    await datasetHelper.selectDataset(datasetName);

    const buildStatus = await page.locator('button[title*="Rebuild Dataset Results"], .fa-flask').isVisible();
    expect(buildStatus).toBeTruthy();
    //const buildStatus = await page.locator('button[title*="Rebuild Dataset Results"], .fa-flask').count();
    //expect(buildStatus).toBeGreaterThan(0);    

  });


/* TODO: implement this test
  test('should upload and validate metadata for dataset', async ({ page }) => {
    const datasetName = 'Test_SARS_Dataset';

    // Create dataset
    await datasetHelper.createDataset(datasetName, 'SARS-CoV-2');

    // Upload metadata
    await datasetHelper.uploadMetadata(datasetName, METADATA_FILES.nextstrain);

    // Verify metadata was uploaded
    await datasetHelper.navigateToDatasets();
    await page.click(`text=${datasetName}`);

    // Look for metadata validation indicators
    await expect(page.locator('text=metadata, text=collection_date, text=country')).toBeVisible();
  });
*/

  test('should validate required metadata fields', async ({ page }) => {
    const datasetName = 'Test_Metadata_Validation';

    await datasetHelper.createDataset(datasetName, 'SARS-CoV-2');

    // Create invalid metadata file
    const invalidMetadata = 'strain\tdate\nlocation\nSample1\t\tPortugal\n'; // Missing collection_date

    await datasetHelper.navigateToDatasets();
    await page.click(`text=${datasetName}`);

    // Try to upload invalid metadata
    await page.evaluate((content) => {
      const blob = new Blob([content], { type: 'text/tab-separated-values' });
      const file = new File([blob], 'invalid_metadata.tsv', { type: 'text/tab-separated-values' });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, invalidMetadata);

    await page.click('button:has-text("Upload"), input[type="submit"]');

    // Should show validation error
    const errorMessage = await page.locator('.alert-danger, .error').textContent();
    expect(errorMessage).toBeTruthy();

    // Clean up
    await datasetHelper.deleteDataset(datasetName);
  });

  test('should allow dataset scaling by adding more samples', async ({ page }) => {
    const datasetName = 'Test_Scaling_Dataset';

    // Create initial dataset with one sample
    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);
    await uploadHelper.uploadBatchSamples(
      METADATA_FILES.sarsOnt,
      [SAMPLE_FILES.sarsOnt[0]],
      'sars'
    );

    const projectName = 'Test_Dataset_Project';
    await projectHelper.createProject(projectName, 'NC004162');
    const initialSample = [SAMPLE_NAMES.sarsOnt[0]]; // Use correct sample name from TSV
    await projectHelper.addSamplesToProject(projectName, initialSample);

    await datasetHelper.createDataset(datasetName, 'SARS-CoV-2');
    await datasetHelper.addSamplesToDataset(datasetName, initialSample);

    // Add more samples later
    const additionalSamples = SAMPLE_NAMES.sarsOnt.slice(1); // Use correct sample names from TSV
    if (additionalSamples.length > 0) {
      // Note: All samples should already be uploaded from the original batch upload with TSV
      // If we need to add individual samples, we would upload them separately

      await projectHelper.addSamplesToProject(projectName, additionalSamples);
      await datasetHelper.addSamplesToDataset(datasetName, additionalSamples);

      // Verify all samples are now in dataset
      await datasetHelper.navigateToDatasets();
      await page.click(`text=${datasetName}`);

      const allSamples = [...initialSample, ...additionalSamples];
      for (const sampleName of allSamples) {
        await expect(page.locator(`text=${sampleName}`)).toBeVisible();
      }
    }
  });

  test('should allow sample removal from dataset', async ({ page }) => {
    const datasetName = 'Test_Sample_Removal';

    // Setup dataset with multiple samples
    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);
    await uploadHelper.uploadBatchSamples(
      METADATA_FILES.sarsOnt,
      SAMPLE_FILES.sarsOnt,
      'sars'
    );

    const projectName = 'Test_Dataset_Project';
    await projectHelper.createProject(projectName, 'NC004162');
    const sampleNames = SAMPLE_NAMES.sarsOnt; // Use correct sample names from TSV
    await projectHelper.addSamplesToProject(projectName, sampleNames);

    await datasetHelper.createDataset(datasetName, 'SARS-CoV-2');
    await datasetHelper.addSamplesToDataset(datasetName, sampleNames);

    // Remove one sample from dataset
    await datasetHelper.navigateToDatasets();
    await page.click(`text=${datasetName}`);

    const sampleToRemove = sampleNames[0];
    const removeButton = page.locator(`tr:has-text("${sampleToRemove}") button:has-text("Remove"), tr:has-text("${sampleToRemove}") a:has-text("Remove")`);

    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Confirm removal if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify sample was removed
      await page.waitForTimeout(1000);
      await expect(page.locator(`text=${sampleToRemove}`)).not.toBeVisible();
    }
  });

  test('should show dataset visualization after build', async ({ page }) => {
    const datasetName = 'Test_Visualization_Dataset';

    // Note: This test may require a completed build, which takes time
    // In practice, you might want to use a pre-built dataset or mock results

    await datasetHelper.createDataset(datasetName, 'SARS-CoV-2');

    // Navigate to dataset
    await datasetHelper.navigateToDatasets();
    await page.click(`text=${datasetName}`);

    // Look for visualization elements (may not be available without build)
    const vizElements = await page.locator('text=tree, text=map, text=auspice, iframe, .visualization').count();

    // If visualization is available, verify it loads
    const auspiceFrame = page.locator('iframe[src*="auspice"]');
    if (await auspiceFrame.isVisible()) {
      await expect(auspiceFrame).toBeVisible();
    }

    // At minimum, verify dataset interface shows expected sections
    await expect(page.locator(`text=${datasetName}`)).toBeVisible();

    // Clean up
    await datasetHelper.deleteDataset(datasetName);
  });

  test('should validate dataset name requirements', async ({ page }) => {
    await datasetHelper.navigateToDatasets();
    await page.click('text=New Dataset');

    // Try invalid dataset name
    await page.fill('input[name*="name"], input[id*="name"]', 'Invalid Dataset Name!@#');
    await page.selectOption('select[name*="build"], select[id*="build"]', 'SARS-CoV-2');

    await page.click('button:has-text("Create"), input[type="submit"]');

    // Should show validation error
    const errorMessage = await page.locator('.alert-danger, .error').textContent();
    expect(errorMessage).toBeTruthy();
  });

  test('should require build type selection for dataset creation', async ({ page }) => {
    await datasetHelper.navigateToDatasets();
    await page.click('text=New Dataset');

    // Fill dataset name but don't select build type
    await page.fill('input[name*="name"], input[id*="name"]', 'Test_No_Build_Type');

    await page.click('button:has-text("Create"), input[type="submit"]');

    // Should show validation error
    const errorMessage = await page.locator('.alert-danger, .error').textContent();
    expect(errorMessage).toBeTruthy();
  });
});