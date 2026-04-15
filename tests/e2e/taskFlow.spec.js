const { test, expect } = require('@playwright/test');

test.describe('Simple Todo App E2E Test', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application and clear any existing state
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Wait for application to be ready
    await page.waitForSelector('#todoInput');
  });

  test('should add, complete, and manage a todo item successfully', async ({ page }) => {
    // Verify initial empty state
    await expect(page.locator('#todoCount')).toContainText('No tasks');
    
    // Add a new todo
    const todoText = 'Buy groceries for dinner';
    await page.fill('#todoInput', todoText);
    await page.click('#addBtn');
    
    // Verify todo was added
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toContainText(todoText);
    await expect(page.locator('#todoCount')).toContainText('1 task (1 active, 0 completed)');
    
    // Complete the todo by clicking checkbox
    await page.click('.todo-checkbox');
    
    // Wait for UI to update and verify completion
    await page.waitForTimeout(200);
    await expect(page.locator('.todo-item.completed')).toHaveCount(1);
    await expect(page.locator('#todoCount')).toContainText('1 task (0 active, 1 completed)');
    
    // Verify the Clear Completed button becomes enabled
    await expect(page.locator('#clearCompleted')).toBeEnabled();
    
    // Add another todo to test filtering
    await page.fill('#todoInput', 'Plan weekend trip');
    await page.click('#addBtn');
    
    // Verify we now have 2 todos total
    await expect(page.locator('.todo-item')).toHaveCount(2);
    await expect(page.locator('#todoCount')).toContainText('2 tasks (1 active, 1 completed)');
    
    // Test filtering - click "Active" to show only active todos
    await page.click('text=Active');
    await page.waitForTimeout(100);
    
    // Should only see 1 active todo
    const visibleTodos = page.locator('.todo-item:visible');
    await expect(visibleTodos).toHaveCount(1);
    await expect(visibleTodos).toContainText('Plan weekend trip');
    
    // Click "Completed" to show only completed todos
    await page.click('text=Completed');
    await page.waitForTimeout(100);
    
    // Should only see 1 completed todo
    await expect(page.locator('.todo-item:visible')).toHaveCount(1);
    await expect(page.locator('.todo-item:visible')).toContainText('Buy groceries for dinner');
    
    // Return to "All" view
    await page.click('text=All');
    await page.waitForTimeout(100);
    
    // Should see both todos again
    await expect(page.locator('.todo-item')).toHaveCount(2);
    
    console.log('✅ E2E Test completed successfully!');
  });
});