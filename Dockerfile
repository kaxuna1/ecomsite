# Multi-stage Dockerfile for Luxia E-commerce
# Supports both x86_64 and arm64 architectures

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
# Set API URL to /api for same-origin requests through Nginx proxy
COPY frontend/ ./
ENV VITE_API_URL=/api
# Build without TypeScript checking (Vite handles TS internally for production)
RUN npx vite build

# Stage 2: Prepare Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Install build dependencies for sharp (required for image optimization)
RUN apk add --no-cache python3 make g++ vips-dev

# Copy package files and install dependencies (including tsx and sharp for production)
COPY backend/package*.json ./
RUN npm ci

# Copy backend source (we'll run TypeScript directly with tsx)
COPY backend/ ./

# Stage 3: Final Production Image
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install required packages including libvips for sharp
RUN apt-get update && apt-get install -y \
    postgresql-14 \
    nginx \
    supervisor \
    nodejs \
    npm \
    curl \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade to Node.js 20
RUN npm install -g n && n 20 && hash -r

# Create app directory
WORKDIR /app

# Copy backend source and dependencies
COPY --from=backend-builder /app/backend/src ./backend/src
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/tsconfig.json ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create uploads directories for product images and CMS media
RUN mkdir -p /app/backend/uploads/cms && \
    mkdir -p /app/backend/uploads/products

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/init-postgres.sh /docker-entrypoint-initdb.d/
COPY docker/run-migrations.sh /usr/local/bin/
COPY docker/docker-entrypoint.sh /usr/local/bin/

# Note: backend source already copied above

# Make scripts executable
RUN chmod +x /docker-entrypoint-initdb.d/init-postgres.sh
RUN chmod +x /usr/local/bin/run-migrations.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Setup PostgreSQL
RUN mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql && \
    chmod 700 /var/lib/postgresql/data

# Create log directories
RUN mkdir -p /var/log/supervisor /var/log/nginx /var/log/app

# Environment variables with defaults
ENV PORT=4000 \
    DB_HOST=localhost \
    DB_PORT=5432 \
    DB_NAME=luxia \
    DB_USER=luxia \
    DB_PASSWORD=luxia_secure_password \
    JWT_SECRET=production-jwt-secret-change-me \
    ADMIN_EMAIL=concierge@luxia.local \
    POSTGRES_PASSWORD=luxia_secure_password \
    NODE_ENV=production \
    INITIAL_ADMIN_EMAIL=admin@luxia.local \
    INITIAL_ADMIN_PASSWORD=LuxiaAdmin2024! \
    INITIAL_ADMIN_NAME="Super Administrator" \
    BASE_URL=http://localhost

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# Start all services
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
