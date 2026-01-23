# CI/CD Reference

## Contents
- Build Pipeline Patterns
- Multi-Architecture Builds
- Registry Push Workflow
- GitHub Actions Template
- Validation Steps

## Build Pipeline Patterns

### Standard Build Flow

```bash
# 1. Build image
docker build -t luxia-ecommerce:$VERSION .

# 2. Run health check
docker run -d --name test-container -p 8080:80 luxia-ecommerce:$VERSION
sleep 60  # Wait for startup
curl -f http://localhost:8080/api/health || exit 1
docker stop test-container && docker rm test-container

# 3. Tag for registry
docker tag luxia-ecommerce:$VERSION registry.example.com/luxia-ecommerce:$VERSION
docker tag luxia-ecommerce:$VERSION registry.example.com/luxia-ecommerce:latest

# 4. Push
docker push registry.example.com/luxia-ecommerce:$VERSION
docker push registry.example.com/luxia-ecommerce:latest
```

### Multi-Architecture Build

The project includes `docker/build-multiarch.sh`:

```bash
#!/bin/bash
# docker/build-multiarch.sh
IMAGE_NAME="${IMAGE_NAME:-luxia-ecommerce}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-}"

# Setup buildx
if ! docker buildx inspect multiarch > /dev/null 2>&1; then
    docker buildx create --name multiarch --use
    docker buildx inspect --bootstrap
fi

# Build for AMD64 and ARM64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ${REGISTRY:+$REGISTRY/}$IMAGE_NAME:$IMAGE_TAG \
  ${REGISTRY:+--push} \
  ${REGISTRY:-"--load"} \
  .
```

Usage:

```bash
# Local build (current arch only)
./docker/build-multiarch.sh

# Push to registry
REGISTRY=your.registry.com IMAGE_TAG=v1.0.0 ./docker/build-multiarch.sh
```

### WARNING: Building Without Testing

**The Problem:**

```bash
# BAD - Push without verification
docker build -t image:latest .
docker push image:latest
```

**Why This Breaks:**
1. Broken images deployed to production
2. No validation of startup sequence
3. Missing dependencies not caught

**The Fix:**

```bash
# GOOD - Test before push
docker build -t image:latest .

# Run and verify
docker run -d --name test -p 8080:80 image:latest
sleep 60
curl -f http://localhost:8080/api/health

# Only push if healthy
docker push image:latest
```

## GitHub Actions Template

Create `.github/workflows/docker.yml`:

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  test:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name != 'pull_request'

    steps:
      - name: Pull image
        run: docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Run container
        run: |
          docker run -d --name test-app \
            -p 8080:80 \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Wait for startup
        run: sleep 60

      - name: Health check
        run: curl -f http://localhost:8080/api/health

      - name: Cleanup
        if: always()
        run: docker stop test-app && docker rm test-app
```

## Validation Steps

### Pre-Build Validation

```bash
# Dockerfile linting
docker run --rm -i hadolint/hadolint < Dockerfile

# Check compose syntax
docker-compose config

# Verify env file completeness
required_vars="JWT_SECRET DB_PASSWORD POSTGRES_PASSWORD"
for var in $required_vars; do
  if ! grep -q "^${var}=" .env; then
    echo "Missing: $var"
    exit 1
  fi
done
```

### Post-Build Validation

```bash
# Test container startup
docker run -d --name validate -p 8080:80 luxia-ecommerce:latest

# Wait for all services
for i in {1..30}; do
  if curl -sf http://localhost:8080/api/health; then
    echo "Health check passed"
    break
  fi
  sleep 2
done

# Verify all services
docker exec validate supervisorctl status | grep -q "RUNNING" || exit 1

# Check logs for errors
docker logs validate 2>&1 | grep -i error && exit 1

docker stop validate && docker rm validate
```

## Version Tagging Strategy

```bash
# Semantic versioning
v1.0.0    # Major.Minor.Patch
v1.0.1    # Patch release
v1.1.0    # Minor feature release
v2.0.0    # Breaking changes

# Branch tags
main      # Latest stable
develop   # Development

# SHA tags
sha-abc123  # Specific commit
```

### Tagging Commands

```bash
# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Build with version
VERSION=$(git describe --tags --always)
docker build -t luxia-ecommerce:$VERSION .
```

## Registry Management

### Cleanup Old Images

```bash
# List images
docker images registry.example.com/luxia-ecommerce

# Remove old tags (keep last 5)
docker images registry.example.com/luxia-ecommerce --format "{{.Tag}}" | \
  tail -n +6 | \
  xargs -I {} docker rmi registry.example.com/luxia-ecommerce:{}
```

### Pull and Deploy

```bash
# Pull latest
docker pull registry.example.com/luxia-ecommerce:latest

# Or specific version
docker pull registry.example.com/luxia-ecommerce:v1.0.0

# Deploy
docker-compose pull && docker-compose up -d
```