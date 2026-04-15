/**
 * Task Controller - UI interaction and DOM manipulation layer
 * Handles user interface updates and event handling
 */

class TaskController {
    constructor(taskService, taskUtils) {
        this.service = taskService;
        this.utils = taskUtils;
        
        // DOM element references
        this.elements = {};
        
        // Bind methods to maintain context
        this.handleAddTask = this.handleAddTask.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleFilterClick = this.handleFilterClick.bind(this);
        
        // Initialize
        this.initializeElements();
        this.attachEventListeners();
        this.subscribeToServiceEvents();
        
        // Initial render
        this.render();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements = {
            todoInput: document.getElementById('todoInput'),
            addBtn: document.getElementById('addBtn'),
            todoList: document.getElementById('todoList'),
            todoCount: document.getElementById('todoCount'),
            clearCompletedBtn: document.getElementById('clearCompleted'),
            filterBtns: document.querySelectorAll('.filter-btn')
        };

        // Validate required elements
        const requiredElements = ['todoInput', 'addBtn', 'todoList', 'todoCount', 'clearCompletedBtn'];
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                console.error(`Required element not found: ${elementName}`);
            }
        }
    }

    /**
     * Attach event listeners to DOM elements
     */
    attachEventListeners() {
        // Add task button and input
        if (this.elements.addBtn) {
            this.elements.addBtn.addEventListener('click', this.handleAddTask);
        }
        
        if (this.elements.todoInput) {
            this.elements.todoInput.addEventListener('keypress', this.handleKeyPress);
        }

        // Clear completed button
        if (this.elements.clearCompletedBtn) {
            this.elements.clearCompletedBtn.addEventListener('click', () => {
                this.handleClearCompleted();
            });
        }

        // Filter buttons
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', this.handleFilterClick);
        });
    }

    /**
     * Subscribe to service events
     */
    subscribeToServiceEvents() {
        this.service.addObserver((event, data) => {
            switch (event) {
                case 'taskAdded':
                case 'taskDeleted':
                case 'taskToggled':
                case 'taskUpdated':
                case 'completedTasksCleared':
                case 'allTasksCleared':
                case 'filterChanged':
                    this.render();
                    break;
                case 'taskEditModeChanged':
                    this.handleEditModeChange(data);
                    break;
            }
        });
    }

    /**
     * Handle add task button click
     */
    handleAddTask() {
        const text = this.elements.todoInput.value;
        const result = this.service.addTask(text);
        
        if (result.success) {
            this.elements.todoInput.value = '';
            this.showMessage('Task added successfully!', 'success');
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    /**
     * Handle input key press events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyPress(event) {
        if (event.key === 'Enter') {
            this.handleAddTask();
        }
    }

    /**
     * Handle filter button clicks
     * @param {Event} event - Click event
     */
    handleFilterClick(event) {
        const filter = event.target.getAttribute('data-filter') || 
                      event.target.textContent.toLowerCase();
        
        // Update active filter button
        this.elements.filterBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Set filter in service
        this.service.setFilter(filter);
    }

    /**
     * Handle clear completed tasks
     */
    handleClearCompleted() {
        const result = this.service.clearCompleted();
        
        if (result.success) {
            this.showMessage(`Cleared ${result.count} completed tasks`, 'success');
        } else {
            this.showMessage(result.error, 'info');
        }
    }

    /**
     * Handle task toggle (complete/incomplete)
     * @param {number} id - Task ID
     */
    handleToggleTask(id) {
        const result = this.service.toggleTask(id);
        
        if (!result.success) {
            this.showMessage(result.error, 'error');
        }
    }

    /**
     * Handle task deletion
     * @param {number} id - Task ID
     */
    handleDeleteTask(id) {
        const result = this.service.deleteTask(id);
        
        if (result.success) {
            this.showMessage('Task deleted', 'info');
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    /**
     * Handle task edit initiation
     * @param {number} id - Task ID
     */
    handleEditTask(id) {
        this.service.setTaskEditMode(id, true);
    }

    /**
     * Handle task edit save
     * @param {number} id - Task ID
     * @param {string} newText - New task text
     */
    handleSaveEdit(id, newText) {
        const result = this.service.updateTask(id, newText);
        
        if (result.success) {
            this.showMessage('Task updated!', 'success');
        } else {
            this.showMessage(result.error, 'error');
        }
    }

    /**
     * Handle task edit cancellation
     * @param {number} id - Task ID
     */
    handleCancelEdit(id) {
        this.service.setTaskEditMode(id, false);
    }

    /**
     * Handle edit mode changes
     * @param {Object} data - Edit mode change data
     */
    handleEditModeChange(data) {
        if (data.editMode) {
            // Focus on edit input after DOM update
            setTimeout(() => {
                const editInput = document.querySelector(`[data-edit-id="${data.taskId}"]`);
                if (editInput) {
                    editInput.focus();
                    editInput.select();
                }
            }, 100);
        }
        this.render();
    }

    /**
     * Render the entire UI
     */
    render() {
        this.renderTasks();
        this.renderStats();
        this.renderFilterState();
    }

    /**
     * Render the task list
     */
    renderTasks() {
        if (!this.elements.todoList) return;
        
        const filteredTasks = this.service.getFilteredTasks();
        
        // Clear current list
        this.elements.todoList.innerHTML = '';
        
        // Show empty state if no tasks
        if (filteredTasks.length === 0) {
            this.renderEmptyState();
        } else {
            // Render each task
            filteredTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                this.elements.todoList.appendChild(taskElement);
            });
        }
    }

    /**
     * Create a task list item element
     * @param {Object} task - Task object
     * @returns {HTMLElement} Task list item element
     */
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);
        
        if (task.editMode) {
            li.innerHTML = this.createEditTaskHTML(task);
        } else {
            li.innerHTML = this.createDisplayTaskHTML(task);
        }
        
        return li;
    }

    /**
     * Create HTML for task in display mode
     * @param {Object} task - Task object
     * @returns {string} HTML string
     */
    createDisplayTaskHTML(task) {
        return `
            <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="taskController.handleToggleTask(${task.id})">
            <span class="todo-text">${this.utils.escapeHtml(task.text)}</span>
            <div class="todo-actions">
                <button class="edit-btn" onclick="taskController.handleEditTask(${task.id})">Edit</button>
                <button class="delete-btn" onclick="taskController.handleDeleteTask(${task.id})">Delete</button>
            </div>
        `;
    }

    /**
     * Create HTML for task in edit mode
     * @param {Object} task - Task object
     * @returns {string} HTML string
     */
    createEditTaskHTML(task) {
        return `
            <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="taskController.handleToggleTask(${task.id})">
            <input type="text" class="edit-input" value="${this.utils.escapeHtml(task.text)}" 
                   data-edit-id="${task.id}" maxlength="100"
                   onkeypress="if(event.key==='Enter') taskController.handleSaveEdit(${task.id}, this.value); else if(event.key==='Escape') taskController.handleCancelEdit(${task.id})">
            <div class="todo-actions">
                <button class="save-btn" onclick="taskController.handleSaveEdit(${task.id}, document.querySelector('[data-edit-id=\\'${task.id}\\']').value)">Save</button>
                <button class="cancel-btn" onclick="taskController.handleCancelEdit(${task.id})">Cancel</button>
            </div>
        `;
    }

    /**
     * Render empty state message
     */
    renderEmptyState() {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        
        const currentFilter = this.service.getCurrentFilter();
        let message = '';
        
        switch (currentFilter) {
            case 'active':
                message = 'No active tasks. Great job! 🎉';
                break;
            case 'completed':
                message = 'No completed tasks yet. Get started! 💪';
                break;
            default:
                message = 'No tasks yet. Add one above to get started! ✨';
        }
        
        emptyDiv.innerHTML = `
            <h3>${message}</h3>
            <p>Your productivity journey starts here.</p>
        `;
        
        this.elements.todoList.appendChild(emptyDiv);
    }

    /**
     * Render statistics
     */
    renderStats() {
        if (!this.elements.todoCount) return;
        
        const stats = this.service.getStats();
        this.elements.todoCount.textContent = this.utils.formatStatsText(stats);
        
        // Enable/disable clear completed button
        if (this.elements.clearCompletedBtn) {
            this.elements.clearCompletedBtn.disabled = stats.completedTasks === 0;
        }
    }

    /**
     * Render filter button states
     */
    renderFilterState() {
        const currentFilter = this.service.getCurrentFilter();
        
        this.elements.filterBtns.forEach(btn => {
            const btnFilter = btn.getAttribute('data-filter') || 
                             btn.textContent.toLowerCase();
            
            if (btnFilter === currentFilter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Show user message
     * @param {string} message - Message text
     * @param {string} type - Message type: 'success', 'error', 'info', 'warning'
     */
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#38a169',
            error: '#e53e3e',
            warning: '#dd6b20',
            info: '#3182ce'
        };
        
        messageDiv.style.background = colors[type] || colors.info;
        
        document.body.appendChild(messageDiv);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 3000);
    }

    /**
     * Get current UI state for testing
     * @returns {Object} Current UI state
     */
    getUIState() {
        return {
            inputValue: this.elements.todoInput ? this.elements.todoInput.value : '',
            taskCount: this.elements.todoList ? this.elements.todoList.children.length : 0,
            activeFilter: this.service.getCurrentFilter(),
            stats: this.service.getStats()
        };
    }

    /**
     * Force a full re-render
     */
    refresh() {
        this.service.loadTasks();
        this.render();
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskController;
} else {
    window.TaskController = TaskController;
}