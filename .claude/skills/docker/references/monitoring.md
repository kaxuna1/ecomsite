# Monitoring Reference

## Contents
- Health Check Configuration
- Log Management
- Service Status Monitoring
- Debugging Container Issues
- Performance Monitoring

## Health Check Configuration

### Dockerfile Health Check

```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1
```

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `interval` | 30s | Time between checks |
| `timeout` | 3s | Max response time |
| `start-period` | 60s | Grace period for startup |
| `retries` | 3 | Failures before unhealthy |

### Health Endpoint

```typescript
// backend/src/app.ts:72
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

### Check Container Health Status

```bash
# Get health status
docker inspect --format='{{.State.Health.Status}}' luxia-app
# Returns: starting | healthy | unhealthy

# Get health check logs
docker inspect --format='{{json .State.Health}}' luxia-app | jq

# Watch health transitions
docker events --filter 'event=health_status'
```

### WARNING: Insufficient Start Period

**The Problem:**

```dockerfile
# BAD - Not enough time for PostgreSQL + migrations
HEALTHCHECK --start-period=10s \
    CMD curl -f http://localhost/api/health || exit 1
```

**Why This Breaks:**
1. PostgreSQL initialization takes 20-40s
2. Migrations can take 10-30s more
3. Container marked unhealthy before ready
4. Orchestrator restarts container in loop

**The Fix:**

```dockerfile
# GOOD - Allow 60s for full startup
HEALTHCHECK --start-period=60s \
    CMD curl -f http://localhost/api/health || exit 1
```

## Log Management

### Log Locations

| Service | Stdout Log | Error Log |
|---------|-----------|-----------|
| Supervisor | `/var/log/supervisor/supervisord.log` | - |
| PostgreSQL | `/var/log/supervisor/postgresql.log` | `/var/log/supervisor/postgresql_error.log` |
| Backend | `/var/log/supervisor/backend.log` | `/var/log/supervisor/backend_error.log` |
| Nginx | `/var/log/supervisor/nginx.log` | `/var/log/nginx/error.log` |
| Migrations | `/var/log/supervisor/migrations.log` | `/var/log/supervisor/migrations_error.log` |

### Viewing Logs

```bash
# All container output
docker logs -f luxia-app

# Last 100 lines
docker logs --tail 100 luxia-app

# Since timestamp
docker logs --since 2024-01-01T00:00:00 luxia-app

# Individual service logs
docker exec luxia-app tail -f /var/log/supervisor/backend.log
docker exec luxia-app tail -f /var/log/supervisor/postgresql.log
docker exec luxia-app tail -f /var/log/nginx/error.log
```

### Search Logs for Errors

```bash
# Find errors in backend
docker exec luxia-app grep -i error /var/log/supervisor/backend_error.log

# Find database connection issues
docker exec luxia-app grep -i "connect\|ECONNREFUSED" /var/log/supervisor/backend.log

# Check nginx access
docker exec luxia-app cat /var/log/nginx/access.log | tail -20
```

## Service Status Monitoring

### Supervisor Commands

```bash
# Enter container
docker exec -it luxia-app bash

# Check all services
supervisorctl status

# Expected output:
# backend          RUNNING   pid 123, uptime 1:23:45
# migrations       EXITED    Jan 01 12:00 PM
# nginx            RUNNING   pid 124, uptime 1:23:45
# postgresql       RUNNING   pid 100, uptime 1:24:00

# Restart specific service
supervisorctl restart backend

# Stop/start
supervisorctl stop nginx
supervisorctl start nginx

# Reload config (after modifying supervisord.conf)
supervisorctl reread
supervisorctl update
```

### Verify Database Connection

```bash
# From inside container
docker exec luxia-app bash -c 'PGPASSWORD=$DB_PASSWORD psql -h localhost -U luxia -d luxia -c "SELECT 1"'

# Check connection count
docker exec luxia-app bash -c 'PGPASSWORD=$DB_PASSWORD psql -h localhost -U luxia -d luxia -c "SELECT count(*) FROM pg_stat_activity"'
```

## Debugging Container Issues

### Container Won't Start

```bash
# Check logs immediately
docker logs luxia-app

