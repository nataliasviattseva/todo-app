# Multi-stage Docker build for Todo App

# Stage 1: Build and test
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for testing)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Run tests and build
RUN npm run test:unit && npm run test:integration

# Create production build
RUN mkdir -p dist && \
    cp -r src/ dist/ && \
    cp index.html dist/ && \
    cp styles.css dist/ && \
    cp package*.json dist/

# Stage 2: Production image
FROM node:18-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create app user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set working directory
WORKDIR /app

# Copy package files
COPY --from=builder /app/dist/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files from builder stage
COPY --from=builder /app/dist/ ./

# Create version info
ARG BUILD_NUMBER=unknown
ARG GIT_COMMIT=unknown
ARG BUILD_DATE=unknown
RUN echo "{\"version\":\"${BUILD_NUMBER}\",\"commit\":\"${GIT_COMMIT}\",\"buildDate\":\"${BUILD_DATE}\",\"environment\":\"production\"}" > version.json

# Change ownership to app user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["npm", "start"]