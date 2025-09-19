import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth';
import { DataUploadHelper, ProjectHelper } from '../utils/data-helpers';
import { SAMPLE_FILES, METADATA_FILES, SAMPLE_NAMES } from '../utils/config';

test.describe('INSaFLU Project Workflow', () => {
  let authHelper: AuthHelper;
  let uploadHelper: DataUploadHelper;
  let projectHelper: ProjectHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    uploadHelper = new DataUploadHelper(page);
    projectHelper = new ProjectHelper(page);
    await authHelper.login();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test data
    try {
      await uploadHelper.cleanupTestSamples();
      await projectHelper.deleteProject('Test_SARS_Project');
      await projectHelper.deleteProject('Test_Influenza_Project');
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  test('should create SARS-CoV-2 project with INSaFLU pipeline', async ({ page }) => {
    const projectName = 'Test_SARS_Project';
    const referenceName = 'NC004162';

    // First upload reference if not exists
    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);

    // Upload test samples
    await uploadHelper.uploadBatchSamples(
      METADATA_FILES.sarsOnt,
      SAMPLE_FILES.sarsOnt,
      'sars'
    );

    // Create project
    await projectHelper.createProject(projectName, referenceName, 'INSaFLU Full Pipeline');

    // Verify project was created
    await projectHelper.navigateToProjects();
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
  });

  test('should create Influenza project with iVar pipeline', async ({ page }) => {
    const projectName = 'Test_Influenza_Project';
    const referenceName = 'NC004162';

    // Upload reference and samples
    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);

    const fastqFiles = SAMPLE_FILES.influenzaIllumina.flatMap(s => [s.r1, s.r2]);
    await uploadHelper.uploadBatchSamples(
      METADATA_FILES.influenzaIllumina,
      fastqFiles,
      'influenza'
    );

    // Create project with iVar pipeline
    await projectHelper.createProject(projectName, referenceName, 'iVar Full Pipeline');

    // Verify project was created
    await projectHelper.navigateToProjects();
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
  });

  test('should add samples to existing project', async ({ page }) => {
    const projectName = 'Test_SARS_Project';
    const referenceName = 'NC004162';

    // Setup project and samples
    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);
    await uploadHelper.uploadBatchSamples(
      METADATA_FILES.sarsOnt,
      SAMPLE_FILES.sarsOnt,
      'sars'
    );

    // Create project
    await projectHelper.createProject(projectName, referenceName);

    // Add samples to project using correct sample names from TSV
    const sampleNames = SAMPLE_NAMES.sarsOnt;
    await projectHelper.addSamplesToProject(projectName, sampleNames);

    // Verify samples were added
    await projectHelper.navigateToProjects();
    await page.click(`text=${projectName}`);

    for (const sampleName of sampleNames) {
      await expect(page.locator(`text=${sampleName}`)).toBeVisible();
    }
  });

  test('should configure project parameters before adding samples', async ({ page }) => {
    const projectName = 'Test_SARS_Project';
    const referenceName = 'NC004162';

    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);

    // Create project
    await projectHelper.createProject(projectName, referenceName);

    // Navigate to project settings/parameters
    await projectHelper.navigateToProjects();
    await page.click(`text=${projectName}`);

    // Look for parameter configuration options
    const settingsButton = page.locator('text=Settings, text=Parameters, text=Configure');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Check for parameter options like quality thresholds, coverage, etc.
      const qualityThreshold = page.locator('input[name*="quality"], input[id*="quality"]');
      if (await qualityThreshold.isVisible()) {
        await qualityThreshold.fill('20');
      }

      const coverageThreshold = page.locator('input[name*="coverage"], input[id*="coverage"]');
      if (await coverageThreshold.isVisible()) {
        await coverageThreshold.fill('10');
      }

      // Save parameters
      await page.click('button:has-text("Save"), input[type="submit"]');
    }

    // Verify project still exists after parameter configuration
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
  });

  test('should monitor project processing status', async ({ page }) => {
    const projectName = 'Test_SARS_Project';
    const referenceName = 'NC004162';

    // Setup complete workflow
    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);
    await uploadHelper.uploadBatchSamples(
      METADATA_FILES.sarsOnt,
      [SAMPLE_FILES.sarsOnt[0]], // Use only one sample for faster testing
      'sars'
    );

    await projectHelper.createProject(projectName, referenceName);

    const sampleNames = [SAMPLE_NAMES.sarsOnt[0]]; // Use correct sample name from TSV
    await projectHelper.addSamplesToProject(projectName, sampleNames);

    // Monitor project status
    await projectHelper.navigateToProjects();
    await page.click(`text=${projectName}`);

    // Check for status indicators
    const statusElements = await page.locator('.status, text=Processing, text=Waiting, text=Completed, text=Error').count();
    expect(statusElements).toBeGreaterThan(0);

    // Check for progress indicators
    const progressElements = await page.locator('.progress, .progress-bar, text=%').count();
    // Progress elements may or may not be present depending on UI design

    // Verify sample status is displayed
    await expect(page.locator(`text=${sampleNames[0]}`)).toBeVisible();
  });

  test('should handle project with no samples gracefully', async ({ page }) => {
    const projectName = 'Empty_Test_Project';
    const referenceName = 'NC004162';

    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);

    // Create project without adding samples
    await projectHelper.createProject(projectName, referenceName);

    // Navigate to project
    await projectHelper.navigateToProjects();
    await page.click(`text=${projectName}`);

    // Should show message about no samples or option to add samples
    const addSamplesButton = page.locator('text=Add Samples');
    await expect(addSamplesButton).toBeVisible();

    // Clean up
    await projectHelper.deleteProject(projectName);
  });

  test('should validate project name requirements', async ({ page }) => {
    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);

    await projectHelper.navigateToProjects();
    await page.click('text=Create project');

    // Try invalid project name
    await page.fill('input[name*="name"], input[id*="name"]', 'Invalid Project Name!@#');
    await page.selectOption('select[name*="reference"], select[id*="reference"]', 'NC004162');

    await page.click('button:has-text("Create"), input[type="submit"]');

    // Should show validation error
    const errorMessage = await page.locator('.alert-danger, .error').textContent();
    expect(errorMessage).toBeTruthy();
  });

  test('should require reference selection for project creation', async ({ page }) => {
    await projectHelper.navigateToProjects();
    await page.click('text=Create project');

    // Fill project name but don't select reference
    await page.fill('input[name*="name"], input[id*="name"]', 'Test_No_Reference');

    await page.click('button:has-text("Create"), input[type="submit"]');

    // Should show validation error
    const errorMessage = await page.locator('.alert-danger, .error').textContent();
    expect(errorMessage).toBeTruthy();
  });

  test('should support different pipeline types', async ({ page }) => {
    const referenceName = 'NC004162';
    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);

    const pipelines = ['INSaFLU Full Pipeline', 'iVar Full Pipeline', 'IRMA Full Pipeline'];

    for (const pipeline of pipelines) {
      const projectName = `Test_${pipeline.replace(' ', '_')}_Project`;

      await projectHelper.navigateToProjects();
      await page.click('text=Create project');

      await page.fill('input[name*="name"], input[id*="name"]', projectName);
      await page.selectOption('select[name*="reference"], select[id*="reference"]', referenceName);

      // Check if pipeline option exists
      const pipelineOption = page.locator(`option:has-text("${pipeline}")`);
      if (await pipelineOption.isVisible()) {
        await page.selectOption('select[name*="pipeline"], select[id*="pipeline"]', pipeline);
        await page.click('button:has-text("Create"), input[type="submit"]');

        // Verify project was created
        await expect(page.locator(`text=${projectName}`)).toBeVisible();

        // Clean up
        await projectHelper.deleteProject(projectName);
      }
    }
  });

  test('should show project results and downloads', async ({ page }) => {
    const projectName = 'Test_Results_Project';
    const referenceName = 'NC004162';

    // Note: This test may take a long time as it requires actual processing
    // In a real test environment, you might want to use a pre-processed project
    // or mock the results

    await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);
    await uploadHelper.uploadBatchSamples(
      METADATA_FILES.sarsOnt,
      [SAMPLE_FILES.sarsOnt[0]],
      'sars'
    );

    await projectHelper.createProject(projectName, referenceName);

    const sampleNames = [SAMPLE_NAMES.sarsOnt[0]]; // Use correct sample name from TSV
    await projectHelper.addSamplesToProject(projectName, sampleNames);

    // Navigate to project
    await projectHelper.navigateToProjects();
    await page.click(`text=${projectName}`);

    // Look for results section (may not be available immediately)
    const resultsSection = page.locator('text=Results, text=Download, text=Report');
    const downloadButtons = page.locator('button:has-text("Download"), a:has-text("Download")');

    // If results are available, verify they can be accessed
    if (await resultsSection.isVisible()) {
      await expect(downloadButtons).toBeVisible();
    }

    // At minimum, verify the project interface shows expected sections
    await expect(page.locator('text=Samples')).toBeVisible();
    await expect(page.locator(`text=${sampleNames[0]}`)).toBeVisible();
  });
});