import { Page, expect, Locator } from '@playwright/test';
import { resolve } from 'path';
import { CONFIG, SAMPLE_FILES, METADATA_FILES, SAMPLE_NAMES } from './config';

export class DataUploadHelper {
  constructor(private page: Page) {}

  async navigateToSamples() {
    await this.page.click('a[href="/managing_files/samples/samples"].nav-link');
    await this.page.waitForLoadState('networkidle');
    await this.page.click('text=Add Samples');
    await this.page.waitForLoadState('networkidle');
  }

  async uploadBatchSamples(metadataFile: string, fastqFiles: string[], sampleType: 'sars' | 'influenza') {
    await this.navigateToSamples();

    // Click "Add Multiple Samples / Load new file"

    //await this.page.click('a[href="/managing_files/samples/sample_add_file"].nav-link');
    await this.page.click('text=Add Multiple Samples');
    await this.page.waitForLoadState('networkidle');

    await this.page.click('text=Load new file');
    await this.page.waitForLoadState('networkidle');

    const metadataPath = resolve(CONFIG.metadataTemplatesPath, metadataFile);
    const samplePath = sampleType === 'sars' ? CONFIG.paths.sarsOnt : CONFIG.paths.influenzaIllumina;

    // Upload metadata file
    const metadataInput = this.page.locator('input[type="file"]').first();
    await metadataInput.setInputFiles(metadataPath);

    // Submit the form
    await this.page.click('button:has-text("Upload"), input[type="submit"]');

    // Wait a bit for the metadata to be processed
    await this.page.waitForTimeout(1000);

    await this.navigateToSamples();

    await this.page.click('text=Add Fastq Files');
    await this.page.waitForLoadState('networkidle');

    await this.page.click('text=Upload fastq.gz files');
    await this.page.waitForLoadState('networkidle');


    // Upload FASTQ files
    const fastqInput = this.page.locator('input[type="file"]').last();
    const fastqPaths = fastqFiles.map(file => resolve(samplePath, file));
    await fastqInput.setInputFiles(fastqPaths);

    // Submit the form
    //await this.page.click('button:has-text("Upload"), input[type="submit"]');

    // Wait for upload completion
    await this.waitForUploadCompletion();
  }

  async uploadIndividualSample(sampleName: string, fastqFile: string, fastqFile2?: string) {
    await this.navigateToSamples();

    // Click "Add One Sample"
    await this.page.click('text= Add One Sample ');
    //await this.page.click('a[href="/managing_files/samples/sample_add"].nav-link');
    await this.page.waitForLoadState('networkidle');

    // Fill sample name
    await this.page.fill('input[name*="name"], input[id*="name"]', sampleName);

    // Upload FASTQ file(s)
    let fastqPath: string;
    //const fastqPath = resolve(CONFIG.paths.sarsOnt, fastqFile);
    if (fastqFile.includes('influenza')) {
      fastqPath = resolve(CONFIG.paths.influenzaIllumina, fastqFile);
    } else {
      fastqPath = resolve(CONFIG.paths.sarsOnt, fastqFile);
    }
    //const fastqInput = this.page.locator('input[type="file"]').first();
    const fastqInput = this.page.locator('input[type="file"], input[name*="path_name_1"]').first();
    await fastqInput.setInputFiles(fastqPath);

    if (fastqFile2) {
      const fastqPath2 = resolve(CONFIG.paths.influenzaIllumina, fastqFile2);
      //const fastqInput2 = this.page.locator('input[type="file"], input[name*="path_name_2"]').last();
      const fastqInput2 = this.page.locator('input[type="file"], input[name*="path_name_2"]').first();
      await fastqInput2.setInputFiles(fastqPath2);
    }

    // Submit the form
    await this.page.click('input[name*="save"], input[type="submit"]');

    // Wait for upload completion
    await this.waitForUploadCompletion();
  }

