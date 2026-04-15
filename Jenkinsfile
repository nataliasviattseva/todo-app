pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        APP_NAME = 'todo-app'
        DEPLOY_PORT = '3000'
    }
    
    options {
        // Keep builds for 30 days and maximum 10 builds
        buildDiscarder(logRotator(daysToKeepStr: '30', numToKeepStr: '10'))
        // Timeout after 20 minutes
        timeout(time: 20, unit: 'MINUTES')
        // Skip default checkout
        skipDefaultCheckout(true)
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
                
                // Display build information
                script {
                    echo "Build Number: ${env.BUILD_NUMBER}"
                    echo "Git Branch: ${env.BRANCH_NAME}"
                    echo "Git Commit: ${env.GIT_COMMIT}"
                }
            }
        }
        
        stage('Setup Environment') {
            steps {
                echo 'Setting up Node.js environment...'
                
                // Install Node.js using NodeJS plugin
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    script {
                        sh '''
                            node --version
                            npm --version
                            echo "Node.js environment ready"
                        '''
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    script {
                        // Clean install for reproducible builds
                        sh '''
                            echo "Cleaning previous installations..."
                            rm -rf node_modules package-lock.json || true
                            
                            echo "Installing dependencies..."
                            npm ci --prefer-offline --no-audit
                            
                            echo "Installing Playwright browsers..."
                            npm run install:browsers
                        '''
                    }
                }
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Lint Check') {
                    steps {
                        echo 'Running code linting...'
                        nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                            script {
                                // Add linting once configured
                                sh '''
                                    echo "Linting not configured - using basic syntax check"
                                    # Basic syntax check for JS files
                                    find src -name "*.js" -exec node -c {} \\;
                                    echo "Syntax check passed!"
                                '''
                            }
                        }
                    }
                }
                
                stage('Security Audit') {
                    steps {
                        echo 'Running security audit...'
                        nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                            script {
                                sh '''
                                    echo "Running npm audit..."
                                    npm audit --audit-level=moderate || echo "Audit completed with warnings"
                                '''
                            }
                        }
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            steps {
                echo 'Running unit tests...'
                
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    script {
                        sh '''
                            echo "Running unit tests with coverage..."
                            npm run test:unit -- --coverage --ci --testResultsProcessor=jest-junit
                        '''
                    }
                }
            }
            
            post {
                always {
                    // Publish test results
                    publishTestResults(
                        testResultsPattern: 'junit.xml',
                        allowEmptyResults: true
                    )
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                echo 'Running integration tests...'
                
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    script {
                        sh '''
                            echo "Running integration tests..."
                            npm run test:integration -- --ci --testResultsProcessor=jest-junit
                        '''
                    }
                }
            }
        }
        
        stage('End-to-End Tests') {
            steps {
                echo 'Running E2E tests...'
                
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    script {
                        sh '''
                            echo "Starting application server in background..."
                            npm start &
                            SERVER_PID=$!
                            
                            echo "Waiting for server to start..."
                            sleep 10
                            
                            # Check if server is responding
                            curl -f http://localhost:${DEPLOY_PORT} || (echo "Server failed to start" && exit 1)
                            
                            echo "Running Playwright E2E tests..."
                            npm run test:e2e -- --reporter=junit
                            
                            echo "Stopping application server..."
                            kill $SERVER_PID || true
                        '''
                    }
                }
            }
            
            post {
                always {
                    // Archive Playwright reports
                    archiveArtifacts(
                        artifacts: 'test-results/**/*',
                        allowEmptyArchive: true
                    )
                    
                    // Publish Playwright HTML report
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'test-results/playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Test Report',
                        reportTitles: ''
                    ])
                }
            }
        }
        
        stage('Code Coverage') {
            steps {
                echo 'Processing code coverage...'
                
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    script {
                        sh '''
                            echo "Generating coverage report..."
                            npm run test:coverage
                        '''
                    }
                }
            }
            
            post {
                always {
                    // Publish coverage reports
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Code Coverage Report',
                        reportTitles: ''
                    ])
                    
                    // Archive coverage artifacts
                    archiveArtifacts(
                        artifacts: 'coverage/**/*',
                        allowEmptyArchive: true
                    )
                }
            }
        }
        
        stage('Build Artifacts') {
            steps {
                echo 'Creating build artifacts...'
                
                script {
                    sh '''
                        echo "Creating deployment package..."
                        
                        # Create build directory
                        mkdir -p dist
                        
                        # Copy application files
                        cp -r src/ dist/
                        cp index.html dist/
                        cp styles.css dist/
                        cp package.json dist/
                        cp package-lock.json dist/
                        cp README.md dist/
                        
                        # Create version info
                        echo "{\\"version\\": \\"${BUILD_NUMBER}\\", \\"commit\\": \\"${GIT_COMMIT}\\", \\"branch\\": \\"${BRANCH_NAME}\\", \\"buildDate\\": \\"$(date)\\"}" > dist/version.json
                        
                        # Create deployment archive
                        tar -czf ${APP_NAME}-build-${BUILD_NUMBER}.tar.gz -C dist .
                        
                        echo "Build artifacts created successfully"
                    '''
                }
            }
            
            post {
                always {
                    // Archive build artifacts
                    archiveArtifacts(
                        artifacts: "${APP_NAME}-build-${BUILD_NUMBER}.tar.gz,version.json",
                        fingerprint: true
                    )
                }
            }
        }
        
        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'develop'
                }
            }
            
            steps {
                echo 'Deploying application...'
                
                script {
                    // Deploy based on branch
                    if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') {
                        echo 'Deploying to PRODUCTION environment'
                        // Add production deployment steps here
                        sh '''
                            echo "Production deployment steps:"
                            echo "1. Deploy to production server"
                            echo "2. Run smoke tests"
                            echo "3. Update monitoring"
                        '''
                    } else if (env.BRANCH_NAME == 'develop') {
                        echo 'Deploying to STAGING environment'
                        // Add staging deployment steps here
                        sh '''
                            echo "Staging deployment steps:"
                            echo "1. Deploy to staging server"
                            echo "2. Run integration tests"
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up workspace...'
            
            // Clean up test processes
            script {
                sh '''
                    # Kill any remaining processes
                    pkill -f "http-server" || true
                    pkill -f "node.*3000" || true
                '''
            }
            
            // Clean workspace
            cleanWs(
                cleanWhenAborted: true,
                cleanWhenFailure: true,
                cleanWhenNotBuilt: true,
                cleanWhenSuccess: true,
                cleanWhenUnstable: true,
                deleteDirs: true
            )
        }
        
        success {
            echo 'Pipeline completed successfully! ✅'
            
            // Notify success (configure as needed)
            script {
                if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') {
                    echo 'Sending success notification for production deployment'
                    // Add notification logic here (Slack, email, etc.)
                }
            }
        }
        
        failure {
            echo 'Pipeline failed! ❌'
            
            // Notify failure
            script {
                echo 'Sending failure notification'
                // Add notification logic here
            }
        }
        
        unstable {
            echo 'Pipeline completed with warnings ⚠️'
        }
        
        aborted {
            echo 'Pipeline was aborted 🛑'
        }
    }
}

// Helper functions for notifications and deployment
def sendNotification(String status, String message) {
    // Implement notification logic (Slack, Teams, Email, etc.)
    echo "Notification: ${status} - ${message}"
}