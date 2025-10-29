#!/bin/bash
set -e

# Multi-architecture Docker build script for Luxia E-commerce
# Supports both x86_64 and ARM64

IMAGE_NAME="${IMAGE_NAME:-luxia-ecommerce}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-}"

echo "Building multi-architecture Docker image..."
echo "Image: ${REGISTRY:+$REGISTRY/}$IMAGE_NAME:$IMAGE_TAG"
echo "Platforms: linux/amd64, linux/arm64"

# Ensure buildx is set up
if ! docker buildx inspect multiarch > /dev/null 2>&1; then
    echo "Creating buildx builder 'multiarch'..."
    docker buildx create --name multiarch --use
    docker buildx inspect --bootstrap
else
    echo "Using existing buildx builder 'multiarch'"
    docker buildx use multiarch
fi

# Build command
BUILD_CMD="docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ${REGISTRY:+$REGISTRY/}$IMAGE_NAME:$IMAGE_TAG"

# Add push flag if registry is specified
if [ -n "$REGISTRY" ]; then
    BUILD_CMD="$BUILD_CMD --push"
    echo "Will push to registry: $REGISTRY"
else
    BUILD_CMD="$BUILD_CMD --load"
    echo "Will load to local Docker"
fi

# Add context
BUILD_CMD="$BUILD_CMD ."

# Execute build
echo ""
echo "Executing: $BUILD_CMD"
echo ""

cd "$(dirname "$0")/.."
eval $BUILD_CMD

echo ""
echo "Build complete!"

if [ -z "$REGISTRY" ]; then
    echo "Image available locally as: $IMAGE_NAME:$IMAGE_TAG"
else
    echo "Image pushed to: ${REGISTRY}/$IMAGE_NAME:$IMAGE_TAG"
fi