  async uploadReference(referenceName: string, fastaFile: string, genbankFile?: string) {

    await this.page.click('a[href="/managing_files/references-index"].nav-link');
    await this.page.waitForLoadState('networkidle');
    await this.page.click('a[href="/managing_files/references/references"]');    
    await this.page.waitForLoadState('networkidle');

    await this.page.click('text=Add Reference');
    await this.page.waitForLoadState('networkidle');

    // Fill sample name
    await this.page.fill('input[name*="name"], input[id*="name"]', referenceName);

    const fastaPath = resolve(CONFIG.paths.reference, fastaFile);

    // Upload FASTA file
    const fastaInput = this.page.locator('input[type="file"]').first();
    await fastaInput.setInputFiles(fastaPath);

    // Upload GenBank file if provided
    if (genbankFile) {
      const genbankPath = resolve(CONFIG.paths.reference, genbankFile);
      const genbankInput = this.page.locator('input[type="file"]').last();
      await genbankInput.setInputFiles(genbankPath);
    }

    // Submit the form
    await this.page.click('button:has-text("Save"), input[type="submit"]');

    // Wait for upload completion
    await this.waitForUploadCompletion();
  }

  // This may be a bit useless... TODO check if it can be improved
  async waitForUploadCompletion(timeout = CONFIG.timeouts.upload) {
    // Wait for success message or redirect
    await this.page.waitForTimeout(2000); // Give initial upload time

    try {
      // Look for success indicators
      await Promise.race([
        this.page.waitForSelector('text=Success', { timeout }),
        this.page.waitForSelector('text=uploaded', { timeout }),
        this.page.waitForSelector('.alert-success', { timeout }),
        this.page.waitForURL('**/samples**', { timeout })
      ]);
    } catch (error) {
      // Check for error messages
      const errorMessage = await this.page.locator('.alert-danger, .error').textContent();
      if (errorMessage) {
        throw new Error(`Upload failed: ${errorMessage}`);
      }
      throw error;
    }
  }

  async verifySampleExists(sampleName: string): Promise<boolean> {
    await this.navigateToSamples();
    await this.page.waitForTimeout(1000);
    return await this.page.locator(`text=${sampleName}`).isVisible();
  }

  async verifyReferenceExists(referenceName: string): Promise<boolean> {
    await this.page.click('text=References');
    await this.page.waitForLoadState('networkidle');
    return await this.page.locator(`text=${referenceName}`).isVisible();
  }

  async deleteSample(sampleName: string) {
    await this.navigateToSamples();

    const sampleRow = this.page.locator(`tr:has-text("${sampleName}")`);
    if (await sampleRow.isVisible()) {
      await sampleRow.locator('button:has-text("Delete"), a:has-text("Delete")').click();

      // Confirm deletion if dialog appears
      const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await this.page.waitForTimeout(1000);
    }
  }

  async cleanupTestSamples() {
    const testSamples = [
      ...SAMPLE_NAMES.sarsOnt,
      ...SAMPLE_NAMES.influenzaIllumina
    ];

    for (const sample of testSamples) {
      try {
        await this.deleteSample(sample);
      } catch (error) {
        console.log(`Could not delete sample ${sample}: ${error}`);
      }
    }
  }
}

export class ProjectHelper {
  constructor(private page: Page) {}

  async navigateToProjects() {
    await this.page.click('text=Projects');
    await this.page.waitForLoadState('networkidle');
  }

  async createProject(projectName: string, referenceName: string, pipelineType = 'INSaFLU Full Pipeline') {
    await this.navigateToProjects();

    // Click "Create project"
    await this.page.click('text=Create project');
    await this.page.waitForLoadState('networkidle');

    // Fill project name
    await this.page.fill('input[name*="name"], input[id*="name"]', projectName);

    // Select reference sequence
    await this.page.selectOption('select[name*="reference"], select[id*="reference"]', referenceName);

    // Select pipeline type
    await this.page.selectOption('select[name*="pipeline"], select[id*="pipeline"]', pipelineType);

    // Submit the form
    await this.page.click('button:has-text("Create"), input[type="submit"]');

    // Wait for project creation
    await this.page.waitForURL('**/projects**', { timeout: 10000 });
  }

  async addSamplesToProject(projectName: string, sampleNames: string[]) {
    await this.navigateToProjects();

    // Find and click on the project
    await this.page.click(`text=${projectName}`);
    await this.page.waitForLoadState('networkidle');

    // Click "Add Samples"
    await this.page.click('text=Add Samples');
    await this.page.waitForLoadState('networkidle');

    // Select samples
    for (const sampleName of sampleNames) {
      await this.page.check(`input[type="checkbox"][value*="${sampleName}"]`);
    }

    // Submit selection
    await this.page.click('button:has-text("Add"), input[type="submit"]');

    // Wait for samples to be added
    await this.page.waitForTimeout(2000);
  }

