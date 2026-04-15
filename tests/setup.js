/**
 * Test Setup Configuration
 * This file runs before all tests to set up the testing environment
 */

const { JSDOM } = require('jsdom');
require('@testing-library/jest-dom');

// Set up JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Make DOM available globally
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Helper to reset localStorage between tests
global.resetLocalStorage = () => {
  localStorageMock.clear();
  jest.clearAllMocks();
};

// Helper to create DOM elements for testing
global.createMockElement = (tag = 'div', attributes = {}) => {
  const element = document.createElement(tag);
  Object.keys(attributes).forEach(key => {
    element.setAttribute(key, attributes[key]);
  });
  return element;
};

// Setup common DOM structure for tests
beforeEach(() => {
  document.body.innerHTML = `
    <div class="container">
      <main>
        <div class="todo-form">
          <input type="text" id="todoInput" placeholder="Add a new todo..." maxlength="100">
          <button id="addBtn">Add Todo</button>
        </div>
        <div class="filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="active">Active</button>
          <button class="filter-btn" data-filter="completed">Completed</button>
        </div>
        <div class="todo-stats">
          <span id="todoCount">0 todos</span>
          <button id="clearCompleted">Clear Completed</button>
        </div>
        <ul id="todoList" class="todo-list"></ul>
      </main>
    </div>
  `;
});