# Check supervisor startup
docker exec luxia-app cat /var/log/supervisor/supervisord.log

# Check PostgreSQL initialization
docker exec luxia-app cat /var/log/supervisor/postgresql.log
docker exec luxia-app cat /var/log/supervisor/postgresql_error.log
```

### Backend Crashes

```bash
# Check error log
docker exec luxia-app cat /var/log/supervisor/backend_error.log

# Common issues:
# - "ECONNREFUSED" = PostgreSQL not ready
# - "no such file or directory" = Missing migration
# - "EADDRINUSE" = Port conflict

# Check environment
docker exec luxia-app env | grep -E "DB_|JWT_|PORT"
```

### Database Issues

```bash
# Check if PostgreSQL is running
docker exec luxia-app pg_isready -h localhost

# Check PostgreSQL logs
docker exec luxia-app cat /var/log/supervisor/postgresql_error.log

# Check disk space (for data directory)
docker exec luxia-app df -h /var/lib/postgresql/data

# Manual database access
docker exec -it luxia-app psql -U luxia -d luxia
```

### Nginx Issues

```bash
# Test nginx config
docker exec luxia-app nginx -t

# Check error log
docker exec luxia-app tail -50 /var/log/nginx/error.log

# Check if upstream (backend) is reachable
docker exec luxia-app curl -f http://localhost:4000/api/health
```

## Performance Monitoring

### Resource Usage

```bash
# Real-time stats
docker stats luxia-app

# Memory and CPU limits
docker inspect luxia-app --format '{{.HostConfig.Memory}} {{.HostConfig.NanoCpus}}'
```

### PostgreSQL Performance

```bash
# Active queries
docker exec luxia-app bash -c 'PGPASSWORD=$DB_PASSWORD psql -h localhost -U luxia -d luxia -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state = '\''active'\''"'

# Table sizes
docker exec luxia-app bash -c 'PGPASSWORD=$DB_PASSWORD psql -h localhost -U luxia -d luxia -c "SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 10"'
```

### Quick Health Dashboard

```bash
#!/bin/bash
# health-check.sh
echo "=== Container Status ==="
docker inspect --format='Health: {{.State.Health.Status}}' luxia-app

echo -e "\n=== Service Status ==="
docker exec luxia-app supervisorctl status

echo -e "\n=== Resource Usage ==="
docker stats luxia-app --no-stream

echo -e "\n=== Recent Errors ==="
docker exec luxia-app tail -5 /var/log/supervisor/backend_error.log 2>/dev/null || echo "No errors"

echo -e "\n=== API Health ==="
curl -sf http://localhost/api/health && echo "OK" || echo "FAILED"
```

## Missing Monitoring Solutions

### WARNING: No Centralized Logging

**Current State:** Logs stored in container filesystem, lost on container removal.

**Recommended Solutions:**
1. Mount log directory as volume
2. Use Docker logging drivers (json-file, syslog, fluentd)
3. Implement log shipping (ELK, Loki)

```yaml
# docker-compose.yml - Logging driver
services:
  luxia-app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### WARNING: No Error Alerting

**Current State:** Errors only visible in logs, no proactive notification.

**Recommended:** Add error tracking (Sentry, Rollbar) or health-based alerting.

```typescript
// Would need to add to backend
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```
```

The Docker skill files have been created with:

- **SKILL.md** (99 lines) - Quick overview with build commands, key concepts, and common patterns
- **references/docker.md** (273 lines) - Dockerfile patterns, multi-stage builds, supervisor, nginx config
- **references/ci-cd.md** (285 lines) - Build pipelines, GitHub Actions template, validation steps
- **references/deployment.md** (269 lines) - Production checklist, environment variables, rollback procedures
- **references/monitoring.md** (291 lines) - Health checks, logging, debugging, performance monitoring

The documentation includes 30+ code blocks, multiple WARNING sections for anti-patterns with clear "Why This Breaks" explanations, and actionable checklists for production deployment.