  async waitForProjectCompletion(projectName: string, timeout = CONFIG.timeouts.project) {
    await this.navigateToProjects();
    await this.page.click(`text=${projectName}`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');

      // Check for completion indicators
      const processingStatus = await this.page.locator('text=Processing, text=Waiting').count();
      const errorStatus = await this.page.locator('text=Error').count();

      if (processingStatus === 0 && errorStatus === 0) {
        // All samples processed
        return true;
      }

      if (errorStatus > 0) {
        throw new Error('Project processing failed with errors');
      }

      await this.page.waitForTimeout(30000); // Check every 30 seconds
    }

    throw new Error('Project processing timed out');
  }

  async deleteProject(projectName: string) {
    await this.navigateToProjects();

    const projectRow = this.page.locator(`tr:has-text("${projectName}")`);
    if (await projectRow.isVisible()) {
      await projectRow.locator('button:has-text("Delete"), a:has-text("Delete")').click();

      // Confirm deletion if dialog appears
      const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await this.page.waitForTimeout(1000);
    }
  }
}

export class DatasetHelper {
  constructor(private page: Page) {}

  async navigateToDatasets() {
    await this.page.click('text=Datasets');
    await this.page.waitForLoadState('networkidle');
  }

  async createDataset(datasetName: string, buildType: string) {
    await this.navigateToDatasets();

    // Click "New Dataset"
    await this.page.click('text=New Dataset');
    await this.page.waitForLoadState('networkidle');

    // Fill dataset name
    await this.page.fill('input[name*="name"], input[id*="name"]', datasetName);

    // Select build type
    await this.page.selectOption('select[name*="build"], select[id*="build"]', buildType);

    // Submit the form
    await this.page.click('button:has-text("Create"), input[type="submit"]');

    // Wait for dataset creation
    await this.page.waitForURL('**/datasets**', { timeout: 10000 });
  }

  async addSamplesToDataset(datasetName: string, sampleNames: string[]) {
    await this.navigateToDatasets();

    // Find and click on the dataset
    await this.page.click(`text=${datasetName}`);
    await this.page.waitForLoadState('networkidle');

    // Click "Add Samples"
    await this.page.click('text=Add Samples');
    await this.page.waitForLoadState('networkidle');

    // Select samples
    for (const sampleName of sampleNames) {
      await this.page.check(`input[type="checkbox"][value*="${sampleName}"]`);
    }

    // Submit selection
    await this.page.click('button:has-text("Add"), input[type="submit"]');
    await this.page.waitForTimeout(2000);
  }

  async uploadMetadata(datasetName: string, metadataFile: string) {
    await this.navigateToDatasets();
    await this.page.click(`text=${datasetName}`);
    await this.page.waitForLoadState('networkidle');

    // Upload metadata
    const metadataPath = resolve(CONFIG.metadataTemplatesPath, metadataFile);
    const metadataInput = this.page.locator('input[type="file"]');
    await metadataInput.setInputFiles(metadataPath);

    // Submit metadata
    await this.page.click('button:has-text("Upload"), input[type="submit"]');
    await this.page.waitForTimeout(2000);
  }

  async buildDataset(datasetName: string) {
    await this.navigateToDatasets();
    await this.page.click(`text=${datasetName}`);
    await this.page.waitForLoadState('networkidle');

    // Click build button (hourglass icon)
    await this.page.click('button[title*="build"], button:has-text("Build"), .fa-hourglass');
    await this.page.waitForTimeout(2000);
  }

  async deleteDataset(datasetName: string) {
    await this.navigateToDatasets();

    const datasetRow = this.page.locator(`tr:has-text("${datasetName}")`);
    if (await datasetRow.isVisible()) {
      await datasetRow.locator('button:has-text("Delete"), a:has-text("Delete")').click();

      // Confirm deletion if dialog appears
      const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await this.page.waitForTimeout(1000);
    }
  }
}