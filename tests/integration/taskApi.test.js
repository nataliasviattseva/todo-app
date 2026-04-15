/**
 * Integration Tests for Task API/Service Layer
 * 
 * Tests the integration between TaskService, TaskModel, and TaskUtils
 * Focuses on data flow and component interaction
 */

const TaskService = require('../../src/services/taskService.js');
const TaskModel = require('../../src/models/taskModel.js');
const TaskUtils = require('../../src/utils/taskUtils.js');

describe('Task API Integration Tests', () => {
    let taskService;
    let taskModel;

    beforeEach(() => {
        resetLocalStorage();
        taskModel = new TaskModel();
        taskService = new TaskService(taskModel, TaskUtils);
    });

    describe('Service Initialization', () => {
        test('should initialize with empty task list', () => {
            expect(taskService.getAllTasks()).toEqual([]);
            expect(taskService.getCurrentFilter()).toBe('all');
        });

        test('should load existing tasks from storage', () => {
            // Pre-populate storage
            const existingTasks = [
                { id: 1, text: 'Existing task', completed: false, createdAt: new Date().toISOString(), editMode: false }
            ];
            taskModel.saveTasks(existingTasks);

            // Create new service instance
            const newService = new TaskService(taskModel, TaskUtils);

            expect(newService.getAllTasks()).toHaveLength(1);
            expect(newService.getAllTasks()[0].text).toBe('Existing task');
        });
    });

    describe('Task CRUD Operations', () => {
        describe('Adding Tasks', () => {
            test('should add valid task and persist to storage', () => {
                const result = taskService.addTask('Buy groceries');

                expect(result.success).toBe(true);
                expect(result.task.text).toBe('Buy groceries');
                expect(result.task.id).toBe(1);
                expect(result.task.completed).toBe(false);

                // Verify persistence
                const storedTasks = taskModel.loadTasks();
                expect(storedTasks).toHaveLength(1);
                expect(storedTasks[0].text).toBe('Buy groceries');
            });

            test('should increment task IDs correctly', () => {
                taskService.addTask('Task 1');
                taskService.addTask('Task 2');
                taskService.addTask('Task 3');

                const tasks = taskService.getAllTasks();
                expect(tasks[0].id).toBe(1);
                expect(tasks[1].id).toBe(2);
                expect(tasks[2].id).toBe(3);
            });

            test('should reject invalid task input', () => {
                const result1 = taskService.addTask('');
                const result2 = taskService.addTask('a'.repeat(101));

                expect(result1.success).toBe(false);
                expect(result1.error).toBe('Please enter a task description');

                expect(result2.success).toBe(false);
                expect(result2.error).toBe('Task must be less than 100 characters');

                expect(taskService.getAllTasks()).toHaveLength(0);
            });

            test('should trim whitespace from task text', () => {
                const result = taskService.addTask('  Trimmed task  ');

                expect(result.success).toBe(true);
                expect(result.task.text).toBe('Trimmed task');
            });
        });

        describe('Deleting Tasks', () => {
            beforeEach(() => {
                taskService.addTask('Task 1');
                taskService.addTask('Task 2');
                taskService.addTask('Task 3');
            });

            test('should delete existing task and update storage', () => {
                const result = taskService.deleteTask(2);

                expect(result.success).toBe(true);
                expect(result.task.text).toBe('Task 2');

                const remainingTasks = taskService.getAllTasks();
                expect(remainingTasks).toHaveLength(2);
                expect(remainingTasks.find(t => t.id === 2)).toBeUndefined();

                // Verify persistence
                const storedTasks = taskModel.loadTasks();
                expect(storedTasks).toHaveLength(2);
            });

            test('should handle non-existent task deletion', () => {
                const result = taskService.deleteTask(999);

                expect(result.success).toBe(false);
                expect(result.error).toBe('Task not found');
                expect(taskService.getAllTasks()).toHaveLength(3);
            });
        });

        describe('Updating Tasks', () => {
            beforeEach(() => {
                taskService.addTask('Original task');
            });

            test('should update task text and persist changes', () => {
                const result = taskService.updateTask(1, 'Updated task');

                expect(result.success).toBe(true);
                expect(result.task.text).toBe('Updated task');
                expect(result.task.editMode).toBe(false);

                // Verify persistence
                const storedTasks = taskModel.loadTasks();
                expect(storedTasks[0].text).toBe('Updated task');
            });

            test('should validate updated text', () => {
                const result1 = taskService.updateTask(1, '');
                const result2 = taskService.updateTask(1, 'a'.repeat(101));

                expect(result1.success).toBe(false);
                expect(result2.success).toBe(false);

                // Original text should remain unchanged
                const task = taskService.getTaskById(1);
                expect(task.text).toBe('Original task');
            });

            test('should handle non-existent task update', () => {
                const result = taskService.updateTask(999, 'New text');

                expect(result.success).toBe(false);
                expect(result.error).toBe('Task not found');
            });
        });

        describe('Toggling Tasks', () => {
            beforeEach(() => {
                taskService.addTask('Task to toggle');
            });

            test('should toggle task completion and persist', () => {
                const task = taskService.getTaskById(1);
                expect(task.completed).toBe(false);

                const result1 = taskService.toggleTask(1);
                expect(result1.success).toBe(true);
                expect(result1.task.completed).toBe(true);

                const result2 = taskService.toggleTask(1);
                expect(result2.success).toBe(true);
                expect(result2.task.completed).toBe(false);

                // Verify persistence
                const storedTasks = taskModel.loadTasks();
                expect(storedTasks[0].completed).toBe(false);
            });
        });
    });

    describe('Filtering and Statistics', () => {
        beforeEach(() => {
            taskService.addTask('Active task 1');
            taskService.addTask('Active task 2');
            taskService.addTask('Task to complete 1');
            taskService.addTask('Task to complete 2');

            // Mark some tasks as completed
            taskService.toggleTask(3);
            taskService.toggleTask(4);
        });

        test('should filter tasks correctly', () => {
            const allTasks = taskService.getFilteredTasks('all');
            const activeTasks = taskService.getFilteredTasks('active');
            const completedTasks = taskService.getFilteredTasks('completed');

            expect(allTasks).toHaveLength(4);
            expect(activeTasks).toHaveLength(2);
            expect(completedTasks).toHaveLength(2);

            expect(activeTasks.every(task => !task.completed)).toBe(true);
            expect(completedTasks.every(task => task.completed)).toBe(true);
        });

        test('should maintain filter state', () => {
            taskService.setFilter('active');
            expect(taskService.getCurrentFilter()).toBe('active');

            const filtered = taskService.getFilteredTasks();
            expect(filtered).toHaveLength(2);
        });

        test('should calculate statistics correctly', () => {
            const stats = taskService.getStats();

            expect(stats.totalTasks).toBe(4);
            expect(stats.activeTasks).toBe(2);
            expect(stats.completedTasks).toBe(2);
            expect(stats.completionRate).toBe(50);
            expect(stats.currentFilter).toBe('all');
        });
    });

    describe('Bulk Operations', () => {
        beforeEach(() => {
            taskService.addTask('Active task');
            taskService.addTask('Completed task 1');
            taskService.addTask('Completed task 2');
            taskService.addTask('Another active task');

            // Complete some tasks
            taskService.toggleTask(2);
            taskService.toggleTask(3);
        });

        test('should clear completed tasks only', () => {
            const result = taskService.clearCompleted();

            expect(result.success).toBe(true);
            expect(result.count).toBe(2);

            const remainingTasks = taskService.getAllTasks();
            expect(remainingTasks).toHaveLength(2);
            expect(remainingTasks.every(task => !task.completed)).toBe(true);

            // Verify persistence
            const storedTasks = taskModel.loadTasks();
            expect(storedTasks).toHaveLength(2);
        });

        test('should handle clearing when no completed tasks exist', () => {
            // First clear existing completed tasks
            taskService.clearCompleted();

            // Try to clear again
            const result = taskService.clearCompleted();

            expect(result.success).toBe(false);
            expect(result.error).toBe('No completed tasks to clear');
        });

        test('should clear all tasks', () => {
            const result = taskService.clearAllTasks();

            expect(result.success).toBe(true);
            expect(result.count).toBe(4);
            expect(taskService.getAllTasks()).toHaveLength(0);

            // Verify persistence
            const storedTasks = taskModel.loadTasks();
            expect(storedTasks).toHaveLength(0);
        });
    });

    describe('Event System', () => {
        test('should notify observers of task changes', () => {
            const observer = jest.fn();
            taskService.addObserver(observer);

            taskService.addTask('New task');

            expect(observer).toHaveBeenCalledWith('taskAdded', expect.any(Object));

            taskService.deleteTask(1);

            expect(observer).toHaveBeenCalledWith('taskDeleted', expect.any(Object));
        });

        test('should handle observer errors gracefully', () => {
            const badObserver = jest.fn(() => { throw new Error('Observer error'); });
            const goodObserver = jest.fn();

            taskService.addObserver(badObserver);
            taskService.addObserver(goodObserver);

            // Should not throw error
            expect(() => {
                taskService.addTask('Test task');
            }).not.toThrow();

            expect(goodObserver).toHaveBeenCalled();
        });

        test('should remove observers correctly', () => {
            const observer = jest.fn();
            taskService.addObserver(observer);
            taskService.removeObserver(observer);

            taskService.addTask('Test task');

            expect(observer).not.toHaveBeenCalled();
        });
    });

    describe('Data Import/Export', () => {
        beforeEach(() => {
            taskService.addTask('Task 1');
            taskService.addTask('Task 2');
            taskService.toggleTask(2); // Mark second task as completed
        });

        test('should export tasks as JSON', () => {
            const exported = taskService.exportTasks();

            expect(exported).toBeDefined();

            const data = JSON.parse(exported);
            expect(data.tasks).toHaveLength(2);
            expect(data.exportDate).toBeDefined();
            expect(data.version).toBe('1.0');
        });

        test('should import tasks from valid JSON', () => {
            const importData = {
                tasks: [
                    { id: 10, text: 'Imported task 1', completed: false },
                    { id: 11, text: 'Imported task 2', completed: true }
                ],
                version: '1.0'
            };

            const result = taskService.importTasks(JSON.stringify(importData));

            expect(result.success).toBe(true);
            expect(result.message).toContain('2 tasks');

            const tasks = taskService.getAllTasks();
            expect(tasks).toHaveLength(2);
            expect(tasks[0].text).toBe('Imported task 1');
            expect(tasks[1].text).toBe('Imported task 2');
        });

        test('should handle invalid import data', () => {
            const result = taskService.importTasks('invalid json');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid');
        });
    });

    // Tests d'intégration supplémentaires - Nouveau batch de tests
  describe('Task Sorting Integration', () => {
    test('should integrate sorting with service and persist sort preferences', () => {
      // Ajouter des tâches avec différents textes
      taskService.addTask('Zebra task');
      taskService.addTask('Alpha task');
      taskService.addTask('Beta task');
      
      const tasks = taskService.getAllTasks();
      expect(tasks).toHaveLength(3);

      // Trier par nom
      const sortedByName = TaskUtils.sortTasks(tasks, 'text', 'asc');
      expect(sortedByName[0].text).toBe('Alpha task');
      expect(sortedByName[1].text).toBe('Beta task');
      expect(sortedByName[2].text).toBe('Zebra task');

      // Vérifier que le service peut utiliser cette fonctionnalité
      const serviceStats = taskService.getStats();
            expect(serviceStats.totalTasks).toBe(3);
        });

        test('should handle sort integration with filtered views', () => {
            // Créer un mix de tâches complétées et actives
            taskService.addTask('Zzz Active task');
            taskService.addTask('Aaa Completed task');
            taskService.addTask('Mmm Active task');

            taskService.toggleTask(2); // Marquer comme complétée

            const activeTasks = taskService.getFilteredTasks('active');
            const sortedActive = TaskUtils.sortTasks(activeTasks, 'text', 'asc');

            expect(sortedActive).toHaveLength(2);
            expect(sortedActive[0].text).toBe('Mmm Active task');
            expect(sortedActive[1].text).toBe('Zzz Active task');
            expect(sortedActive.every(task => !task.completed)).toBe(true);
        });
    });

    describe('Advanced Task Validation Integration', () => {
        test('should integrate input sanitization with task creation workflow', () => {
            const maliciousInput = 'Task: <script>alert("xss")</script>Important<b>Meeting</b>';

            // Le service devrait utiliser TaskUtils pour sanitizer l'input
            const sanitized = TaskUtils.sanitizeInput(maliciousInput);
            const validationResult = TaskUtils.validateTaskInput(sanitized);

            expect(sanitized).toBe('Task: ImportantMeeting');
            expect(validationResult.isValid).toBe(true);

            // Ajouter la tâche avec l'input sanitizé  
            const result = taskService.addTask(sanitized);

            expect(result.success).toBe(true);
            expect(result.task.text).toBe('Task: ImportantMeeting');
            expect(result.task.text).not.toContain('<script>');

            // Vérifier la persistance avec les données sanitizées
            const storedTasks = taskModel.loadTasks();
            expect(storedTasks[0].text).toBe('Task: ImportantMeeting');
        });

        test('should handle ID generation collision prevention in service', () => {
            // Tester la génération de plusieurs IDs uniques
            const task1 = taskService.addTask('Task 1');
            const task2 = taskService.addTask('Task 2');
            const task3 = taskService.addTask('Task 3');

            expect(task1.task.id).toBe(1);
            expect(task2.task.id).toBe(2);
            expect(task3.task.id).toBe(3);

            // Les IDs générés par TaskUtils devraient être différents
            const utilsId1 = TaskUtils.generateId();
            const utilsId2 = TaskUtils.generateId();
            const utilsId3 = TaskUtils.generateId();

      expect(utilsId1).not.toBe(utilsId2);
      expect(utilsId2).not.toBe(utilsId3);
      expect(utilsId1).not.toBe(utilsId3);
      
      // Vérifier que tous les IDs sont des strings non vides
      expect(typeof utilsId1).toBe('string');
      expect(utilsId1.length).toBeGreaterThan(0);
    });
  });

  describe('Storage Error Handling', () => {
    beforeEach(() => {
      resetLocalStorage();
    });

    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const result = taskService.addTask('Test task');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save task');
      
      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });
});

// Helper function to reset localStorage for clean testing
function resetLocalStorage() {
  Object.defineProperty(window, 'localStorage', {
    value: (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i] || null
      };
    })(),
    writable: true
  });
}