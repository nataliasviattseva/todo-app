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
                    sh '''
                        node --version
                        npm --version
                    '''
                }
            }
        }

        stage('Install Dependencies') {
            environment {
                CI = 'true'
            }
            steps {
                echo 'Installing npm dependencies...'
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    sh '''
                        # Install npm packages
                        npm ci --prefer-offline --no-audit
                        
                        # Install CI-specific dependencies
                        chmod +x scripts/install-ci-deps.sh
                        npm run install:ci
                    '''
                }
            }
        }

        stage('Code Quality') {
            parallel {
                stage('Lint Check') {
                    steps {
                        nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                            sh '''
                                echo "Basic syntax check..."
                                find src -name "*.js" -exec node -c {} \\;
                            '''
                        }
                    }
                }

                stage('Security Audit') {
                    steps {
                        nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                            sh '''
                                npm audit --audit-level=moderate || true
                            '''
                        }
                    }
                }
            }
        }

        stage('Unit Tests') {
            steps {
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    sh 'npm run test:unit -- --coverage --ci'
                }
            }
            post {
                always {
                    junit testResults: 'junit.xml', allowEmptyResults: true
                }
            }
        }

        stage('Integration Tests') {
            steps {
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    sh 'npm run test:integration -- --ci'
                }
            }
            post {
                always {
                    junit testResults: 'junit.xml', allowEmptyResults: true
                }
            }
        }

        stage('End-to-End Tests') {
            environment {
                CI = 'true'
                DISPLAY = ':99'
            }
            steps {
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    sh '''
                        # Create test results directory
                        mkdir -p test-results
                        
                        # Start virtual display for headless browsers (if available)
                        if command -v Xvfb >/dev/null 2>&1; then
                            Xvfb :99 -ac -screen 0 1280x1024x16 > /dev/null 2>&1 &
                            export DISPLAY=:99
                        fi
                        
                        # Start application server in background
                        nohup npm start > app.log 2>&1 &
                        APP_PID=$!
                        echo $APP_PID > .server.pid
                        
                        # Wait for server to be ready
                        echo "Waiting for server to start..."
                        for i in {1..30}; do
                            if curl -f http://localhost:${DEPLOY_PORT} >/dev/null 2>&1; then
                                echo "Server is ready!"
                                break
                            fi
                            if [ $i -eq 30 ]; then
                                echo "Server failed to start within 30 seconds"
                                cat app.log || true
                                exit 1
                            fi
                            sleep 1
                        done
                        
                        # Run E2E tests with proper configuration
                        npm run test:e2e:ci || {
                            echo "E2E tests failed, capturing logs..."
                            tail -50 app.log || true
                            exit 1
                        }
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'app.log,test-results/**/*', allowEmptyArchive: true
                    junit testResults: 'test-results/junit-e2e.xml', allowEmptyResults: true
                    
                    // Only try to publish HTML report if it exists
                    script {
                        if (fileExists('test-results/playwright-report/index.html')) {
                            publishHTML([
                                allowMissing: true,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'test-results/playwright-report',
                                reportFiles: 'index.html',
                                reportName: 'Playwright Report'
                            ])
                        }
                    }
                }
                cleanup {
                    sh '''
                        # Kill the application server
                        if [ -f .server.pid ]; then
                            kill $(cat .server.pid) || true
                            rm -f .server.pid
                        fi
                        pkill -f http-server || true
                        pkill -f "node.*3000" || true
                    '''
                }
            }
        }

        stage('Code Coverage') {
            steps {
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    sh 'npm run test:coverage'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up workspace...'
            sh '''
                pkill -f http-server || true
                pkill -f "node.*3000" || true
            '''
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
        }
        failure {
            echo 'Pipeline failed! ❌'
        }
    }
}