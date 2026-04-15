/**
 * End-to-End Tests for Todo App User Flows
 * 
 * Tests complete user workflows using Playwright
 * Covers real browser interactions and UI behavior
 */

const { test, expect } = require('@playwright/test');

// Base URL for the application
const APP_URL = 'http://localhost:3000';

test.describe('Todo App E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to app and clear any existing data
    await page.goto(APP_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test.describe('Basic Task Operations', () => {
    
    test('should load application successfully', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('My Todo App');
      await expect(page.locator('#todoInput')).toBeVisible();
      await expect(page.locator('#addBtn')).toBeVisible();
      await expect(page.locator('.empty-state')).toBeVisible();
    });

    test('should add a new task', async ({ page }) => {
      const taskText = 'Buy groceries for dinner';
      
      // Add task
      await page.fill('#todoInput', taskText);
      await page.click('#addBtn');
      
      // Verify task appears
      await expect(page.locator('.todo-item')).toHaveCount(1);
      await expect(page.locator('.todo-text')).toContainText(taskText);
      await expect(page.locator('#todoCount')).toContainText('1 task');
      await expect(page.locator('#todoInput')).toHaveValue('');
      
      // Verify success message
      await expect(page.locator('.message')).toContainText('Task added successfully!');
    });

    test('should add task using Enter key', async ({ page }) => {
      const taskText = 'Press Enter to add';
      
      await page.fill('#todoInput', taskText);
      await page.press('#todoInput', 'Enter');
      
      await expect(page.locator('.todo-item')).toHaveCount(1);
      await expect(page.locator('.todo-text')).toContainText(taskText);
    });

    test('should prevent adding empty tasks', async ({ page }) => {
      await page.click('#addBtn');
      
      await expect(page.locator('.todo-item')).toHaveCount(0);
      await expect(page.locator('.message')).toContainText('Please enter a task description');
    });

    test('should prevent adding tasks over 100 characters', async ({ page }) => {
      const longText = 'a'.repeat(101);
      
      await page.fill('#todoInput', longText);
      await page.click('#addBtn');
      
      await expect(page.locator('.todo-item')).toHaveCount(0);
      await expect(page.locator('.message')).toContainText('Task must be less than 100 characters');
    });

    test('should complete a task', async ({ page }) => {
      // Add a task first
      await page.fill('#todoInput', 'Task to complete');
      await page.click('#addBtn');
      
      // Complete the task
      await page.check('.todo-checkbox');
      
      // Verify task is marked as completed
      await expect(page.locator('.todo-item')).toHaveClass(/completed/);
      await expect(page.locator('.todo-text')).toHaveCSS('text-decoration-line', 'line-through');
      await expect(page.locator('#todoCount')).toContainText('(0 active, 1 completed)');
    });

    test('should uncomplete a task', async ({ page }) => {
      // Add and complete a task
      await page.fill('#todoInput', 'Task to uncomplete');
      await page.click('#addBtn');
      await page.check('.todo-checkbox');
      
      // Uncomplete the task
      await page.uncheck('.todo-checkbox');
      
      // Verify task is no longer completed
      await expect(page.locator('.todo-item')).not.toHaveClass(/completed/);
      await expect(page.locator('#todoCount')).toContainText('(1 active, 0 completed)');
    });

    test('should delete a task', async ({ page }) => {
      // Add a task first
      await page.fill('#todoInput', 'Task to delete');
      await page.click('#addBtn');
      
      // Delete the task
      await page.click('.delete-btn');
      
      // Verify task is removed
      await expect(page.locator('.todo-item')).toHaveCount(0);
      await expect(page.locator('.empty-state')).toBeVisible();
      await expect(page.locator('.message')).toContainText('Task deleted');
    });
  });

  test.describe('Task Editing', () => {
    
    test('should edit a task', async ({ page }) => {
      const originalText = 'Original task text';
      const editedText = 'Edited task text';
      
      // Add a task
      await page.fill('#todoInput', originalText);
      await page.click('#addBtn');
      
      // Start editing
      await page.click('.edit-btn');
      
      // Verify edit mode
      await expect(page.locator('.edit-input')).toBeVisible();
      await expect(page.locator('.edit-input')).toHaveValue(originalText);
      await expect(page.locator('.save-btn')).toBeVisible();
      await expect(page.locator('.cancel-btn')).toBeVisible();
      
      // Edit and save
      await page.fill('.edit-input', editedText);
      await page.click('.save-btn');
      
      // Verify changes
      await expect(page.locator('.todo-text')).toContainText(editedText);
      await expect(page.locator('.edit-input')).not.toBeVisible();
      await expect(page.locator('.message')).toContainText('Task updated!');
    });

    test('should save edit with Enter key', async ({ page }) => {
      await page.fill('#todoInput', 'Task to edit');
      await page.click('#addBtn');
      
      await page.click('.edit-btn');
      await page.fill('.edit-input', 'Edited with Enter');
      await page.press('.edit-input', 'Enter');
      
      await expect(page.locator('.todo-text')).toContainText('Edited with Enter');
    });

    test('should cancel edit with Escape key', async ({ page }) => {
      const originalText = 'Original text';
      
      await page.fill('#todoInput', originalText);
      await page.click('#addBtn');
      
      await page.click('.edit-btn');
      await page.fill('.edit-input', 'Changed text');
      await page.press('.edit-input', 'Escape');
      
      await expect(page.locator('.todo-text')).toContainText(originalText);
      await expect(page.locator('.edit-input')).not.toBeVisible();
    });

    test('should cancel edit with cancel button', async ({ page }) => {
      const originalText = 'Original text';
      
      await page.fill('#todoInput', originalText);
      await page.click('#addBtn');
      
      await page.click('.edit-btn');
      await page.fill('.edit-input', 'Changed text');
      await page.click('.cancel-btn');
      
      await expect(page.locator('.todo-text')).toContainText(originalText);
    });

    test('should prevent saving empty edit', async ({ page }) => {
      await page.fill('#todoInput', 'Task to edit');
      await page.click('#addBtn');
      
      await page.click('.edit-btn');
      await page.fill('.edit-input', '');
      await page.click('.save-btn');
      
      await expect(page.locator('.message')).toContainText('Todo text cannot be empty');
      await expect(page.locator('.edit-input')).toBeVisible(); // Still in edit mode
    });
  });

  test.describe('Task Filtering', () => {
    
    test.beforeEach(async ({ page }) => {
      // Add sample tasks
      await page.fill('#todoInput', 'Active task 1');
      await page.click('#addBtn');
      
      await page.fill('#todoInput', 'Task to complete');
      await page.click('#addBtn');
      
      await page.fill('#todoInput', 'Active task 2');
      await page.click('#addBtn');
      
      // Complete one task
      await page.locator('.todo-checkbox').nth(1).check();
    });

    test('should show all tasks by default', async ({ page }) => {
      await expect(page.locator('.todo-item')).toHaveCount(3);
      await expect(page.locator('.filter-btn.active')).toContainText('All');
    });

    test('should filter active tasks', async ({ page }) => {
      await page.click('text=Active');
      
      await expect(page.locator('.todo-item')).toHaveCount(2);
      await expect(page.locator('.filter-btn.active')).toContainText('Active');
      
      // Verify only active tasks are shown
      const activeTasks = page.locator('.todo-item:not(.completed)');
      await expect(activeTasks).toHaveCount(2);
    });

    test('should filter completed tasks', async ({ page }) => {
      await page.click('text=Completed');
      
      await expect(page.locator('.todo-item')).toHaveCount(1);
      await expect(page.locator('.filter-btn.active')).toContainText('Completed');
      
      // Verify only completed tasks are shown
      const completedTasks = page.locator('.todo-item.completed');
      await expect(completedTasks).toHaveCount(1);
    });

    test('should show appropriate empty states', async ({ page }) => {
      // Clear all tasks and test empty states
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      
      // All filter - default empty state
      await expect(page.locator('.empty-state')).toContainText('No tasks yet');
      
      // Add and complete a task
      await page.fill('#todoInput', 'Task for empty state test');
      await page.click('#addBtn');
      await page.check('.todo-checkbox');
      
      // Active filter - should show "no active tasks"
      await page.click('text=Active');
      await expect(page.locator('.empty-state')).toContainText('No active tasks');
      
      // Delete the completed task
      await page.click('text=All');
      await page.click('.delete-btn');
      
      // Completed filter - should show "no completed tasks"
      await page.click('text=Completed');
      await expect(page.locator('.empty-state')).toContainText('No completed tasks yet');
    });
  });

  test.describe('Bulk Operations', () => {
    
    test.beforeEach(async ({ page }) => {
      // Add sample tasks
      const tasks = ['Task 1', 'Task 2', 'Task 3', 'Task 4'];
      
      for (const task of tasks) {
        await page.fill('#todoInput', task);
        await page.click('#addBtn');
      }
      
      // Complete some tasks
      await page.locator('.todo-checkbox').nth(1).check();
      await page.locator('.todo-checkbox').nth(3).check();
    });

    test('should clear completed tasks', async ({ page }) => {
      await page.click('#clearCompleted');
      
      await expect(page.locator('.todo-item')).toHaveCount(2);
      await expect(page.locator('.message')).toContainText('Cleared 2 completed tasks');
      
      // Verify only active tasks remain
      const completedTasks = page.locator('.todo-item.completed');
      await expect(completedTasks).toHaveCount(0);
    });

    test('should disable clear completed button when no completed tasks', async ({ page }) => {
      // Add some tasks to test with
      await page.fill('#todoInput', 'Task 1');
      await page.click('#addBtn');
      await page.fill('#todoInput', 'Task 2');
      await page.click('#addBtn');
      
      // Initially the button should be disabled (no completed tasks)
      await expect(page.locator('#clearCompleted')).toBeDisabled();
      
      // Complete one task (click the first checkbox)
      await page.click('.todo-checkbox');
      
      // Wait for UI to update
      await page.waitForTimeout(100);
      
      // Now button should be enabled
      await expect(page.locator('#clearCompleted')).toBeEnabled();
      
      // Clear completed tasks
      await page.click('#clearCompleted');
      
      // Wait for UI to update
      await page.waitForTimeout(100);
      
      // Button should be disabled again
      await expect(page.locator('#clearCompleted')).toBeDisabled();
    });
  });

  test.describe('Statistics and UI Updates', () => {
    
    test('should update task count dynamically', async ({ page }) => {
      await expect(page.locator('#todoCount')).toContainText('No todos');
      
      // Add first task
      await page.fill('#todoInput', 'First task');
      await page.click('#addBtn');
      await expect(page.locator('#todoCount')).toContainText('1 task (1 active, 0 completed)');
      
      // Add second task
      await page.fill('#todoInput', 'Second task');
      await page.click('#addBtn');
      await expect(page.locator('#todoCount')).toContainText('2 tasks (2 active, 0 completed)');
      
      // Complete one task
      await page.locator('.todo-checkbox').first().check();
      await expect(page.locator('#todoCount')).toContainText('2 tasks (1 active, 1 completed)');
    });

    test('should show notification messages', async ({ page }) => {
      // Success message
      await page.fill('#todoInput', 'Test task');
      await page.click('#addBtn');
      await expect(page.locator('.message.success')).toBeVisible();
      
      // Wait for message to disappear
      await page.waitForTimeout(3500);
      await expect(page.locator('.message')).not.toBeVisible();
      
      // Error message
      await page.click('#addBtn'); // Try to add empty task
      await expect(page.locator('.message.error')).toBeVisible();
    });
  });

  test.describe('Persistence and Data Recovery', () => {
    
    test('should persist tasks across page reloads', async ({ page }) => {
      // Add tasks
      await page.fill('#todoInput', 'Persistent task 1');
      await page.click('#addBtn');
      
      await page.fill('#todoInput', 'Persistent task 2');
      await page.click('#addBtn');
      
      // Complete one task
      await page.locator('.todo-checkbox').first().check();
      
      // Reload page
      await page.reload();
      
      // Verify tasks are still there
      await expect(page.locator('.todo-item')).toHaveCount(2);
      await expect(page.locator('.todo-item.completed')).toHaveCount(1);
      await expect(page.locator('#todoCount')).toContainText('2 tasks (1 active, 1 completed)');
    });

    test('should maintain filter state across operations', async ({ page }) => {
      // Add and complete tasks
      await page.fill('#todoInput', 'Active task');
      await page.click('#addBtn');
      
      await page.fill('#todoInput', 'Task to complete');
      await page.click('#addBtn');
      await page.locator('.todo-checkbox').nth(1).check();
      
      // Set filter to active
      await page.click('text=Active');
      await expect(page.locator('.todo-item')).toHaveCount(1);
      
      // Add another task - should still show filtered view
      await page.fill('#todoInput', 'Another active task');
      await page.click('#addBtn');
      await expect(page.locator('.todo-item')).toHaveCount(2);
      
      // Switch to completed filter
      await page.click('text=Completed');
      await expect(page.locator('.todo-item')).toHaveCount(1);
    });
  });

  test.describe('Accessibility and Keyboard Navigation', () => {
    
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through elements
      await page.keyboard.press('Tab');
      await expect(page.locator('#todoInput')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('#addBtn')).toBeFocused();
      
      // Add task with keyboard
      await page.focus('#todoInput');
      await page.type('#todoInput', 'Keyboard added task');
      await page.keyboard.press('Enter');
      
      await expect(page.locator('.todo-item')).toHaveCount(1);
    });

    test('should provide proper ARIA labels and roles', async ({ page }) => {
      await page.fill('#todoInput', 'Test task');
      await page.click('#addBtn');
      
      // Check for proper form elements
      await expect(page.locator('#todoInput')).toHaveAttribute('type', 'text');
      await expect(page.locator('.todo-checkbox')).toHaveAttribute('type', 'checkbox');
      
      // Check for proper list structure
      await expect(page.locator('.todo-list')).toHaveRole('list');
      await expect(page.locator('.todo-item')).toHaveRole('listitem');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle rapid successive operations', async ({ page }) => {
      const tasks = ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5'];
      
      // Rapidly add multiple tasks
      for (const task of tasks) {
        await page.fill('#todoInput', task);
        await page.click('#addBtn');
      }
      
      await expect(page.locator('.todo-item')).toHaveCount(5);
      
      // Rapidly toggle completion
      for (let i = 0; i < 5; i++) {
        await page.locator('.todo-checkbox').nth(i).check();
      }
      
      await expect(page.locator('.todo-item.completed')).toHaveCount(5);
      await expect(page.locator('#todoCount')).toContainText('(0 active, 5 completed)');
    });

    test('should handle special characters in task text', async ({ page }) => {
      const specialText = '<script>alert("test")</script> & "quotes" \'apostrophes\'';
      
      await page.fill('#todoInput', specialText);
      await page.click('#addBtn');
      
      // Verify text is properly escaped and displayed
      await expect(page.locator('.todo-text')).toContainText(specialText);
      
      // Verify no script execution (page should still be normal)
      await expect(page.locator('h1')).toContainText('My Todo App');
    });

    test('should handle browser back/forward navigation', async ({ page }) => {
      // Add a task
      await page.fill('#todoInput', 'Navigation test');
      await page.click('#addBtn');
      
      // Filter to active using more specific selector
      await page.click('.filter-btn:has-text("Active")');
      
      // Wait for filter to apply
      await page.waitForTimeout(100);
      
      // Verify filter is active
      await expect(page.locator('.filter-btn.active')).toContainText('Active');
      
      // Navigate to a different page and back (note: filter state will reset)
      await page.goto('about:blank');
      await page.goBack();
      
      // Verify state is restored (filter resets to All, but task is preserved)
      await expect(page.locator('.todo-item')).toHaveCount(1);
      await expect(page.locator('.filter-btn.active')).toContainText('All');
      await expect(page.locator('.todo-text')).toContainText('Navigation test');
    });
  });

  // Test E2E supplémentaire - Workflow avancé complet
  test.describe('Advanced User Workflows', () => {
    
    test('should handle complex multi-step user scenario with data validation', async ({ page }) => {
      // Scénario complexe: Créer plusieurs tâches, les modifier, filtrer, nettoyer
      const taskTexts = [
        'Acheter des provisions pour la semaine',
        'Préparer la présentation client',
        'Réviser le code de l\'équipe',
        'Planifier les vacances d\'été'
      ];

      // Étape 1: Ajouter plusieurs tâches
      for (const taskText of taskTexts) {
        await page.fill('#todoInput', taskText);
        await page.click('#addBtn');
      }
      
      await expect(page.locator('.todo-item')).toHaveCount(4);

      // Étape 2: Marquer certaines tâches comme complétées
      await page.locator('.todo-checkbox').nth(0).check(); // Provisions
      await page.locator('.todo-checkbox').nth(2).check(); // Code review
      
      await expect(page.locator('.todo-item.completed')).toHaveCount(2);
      await expect(page.locator('#todoCount')).toContainText('4 tasks (2 active, 2 completed)');

      // Étape 3: Modifier une tâche active
      await page.locator('.edit-btn').nth(1).click(); // Modifier la présentation
      await page.fill('.edit-input', 'Finaliser la présentation client pour lundi');
      await page.press('.edit-input', 'Enter');
      
      await expect(page.locator('.todo-text').nth(1)).toContainText('Finaliser la présentation client pour lundi');

      // Étape 4: Filtrer les tâches actives
      await page.click('text=Active');
      await expect(page.locator('.todo-item')).toHaveCount(2);
      await expect(page.locator('.filter-btn.active')).toContainText('Active');

      // Étape 5: Ajouter une nouvelle tâche en mode filtré
      await page.fill('#todoInput', 'Appeler le client pour confirmer le RDV');
      await page.click('#addBtn');
      await expect(page.locator('.todo-item')).toHaveCount(3); // Nouvelles tâches actives

      // Étape 6: Revenir à la vue "All" et nettoyer les tâches complétées
      await page.click('text=All');
      await expect(page.locator('.todo-item')).toHaveCount(5); // Total avec la nouvelle tâche
      await page.click('#clearCompleted');
      
      await expect(page.locator('.todo-item')).toHaveCount(3); // Seulement les actives restent
      await expect(page.locator('.message')).toContainText('Cleared 2 completed tasks');

      // Étape 7: Vérifier la persistance en rechargeant la page
      await page.reload();
      await expect(page.locator('.todo-item')).toHaveCount(3);
      await expect(page.locator('#todoCount')).toContainText('3 tasks (3 active, 0 completed)');
      
      // Vérifier que les bonnes tâches sont présentes
      await expect(page.locator('.todo-text')).toContainText('Finaliser la présentation client pour lundi');
      await expect(page.locator('.todo-text')).toContainText('Planifier les vacances d\'été');
      await expect(page.locator('.todo-text')).toContainText('Appeler le client pour confirmer le RDV');
    });
  });

});