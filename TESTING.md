# Testing Setup Guide

## Quick Reference Commands

```bash
# Development
npm start                # Run application (http://localhost:3000)
npm run dev              # Development server with no caching

# All Tests
npm run test:all         # Run complete test suite (unit + integration + e2e)
npm test                 # Run unit and integration tests only

# Individual Test Types  
npm run test:unit        # Unit tests for TaskUtils
npm run test:integration # Integration tests for TaskService
npm run test:e2e         # End-to-end browser tests

# E2E Test Variations
npm run test:e2e:ui      # Interactive Playwright UI
npm run test:e2e:headed  # Run with visible browser
npm run test:e2e:debug   # Debug mode with breakpoints

# Development Testing
npm run test:watch       # Watch mode for jest tests
npm run test:coverage    # Generate coverage reports

# Setup
npm install              # Install all dependencies
npm run install:browsers # Install Playwright browsers
```

## Test Architecture Summary

### 1. Unit Tests (`tests/unit/`)
**Purpose**: Test individual functions in isolation
**Framework**: Jest with JSDOM
**Coverage**: TaskUtils validation, formatting, filtering functions

**Example Test**:
```javascript
test('escapeHtml should prevent XSS attacks', () => {
  const maliciousInput = '<script>alert("xss")</script>';
  const escaped = TaskUtils.escapeHtml(maliciousInput);
  expect(escaped).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
});
```

### 2. Integration Tests (`tests/integration/`)
**Purpose**: Test component interactions and data flow
**Framework**: Jest with mocked DOM
**Coverage**: TaskService-TaskModel integration, observer patterns, API workflows

**Example Test**:
```javascript
test('should persist tasks across reload simulation', () => {
  taskService.addTask('Persistent task');
  // Simulate page reload
  const newModel = new TaskModel();
  const newService = new TaskService(newModel);
  expect(newService.getAllTasks()).toHaveLength(1);
});
```

### 3. End-to-End Tests (`tests/e2e/`)
**Purpose**: Test complete user workflows in real browser
**Framework**: Playwright
**Coverage**: User interactions, UI behavior, browser compatibility

**Example Test**:
```javascript
test('should add a new task', async ({ page }) => {
  await page.fill('#todoInput', 'Buy groceries');
  await page.click('#addBtn');
  await expect(page.locator('.todo-item')).toHaveCount(1);
  await expect(page.locator('.todo-text')).toContainText('Buy groceries');
});
```

## Test Reports Locations

| Test Type | Report Location | Format |
|-----------|----------------|--------|
| Jest Coverage | `coverage/lcov-report/index.html` | HTML |
| Jest Results | Terminal output | Text |
| Playwright | `test-results/playwright-report/index.html` | HTML |
| JUnit XML | `test-results/junit.xml` | XML |

## Browser Coverage (E2E Tests)

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Mobile Chrome, Mobile Safari
- **Branded**: Google Chrome, Microsoft Edge

## Coverage Thresholds

All code coverage maintained at **80%** minimum:
- **Branches**: 80%
- **Functions**: 80% 
- **Lines**: 80%
- **Statements**: 80%

## Testing Best Practices Applied

### Unit Tests
- ✅ Pure function testing
- ✅ Edge case coverage
- ✅ Input validation testing
- ✅ Error condition testing

### Integration Tests  
- ✅ Observer pattern testing
- ✅ Data persistence testing
- ✅ Component communication testing
- ✅ State management testing

### E2E Tests
- ✅ Complete user workflows
- ✅ Cross-browser compatibility
- ✅ Mobile device testing
- ✅ Accessibility testing
- ✅ Error handling testing

## Debugging Tests

### Jest Tests
```bash
npm run test:watch     # Watch mode - tests re-run on file changes
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

### Playwright Tests
```bash
npm run test:e2e:debug    # Step through tests with browser DevTools
npm run test:e2e:headed   # See tests run in real browser
npm run test:e2e:ui       # Interactive test runner with timeline
```

## CI/CD Integration

Tests are configured for CI environments with:
- **Retry Logic**: 2 retries on CI, 0 locally
- **Parallel Execution**: Optimized for CI performance
- **Multiple Formats**: JUnit XML, JSON, HTML reports
- **Artifact Collection**: Screenshots, videos, traces on failure

## Adding New Tests

### For New Utility Functions:
1. Add unit tests in `tests/unit/`
2. Test pure functions, edge cases, validation
3. Maintain 80%+ coverage

### For New Components:
1. Add integration tests in `tests/integration/`
2. Test component interactions and data flow
3. Mock dependencies appropriately

### For New User Features:
1. Add E2E tests in `tests/e2e/`
2. Test complete user workflows
3. Include accessibility and error scenarios

## Troubleshooting

### Jest Issues
- **Module not found**: Check file paths and imports
- **JSDOM errors**: Ensure DOM setup in test environment
- **Coverage gaps**: Run with `--coverage` to identify missing tests

### Playwright Issues
- **Browser not found**: Run `npm run install:browsers`
- **Timeout errors**: Increase timeout in `playwright.config.js`
- **Element not found**: Use proper selectors and wait conditions

### Common Fixes
- Clear test caches: `npm run clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Update browsers: `npx playwright install`