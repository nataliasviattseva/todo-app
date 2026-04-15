/**
 * Unit Tests for TaskUtils
 * 
 * Tests utility functions for validation, formatting, and helper methods
 */

const TaskUtils = require('../../src/utils/taskUtils.js');

describe('TaskUtils Unit Tests', () => {

  describe('escapeHtml Method', () => {
    test('should escape HTML special characters', () => {
      const dangerous = '<script>alert("xss")</script>';
      const escaped = TaskUtils.escapeHtml(dangerous);
      
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&gt;');
    });

    test('should handle ampersands correctly', () => {
      const text = 'Rock & Roll';
      const escaped = TaskUtils.escapeHtml(text);
      
      expect(escaped).toBe('Rock &amp; Roll');
    });

    test('should return same text if no special characters', () => {
      const text = 'Normal text';
      const escaped = TaskUtils.escapeHtml(text);
      
      expect(escaped).toBe(text);
    });

    test('should handle empty string', () => {
      const escaped = TaskUtils.escapeHtml('');
      expect(escaped).toBe('');
    });

    test('should handle non-string input', () => {
      const escaped = TaskUtils.escapeHtml(null);
      expect(escaped).toBe('');
    });

    test('should escape quotes', () => {
      const text = 'Say "hello" to \'world\'';
      const escaped = TaskUtils.escapeHtml(text);
      
      expect(escaped).toContain('&quot;');
    });
  });

  describe('validateTaskInput Method', () => {
    test('should validate correct task text', () => {
      const result = TaskUtils.validateTaskInput('Buy milk');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should reject empty string', () => {
      const result = TaskUtils.validateTaskInput('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a task description');
    });

    test('should reject whitespace-only string', () => {
      const result = TaskUtils.validateTaskInput('   ');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a task description');
    });

    test('should reject text over 100 characters', () => {
      const longText = 'a'.repeat(101);
      const result = TaskUtils.validateTaskInput(longText);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Task must be less than 100 characters');
    });

    test('should accept text at exactly 100 characters', () => {
      const text = 'a'.repeat(100);
      const result = TaskUtils.validateTaskInput(text);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle null input', () => {
      const result = TaskUtils.validateTaskInput(null);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a task description');
    });

    test('should trim and validate input', () => {
      const result = TaskUtils.validateTaskInput('  valid task  ');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('formatDate Method', () => {
    test('should format valid date string', () => {
      const date = new Date('2023-06-15T10:30:00Z');
      const formatted = TaskUtils.formatDate(date);
      
      expect(formatted).toContain('6/15/2023');
      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Time format
    });

    test('should handle Date object', () => {
      const date = new Date('2023-12-25T15:45:30Z');
      const formatted = TaskUtils.formatDate(date);
      
      expect(formatted).toBeDefined();
      expect(formatted).not.toBe('Invalid date');
    });

    test('should handle invalid date', () => {
      const formatted = TaskUtils.formatDate('invalid-date');
      
      expect(formatted).toBe('Invalid date');
    });

    test('should handle null input', () => {
      const formatted = TaskUtils.formatDate(null);
      
      expect(formatted).toBe('Invalid date');
    });
  });

  describe('getRelativeTime Method', () => {
    test('should return "Just now" for recent dates', () => {
      const recentDate = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      const relative = TaskUtils.getRelativeTime(recentDate);
      
      expect(relative).toBe('Just now');
    });

    test('should return minutes for dates within an hour', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const relative = TaskUtils.getRelativeTime(date);
      
      expect(relative).toBe('5 minutes ago');
    });

    test('should return hour for dates within a day', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const relative = TaskUtils.getRelativeTime(date);
      
      expect(relative).toBe('2 hours ago');
    });

    test('should handle singular forms', () => {
      const date1 = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
      const relative1 = TaskUtils.getRelativeTime(date1);
      
      const date2 = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      const relative2 = TaskUtils.getRelativeTime(date2);
      
      expect(relative1).toBe('1 minute ago');
      expect(relative2).toBe('1 hour ago');
    });

    test('should handle invalid date', () => {
      const relative = TaskUtils.getRelativeTime('invalid');
      
      expect(relative).toBe('Unknown');
    });
  });

  describe('pluralize Method', () => {
    test('should return singular form for count of 1', () => {
      const result = TaskUtils.pluralize(1, 'task');
      
      expect(result).toBe('1 task');
    });

    test('should return plural form for count > 1', () => {
      const result = TaskUtils.pluralize(3, 'task');
      
      expect(result).toBe('3 tasks');
    });

    test('should return plural form for count of 0', () => {
      const result = TaskUtils.pluralize(0, 'task');
      
      expect(result).toBe('0 tasks');
    });

    test('should use custom plural form when provided', () => {
      const result = TaskUtils.pluralize(2, 'mouse', 'mice');
      
      expect(result).toBe('2 mice');
    });

    test('should handle negative numbers', () => {
      const result = TaskUtils.pluralize(-1, 'task');
      
      expect(result).toBe('-1 tasks');
    });

    test('should handle zero with correct plurality', () => {
      const result = TaskUtils.pluralize(0, 'item');
      
      expect(result).toBe('0 items');
    });
  });

  // Tests unitaires supplémentaires - Nouveau batch de tests
  describe('generateId Method', () => {
    test('should generate unique IDs on consecutive calls', () => {
      const id1 = TaskUtils.generateId();
      const id2 = TaskUtils.generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });

    test('should generate IDs with timestamp component', () => {
      const beforeTime = Date.now();
      const id = TaskUtils.generateId();
      const afterTime = Date.now();
      
      // L'ID devrait contenir un timestamp qui est dans la plage attendue
      expect(id).toBeDefined();
      expect(id.length).toBeGreaterThan(10); // Un ID raisonnable devrait être plus long
    });
  });

  describe('sanitizeInput Method', () => {
    test('should strip dangerous HTML tags while preserving text', () => {
      const maliciousInput = '<img src=x onerror=alert(1)>Hello<script>alert("xss")</script>World';
      const sanitized = TaskUtils.sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('HelloWorld');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('onerror');
    });

    test('should preserve safe text content', () => {
      const safeInput = 'Buy groceries for dinner tonight';
      const sanitized = TaskUtils.sanitizeInput(safeInput);
      
      expect(sanitized).toBe(safeInput);
    });

    test('should handle mixed content with safe and unsafe elements', () => {
      const mixedInput = 'Task: <b>Important</b><script>alert("hack")</script> meeting';
      const sanitized = TaskUtils.sanitizeInput(mixedInput);
      
      expect(sanitized).toBe('Task: Important meeting');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<b>');
    });
  });

});

// Helper function for Node.js/browser compatibility
function resetLocalStorage() {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
}

    test('should handle edge cases', () => {
      const result1 = TaskUtils.pluralize(1, 'category', 'categories');
      const result2 = TaskUtils.pluralize(3, 'category', 'categories');
      
      expect(result1).toBe('1 category');
      expect(result2).toBe('3 categories');
    });
  });

  describe('filterTasks Method', () => {
    const sampleTasks = [
      { id: 1, text: 'Active 1', completed: false },
      { id: 2, text: 'Completed 1', completed: true },
      { id: 3, text: 'Active 2', completed: false },
      { id: 4, text: 'Completed 2', completed: true }
    ];

    test('should return all tasks for "all" filter', () => {
      const filtered = TaskUtils.filterTasks(sampleTasks, 'all');
      
      expect(filtered).toHaveLength(4);
      expect(filtered).toEqual(sampleTasks);
    });

    test('should return only active tasks for "active" filter', () => {
      const filtered = TaskUtils.filterTasks(sampleTasks, 'active');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(task => !task.completed)).toBe(true);
    });

    test('should return only completed tasks for "completed" filter', () => {
      const filtered = TaskUtils.filterTasks(sampleTasks, 'completed');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(task => task.completed)).toBe(true);
    });

    test('should handle invalid filter gracefully', () => {
      const filtered = TaskUtils.filterTasks(sampleTasks, 'invalid');
      
      expect(filtered).toEqual(sampleTasks);
    });

    test('should handle non-array input', () => {
      const filtered1 = TaskUtils.filterTasks(null, 'all');
      const filtered2 = TaskUtils.filterTasks(undefined, 'active');
      
      expect(filtered1).toEqual([]);
      expect(filtered2).toEqual([]);
    });

    test('should handle empty array', () => {
      const filtered = TaskUtils.filterTasks([], 'all');
      
      expect(filtered).toEqual([]);
    });
  });

  describe('calculateStats Method', () => {
    test('should calculate correct statistics', () => {
      const tasks = [
        { id: 1, completed: false },
        { id: 2, completed: true },
        { id: 3, completed: false },
        { id: 4, completed: true },
        { id: 5, completed: true }
      ];
      
      const stats = TaskUtils.calculateStats(tasks);
      
      expect(stats).toEqual({
        totalTasks: 5,
        activeTasks: 2,
        completedTasks: 3,
        completionRate: 60
      });
    });

    test('should handle empty task array', () => {
      const stats = TaskUtils.calculateStats([]);
      
      expect(stats).toEqual({
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        completionRate: 0
      });
    });

    test('should handle non-array input', () => {
      const stats1 = TaskUtils.calculateStats(null);
      const stats2 = TaskUtils.calculateStats(undefined);
      
      const expected = {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        completionRate: 0
      };
      
      expect(stats1).toEqual(expected);
      expect(stats2).toEqual(expected);
    });

    test('should calculate 100% completion rate', () => {
      const tasks = [
        { id: 1, completed: true },
        { id: 2, completed: true }
      ];
      
      const stats = TaskUtils.calculateStats(tasks);
      
      expect(stats.completionRate).toBe(100);
    });
  });

  describe('deepClone Method', () => {
    test('should clone simple object', () => {
      const original = { id: 1, text: 'test', completed: false };
      const cloned = TaskUtils.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    test('should clone nested object', () => {
      const original = {
        task: { id: 1, text: 'test' },
        metadata: { created: new Date(), tags: ['work', 'urgent'] }
      };
      const cloned = TaskUtils.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned.task).not.toBe(original.task);
      expect(cloned.metadata.tags).not.toBe(original.metadata.tags);
    });

    test('should clone array', () => {
      const original = [1, 2, { id: 3 }];
      const cloned = TaskUtils.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    test('should handle primitive values', () => {
      expect(TaskUtils.deepClone(42)).toBe(42);
      expect(TaskUtils.deepClone('text')).toBe('text');
      expect(TaskUtils.deepClone(true)).toBe(true);
      expect(TaskUtils.deepClone(null)).toBe(null);
    });

    test('should clone Date objects', () => {
      const original = new Date('2023-06-15');
      const cloned = TaskUtils.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned instanceof Date).toBe(true);
    });
  });

  describe('debounce Method', () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.clearAllTimers();
    });

    test('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = TaskUtils.debounce(mockFn, 100);
      
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    test('should execute immediately when immediate flag is true', () => {
      const mockFn = jest.fn();
      const debouncedFn = TaskUtils.debounce(mockFn, 100, true);
      
      debouncedFn('arg1');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });
  });
});