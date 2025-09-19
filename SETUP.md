# INSaFLU Testing Suite Setup Guide

## System Dependencies (Linux/WSL)

The Playwright warning indicates missing system libraries. Here are the solutions:

### Option 1: Install System Dependencies (Recommended)

For **Ubuntu/Debian** systems (including WSL):

```bash
# Update package list
sudo apt update

# Install Playwright dependencies
sudo apt install -y \
    libgtk-4-1 libgraphene-1.0-0 libxslt1.1 libwoff1 \
    libvpx9 libevent-2.1-7 libopus0 \
    gstreamer1.0-plugins-base gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad gstreamer1.0-libav \
    libflite1 libwebpdemux2 libavif16 \
    libharfbuzz-icu0 libwebpmux3 libenchant-2-2 \
    libsecret-1-0 libhyphen0 libmanette-0.2-0 \
    libgles2 libx264-164

# Alternative: Use Playwright's dependency installer
npx playwright install-deps
```

### Option 2: Use Docker (Alternative)

If you can't install system dependencies, use Docker:

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM mcr.microsoft.com/playwright:v1.55.0-focal
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "test"]
EOF

# Build and run
docker build -t insaflu-tests .
docker run --rm -v $(pwd)/reports:/app/reports insaflu-tests
```

### Option 3: Headless Mode Only

If you only need headless testing (CI/CD):

```bash
# Set environment variable for headless mode
export CI=true

# Run tests (will use headless mode automatically)
npm test
```

### Option 4: Use Remote Browser (Advanced)

Connect to a remote browser service:

```typescript
// In playwright.config.ts, add:
use: {
  // ... other options
  connectOptions: {
    wsEndpoint: 'ws://remote-browser-service:3000',
  },
}
```

## Quick Start (After Dependencies)

1. **Install and setup:**
   ```bash
   cd insaflu-tests
   npm install
   npx playwright install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your INSaFLU credentials
   ```

3. **Test the setup:**
   ```bash
   # Quick auth test (headless)
   npm run test:auth -- --project=chromium

   # Run with visible browser (if GUI available)
   npm run test:headed -- tests/auth/login.spec.ts
   ```

## Troubleshooting

### WSL Specific Issues

If using WSL and want to see browser windows:

1. **Install X11 server** (like VcXsrv on Windows)
2. **Set DISPLAY variable:**
   ```bash
   export DISPLAY=:0
   # Add to ~/.bashrc for persistence
   ```

### Permission Issues

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules
```

### Network Issues

If you're testing against `https://insaflu.insa.pt/`:

```bash
# Test connectivity
curl -I https://insaflu.insa.pt/
ping insaflu.insa.pt
```

### Memory Issues

For large test suites:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

## Verification Steps

1. **Check Playwright installation:**
   ```bash
   npx playwright --version
   ```

2. **Test browser launch:**
   ```bash
   npx playwright open --browser=chromium https://example.com
   ```

3. **Run minimal test:**
   ```bash
   npm run test:auth -- --headed --project=chromium
   ```

## Platform-Specific Notes

### Windows (Native)
- Usually works out of the box
- May need to disable Windows Defender for test directory

### macOS
- Install Xcode command line tools: `xcode-select --install`
- May need to allow browser access in Security preferences

### Linux Server/CI
- Always use headless mode: `CI=true npm test`
- Consider using `xvfb` for display simulation

### Docker/Container
- Use official Playwright Docker images
- Mount volumes for test results: `-v $(pwd)/reports:/app/reports`

## Performance Optimization

### For Faster Tests
```bash
# Run tests in parallel
npm test -- --workers=4

# Run specific browser only
npm test -- --project=chromium

# Skip slow tests
npm test -- --grep="@slow" --invert
```

### For CI/CD
```bash
# Minimal test run
npm test -- --project=chromium --reporter=line

# Generate JUnit reports
npm test -- --reporter=junit --output-file=results.xml
```

## Next Steps

Once dependencies are resolved:

1. **Start with authentication tests:**
   ```bash
   npm run test:auth
   ```

2. **Test file uploads with small datasets:**
   ```bash
   npm run test:upload -- --grep="individual"
   ```

3. **Run full test suite:**
   ```bash
   npm test
   ```

4. **View detailed reports:**
   ```bash
   npm run report
   ```