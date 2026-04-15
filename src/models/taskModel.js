/**
 * Task Model - Data structure and persistence layer
 * Handles task data validation, storage, and retrieval
 */

class TaskModel {
    constructor() {
        this.storageKey = 'todoApp_tasks';
        this.nextIdKey = 'todoApp_nextId';
    }

    /**
     * Create a new task object with validation
     * @param {string} text - Task text content
     * @param {number} id - Optional task ID (auto-generated if not provided)
     * @returns {Object|null} Task object or null if invalid
     */
    createTask(text, id = null) {
        const trimmedText = text ? text.trim() : '';
        
        if (!this.validateTaskText(trimmedText)) {
            return null;
        }

        return {
            id: id || this.generateId(),
            text: trimmedText,
            completed: false,
            createdAt: new Date().toISOString(),
            editMode: false
        };
    }

    /**
     * Validate task text content
     * @param {string} text - Task text to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validateTaskText(text) {
        if (typeof text !== 'string') return false;
        if (text.trim().length === 0) return false;
        if (text.length > 100) return false;
        return true;
    }

    /**
     * Generate a unique ID for new tasks
     * @returns {number} New unique ID
     */
    generateId() {
        const currentId = this.getNextId();
        this.setNextId(currentId + 1);
        return currentId;
    }

    /**
     * Get the next available ID from storage
     * @returns {number} Next ID to use
     */
    getNextId() {
        try {
            const stored = localStorage.getItem(this.nextIdKey);
            return stored ? parseInt(stored, 10) : 1;
        } catch (e) {
            console.error('Error getting next ID:', e);
            return 1;
        }
    }

    /**
     * Set the next ID in storage
     * @param {number} id - ID to store
     */
    setNextId(id) {
        try {
            localStorage.setItem(this.nextIdKey, id.toString());
        } catch (e) {
            console.error('Error setting next ID:', e);
        }
    }

    /**
     * Save tasks to localStorage
     * @param {Array} tasks - Array of task objects to save
     * @returns {boolean} True if successful, false if error
     */
    saveTasks(tasks) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(tasks));
            return true;
        } catch (e) {
            console.error('Failed to save tasks:', e);
            return false;
        }
    }

    /**
     * Load tasks from localStorage
     * @returns {Array} Array of task objects
     */
    loadTasks() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return [];

            const tasks = JSON.parse(stored);
            
            // Ensure all tasks have required properties
            return tasks.map(task => ({
                id: task.id,
                text: task.text || '',
                completed: Boolean(task.completed),
                createdAt: task.createdAt || new Date().toISOString(),
                editMode: false // Always reset edit mode on load
            }));
        } catch (e) {
            console.error('Failed to load tasks:', e);
            return [];
        }
    }

    /**
     * Clear all stored data
     */
    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.nextIdKey);
        } catch (e) {
            console.error('Failed to clear storage:', e);
        }
    }

    /**
     * Get storage statistics
     * @returns {Object} Storage information
     */
    getStorageInfo() {
        try {
            const tasks = this.loadTasks();
            const nextId = this.getNextId();
            
            return {
                taskCount: tasks.length,
                nextId: nextId,
                storageSize: (localStorage.getItem(this.storageKey) || '').length,
                lastModified: tasks.length > 0 ? tasks[tasks.length - 1].createdAt : null
            };
        } catch (e) {
            console.error('Error getting storage info:', e);
            return {
                taskCount: 0,
                nextId: 1,
                storageSize: 0,
                lastModified: null
            };
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskModel;
} else {
    window.TaskModel = TaskModel;
}