# Deployment Reference

## Contents
- Production Deployment Checklist
- Environment Variables
- Volume Configuration
- Production Run Commands
- Rollback Procedures

## Production Deployment Checklist

Copy this checklist and track progress:
- [ ] Generate strong JWT_SECRET: `openssl rand -base64 32`
- [ ] Generate strong DB_PASSWORD: `openssl rand -base64 24`
- [ ] Set POSTGRES_PASSWORD to match DB_PASSWORD
- [ ] Generate ADMIN_PASSWORD_HASH with bcrypt
- [ ] Configure SMTP for email notifications
- [ ] Mount persistent volumes for data
- [ ] Configure HTTPS/TLS (external proxy)
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting

## Environment Variables

### Required for Production

```bash
# Security - NEVER use defaults
JWT_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)
POSTGRES_PASSWORD=$DB_PASSWORD  # Must match

# Admin credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH='$2b$10$...'  # Generate with bcrypt
```

Generate bcrypt hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword', 10))"
```

### WARNING: Default Credentials in Production

**The Problem:**

```yaml
# BAD - Using defaults from docker-compose.yml
environment:
  - JWT_SECRET=production-jwt-secret-change-me
  - INITIAL_ADMIN_PASSWORD=LuxiaAdmin2024!
```

**Why This Breaks:**
1. Credentials are public (in version control)
2. JWT tokens can be forged
3. Admin account compromised immediately

**The Fix:**

```yaml
# GOOD - Generate at runtime, use secrets
environment:
  - JWT_SECRET=${JWT_SECRET}  # Set in .env, NOT committed
  - ADMIN_PASSWORD_HASH=${ADMIN_HASH}  # Pre-hashed
```

### Optional but Recommended

```bash
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=app-password
NOTIFY_FROM="Luxia Products <noreply@example.com>"

# Base URL for email links
BASE_URL=https://luxia.example.com
```

## Volume Configuration

### Data Persistence

```yaml
# docker-compose.yml
volumes:
  postgres_data:
    driver: local
  uploads_data:
    driver: local

services:
  luxia-app:
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - uploads_data:/app/backend/uploads
```

### Production Host Mounts

```bash
# Direct host paths for easier backup
docker run -d \
  -v /data/luxia/postgres:/var/lib/postgresql/data \
  -v /data/luxia/uploads:/app/backend/uploads \
  luxia-ecommerce:latest
```

### WARNING: Missing Volume Mounts

**The Problem:**

```bash
# BAD - No volumes
docker run -d -p 80:80 luxia-ecommerce:latest
```

**Why This Breaks:**
1. All data lost on container restart
2. Database wiped on every deployment
3. Uploaded images disappear

**The Fix:**

```bash
# GOOD - Always mount data volumes
docker run -d -p 80:80 \
  -v luxia-postgres:/var/lib/postgresql/data \
  -v luxia-uploads:/app/backend/uploads \
  luxia-ecommerce:latest
```

## Production Run Commands

### Full Production Command

```bash
docker run -d \
  --name luxia-production \
  --restart unless-stopped \
  -p 80:80 \
  -e JWT_SECRET="$(openssl rand -base64 32)" \
  -e DB_PASSWORD="$(openssl rand -base64 24)" \
  -e POSTGRES_PASSWORD="$(openssl rand -base64 24)" \
  -e NODE_ENV=production \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD_HASH='$2b$10$hashedpassword' \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_USER=noreply@example.com \
  -e SMTP_PASSWORD=app-password \
  -v /data/luxia/postgres:/var/lib/postgresql/data \
  -v /data/luxia/uploads:/app/backend/uploads \
  registry.example.com/luxia-ecommerce:v1.0
```

### Using Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  luxia-app:
    image: registry.example.com/luxia-ecommerce:v1.0
    restart: unless-stopped
    ports:
      - "80:80"
    env_file:
      - .env.production  # NOT in version control
    volumes:
      - /data/luxia/postgres:/var/lib/postgresql/data
      - /data/luxia/uploads:/app/backend/uploads
```

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Database Backup

### Manual Backup

```bash
# Create backup
docker exec luxia-production pg_dump -U luxia luxia > backup-$(date +%Y%m%d).sql

# With compression
docker exec luxia-production pg_dump -U luxia luxia | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Stop application first
docker exec luxia-production supervisorctl stop backend

# Restore
docker exec -i luxia-production psql -U luxia luxia < backup.sql

# Restart
docker exec luxia-production supervisorctl start backend
```

### Automated Backup Script

```bash
#!/bin/bash
# /etc/cron.daily/luxia-backup
BACKUP_DIR=/backups/luxia
DATE=$(date +%Y%m%d)

# Database
docker exec luxia-production pg_dump -U luxia luxia | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Uploads
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz /data/luxia/uploads

# Retain 30 days
find $BACKUP_DIR -mtime +30 -delete
```

## Rollback Procedures

### Quick Rollback

```bash
# Stop current version
docker stop luxia-production

# Start previous version
docker run -d --name luxia-rollback \
  -p 80:80 \
  -v /data/luxia/postgres:/var/lib/postgresql/data \
  -v /data/luxia/uploads:/app/backend/uploads \
  registry.example.com/luxia-ecommerce:v0.9  # Previous tag
```

### Blue-Green Deployment

```bash
# Start new version on different port
docker run -d --name luxia-green \
  -p 8080:80 \
  -v /data/luxia/postgres:/var/lib/postgresql/data \
  -v /data/luxia/uploads:/app/backend/uploads \
  registry.example.com/luxia-ecommerce:v1.1

# Test at :8080

# If good, switch traffic (via nginx/load balancer)
# If bad, just stop green:
docker stop luxia-green && docker rm luxia-green
```

## Health Verification

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' luxia-production

# Verify API
curl -f http://localhost/api/health || echo "UNHEALTHY"

# Check service status inside container
docker exec luxia-production supervisorctl status
```