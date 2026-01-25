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

# Build backend for production
RUN npm run build

# Stage 3: Final Production Image
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install required packages including libvips for sharp
RUN apt-get update && apt-get install -y \
    postgresql-14 \
    redis-server \
    nginx \
    supervisor \
    nodejs \
    npm \
    curl \
    ca-certificates \
    python3 \
    make \
    g++ \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade to Node.js 20
RUN npm install -g n && n 20 && hash -r

# Create app directory
WORKDIR /app

# Install backend production dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev
WORKDIR /app

# Copy backend build output
COPY --from=backend-builder /app/backend/dist ./backend/dist
RUN mkdir -p /app/backend/dist/scripts
COPY backend/src/scripts/translationsSeed.sql ./backend/dist/scripts/

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
COPY docker/start-backend.sh /usr/local/bin/
COPY docker/docker-entrypoint.sh /usr/local/bin/

# Note: backend source already copied above

# Make scripts executable
RUN chmod +x /docker-entrypoint-initdb.d/init-postgres.sh
RUN chmod +x /usr/local/bin/run-migrations.sh
RUN chmod +x /usr/local/bin/start-backend.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Setup PostgreSQL
RUN mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql && \
    chmod 700 /var/lib/postgresql/data

# Create app state directory
RUN mkdir -p /var/run/luxia

# Create log directories
RUN mkdir -p /var/log/supervisor /var/log/nginx /var/log/app

# Environment variables with defaults
ENV BACKEND_PORT=4000 \
    PORT=4000 \
    DB_HOST=localhost \
    DB_PORT=5432 \
    DB_NAME=luxia \
    DB_USER=luxia \
    DB_PASSWORD=luxia_secure_password \
    JWT_SECRET=production-jwt-secret-change-me \
    ADMIN_EMAIL=concierge@luxia.local \
    POSTGRES_PASSWORD=luxia_secure_password \
    REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    RUN_SEEDS=true \
    NODE_ENV=production \
    INITIAL_ADMIN_EMAIL=admin@luxia.local \
    INITIAL_ADMIN_PASSWORD=LuxiaAdmin2024! \
    INITIAL_ADMIN_NAME="Super Administrator" \
    BASE_URL=http://localhost

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD bash -c "curl -f http://localhost/api/health >/dev/null && redis-cli ping >/dev/null && pg_isready -h localhost -U $DB_USER -d $DB_NAME"

# Start all services
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
