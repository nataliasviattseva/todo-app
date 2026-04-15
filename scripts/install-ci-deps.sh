#!/bin/bash

# Install CI dependencies for Playwright
echo "Installing CI dependencies for Playwright E2E tests..."

# Create test results directory
mkdir -p test-results

# Check if running in CI environment
if [ "$CI" = "true" ]; then
    echo "CI environment detected, installing headless browser dependencies..."
    
    # Install system dependencies if apt-get is available (Ubuntu/Debian)
    if command -v apt-get >/dev/null 2>&1; then
        echo "Installing system dependencies with apt-get..."
        apt-get update || echo "Failed to update package list"
        apt-get install -y --no-install-recommends \
            libx11-6 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
            libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
            libxtst6 ca-certificates fonts-liberation libappindicator1 \
            libnss3 lsb-release xdg-utils wget libxcb-shm0 \
            libgtk-3-0 libgdk-3-0 libpangocairo-1.0-0 libpango-1.0-0 \
            libatk-1.0-0 libcairo-gobject2 libcairo2 libgdk-pixbuf2.0-0 \
            libgio-2.0-0 libgobject-2.0-0 libglib-2.0-0 libasound2 \
            libdbus-1-3 xvfb || echo "System dependencies installation failed, proceeding with minimal setup"
    fi
    
    # Install only Chromium for CI
    echo "Installing Chromium browser for CI..."
    npx playwright install chromium || {
        echo "Browser installation failed, attempting minimal install..."
        npx playwright install-deps chromium || echo "Deps install failed, proceeding with existing setup"
    }
else
    echo "Local development environment, installing all browsers..."
    npx playwright install
fi

echo "CI dependencies installation completed!"