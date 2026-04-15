/**
 * Task Service - Business logic layer
 * Handles task operations, filtering, and state management
 */

class TaskService {
    constructor(taskModel, taskUtils) {
        this.model = taskModel;
        this.utils = taskUtils;
        this.tasks = [];
        this.currentFilter = 'all';
        this.observers = [];
        
        // Load existing tasks
        this.loadTasks();
    }

    /**
     * Add an observer for task changes
     * @param {Function} callback - Function to call when tasks change
     */
    addObserver(callback) {
        if (typeof callback === 'function') {
            this.observers.push(callback);
        }
    }

    /**
     * Remove an observer
     * @param {Function} callback - Function to remove
     */
    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    /**
     * Notify all observers of changes
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    notifyObservers(event, data = null) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Observer error:', error);
            }
        });
    }

    /**
     * Load tasks from storage
     */
    loadTasks() {
        try {
            this.tasks = this.model.loadTasks();
            this.notifyObservers('tasksLoaded', this.tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
    }

    /**
     * Save tasks to storage
     * @returns {boolean} True if successful
     */
    saveTasks() {
        const success = this.model.saveTasks(this.tasks);
        if (success) {
            this.notifyObservers('tasksSaved', this.tasks);
        }
        return success;
    }

    /**
     * Add a new task
     * @param {string} text - Task description
     * @returns {Object} Result with success flag and task/error
     */
    addTask(text) {
        const validation = this.utils.validateTaskInput(text);
        
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error
            };
        }

        const newTask = this.model.createTask(text);
        if (!newTask) {
            return {
                success: false,
                error: 'Failed to create task'
            };
        }

        this.tasks.push(newTask);
        const saved = this.saveTasks();
        
        if (saved) {
            this.notifyObservers('taskAdded', newTask);
            return {
                success: true,
                task: newTask
            };
        } else {
            // Remove the task if save failed
            this.tasks.pop();
            return {
                success: false,
                error: 'Failed to save task'
            };
        }
    }

