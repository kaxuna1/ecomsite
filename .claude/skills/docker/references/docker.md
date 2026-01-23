# Docker Reference

## Contents
- Multi-Stage Build Pattern
- Dockerfile Anti-Patterns
- Supervisor Configuration
- Nginx Configuration
- Entrypoint Scripts

## Multi-Stage Build Pattern

This project uses a three-stage build:

```dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npx vite build

# Stage 2: Prepare Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache python3 make g++ vips-dev
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./

# Stage 3: Production Runtime
FROM ubuntu:22.04
# Copy only built artifacts
COPY --from=backend-builder /app/backend/src ./backend/src
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
```

### WARNING: Fat Images

**The Problem:**

```dockerfile
# BAD - Single-stage with dev dependencies
FROM node:20
COPY . .
RUN npm install
```

**Why This Breaks:**
1. Image contains dev dependencies (build tools, TypeScript, etc.)
2. Source code exposed in production image
3. Image size bloated by 2-3x

**The Fix:**

```dockerfile
# GOOD - Multi-stage with production artifacts only
FROM node:20-alpine AS builder
RUN npm ci
RUN npm run build

FROM node:20-alpine
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
```

## Supervisor Process Management

Process startup order is critical. This project uses priority-based ordering:

```ini
# docker/supervisord.conf
[program:postgresql]
priority=1
autostart=true
autorestart=true

[program:migrations]
priority=2
autorestart=false    # Run once, don't restart
startsecs=0          # Don't wait for steady state

[program:backend]
priority=3
startsecs=10         # Must run 10s to be "started"
startretries=3
```

### WARNING: Missing Startup Dependencies

**The Problem:**

```ini
# BAD - Backend starts before DB is ready
[program:backend]
priority=1
autostart=true
```

**Why This Breaks:**
1. Database connection fails
2. Migrations haven't run
3. Backend crashes, supervisor restarts, crash loop

**The Fix:**

```ini
# GOOD - Explicit dependency chain via priorities
[program:postgresql]
priority=1

[program:migrations]
priority=2

[program:backend]
priority=3
startsecs=10    # Ensure it stays up
```

## Nginx Reverse Proxy

```nginx
# docker/nginx.conf
# API proxy - all /api requests go to backend
location /api {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Static uploads with long cache
location /uploads {
    alias /app/backend/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# Frontend SPA
location / {
    root /app/frontend/dist;
    try_files $uri $uri/ /index.html;
}
```

### WARNING: Missing try_files for SPA

**The Problem:**

```nginx
# BAD - Direct file serving
location / {
    root /app/frontend/dist;
}
```

**Why This Breaks:**
1. Deep links return 404 (`/en/products/123`)
2. Refreshing non-root pages fails
3. React Router routes don't work

**The Fix:**

```nginx
# GOOD - Fall back to index.html for SPA routing
location / {
    root /app/frontend/dist;
    try_files $uri $uri/ /index.html;
}
```

## Entrypoint Script Pattern

```bash
#!/bin/bash
# docker/docker-entrypoint.sh
set -e

# Initialize PostgreSQL on first run
if [ ! -s "/var/lib/postgresql/data/PG_VERSION" ]; then
    echo "Initializing PostgreSQL..."
    su - postgres -c "/usr/lib/postgresql/14/bin/initdb -D /var/lib/postgresql/data"

    # Start temporarily for initialization
    su - postgres -c "pg_ctl -D /var/lib/postgresql/data start"

    # Wait for ready
    until su - postgres -c "pg_isready -h localhost"; do
        sleep 2
    done

    # Run init script
    /docker-entrypoint-initdb.d/init-postgres.sh

    # Stop (supervisor will restart)
    su - postgres -c "pg_ctl -D /var/lib/postgresql/data stop"
fi

exec "$@"
```

### WARNING: Missing exec in Entrypoint

**The Problem:**

```bash
# BAD - Process not replaced
#!/bin/bash
/usr/bin/supervisord -c /etc/supervisor/supervisord.conf
```

**Why This Breaks:**
1. Bash remains PID 1, not supervisord
2. Signals not properly forwarded
3. Graceful shutdown fails

**The Fix:**

```bash
# GOOD - Replace shell with final process
#!/bin/bash
exec "$@"
# Or explicitly:
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
```

## Health Check Configuration

```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1
```

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `interval` | 30s | Check frequency after start |
| `timeout` | 3s | Max time for check |
| `start-period` | 60s | Grace period for initialization |
| `retries` | 3 | Failures before unhealthy |

The health endpoint at `backend/src/app.ts:72`:

```typescript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

## Build Commands Reference

```bash
# Standard build
docker build -t luxia-ecommerce:latest .

# No cache rebuild
docker build --no-cache -t luxia-ecommerce:latest .

# Build specific stage
docker build --target frontend-builder -t luxia-frontend:latest .

# Multi-arch build
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t registry.example.com/luxia:latest \
  --push .
```