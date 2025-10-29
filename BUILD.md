# Docker Build & Deployment Guide

## Overview

This project is fully containerized with a single Docker image that includes:
- **PostgreSQL 14**: Database
- **Node.js Backend**: Express API (running on port 4000)
- **Vite Frontend**: React application
- **Nginx**: Reverse proxy and static file server (exposed on port 80)

All services run in a single container managed by Supervisor.

## Quick Start

### Local Testing

```bash
# Build the image
docker build -t luxia-ecommerce:latest .

# Run the container
docker run -d \
  -p 80:80 \
  --name luxia-app \
  -e JWT_SECRET=your-secret-key \
  -e DB_PASSWORD=secure_password \
  -e POSTGRES_PASSWORD=secure_password \
  luxia-ecommerce:latest

# Check health
curl http://localhost/api/health
# Expected: {"status":"ok"}

# Stop and remove
docker stop luxia-app && docker rm luxia-app
```

### Using Docker Compose

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

## Multi-Architecture Build

The image supports both x86_64 and ARM64 architectures.

### Build for Multiple Platforms

```bash
# Setup buildx (one-time setup)
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# Build for both amd64 and arm64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-registry.com/luxia-ecommerce:latest \
  --push \
  .
```

### Using the Build Script

```bash
# Build and push to registry
IMAGE_NAME=luxia-ecommerce \
IMAGE_TAG=v1.0.0 \
REGISTRY=your-registry.com \
./docker/build-multiarch.sh

# Build for local use (current architecture only)
docker build -t luxia-ecommerce:latest .
```

## Environment Variables

### Required

- `JWT_SECRET`: Secret key for JWT tokens
- `DB_PASSWORD`: PostgreSQL user password
- `POSTGRES_PASSWORD`: PostgreSQL postgres user password (should match DB_PASSWORD)

### Optional

- `PORT`: Backend port (default: 4000)
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: luxia)
- `DB_USER`: Database user (default: luxia)
- `INITIAL_ADMIN_EMAIL`: Initial admin email (default: admin@luxia.local)
- `INITIAL_ADMIN_PASSWORD`: Initial admin password (default: LuxiaAdmin2024!)
- `INITIAL_ADMIN_NAME`: Initial admin name (default: "Super Administrator")
- `SMTP_*`: Email notification settings
- `SMS_*`: SMS notification settings

**Note**: See [ADMIN_USER_SETUP.md](ADMIN_USER_SETUP.md) for detailed admin user configuration.

## Accessing the Application

Once the container is running:

- **Frontend**: http://localhost (or http://localhost:PORT if you mapped a different port)
- **API**: http://localhost/api/
- **Health Check**: http://localhost/api/health
- **Product Images**: http://localhost/uploads/

## Production Deployment

### Security Checklist

1. **Change all default passwords**
   ```bash
   # Generate secure passwords
   JWT_SECRET=$(openssl rand -base64 32)
   DB_PASSWORD=$(openssl rand -base64 24)
   ```

2. **Set admin password hash**
   ```bash
   # Generate bcrypt hash
   node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"
   ```

3. **Use environment-specific configuration**
4. **Set up HTTPS** (use a reverse proxy like Traefik or Nginx)
5. **Configure email notifications**
6. **Set up database backups**
7. **Enable monitoring and logging**

### Example Production Deployment

```bash
docker run -d \
  --name luxia-production \
  --restart unless-stopped \
  -p 80:80 \
  -e NODE_ENV=production \
  -e JWT_SECRET="$(openssl rand -base64 32)" \
  -e DB_PASSWORD="$(openssl rand -base64 24)" \
  -e POSTGRES_PASSWORD="$(openssl rand -base64 24)" \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD_HASH='$2b$10$...' \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_USER=noreply@example.com \
  -e SMTP_PASSWORD=app-password \
  -v /data/luxia/postgres:/var/lib/postgresql/data \
  -v /data/luxia/uploads:/app/backend/uploads \
  luxia-ecommerce:latest
```

## Data Persistence

Two volumes should be mounted for data persistence:

1. **PostgreSQL Data**: `/var/lib/postgresql/data`
2. **Product Images**: `/app/backend/uploads`

Example with named volumes:
```bash
docker volume create luxia-postgres
docker volume create luxia-uploads

docker run -d \
  -p 80:80 \
  -v luxia-postgres:/var/lib/postgresql/data \
  -v luxia-uploads:/app/backend/uploads \
  luxia-ecommerce:latest
```

## Troubleshooting

### Container won't start

```bash
# View logs
docker logs luxia-app

# Check supervisor status
docker exec luxia-app supervisorctl status

# View specific service logs
docker exec luxia-app cat /var/log/supervisor/backend.log
docker exec luxia-app cat /var/log/supervisor/postgresql.log
docker exec luxia-app cat /var/log/supervisor/nginx.log
```

### Database issues

```bash
# Connect to database
docker exec -it luxia-app psql -U luxia -d luxia

# Check PostgreSQL status
docker exec luxia-app supervisorctl status postgresql

# View PostgreSQL logs
docker exec luxia-app cat /var/log/supervisor/postgresql.log
```

### Backend API not responding

```bash
# Check backend status
docker exec luxia-app supervisorctl status backend

# View backend logs
docker exec luxia-app cat /var/log/supervisor/backend.log
docker exec luxia-app cat /var/log/supervisor/backend_error.log

# Restart backend
docker exec luxia-app supervisorctl restart backend
```

### Frontend not loading

```bash
# Check nginx status
docker exec luxia-app supervisorctl status nginx

# View nginx logs
docker exec luxia-app cat /var/log/nginx/access.log
docker exec luxia-app cat /var/log/nginx/error.log

# Test nginx config
docker exec luxia-app nginx -t
```

## Container Management

### Restart Services

```bash
# Restart all services
docker restart luxia-app

# Restart specific service
docker exec luxia-app supervisorctl restart backend
docker exec luxia-app supervisorctl restart nginx
docker exec luxia-app supervisorctl restart postgresql
```

### View Logs

```bash
# All logs
docker logs -f luxia-app

# Backend logs
docker exec luxia-app tail -f /var/log/supervisor/backend.log

# Real-time supervisor logs
docker exec luxia-app tail -f /var/log/supervisor/supervisord.log
```

### Database Backup

```bash
# Backup database
docker exec luxia-app pg_dump -U luxia luxia > backup.sql

# Restore database
docker exec -i luxia-app psql -U luxia luxia < backup.sql
```

## Build Details

### Image Size
- Approximately 2GB (includes PostgreSQL, Node.js, Nginx, and all dependencies)

### Build Time
- Initial build: 5-10 minutes (depending on system)
- Subsequent builds: 1-2 minutes (with cache)

### Startup Time
- First run: ~30-40 seconds (PostgreSQL initialization + migrations)
- Subsequent runs: ~10-15 seconds (existing database)

## Architecture Details

### Port Mapping
- Port 80 (external) → Nginx (internal)
- Nginx → Port 4000 (backend API)
- Nginx → Static files (frontend)

### Service Startup Order
1. PostgreSQL (priority 1)
2. Database Migrations (priority 2)
3. Backend API (priority 3)
4. Nginx (priority 4)

### Health Check
- Endpoint: `http://localhost/api/health`
- Interval: 30 seconds
- Timeout: 3 seconds
- Start period: 60 seconds
- Retries: 3

## Additional Resources

- Docker configuration: `/docker` directory
- Detailed documentation: `/docker/README.md`
- Multi-arch build script: `/docker/build-multiarch.sh`