    /**
     * Delete a task by ID
     * @param {number} id - Task ID
     * @returns {Object} Result with success flag and task/error
     */
    deleteTask(id) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
            return {
                success: false,
                error: 'Task not found'
            };
        }

        const deletedTask = this.tasks[taskIndex];
        this.tasks.splice(taskIndex, 1);
        
        const saved = this.saveTasks();
        if (saved) {
            this.notifyObservers('taskDeleted', deletedTask);
            return {
                success: true,
                task: deletedTask
            };
        } else {
            // Restore the task if save failed
            this.tasks.splice(taskIndex, 0, deletedTask);
            return {
                success: false,
                error: 'Failed to save changes'
            };
        }
    }

    /**
     * Toggle task completion status
     * @param {number} id - Task ID
     * @returns {Object} Result with success flag and task/error
     */
    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        
        if (!task) {
            return {
                success: false,
                error: 'Task not found'
            };
        }

        const oldStatus = task.completed;
        task.completed = !task.completed;
        
        const saved = this.saveTasks();
        if (saved) {
            this.notifyObservers('taskToggled', { task, oldStatus });
            return {
                success: true,
                task: task
            };
        } else {
            // Revert the change if save failed
            task.completed = oldStatus;
            return {
                success: false,
                error: 'Failed to save changes'
            };
        }
    }

    /**
     * Update task text
     * @param {number} id - Task ID
     * @param {string} newText - New task text
     * @returns {Object} Result with success flag and task/error
     */
    updateTask(id, newText) {
        const validation = this.utils.validateTaskInput(newText);
        
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error
            };
        }

        const task = this.tasks.find(task => task.id === id);
        
        if (!task) {
            return {
                success: false,
                error: 'Task not found'
            };
        }

        const oldText = task.text;
        task.text = newText.trim();
        task.editMode = false;
        
        const saved = this.saveTasks();
        if (saved) {
            this.notifyObservers('taskUpdated', { task, oldText });
            return {
                success: true,
                task: task
            };
        } else {
            // Revert the change if save failed
            task.text = oldText;
            return {
                success: false,
                error: 'Failed to save changes'
            };
        }
    }

    /**
     * Set task edit mode
     * @param {number} id - Task ID
     * @param {boolean} editMode - Edit mode state
     */
    setTaskEditMode(id, editMode) {
        // Reset all tasks to non-edit mode first
        this.tasks.forEach(task => task.editMode = false);
        
        // Set the specific task to edit mode if requested
        if (editMode) {
            const task = this.tasks.find(task => task.id === id);
            if (task) {
                task.editMode = true;
                this.notifyObservers('taskEditModeChanged', { taskId: id, editMode: true });
            }
        } else {
            this.notifyObservers('taskEditModeChanged', { taskId: id, editMode: false });
        }
    }

    /**
     * Get filtered tasks based on current filter
     * @param {string} filter - Filter type (optional, uses current filter if not provided)
     * @returns {Array} Filtered tasks
     */
    getFilteredTasks(filter = null) {
        const activeFilter = filter || this.currentFilter;
        return this.utils.filterTasks(this.tasks, activeFilter);
    }

    /**
     * Set current filter
     * @param {string} filter - Filter type: 'all', 'active', 'completed'
     */
    setFilter(filter) {
        if (['all', 'active', 'completed'].includes(filter)) {
            this.currentFilter = filter;
            this.notifyObservers('filterChanged', filter);
        }
    }

    /**
     * Clear all completed tasks
     * @returns {Object} Result with success flag and count/error
     */
    clearCompleted() {
        const completedTasks = this.tasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            return {
                success: false,
                error: 'No completed tasks to clear'
            };
        }

        const originalTasks = [...this.tasks];
        this.tasks = this.tasks.filter(task => !task.completed);
        
        const saved = this.saveTasks();
        if (saved) {
            this.notifyObservers('completedTasksCleared', completedTasks);
            return {
                success: true,
                count: completedTasks.length
            };
        } else {
            // Restore tasks if save failed
            this.tasks = originalTasks;
            return {
                success: false,
                error: 'Failed to save changes'
            };
        }
    }

    /**
     * Clear all tasks
     * @returns {Object} Result with success flag
     */
    clearAllTasks() {
        const taskCount = this.tasks.length;
        const originalTasks = [...this.tasks];
        
        this.tasks = [];
        this.model.setNextId(1);
        
        const saved = this.saveTasks();
        if (saved) {
            this.notifyObservers('allTasksCleared', { count: taskCount });
            return {
                success: true,
                count: taskCount
            };
        } else {
            // Restore tasks if save failed
            this.tasks = originalTasks;
            return {
                success: false,
                error: 'Failed to save changes'
            };
        }
    }

    /**
     * Get task statistics
     * @returns {Object} Statistics including current filter
     */
    getStats() {
        const stats = this.utils.calculateStats(this.tasks);
        return {
            ...stats,
            currentFilter: this.currentFilter
        };
    }

    /**
     * Get task by ID
     * @param {number} id - Task ID
     * @returns {Object|null} Task object or null if not found
     */
    getTaskById(id) {
        return this.tasks.find(task => task.id === id) || null;
    }

    /**
     * Get all tasks (unfiltered)
     * @returns {Array} All tasks
     */
    getAllTasks() {
        return [...this.tasks];
    }

    /**
     * Get current filter
     * @returns {string} Current filter
     */
    getCurrentFilter() {
        return this.currentFilter;
    }

    /**
     * Export tasks as JSON
     * @returns {string} JSON string of tasks
     */
    exportTasks() {
        try {
            return JSON.stringify({
                tasks: this.tasks,
                exportDate: new Date().toISOString(),
                version: '1.0'
            }, null, 2);
        } catch (error) {
            console.error('Export error:', error);
            return null;
        }
    }

    /**
     * Import tasks from JSON
     * @param {string} jsonString - JSON string of tasks
     * @returns {Object} Result with success flag and message
     */
    importTasks(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (!data.tasks || !Array.isArray(data.tasks)) {
                return {
                    success: false,
                    error: 'Invalid data format'
                };
            }

            // Validate and clean imported tasks
            const validTasks = data.tasks
                .filter(task => task.text && typeof task.text === 'string')
                .map(task => this.model.createTask(task.text, task.id))
                .filter(task => task !== null);

            this.tasks = validTasks;
            const saved = this.saveTasks();
            
            if (saved) {
                this.notifyObservers('tasksImported', validTasks);
                return {
                    success: true,
                    message: `Imported ${validTasks.length} tasks`
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to save imported tasks'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: 'Invalid JSON format'
            };
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskService;
} else {
    window.TaskService = TaskService;
}