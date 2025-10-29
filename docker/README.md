# Docker Deployment Guide

This directory contains all the necessary configuration files to build and run the Luxia E-commerce application as a single Docker container.

## Architecture

The Docker image contains:
- **PostgreSQL 14**: Database server
- **Node.js 20**: Backend Express.js application
- **Nginx**: Reverse proxy and static file server
- **Supervisor**: Process manager for all services

All services run in a single container and are accessible through port 80.

## Quick Start

### Using Docker Compose (Recommended for Testing)

```bash
# Build and start the container
docker-compose up --build

# Access the application at http://localhost
# API health check: http://localhost/api/health

# Stop the container
docker-compose down

# Remove volumes (database and uploads)
docker-compose down -v
```

### Using Docker Directly

```bash
# Build the image
docker build -t luxia-ecommerce .

# Run the container
docker run -d \
  -p 80:80 \
  --name luxia-app \
  -e JWT_SECRET=your-secret-here \
  -v luxia-postgres:/var/lib/postgresql/data \
  -v luxia-uploads:/app/backend/uploads \
  luxia-ecommerce

# View logs
docker logs -f luxia-app

# Stop and remove
docker stop luxia-app
docker rm luxia-app
```

## Multi-Architecture Build

Build for both x86_64 and ARM64:

```bash
# Setup buildx (one-time)
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-registry/luxia-ecommerce:latest \
  --push \
  .

# Or build and load for current architecture
docker buildx build \
  --platform linux/amd64 \
  -t luxia-ecommerce:latest \
  --load \
  .
```

## Environment Variables

### Required Variables

- `JWT_SECRET`: Secret key for JWT token signing
- `DB_PASSWORD`: PostgreSQL password
- `POSTGRES_PASSWORD`: Must match DB_PASSWORD

### Optional Variables

- `PORT`: Backend port (default: 4000)
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: luxia)
- `DB_USER`: Database user (default: luxia)
- `ADMIN_EMAIL`: Admin login email (default: concierge@luxia.local)
- `ADMIN_PASSWORD_HASH`: Bcrypt hash of admin password
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: Email notifications
- `SMS_WEBHOOK_URL`, `SMS_API_KEY`, `SMS_FROM`: SMS notifications
- `NOTIFY_FROM`: Email sender address

## Volumes

Two volumes are recommended for data persistence:

1. **postgres_data**: `/var/lib/postgresql/data` - Database files
2. **uploads_data**: `/app/backend/uploads` - Product images

## Health Check

The container includes a health check that verifies the API is responding:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' luxia-app
```

## Service Management

All services are managed by Supervisor. To interact with services:

```bash
# Enter the container
docker exec -it luxia-app bash

# Check service status
supervisorctl status

# Restart a service
supervisorctl restart backend
supervisorctl restart nginx

# View logs
tail -f /var/log/supervisor/backend.log
tail -f /var/log/supervisor/nginx.log
tail -f /var/log/supervisor/postgresql.log
```

## Startup Sequence

1. **PostgreSQL Initialization**: If first run, PostgreSQL data directory is initialized
2. **Database Creation**: Creates database and user
3. **Migrations**: Runs database migrations to create tables
4. **Backend Start**: Starts Express.js API server
5. **Nginx Start**: Starts reverse proxy and static file server

## URLs

- **Frontend**: http://localhost/
- **API**: http://localhost/api/
- **Health Check**: http://localhost/api/health
- **Product Images**: http://localhost/uploads/

## Troubleshooting

### Container won't start

```bash
# View container logs
docker logs luxia-app

# Check supervisor logs
docker exec luxia-app cat /var/log/supervisor/supervisord.log
```

### Database connection errors

```bash
# Check PostgreSQL logs
docker exec luxia-app cat /var/log/supervisor/postgresql.log

# Verify database is running
docker exec luxia-app supervisorctl status postgresql
```

### Backend errors

```bash
# Check backend logs
docker exec luxia-app cat /var/log/supervisor/backend.log
docker exec luxia-app cat /var/log/supervisor/backend_error.log

# Check environment variables
docker exec luxia-app env | grep DB_
```

### Nginx errors

```bash
# Check nginx logs
docker exec luxia-app cat /var/log/supervisor/nginx.log
docker exec luxia-app cat /var/log/nginx/error.log
```

## Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Set a strong `JWT_SECRET`
- [ ] Use `ADMIN_PASSWORD_HASH` instead of default password
- [ ] Configure HTTPS/TLS (use a reverse proxy like Traefik or nginx)
- [ ] Set up regular database backups
- [ ] Configure email notifications (SMTP settings)
- [ ] Review and adjust resource limits
- [ ] Enable log rotation
- [ ] Set up monitoring and alerts

### Example Production Deployment

```bash
# Build image
docker build -t registry.example.com/luxia-ecommerce:v1.0 .

# Push to registry
docker push registry.example.com/luxia-ecommerce:v1.0

# Run on production server
docker run -d \
  -p 80:80 \
  --name luxia-production \
  --restart unless-stopped \
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
  registry.example.com/luxia-ecommerce:v1.0
```

## File Structure

```
docker/
├── README.md              # This file
├── nginx.conf             # Nginx reverse proxy configuration
├── supervisord.conf       # Supervisor process manager config
├── docker-entrypoint.sh   # Container startup script
├── init-postgres.sh       # PostgreSQL initialization
└── run-migrations.sh      # Database migration runner
```
