// Todo App JavaScript
class TodoApp {
    constructor() {
        this.todos = [];
        this.filter = 'all';
        this.nextId = 1;
        
        // DOM elements
        this.todoInput = document.getElementById('todoInput');
        this.todoList = document.getElementById('todoList');
        this.todoCount = document.getElementById('todoCount');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        
        // Initialize app
        this.init();
    }
    
    init() {
        // Load todos from localStorage
        this.loadTodos();
        
        // Add event listeners
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
        
        // Initial render
        this.render();
    }
    
    // Add a new todo
    addTodo() {
        const text = this.todoInput.value.trim();
        
        if (text === '') {
            this.showMessage('Please enter a todo item', 'error');
            return false;
        }
        
        if (text.length > 100) {
            this.showMessage('Todo must be less than 100 characters', 'error');
            return false;
        }
        
        const newTodo = {
            id: this.nextId++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            editMode: false
        };
        
        this.todos.push(newTodo);
        this.todoInput.value = '';
        this.saveTodos();
        this.render();
        
        this.showMessage('Todo added successfully!', 'success');
        return true;
    }
    
    // Delete a todo by id
    deleteTodo(id) {
        const todoIndex = this.todos.findIndex(todo => todo.id === id);
        if (todoIndex !== -1) {
            this.todos.splice(todoIndex, 1);
            this.saveTodos();
            this.render();
            this.showMessage('Todo deleted', 'info');
            return true;
        }
        return false;
    }
    
