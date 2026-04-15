/**
 * Task Utilities - Helper functions for task operations
 * Contains validation, formatting, and utility methods
 */

class TaskUtils {
    /**
     * Escape HTML characters to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} HTML-escaped text
     */
    static escapeHtml(text) {
        if (typeof text !== 'string') return '';
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Validate task text input
     * @param {string} text - Text to validate
     * @returns {Object} Validation result with isValid flag and error message
     */
    static validateTaskInput(text) {
        const trimmed = text ? text.trim() : '';
        
        if (trimmed.length === 0) {
            return {
                isValid: false,
                error: 'Please enter a task description'
            };
        }
        
        if (trimmed.length > 100) {
            return {
                isValid: false,
                error: 'Task must be less than 100 characters'
            };
        }
        
        return {
            isValid: true,
            error: null
        };
    }

    /**
     * Generate a timestamp string for display
     * @param {string|Date} dateInput - Date to format
     * @returns {string} Formatted date string
     */
    static formatDate(dateInput) {
        try {
            if (dateInput === null || dateInput === undefined) {
                return 'Invalid date';
            }
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid date';
        }
    }

    /**
     * Generate a relative time string (e.g., "2 hours ago")
     * @param {string|Date} dateInput - Date to calculate from
     * @returns {string} Relative time string
     */
    static getRelativeTime(dateInput) {
        try {
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) {
                return 'Unknown';
            }
            const now = new Date();
            const diffMs = now - date;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);

            if (diffSec < 60) return 'Just now';
            if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
            if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
            if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
            
            return this.formatDate(date);
        } catch (e) {
            return 'Unknown';
        }
    }

    /**
     * Generate a pluralized text based on count
     * @param {number} count - Number to check
     * @param {string} singular - Singular form
     * @param {string} plural - Plural form (optional, defaults to singular + 's')
     * @returns {string} Pluralized text
     */
    static pluralize(count, singular, plural = null) {
        if (count === 1) return `${count} ${singular}`;
        return `${count} ${plural || (singular + 's')}`;
    }

    /**
     * Generate statistics text for display
     * @param {Object} stats - Statistics object with counts
     * @returns {string} Formatted statistics text
     */
    static formatStatsText(stats) {
        const { totalTasks, activeTasks, completedTasks } = stats;
        
        if (totalTasks === 0) return 'No tasks';
        
        let text = this.pluralize(totalTasks, 'task');
        
        if (totalTasks > 0) {
            text += ` (${activeTasks} active, ${completedTasks} completed)`;
        }
        
        return text;
    }

    /**
     * Filter tasks based on completion status
     * @param {Array} tasks - Array of task objects
     * @param {string} filter - Filter type: 'all', 'active', 'completed'
     * @returns {Array} Filtered task array
     */
    static filterTasks(tasks, filter) {
        if (!Array.isArray(tasks)) return [];
        
        switch (filter) {
            case 'active':
                return tasks.filter(task => !task.completed);
            case 'completed':
                return tasks.filter(task => task.completed);
            case 'all':
            default:
                return tasks;
        }
    }

    /**
     * Sort tasks by various criteria
     * @param {Array} tasks - Array of task objects
     * @param {string} sortBy - Sort criteria: 'created', 'text', 'status'
     * @param {string} order - Sort order: 'asc' or 'desc'
     * @returns {Array} Sorted task array
     */
    static sortTasks(tasks, sortBy = 'created', order = 'desc') {
        if (!Array.isArray(tasks)) return [];
        
        const sorted = [...tasks];
        
        sorted.sort((a, b) => {
            let compareValue = 0;
            
            switch (sortBy) {
                case 'text':
                    compareValue = a.text.localeCompare(b.text);
                    break;
                case 'status':
                    compareValue = a.completed === b.completed ? 0 : (a.completed ? 1 : -1);
                    break;
                case 'created':
                default:
                    compareValue = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
            }
            
            return order === 'desc' ? -compareValue : compareValue;
        });
        
        return sorted;
    }

    /**
     * Generate task statistics
     * @param {Array} tasks - Array of task objects
     * @returns {Object} Statistics object
     */
    static calculateStats(tasks) {
        if (!Array.isArray(tasks)) {
            return {
                totalTasks: 0,
                activeTasks: 0,
                completedTasks: 0,
                completionRate: 0
            };
        }
        
        const totalTasks = tasks.length;
        const activeTasks = tasks.filter(task => !task.completed).length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        return {
            totalTasks,
            activeTasks,
            completedTasks,
            completionRate: Math.round(completionRate)
        };
    }

    /**
     * Generate a unique ID for tasks
     * @returns {string} Unique identifier
     */
    static generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `task_${timestamp}_${random}`;
    }

    /**
    /**
     * Sanitize input by removing dangerous HTML tags
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remove dangerous HTML tags and their content
        return input
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]*>/g, '');
    }

    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately on first call
     * @returns {Function} Debounced function
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * Deep clone an object (for task objects)
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskUtils;
} else {
    window.TaskUtils = TaskUtils;
}