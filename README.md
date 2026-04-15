# Todo App

A modern, modular todo application built with vanilla JavaScript following MVC architecture principles. Features comprehensive testing infrastructure with unit, integration, and end-to-end tests.

## 🚀 Features

- **Modular Architecture**: Clean separation of concerns with Model-View-Controller pattern
- **Task Management**: Add, edit, delete, and toggle completion status of tasks
- **Data Persistence**: Tasks saved to localStorage with automatic recovery
- **Smart Filtering**: Filter tasks by status (All, Active, Completed)
- **Bulk Operations**: Clear completed tasks with a single action
- **Real-time Updates**: Live task counts and statistics
- **Input Validation**: Text length validation and XSS protection
- **Responsive Design**: Works across different screen sizes
- **Comprehensive Testing**: Unit, integration, and E2E test coverage

## 📁 Project Structure

```
todo-app/
├── src/                          # Source code
│   ├── models/
│   │   └── taskModel.js         # Data layer - task persistence & validation
│   ├── services/
│   │   └── taskService.js       # Business logic - CRUD operations & events
│   ├── controllers/
│   │   └── taskController.js    # UI layer - DOM manipulation & user interactions
│   ├── utils/
│   │   └── taskUtils.js         # Utilities - validation, formatting, helpers
│   └── app.js                   # Application coordinator - dependency injection
├── tests/                        # Test suites
│   ├── unit/                    # Unit tests for individual components
│   │   └── taskUtils.test.js    # Tests for utility functions
│   ├── integration/             # Integration tests for component interaction
│   │   └── taskApi.test.js      # Tests for service-model integration
│   ├── e2e/                     # End-to-end tests for user workflows
│   │   ├── taskFlow.spec.js     # Complete user journey tests
│   │   └── global-setup.js      # Playwright global setup
│   └── setup.js                 # Jest test configuration
├── index.html                   # Entry point
├── styles.css                   # Application styling
├── package.json                 # Dependencies and scripts
├── playwright.config.js         # E2E test configuration
└── README.md                    # This file
```

## 🏗️ Architecture

### Model-View-Controller Pattern

- **Model** (`TaskModel`): Handles data persistence, validation, and storage operations
- **Service** (`TaskService`): Contains business logic, CRUD operations, and event management using observer pattern
- **Controller** (`TaskController`): Manages UI interactions, DOM manipulation, and user input handling
- **Utils** (`TaskUtils`): Provides utility functions for validation, formatting, and data processing
- **App** (`App`): Application coordinator that initializes components and manages dependencies

### Data Flow

```
User Interaction → Controller → Service → Model → LocalStorage
                            ↓
                      Observer Events ← Service
                            ↓
                      UI Updates ← Controller
```

## 🧪 Testing Strategy

### Three-Tier Testing Approach

1. **Unit Tests** - Test individual functions and methods in isolation
2. **Integration Tests** - Test component interactions and data flow
3. **End-to-End Tests** - Test complete user workflows in real browser environment

### Test Coverage

- **Unit Tests**: TaskUtils validation, formatting, and helper functions
- **Integration Tests**: TaskService-TaskModel interactions, data persistence, observer patterns
- **E2E Tests**: Complete user journeys, UI interactions, accessibility, error handling

## � CI/CD Pipeline

### Jenkins Pipeline

The project includes a comprehensive Jenkins pipeline with:

- **Automated Testing**: Unit, integration, and E2E tests
- **Code Quality**: Linting and security audits  
- **Coverage Reports**: HTML and LCOV coverage reports
- **Multi-browser Testing**: Chrome, Firefox, Safari, Edge
- **Automated Deployment**: Staging and production environments
- **Notifications**: Success/failure notifications support

#### Pipeline Configuration

```bash
# Required Jenkins plugins
- NodeJS Plugin
- HTML Publisher Plugin  
- JUnit Plugin
- Pipeline Plugin

# Environment setup
Node.js 18.x configured in Jenkins Global Tools
```

#### Usage

```bash
# Trigger pipeline
git push origin main        # Deploys to production
git push origin develop     # Deploys to staging
git push origin feature/*   # Tests only
```

See [JENKINS.md](JENKINS.md) for detailed configuration guide.

### Docker Deployment

Alternative containerized deployment option:

```bash
# Build Docker image
docker build -t todo-app:latest .

# Run container
docker run -p 3000:3000 --name todo-app-container todo-app:latest

# Health check
curl http://localhost:3000
```

### Manual Deployment

Using the included deployment script:

```bash
# Make script executable (Linux/Mac)
chmod +x deploy.sh

# Deploy to staging
./deploy.sh staging

# Deploy to production
./deploy.sh production v1.2.3
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 16+ (for running tests and development server)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/todo-app.git
cd todo-app
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers for E2E testing:
```bash
npm run install:browsers
```

## 🚀 Running the Application

### Development Server

```bash
npm start          # Starts server on http://localhost:3000
npm run dev        # Development server with no caching
```

Simply open your browser to `http://localhost:3000` to use the application.

