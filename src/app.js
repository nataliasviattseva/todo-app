/**
 * Main Application Entry Point
 * Coordinates and initializes all application components
 */

class TodoApp {
    constructor() {
        this.model = null;
        this.service = null;
        this.controller = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize components in order
            this.initializeModel();
            this.initializeService();
            this.initializeController();
            
            // Set up global references for browser console access
            this.setupGlobalReferences();
            
            // Add CSS animations if not already present
            this.injectAnimations();
            
            this.isInitialized = true;
            
            console.log('TodoApp initialized successfully');
            
            // Dispatch custom event for testing/integration
            document.dispatchEvent(new CustomEvent('todoAppReady', {
                detail: { app: this }
            }));

        } catch (error) {
            console.error('Failed to initialize TodoApp:', error);
            this.showInitError(error.message);
        }
    }

    /**
     * Initialize the task model
     */
    initializeModel() {
        if (typeof TaskModel === 'undefined') {
            throw new Error('TaskModel class not found. Make sure taskModel.js is loaded.');
        }
        
        this.model = new TaskModel();
        console.log('TaskModel initialized');
    }

    /**
     * Initialize the task service
     */
    initializeService() {
        if (typeof TaskService === 'undefined') {
            throw new Error('TaskService class not found. Make sure taskService.js is loaded.');
        }
        
        if (typeof TaskUtils === 'undefined') {
            throw new Error('TaskUtils class not found. Make sure taskUtils.js is loaded.');
        }
        
        this.service = new TaskService(this.model, TaskUtils);
        console.log('TaskService initialized');
    }

    /**
     * Initialize the task controller
     */
    initializeController() {
        if (typeof TaskController === 'undefined') {
            throw new Error('TaskController class not found. Make sure taskController.js is loaded.');
        }
        
        this.controller = new TaskController(this.service, TaskUtils);
        console.log('TaskController initialized');
    }

    /**
     * Set up global references for browser console access and legacy compatibility
     */
    setupGlobalReferences() {
        // Make controller available globally for onclick handlers
        window.taskController = this.controller;
        
        // Legacy compatibility - expose main methods
        window.todoApp = {
            addTodo: () => this.controller.handleAddTask(),
            filterTodos: (filter) => {
                this.service.setFilter(filter);
                // Update filter button appearance
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    const btnFilter = btn.getAttribute('data-filter') || btn.textContent.toLowerCase();
                    if (btnFilter === filter) {
                        btn.classList.add('active');
                    }
                });
            },
            clearCompleted: () => this.controller.handleClearCompleted(),
            getStats: () => this.service.getStats(),
            clearAllTodos: () => {
                const result = this.service.clearAllTasks();
                if (result.success) {
                    this.controller.showMessage('All tasks cleared', 'info');
                }
            }
        };
    }

    /**
     * Inject CSS animations if not already present
     */
    injectAnimations() {
        // Check if animations are already injected
        if (document.querySelector('#todoapp-animations')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'todoapp-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .todo-item {
                animation: fadeIn 0.3s ease;
            }
            
            .todo-item.completed {
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show initialization error to user
     * @param {string} message - Error message
     */
    showInitError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e53e3e;
            color: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            z-index: 9999;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3>Application Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #e53e3e;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                margin-top: 1rem;
                cursor: pointer;
            ">Reload Page</button>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * Get application statistics and health info
     * @returns {Object} Application information
     */
    getAppInfo() {
        if (!this.isInitialized) {
            return {
                status: 'not_initialized',
                error: 'Application not yet initialized'
            };
        }

        try {
            const stats = this.service.getStats();
            const storageInfo = this.model.getStorageInfo();
            
            return {
                status: 'running',
                initialized: this.isInitialized,
                version: '1.0.0',
                statistics: stats,
                storage: storageInfo,
                components: {
                    model: !!this.model,
                    service: !!this.service,
                    controller: !!this.controller
                }
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Export application data
     * @returns {string|null} JSON string of all data
     */
    exportData() {
        if (!this.isInitialized || !this.service) {
            return null;
        }
        
        return this.service.exportTasks();
    }

    /**
     * Import application data
     * @param {string} jsonData - JSON string to import
     * @returns {Object} Import result
     */
    importData(jsonData) {
        if (!this.isInitialized || !this.service) {
            return {
                success: false,
                error: 'Application not initialized'
            };
        }
        
        return this.service.importTasks(jsonData);
    }

    /**
     * Reset application to initial state
     * @returns {boolean} Success status
     */
    reset() {
        if (!this.isInitialized || !this.service) {
            return false;
        }
        
        const result = this.service.clearAllTasks();
        if (result.success && this.controller) {
            this.controller.showMessage('Application reset successfully', 'info');
        }
        
        return result.success;
    }

    /**
     * Destroy the application and clean up
     */
    destroy() {
        try {
            // Remove global references
            delete window.taskController;
            delete window.todoApp;
            
            // Remove event listeners if controller exists
            if (this.controller) {
                // The controller's event listeners will be garbage collected
                // when the controller is dereferenced
            }
            
            // Clear references
            this.controller = null;
            this.service = null;
            this.model = null;
            this.isInitialized = false;
            
            console.log('TodoApp destroyed');
        } catch (error) {
            console.error('Error during app destruction:', error);
        }
    }
}

// Auto-initialize when script loads
let app;

// Initialize immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new TodoApp();
        app.init();
    });
} else {
    // DOM is already ready
    app = new TodoApp();
    app.init();
}

// Export for testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoApp;
} else {
    // Make available globally for console access
    window.TodoApp = TodoApp;
    window.todoAppInstance = app;
}