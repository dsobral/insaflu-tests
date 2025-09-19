# INSaFLU Playwright Testing Suite

A comprehensive end-to-end testing suite for the INSaFLU platform using Playwright and TypeScript.

## Overview

This testing suite provides automated functional tests for the INSaFLU website (https://insaflu.insa.pt/), covering:

- **Authentication**: Login/logout functionality
- **Data Upload**: Batch upload, individual sample upload, and reference sequence upload
- **Project Workflows**: Creating and managing INSaFLU projects
- **Dataset Workflows**: Creating and managing NextStrain datasets
- **Cross-browser Testing**: Support for Chromium, Firefox, and WebKit

## Features

- ✅ **Configurable Base URL** - Test production, staging, or development environments
- ✅ **Authentication Management** - Reusable login utilities with credential handling
- ✅ **File Upload Testing** - Support for FASTQ, FASTA, GenBank, and metadata files
- ✅ **Workflow Testing** - Complete project and dataset creation workflows
- ✅ **Data Cleanup** - Automatic cleanup of test data after each test
- ✅ **Comprehensive Reporting** - HTML reports with screenshots on failures
- ✅ **CI/CD Ready** - Configured for continuous integration environments

## Project Structure

```
insaflu-tests/
├── package.json              # Project dependencies and scripts
├── playwright.config.ts      # Playwright configuration
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment variables template
├── tests/                   # Test suites
│   ├── auth/               # Authentication tests
│   ├── data-upload/        # Data upload tests
│   ├── projects/           # Project workflow tests
│   ├── datasets/           # Dataset workflow tests
│   └── utils/              # Shared utilities
├── test-data/              # Test data and templates
│   ├── metadata-templates/ # CSV/TSV metadata files
│   └── sample-files/       # Symlink to example data
└── reports/                # Test reports and artifacts
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Access to INSaFLU instance (production or development)
- Valid INSaFLU user credentials

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install system dependencies and browsers:**
   ```bash
   # Option A: Auto-install script (Linux/WSL)
   npm run setup

   # Option B: Manual installation
   npm run setup:deps    # Install system dependencies
   npm run setup:browsers # Install browsers only

   # Option C: Playwright's installer
   npx playwright install-deps
   npx playwright install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

> ⚠️ **WSL/Linux Users**: If you see missing library warnings, see [SETUP.md](./SETUP.md) for detailed dependency installation instructions.

### Configuration

Create a `.env` file based on `.env.example`:

```bash
# INSaFLU instance to test
INSAFLU_BASE_URL=https://insaflu.insa.pt/

# Test credentials
INSAFLU_USERNAME=your_username
INSAFLU_PASSWORD=your_password

# Test data paths (already configured for included example data)
TEST_DATA_PATH=../example_data
SARS_ONT_PATH=../example_data/SARS_ONT
INFLUENZA_ILLUMINA_PATH=../example_data/influenza_illumina
REFERENCE_PATH=../example_data/reference

# Timeouts (optional)
UPLOAD_TIMEOUT=60000
PROCESSING_TIMEOUT=300000
PROJECT_TIMEOUT=600000
```

### Running Tests

```bash
# Quick test (recommended first run)
npm run test:quick

# Run all tests
npm test

# Run tests with browser UI visible (requires GUI)
npm run test:headed

# Run tests in interactive mode
npm run test:ui

# Run specific test suites
npm run test:auth      # Authentication tests
npm run test:upload    # Data upload tests
npm run test:projects  # Project workflow tests
npm run test:datasets  # Dataset workflow tests

# CI/CD mode (headless, minimal output)
npm run test:ci

# Debug specific test
npm run test:debug -- tests/auth/login.spec.ts

# Generate HTML report
npm run report
```

## Test Suites

### Authentication Tests (`tests/auth/`)
- ✅ Successful login with valid credentials
- ✅ Failed login with invalid credentials
- ✅ Logout functionality
- ✅ Session persistence across page reloads
- ✅ Protected page access without authentication

### Data Upload Tests (`tests/data-upload/`)

#### Batch Upload (`batch-upload.spec.ts`)
- ✅ SARS-CoV-2 ONT samples batch upload
- ✅ Influenza Illumina samples batch upload
- ✅ Metadata format validation
- ✅ File validation and error handling

#### Individual Upload (`individual-upload.spec.ts`)
- ✅ Single SARS-CoV-2 ONT sample upload
- ✅ Paired-end Influenza Illumina sample upload
- ✅ Sample name validation
- ✅ File format validation
- ✅ Duplicate sample handling

#### Reference Upload (`reference-upload.spec.ts`)
- ✅ FASTA file upload
- ✅ Combined FASTA and GenBank upload
- ✅ File format validation
- ✅ Reference information extraction

### Project Workflow Tests (`tests/projects/`)
- ✅ Project creation with different pipeline types
- ✅ Sample addition to projects
- ✅ Parameter configuration
- ✅ Project status monitoring
- ✅ Results and download verification

### Dataset Workflow Tests (`tests/datasets/`)
- ✅ NextStrain dataset creation for different pathogens
- ✅ Sample addition from projects
- ✅ Metadata upload and validation
- ✅ Dataset building
- ✅ Sample scaling and removal

## Test Data

The suite includes example data for testing:

- **SARS-CoV-2 ONT samples**: 3 single-end FASTQ files
- **Influenza Illumina samples**: 4 paired-end sample sets
- **Reference sequences**: NC004162 FASTA and GenBank files
- **Metadata templates**: Pre-configured CSV/TSV files

## Utilities and Helpers

### AuthHelper (`tests/utils/auth.ts`)
- Login/logout functionality
- Session management
- Authentication state verification

### DataUploadHelper (`tests/utils/data-helpers.ts`)
- File upload utilities
- Sample management
- Upload completion monitoring

### ProjectHelper (`tests/utils/data-helpers.ts`)
- Project creation and management
- Sample addition to projects
- Project status monitoring

### DatasetHelper (`tests/utils/data-helpers.ts`)
- Dataset creation and management
- Metadata handling
- Dataset building and monitoring

## Configuration Options

### Playwright Configuration (`playwright.config.ts`)

- **Cross-browser testing**: Chromium, Firefox, WebKit
- **Retry logic**: Automatic retries on CI
- **Reporting**: HTML, JSON, and line reporters
- **Screenshots**: Captured on test failures
- **Videos**: Recorded on test failures

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `INSAFLU_BASE_URL` | INSaFLU instance URL | `https://insaflu.insa.pt/` |
| `INSAFLU_USERNAME` | Test user username | `daniel.sobral` |
| `INSAFLU_PASSWORD` | Test user password | Required |
| `UPLOAD_TIMEOUT` | File upload timeout (ms) | `60000` |
| `PROCESSING_TIMEOUT` | Processing timeout (ms) | `300000` |
| `PROJECT_TIMEOUT` | Project completion timeout (ms) | `600000` |

## Best Practices

### Test Development

1. **Use Page Object Pattern**: Utilities are organized as helper classes
2. **Implement Cleanup**: Each test cleans up its data in `afterEach`
3. **Wait for Elements**: Use proper waiting strategies for dynamic content
4. **Error Handling**: Tests handle both success and failure scenarios

### Data Management

1. **Unique Names**: Use descriptive, unique names for test data
2. **Cleanup Strategy**: Automatic cleanup prevents data accumulation
3. **Isolation**: Tests don't depend on data from other tests

### CI/CD Integration

1. **Headless Mode**: Tests run headless in CI environments
2. **Retry Logic**: Automatic retries for flaky tests
3. **Artifacts**: Screenshots and videos saved on failures

## Troubleshooting

### Common Issues

1. **Login Failures**
   - Verify credentials in `.env` file
   - Check if INSaFLU instance is accessible
   - Ensure user account is active

2. **File Upload Failures**
   - Check file paths in configuration
   - Verify test data symlinks are correct
   - Ensure sufficient disk space

3. **Timeout Errors**
   - Increase timeout values in `.env`
   - Check network connectivity
   - Verify INSaFLU instance performance

4. **Browser Installation Issues**
   - Run `npx playwright install` to reinstall browsers
   - Check system dependencies for Linux
   - Use `--with-deps` flag if needed

### Debug Mode

For debugging failing tests:

```bash
# Run single test in debug mode
npm run test:debug -- tests/auth/login.spec.ts

# Run with visible browser
npm run test:headed -- tests/auth/login.spec.ts

# Use Playwright inspector
npx playwright test --debug tests/auth/login.spec.ts
```

### Logs and Reports

- **Console Output**: Real-time test progress and errors
- **HTML Report**: Detailed results with screenshots (`npm run report`)
- **JSON Report**: Machine-readable results in `reports/test-results.json`
- **Screenshots**: Failure screenshots in `test-results/`
- **Videos**: Failure recordings in `test-results/`

## Development

### Adding New Tests

1. **Create test file** in appropriate directory
2. **Import utilities** from `../utils/`
3. **Follow naming convention**: `*.spec.ts`
4. **Include cleanup** in `afterEach` hook
5. **Add descriptive test names**

### Extending Utilities

1. **Add methods** to existing helper classes
2. **Follow async/await** pattern
3. **Include error handling**
4. **Document parameters** and return values

### Configuration Changes

1. **Update `playwright.config.ts`** for Playwright settings
2. **Update `.env.example`** for new environment variables
3. **Update `CONFIG`** object in `tests/utils/config.ts`

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-test`
3. **Add tests** following existing patterns
4. **Test thoroughly** on different environments
5. **Update documentation** as needed
6. **Submit pull request**

## License

This testing suite is provided under the same license as the INSaFLU project.

## Support

For issues related to:
- **INSaFLU platform**: Contact INSaFLU support team
- **Testing suite**: Create issue in the project repository
- **Playwright framework**: Refer to [Playwright documentation](https://playwright.dev/)

---

**Note**: This testing suite is designed for testing INSaFLU functionality and should not be used to upload actual research data to production systems during automated testing.