    // Toggle todo completion status
    toggleTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            return true;
        }
        return false;
    }
    
    // Edit todo text
    editTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            // Set all todos to non-edit mode first
            this.todos.forEach(t => t.editMode = false);
            todo.editMode = true;
            this.render();
            
            // Focus on edit input
            setTimeout(() => {
                const editInput = document.querySelector(`[data-edit-id="${id}"]`);
                if (editInput) {
                    editInput.focus();
                    editInput.select();
                }
            }, 100);
        }
    }
    
    // Save edited todo
    saveEdit(id, newText) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            const trimmedText = newText.trim();
            
            if (trimmedText === '') {
                this.showMessage('Todo text cannot be empty', 'error');
                return false;
            }
            
            if (trimmedText.length > 100) {
                this.showMessage('Todo must be less than 100 characters', 'error');
                return false;
            }
            
            todo.text = trimmedText;
            todo.editMode = false;
            this.saveTodos();
            this.render();
            this.showMessage('Todo updated!', 'success');
            return true;
        }
        return false;
    }
    
    // Cancel editing
    cancelEdit(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.editMode = false;
            this.render();
        }
    }
    
    // Filter todos
    filterTodos(filter) {
        this.filter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.render();
    }
    
    // Get filtered todos
    getFilteredTodos() {
        switch (this.filter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }
    
    // Clear completed todos
    clearCompleted() {
        const completedCount = this.todos.filter(todo => todo.completed).length;
        
        if (completedCount === 0) {
            this.showMessage('No completed todos to clear', 'info');
            return;
        }
        
        this.todos = this.todos.filter(todo => !todo.completed);
        this.saveTodos();
        this.render();
        this.showMessage(`Cleared ${completedCount} completed todos`, 'success');
    }
    
    // Render the todo list
    render() {
        const filteredTodos = this.getFilteredTodos();
        
        // Clear current list
        this.todoList.innerHTML = '';
        
        // Show empty state if no todos
        if (filteredTodos.length === 0) {
            this.showEmptyState();
        } else {
            // Render each todo
            filteredTodos.forEach(todo => {
                this.todoList.appendChild(this.createTodoElement(todo));
            });
        }
        
        // Update stats
        this.updateStats();
    }
    
    // Create a todo element
    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);
        
        if (todo.editMode) {
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="todoApp.toggleTodo(${todo.id})">
                <input type="text" class="edit-input" value="${this.escapeHtml(todo.text)}" 
                       data-edit-id="${todo.id}" maxlength="100"
                       onkeypress="if(event.key==='Enter') todoApp.saveEdit(${todo.id}, this.value)
                                  else if(event.key==='Escape') todoApp.cancelEdit(${todo.id})">
                <div class="todo-actions">
                    <button class="save-btn" onclick="todoApp.saveEdit(${todo.id}, document.querySelector('[data-edit-id=\\'${todo.id}\\']').value)">Save</button>
                    <button class="cancel-btn" onclick="todoApp.cancelEdit(${todo.id})">Cancel</button>
                </div>
            `;
        } else {
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="todoApp.toggleTodo(${todo.id})">
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="edit-btn" onclick="todoApp.editTodo(${todo.id})">Edit</button>
                    <button class="delete-btn" onclick="todoApp.deleteTodo(${todo.id})">Delete</button>
                </div>
            `;
        }
        
        return li;
    }
    
    // Show empty state
    showEmptyState() {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        
        let message = '';
        switch (this.filter) {
            case 'active':
                message = 'No active todos. Great job! 🎉';
                break;
            case 'completed':
                message = 'No completed todos yet. Get started! 💪';
                break;
            default:
                message = 'No todos yet. Add one above to get started! ✨';
        }
        
        emptyDiv.innerHTML = `
            <h3>${message}</h3>
            <p>Your productivity journey starts here.</p>
        `;
        
        this.todoList.appendChild(emptyDiv);
    }
    
    // Update statistics
    updateStats() {
        const totalTodos = this.todos.length;
        const activeTodos = this.todos.filter(todo => !todo.completed).length;
        const completedTodos = this.todos.filter(todo => todo.completed).length;
        
        // Update todo count
        if (totalTodos === 0) {
            this.todoCount.textContent = 'No todos';
        } else if (totalTodos === 1) {
            this.todoCount.textContent = '1 todo';
        } else {
            this.todoCount.textContent = `${totalTodos} todos`;
        }
        
        // Add active/completed info
        if (totalTodos > 0) {
            this.todoCount.textContent += ` (${activeTodos} active, ${completedTodos} completed)`;
        }
        
        // Enable/disable clear completed button
        this.clearCompletedBtn.disabled = completedTodos === 0;
    }
    
    // Save todos to localStorage
    saveTodos() {
        try {
            localStorage.setItem('todoApp_todos', JSON.stringify(this.todos));
            localStorage.setItem('todoApp_nextId', this.nextId.toString());
        } catch (e) {
            console.error('Failed to save todos:', e);
            this.showMessage('Failed to save todos', 'error');
        }
    }
    
    // Load todos from localStorage
    loadTodos() {
        try {
            const savedTodos = localStorage.getItem('todoApp_todos');
            const savedNextId = localStorage.getItem('todoApp_nextId');
            
            if (savedTodos) {
                this.todos = JSON.parse(savedTodos);
                // Ensure editMode is false for all todos
                this.todos.forEach(todo => {
                    todo.editMode = false;
                    if (!todo.createdAt) {
                        todo.createdAt = new Date().toISOString();
                    }
                });
            }
            
            if (savedNextId) {
                this.nextId = parseInt(savedNextId) || 1;
            } else if (this.todos.length > 0) {
                this.nextId = Math.max(...this.todos.map(todo => todo.id)) + 1;
            }
        } catch (e) {
            console.error('Failed to load todos:', e);
            this.todos = [];
            this.nextId = 1;
        }
    }
    
    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Show message to user
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
        switch (type) {
            case 'success':
                messageDiv.style.background = '#38a169';
                break;
            case 'error':
                messageDiv.style.background = '#e53e3e';
                break;
            case 'warning':
                messageDiv.style.background = '#dd6b20';
                break;
            default:
                messageDiv.style.background = '#3182ce';
        }
        
        document.body.appendChild(messageDiv);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 3000);
    }
    
    // Get app statistics (useful for testing)
    getStats() {
        return {
            totalTodos: this.todos.length,
            activeTodos: this.todos.filter(todo => !todo.completed).length,
            completedTodos: this.todos.filter(todo => todo.completed).length,
            currentFilter: this.filter
        };
    }
    
    // Clear all todos (useful for testing)
    clearAllTodos() {
        this.todos = [];
        this.nextId = 1;
        this.saveTodos();
        this.render();
        this.showMessage('All todos cleared', 'info');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
let todoApp;

document.addEventListener('DOMContentLoaded', function() {
    todoApp = new TodoApp();
});

// Export for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoApp;
}