#!/bin/bash

# INSaFLU Testing Suite - Dependency Installation Script
# Supports Ubuntu/Debian systems including WSL

set -e

echo "🔧 Installing Playwright dependencies for INSaFLU testing suite..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt-get >/dev/null 2>&1; then
        echo "📦 Detected Debian/Ubuntu system"

        echo "🔄 Updating package list..."
        sudo apt-get update

        echo "📚 Installing Playwright system dependencies..."
        sudo apt-get install -y \
            libgtk-4-1 \
            libgraphene-1.0-0 \
            libxslt1.1 \
            libwoff1 \
            libvpx9 \
            libevent-2.1-7 \
            libopus0 \
            gstreamer1.0-plugins-base \
            gstreamer1.0-plugins-good \
            gstreamer1.0-plugins-bad \
            gstreamer1.0-libav \
            libflite1 \
            libwebpdemux2 \
            libavif16 \
            libharfbuzz-icu0 \
            libwebpmux3 \
            libenchant-2-2 \
            libsecret-1-0 \
            libhyphen0 \
            libmanette-0.2-0 \
            libgles2 \
            libx264-164

    elif command -v yum >/dev/null 2>&1; then
        echo "📦 Detected RHEL/CentOS system"
        echo "⚠️  Please install dependencies manually or use Playwright's installer"
        echo "💡 Try: npx playwright install-deps"

    elif command -v pacman >/dev/null 2>&1; then
        echo "📦 Detected Arch Linux system"
        echo "⚠️  Please install dependencies manually or use Playwright's installer"
        echo "💡 Try: npx playwright install-deps"

    else
        echo "❌ Unsupported Linux distribution"
        echo "💡 Try: npx playwright install-deps"
        exit 1
    fi

elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detected macOS - dependencies should be handled automatically"
    echo "💡 If issues persist, ensure Xcode command line tools are installed:"
    echo "   xcode-select --install"

elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    echo "🪟 Detected Windows - dependencies should be handled automatically"
    echo "💡 If issues persist, try running as administrator"

else
    echo "❓ Unknown operating system: $OSTYPE"
    echo "💡 Try: npx playwright install-deps"
fi

echo ""
echo "🎭 Installing Playwright browsers..."
npx playwright install

echo ""
echo "✅ Installation complete!"
echo ""
echo "🧪 Test the installation:"
echo "   npm run test:auth -- --project=chromium"
echo ""
echo "📚 For more help, see SETUP.md"