## ✅ Testing

### Run All Tests
```bash
npm run test:all      # Runs unit, integration, and E2E tests
npm test              # Runs unit and integration tests only
```

### Individual Test Types
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # E2E tests only
```

### E2E Test Options
```bash
npm run test:e2e:ui      # Run with Playwright UI mode
npm run test:e2e:headed  # Run with visible browser
npm run test:e2e:debug   # Run in debug mode
```

### Development Testing
```bash
npm run test:watch       # Watch mode for unit/integration tests
npm run test:coverage    # Generate coverage reports
```

### Test Reports

- **Jest Coverage**: `coverage/lcov-report/index.html`
- **Playwright Report**: `test-results/playwright-report/index.html`
- **JUnit XML**: `test-results/junit.xml`

## 🔧 Configuration

### Jest Configuration

The Jest setup includes:
- JSDOM environment for DOM testing
- Testing Library utilities for better assertions
- Coverage reporting with 80% thresholds
- Automatic test discovery in `/tests` directory

### Playwright Configuration

E2E tests run across multiple browsers:
- Chrome, Firefox, Safari (WebKit)
- Mobile Chrome, Mobile Safari  
- Microsoft Edge, Google Chrome
- Configurable viewports and device emulation

## 📚 Usage Examples

### Adding a Task
```javascript
// User types "Buy groceries" and clicks Add or presses Enter
// TaskController handles the input
// TaskService validates and processes the task
// TaskModel persists to localStorage
// UI updates with new task and updated counts
```

### Editing a Task
```javascript
// User clicks edit button on existing task
// TaskController switches to edit mode
// User modifies text and saves
// TaskService updates the task data
// TaskModel persists changes
// UI reflects the updated task
```

### Filtering Tasks
```javascript
// User clicks "Active" filter button
// TaskController updates the current filter
// TaskService applies filter logic
// UI shows only active tasks
// Empty state appears if no active tasks exist
```

## 🔒 Security

- **XSS Protection**: All user input is escaped before rendering to DOM
- **Input Validation**: Text length limits and content validation
- **Safe DOM Manipulation**: Uses modern DOM APIs safely
- **No eval() Usage**: Static code execution only

## 🎨 Styling

The application uses modern CSS with:
- CSS Grid and Flexbox for responsive layouts
- CSS Custom Properties (variables) for theming
- Semantic HTML structure for accessibility
- Mobile-first responsive design

## 🚀 Performance

- **Vanilla JavaScript**: No framework overhead
- **Efficient DOM Updates**: Targeted element updates only
- **Local Storage**: Fast client-side persistence
- **Event Delegation**: Optimized event handling
- **Lazy Loading**: Components loaded as needed

## 📱 Browser Support

- **Modern Browsers**: Chrome 76+, Firefox 70+, Safari 13+, Edge 79+
- **Mobile Browsers**: iOS Safari 13+, Android Chrome 76+
- **Progressive Enhancement**: Graceful degradation for older browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the existing architecture
4. Add tests for new functionality
5. Ensure all tests pass: `npm run test:all`
6. Commit your changes: `git commit -m 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

### Development Guidelines

- Follow the existing modular architecture
- Add unit tests for new utility functions
- Add integration tests for component interactions
- Add E2E tests for new user workflows
- Maintain test coverage above 80%
- Use semantic HTML and accessible markup
- Follow JavaScript ES6+ conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with vanilla JavaScript for maximum compatibility
- Inspired by TodoMVC specifications
- Testing architecture following modern best practices
- Accessibility guidelines following WCAG standards
- `render()` - Update the DOM with current state
- `createTodoElement(todo)` - Generate HTML for a todo item  
- `showMessage(message, type)` - Display user feedback

## Testing

The application is designed with testing in mind:

```bash
# Install test dependencies
npm install

# Run tests (once you create them)
npm test

# Run tests in watch mode  
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test-Ready Features
- Separated business logic from DOM manipulation
- Public methods for all core functionality
- Predictable state management
- Easy-to-mock localStorage operations
- Statistics methods for assertions

## Browser Support

- Chrome 60+ ✅
- Firefox 55+ ✅  
- Safari 12+ ✅
- Edge 79+ ✅

## Customization

### Styling
Modify `styles.css` to customize:
- Colors and themes
- Layout and spacing
- Responsive breakpoints
- Animations and transitions

### Functionality  
Extend `app.js` to add:
- Todo categories/tags
- Due dates and reminders
- Priority levels
- Import/export functionality
- Drag and drop reordering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Ready to boost your productivity?** Start adding your first todo! 🚀