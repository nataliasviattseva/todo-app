/**
 * Todo App Test Suite
 * 
 * This file contains test templates for the TodoApp class.
 * Run with: npm test
 * 
 * To get started:
 * 1. npm install
 * 2. Uncomment and modify the tests below
 * 3. Run npm test
 */

const TodoApp = require('./app.js');

// Mock localStorage for testing
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Mock DOM elements
document.getElementById = jest.fn((id) => {
  const mockElement = {
    value: '',
    innerHTML: '',
    textContent: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    addEventListener: jest.fn(),
    appendChild: jest.fn(),
    setAttribute: jest.fn()
  };
  return mockElement;
});

document.createElement = jest.fn(() => ({
  className: '',
  innerHTML: '',
  textContent: '',
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn()
  },
  appendChild: jest.fn(),
  setAttribute: jest.fn(),
  remove: jest.fn()
}));

document.querySelectorAll = jest.fn(() => []);
document.querySelector = jest.fn(() => null);

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('TodoApp', () => {
  let todoApp;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    
    // Create a new TodoApp instance for each test
    todoApp = new TodoApp();
  });

  describe('Initialization', () => {
    test('should initialize with empty todos array', () => {
      expect(todoApp.todos).toEqual([]);
    });

    test('should initialize with nextId of 1', () => {
      expect(todoApp.nextId).toBe(1);
    });

    test('should initialize with "all" filter', () => {
      expect(todoApp.filter).toBe('all');
    });
  });

  describe('Adding Todos', () => {
    test('should add a valid todo', () => {
      // Mock the input element to have a value
      todoApp.todoInput = { value: 'Test todo', focus: jest.fn() };
      
      const result = todoApp.addTodo();
      
      expect(result).toBe(true);
      expect(todoApp.todos).toHaveLength(1);
      expect(todoApp.todos[0]).toMatchObject({
        id: 1,
        text: 'Test todo',
        completed: false
      });
    });

    test('should reject empty todo text', () => {
      todoApp.todoInput = { value: '   ', focus: jest.fn() };
      
      const result = todoApp.addTodo();
      
      expect(result).toBe(false);
      expect(todoApp.todos).toHaveLength(0);
    });

    test('should reject todo text over 100 characters', () => {
      const longText = 'a'.repeat(101);
      todoApp.todoInput = { value: longText, focus: jest.fn() };
      
      const result = todoApp.addTodo();
      
      expect(result).toBe(false);
      expect(todoApp.todos).toHaveLength(0);
    });
  });

  describe('Managing Todos', () => {
    beforeEach(() => {
      // Add a test todo for these tests
      todoApp.todos = [{
        id: 1,
        text: 'Test todo',
        completed: false,
        createdAt: new Date().toISOString(),
        editMode: false
      }];
      todoApp.nextId = 2;
    });

    test('should toggle todo completion', () => {
      const result = todoApp.toggleTodo(1);
      
      expect(result).toBe(true);
      expect(todoApp.todos[0].completed).toBe(true);
    });

    test('should delete todo by id', () => {
      const result = todoApp.deleteTodo(1);
      
      expect(result).toBe(true);
      expect(todoApp.todos).toHaveLength(0);
    });

    test('should return false when deleting non-existent todo', () => {
      const result = todoApp.deleteTodo(999);
      
      expect(result).toBe(false);
      expect(todoApp.todos).toHaveLength(1);
    });

    test('should save edited todo with valid text', () => {
      const result = todoApp.saveEdit(1, 'Updated todo text');
      
      expect(result).toBe(true);
      expect(todoApp.todos[0].text).toBe('Updated todo text');
      expect(todoApp.todos[0].editMode).toBe(false);
    });

    test('should reject empty edit text', () => {
      const result = todoApp.saveEdit(1, '   ');
      
      expect(result).toBe(false);
      expect(todoApp.todos[0].text).toBe('Test todo');
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      todoApp.todos = [
        { id: 1, text: 'Active todo', completed: false, editMode: false },
        { id: 2, text: 'Completed todo', completed: true, editMode: false },
        { id: 3, text: 'Another active', completed: false, editMode: false }
      ];
    });

    test('should return all todos with "all" filter', () => {
      todoApp.filter = 'all';
      const filtered = todoApp.getFilteredTodos();
      
      expect(filtered).toHaveLength(3);
    });

    test('should return only active todos with "active" filter', () => {
      todoApp.filter = 'active';
      const filtered = todoApp.getFilteredTodos();
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(todo => !todo.completed)).toBe(true);
    });

    test('should return only completed todos with "completed" filter', () => {
      todoApp.filter = 'completed';
      const filtered = todoApp.getFilteredTodos();
      
      expect(filtered).toHaveLength(1);
      expect(filtered.every(todo => todo.completed)).toBe(true);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      todoApp.todos = [
        { id: 1, text: 'Active todo', completed: false, editMode: false },
        { id: 2, text: 'Completed todo', completed: true, editMode: false },
        { id: 3, text: 'Another active', completed: false, editMode: false }
      ];
    });

    test('should return correct statistics', () => {
      const stats = todoApp.getStats();
      
      expect(stats).toEqual({
        totalTodos: 3,
        activeTodos: 2,
        completedTodos: 1,
        currentFilter: 'all'
      });
    });
  });

  describe('Clear Operations', () => {
    beforeEach(() => {
      todoApp.todos = [
        { id: 1, text: 'Active todo', completed: false, editMode: false },
        { id: 2, text: 'Completed todo', completed: true, editMode: false },
        { id: 3, text: 'Another completed', completed: true, editMode: false }
      ];
    });

    test('should clear only completed todos', () => {
      todoApp.clearCompleted();
      
      expect(todoApp.todos).toHaveLength(1);
      expect(todoApp.todos[0].completed).toBe(false);
    });

    test('should clear all todos', () => {
      todoApp.clearAllTodos();
      
      expect(todoApp.todos).toHaveLength(0);
      expect(todoApp.nextId).toBe(1);
    });
  });

  describe('Utility Functions', () => {
    test('should escape HTML characters', () => {
      const escaped = todoApp.escapeHtml('<script>alert("test")</script>');
      
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });
  });
});

/*
To run these tests:

1. Install dependencies:
   npm install

2. Run tests:
   npm test

3. Run tests in watch mode:
   npm run test:watch

4. Generate coverage report:
   npm run test:coverage

5. View coverage report:
   Open coverage/lcov-report/index.html in your browser
*/