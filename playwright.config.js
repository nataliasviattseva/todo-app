/**
 * Playwright Configuration for Todo App E2E Tests
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    // Test directory
    testDir: './tests/e2e',

    // Run tests in files in parallel
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code
    forbidOnly: !!process.env.CI,

    // Retry on CI only
    retries: process.env.CI ? 2 : 0,

    // Opt out of parallel tests on CI
    workers: process.env.CI ? 1 : undefined,

    // Reporter to use
    reporter: process.env.CI ? [
        ['allure-playwright', { resultsDir: './test-results/allure-results' }],
        ['html', { outputFolder: './test-results/playwright-report', open: 'never' }],
        ['junit', { outputFile: './test-results/junit-e2e.xml' }],
        ['json', { outputFile: './test-results/test-results.json' }]
    ] : [
        ['allure-playwright', { resultsDir: './test-results/allure-results' }],
        ['html', { outputFolder: './test-results/playwright-report', open: 'never' }],
        ['json', { outputFile: './test-results/test-results.json' }],
        ['junit', { outputFile: './test-results/junit-e2e.xml' }]
    ],

    // Shared settings for all the projects below
    use: {
        // Base URL to use in actions like `await page.goto('/')`
        baseURL: 'http://localhost:3000',

        // Collect trace when retrying the failed test
        trace: 'on-first-retry',

        // Record video for failed tests
        video: process.env.CI ? 'off' : 'retain-on-failure',

        // Take screenshot on failure
        screenshot: 'only-on-failure',

        // Global test timeout
        actionTimeout: 10000,

        // Navigation timeout
        navigationTimeout: 30000,

        // CI-specific browser launch options
        launchOptions: process.env.CI ? {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        } : {}
    },

    // Configure projects for major browsers
    projects: process.env.CI ? [
        // Only run Chromium in CI for stability and speed
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                headless: true,
                launchOptions: {
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding'
                    ]
                }
            },
        }
    ] : [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },

        // Test against mobile viewports
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },

        // Test against branded browsers
        {
            name: 'Microsoft Edge',
            use: { ...devices['Desktop Edge'], channel: 'msedge' },
        },
        {
            name: 'Google Chrome',
            use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        }
    ],

    // Run your  dev server before starting the tests
    webServer: process.env.CI
        ? undefined
        : {
            command: 'npm start',
            port: 3000,
            reuseExistingServer: true,
            timeout: 120000
        },

    // Output directories
    outputDir: './test-results/playwright-artifacts',

    // Global setup/teardown
    globalSetup: require.resolve('./tests/e2e/global-setup.js'),

    // Test timeout
    timeout: 30000,

    // Expect timeout
    expect: {
        timeout: 5000
    }
});