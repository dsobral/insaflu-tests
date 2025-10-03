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
    //try {
    //  await uploadHelper.cleanupTestSamples();
    //  await projectHelper.deleteProject('Test_SARS_Project');
    //  await projectHelper.deleteProject('Test_Influenza_Project');
    //} catch (error) {
    //  console.log('Cleanup error:', error);
    //}
  });

  test('should create SARS-CoV-2 project with INSaFLU pipeline', async ({ page }) => {
    const projectName = 'Test_SARS_Project';
    const referenceName = 'SARS_CoV_2_Wuhan_Hu_1_MN908947';

    // First upload reference if not exists
    // Assume reference was already uploaded in previous tests
    //await uploadHelper.uploadReference(SAMPLE_FILES.reference.fasta);

    // Upload test samples
    // Assume samples were already uploaded in previous tests
    //await uploadHelper.uploadBatchSamples(
    //  METADATA_FILES.sarsOnt,
    //  SAMPLE_FILES.sarsOnt,
    //  'sars'
    //);

    // Create project 
    await projectHelper.createProject(projectName, referenceName, 'Snippy');

    // Verify if project was created
    await projectHelper.navigateToProjects();
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
  });

  /* 
  //This test requires illumina samples to be available in the instance
  test('should create SARS-CoV-2 project with iVar pipeline', async ({ page }) => {
    const projectName = 'Test_SARS_Project_iVar';
    const referenceName = 'SARS_CoV_2_Wuhan_Hu_1_MN908947';

    // Create project
    await projectHelper.createProject(projectName, referenceName, 'IVAR');

    // Verify if project was created
    await projectHelper.navigateToProjects();
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
    // this only makes sense if there is no other iVar project existing
    // Need to use nth(1) because there are two "iVar" texts in the page
    await expect(page.locator(`text=iVar`).nth(1)).toBeVisible();

  });
  */  

  test('should create Influenza project with INSaFLU pipeline', async ({ page }) => {
    const projectName = 'Test_Influenza_Project';
    const referenceName = 'A_H3N2_A_Massachusetts_18_2022';


    // Create project with normal pipeline (default)
    await projectHelper.createProject(projectName, referenceName);

    // Verify project was created
    await projectHelper.navigateToProjects();
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
    await expect(page.locator(`text=${referenceName}`)).toBeVisible();

  });


  test('should create Influenza project with iVar pipeline', async ({ page }) => {
    const projectName = 'Test_Influenza_Project_iVar';
    const referenceName = 'A_H3N2_A_Massachusetts_18_2022';

    // Create project
    await projectHelper.createProject(projectName, referenceName, 'IVAR');

    // Verify if project was created
    await projectHelper.navigateToProjects();
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
    // this only makes sense if there is no other iVar project existing
    // Need to use nth(1) because there are two "iVar" texts in the page
    await expect(page.locator(`text=iVar`).nth(1)).toBeVisible();

  });


  test('should create Influenza project with IRMA pipeline', async ({ page }) => {
    const projectName = 'Test_Influenza_Project_IRMA';
    const referenceName = 'A_H3N2_A_Massachusetts_18_2022';


    // Create project with normal pipeline (default)
    await projectHelper.createProject(projectName, referenceName, "IRMA");

    // Verify project was created
    await projectHelper.navigateToProjects();
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
    await expect(page.locator(`text=IRMA`).nth(1)).toBeVisible();

  });


  test('should configure project parameters before adding samples', async ({ page }) => {
    const projectName = 'Test_SARS_Project';

    // Navigate to project settings/parameters
    await projectHelper.navigateToProjects();

    // Select project to guarantee there is only one
    await page.fill('input[name*="search_projects"], input[id*="search_form_id"]', projectName);
    // Submit the form so that the top project is the one we want
    await page.click('button:has-text("Search"), input[type="submit"]');

    // Click the Settings/Parameters button
    //await page.locator('a[title*="Software settings"]').nth(0).click();
    await page.locator('a[href*="show_project_settings"], a[title*="Software settings"]').click();
    await page.waitForLoadState('networkidle');

    // This one seems to work
    await page.locator('text=IonTorrent').nth(0).click();
    // suggested by Claude as being best practices for Playwright, probably need to change the html
    //await page.getByRole('link', { name: 'Illumina/IonTorrent' }).click();
    await page.waitForLoadState('networkidle');

    // project_name... none of these work
    //await page.locator(`a[project_name="${projectName}"]`).click();    
    //await page.locator('a[reference_name="SARS_CoV_2_Wuhan_Hu_1_MN908947"]').click(); 
    //await page.locator(`a[title="Edit parameters"]`).first().click();
    //await page.locator('td', { has: page.locator('text=INSaFLU Full Pipeline') }).locator('a').first().click();
    //await page.locator('a[href*="#id_set_positions_to_mask_regions"], a[id="showMaskModal"], a[title*="Edit parameters"]').click();
    //await page.locator('a[title="Edit parameters"]').first().click();
    //await page.locator('a[id="showMaskModal"]').click();

    // Brute forcing things... TODO need to find a decent solution... 
    await page.locator('a').nth(23).click();
    await page.waitForLoadState('networkidle');

    await page.locator('input[name*="--mincov_2"], input[id*="coverage"]').fill('30'); ;

    // Save parameters
    await page.click('button:has-text("Save"), input[type="submit"]');
    await page.waitForLoadState('networkidle');    

    // Verify project still exists after parameter configuration
    await projectHelper.navigateToProjects();
    await expect(page.locator(`text=${projectName}`)).toBeVisible();

  });



  test('should add samples to existing project', async ({ page }) => {
    const projectName = 'Test_SARS_Project';

    // Add samples to project using correct sample names from TSV
    const sampleNames = SAMPLE_NAMES.sarsOnt;
    await projectHelper.addSamplesToProject(projectName, sampleNames);

    // Wait for samples to appear (may take time depending on backend processing)
    await page.waitForTimeout(90000);

    // Verify samples were added
    await projectHelper.navigateToProjects();
    await page.click(`text=${projectName}`);
    await page.waitForLoadState('networkidle');

    for (const sampleName of sampleNames) {
      await expect(page.locator(`text=${sampleName}`)).toBeVisible();
    }
  });



  test('should monitor project processing status', async ({ page }) => {
    
    const sampleNames = SAMPLE_NAMES.influenzaIllumina;

    // Add samples to project using correct sample names from TSV
    
    await projectHelper.addSamplesToProject('Test_Influenza_Project', sampleNames);

    await projectHelper.addSamplesToProject('Test_Influenza_Project_IRMA', sampleNames);

    await projectHelper.navigateToProjects();

    // Select project to guarantee there is only one
    await page.fill('input[name*="search_projects"], input[id*="search_form_id"]', 'Test_Influenza_Project');
    // Submit the form so that the top project is the one we want
    await page.click('button:has-text("Search"), input[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Check for status indicators
    const statusElementspre = await page.locator('text=(0/4/0)').count();
    expect(statusElementspre).toBeGreaterThan(0);

    await page.waitForTimeout(60000);

        // Select project to guarantee there is only one
    await page.fill('input[name*="search_projects"], input[id*="search_form_id"]', 'Test_Influenza_Project');
    // Submit the form so that the top project is the one we want
    await page.click('button:has-text("Search"), input[type="submit"]');
    await page.waitForLoadState('networkidle');

    const statusElementspos = await page.locator('text=(4/0/0)').count();
    expect(statusElementspos).toBeGreaterThan(0);

  });


/*
  // This test requires specific project name validation rules to be implemented in the application
  test('should validate project name requirements', async ({ page }) => {

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
*/

  test('should require reference selection for project creation', async ({ page }) => {
    await projectHelper.navigateToProjects();
    await page.click('text=Create project');

    // Fill project name but don't select reference
    await page.fill('input[name*="name"], input[id*="name"]', 'Test_No_Reference');

    await page.click('button:has-text("Save"), input[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Should show validation error
    await expect(page.locator('text=You need to select a reference.')).toBeVisible();
    //const errorMessage = await page.locator('.alert-danger, .error').textContent();
    //expect(errorMessage).toBeTruthy();

  });


  test('should show project results and downloads', async ({ page }) => {
    const projectName = 'Test_SARS_Project';

    // Navigate to project
    await projectHelper.navigateToProjects();
    await page.click(`text=${projectName}`);

    // If results are available, verify they can be accessed
    await page.locator('text=Algn2Pheno report').click();
    await page.waitForLoadState('networkidle');
    
    //await expect(page.locator('text=BA.2')).toBeVisible();
    await expect(page.getByLabel('Algn2Pheno report').getByRole('cell', { name: 'BA.2' })).toBeVisible();
    
    // At minimum, verify the project interface shows expected sections
    await page.locator('button:has-text("Download")').click();
    await expect(page.locator('text=Download - AllFiles.zip')).toBeVisible();

  });


});