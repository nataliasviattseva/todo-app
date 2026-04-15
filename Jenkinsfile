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
            steps {
                echo 'Installing npm dependencies...'
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    sh '''
                        npm ci --prefer-offline --no-audit
                        npm run install:browsers
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
            steps {
                nodejs(nodeJSInstallationName: "Node ${NODE_VERSION}") {
                    sh '''
                        nohup npm start > app.log 2>&1 &
                        sleep 10
                        curl -f http://localhost:${DEPLOY_PORT}
                        npm run test:e2e -- --reporter=junit
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'app.log,test-results/**/*', allowEmptyArchive: true
                    junit testResults: 'test-results/**/*.xml,playwright-report/**/*.xml,results.xml', allowEmptyResults: true
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Report'
                    ])
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