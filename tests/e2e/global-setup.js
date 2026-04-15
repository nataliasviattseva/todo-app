/**
 * Playwright Global Setup
 * Runs before all tests to prepare the testing environment
 */

async function globalSetup(config) {
  console.log('🚀 Starting Todo App E2E Test Suite');
  console.log(`📍 Base URL: ${config.use.baseURL}`);
  console.log('⏳ Waiting for application to be ready...');
  
  // Additional global setup logic can be added here
  // For example:
  // - Database seeding
  // - Authentication setup
  // - Global configuration
  
  return async () => {
    console.log('🧹 Cleaning up after E2E tests...');
    // Global teardown logic
  };
}

module.exports = globalSetup;