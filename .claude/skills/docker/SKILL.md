---
name: docker
description: |
  Builds single-container deployments with PostgreSQL, Nginx, and Supervisor for the Luxia e-commerce platform.
  Use when: modifying Dockerfile, docker-compose.yml, nginx.conf, supervisord.conf, or deployment scripts.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Docker Skill

Single-container architecture bundling PostgreSQL 14, Node.js 20 backend, Nginx reverse proxy, and Supervisor process manager. Multi-stage builds optimize image size while supporting both AMD64 and ARM64 architectures.

## Quick Start

### Build and Run

```bash
# Docker Compose (recommended)
docker-compose up -d

# Manual build
docker build -t luxia-ecommerce:latest .
docker run -d -p 80:80 \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  -e DB_PASSWORD=secure_password \
  -e POSTGRES_PASSWORD=secure_password \
  -v luxia-postgres:/var/lib/postgresql/data \
  -v luxia-uploads:/app/backend/uploads \
  luxia-ecommerce:latest
```

### Multi-Architecture Build

```bash
./docker/build-multiarch.sh
# Or with registry:
REGISTRY=your.registry.com ./docker/build-multiarch.sh
```

## Key Concepts

| Concept | Location | Purpose |
|---------|----------|---------|
| Multi-stage build | `Dockerfile` | Separate frontend/backend builders, final Ubuntu runtime |
| Supervisor | `docker/supervisord.conf` | Manages PostgreSQL → migrations → backend → nginx startup order |
| Nginx proxy | `docker/nginx.conf` | Routes `/api/*` to backend, serves static files |
| Health check | `Dockerfile:113` | Verifies `/api/health` endpoint |

## Common Patterns

### Service Priority Order

Supervisor starts services in priority order:

```ini
# docker/supervisord.conf
[program:postgresql]
priority=1      # Start first

[program:migrations]
priority=2      # Run after DB ready

[program:backend]
priority=3      # Start after migrations

[program:nginx]
priority=4      # Start last
```

### Volume Persistence

```yaml
# docker-compose.yml
volumes:
  - postgres_data:/var/lib/postgresql/data  # Database
  - uploads_data:/app/backend/uploads        # User uploads
```

### Environment Variables

Critical variables for production:

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Token signing (use `openssl rand -base64 32`) |
| `DB_PASSWORD` | PostgreSQL password |
| `POSTGRES_PASSWORD` | Must match `DB_PASSWORD` |

## See Also

- [docker](references/docker.md) - Dockerfile patterns and multi-stage builds
- [deployment](references/deployment.md) - Production deployment checklist
- [monitoring](references/monitoring.md) - Logging and health checks

## Related Skills

For PostgreSQL configuration details, see the **postgresql** skill.
For backend service patterns, see the **express** skill.
For Node.js runtime specifics, see the **node** skill.