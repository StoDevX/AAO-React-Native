#!/bin/bash
set -euo pipefail

# Script to pull JS bundles from GitHub Container Registry
# Usage: ./scripts/pull-jsbundle.sh <platform> <tag>
# Example: ./scripts/pull-jsbundle.sh ios main
# Example: ./scripts/pull-jsbundle.sh android abc123

PLATFORM="${1:-}"
TAG="${2:-main}"
REPO="stodevx/aao-react-native"

if [[ -z "$PLATFORM" ]]; then
    echo "Usage: $0 <platform> [tag]"
    echo "  platform: ios or android"
    echo "  tag: git branch, commit SHA, or tag (default: main)"
    echo ""
    echo "Examples:"
    echo "  $0 ios main"
    echo "  $0 android abc123def"
    exit 1
fi

if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" ]]; then
    echo "Error: Platform must be 'ios' or 'android'"
    exit 1
fi

IMAGE="ghcr.io/${REPO}/${PLATFORM}-jsbundle:${TAG}"

echo "Pulling bundle from: $IMAGE"

# Create a temporary container
CONTAINER_ID=$(docker create "$IMAGE")

# Extract files based on platform
if [[ "$PLATFORM" == "ios" ]]; then
    echo "Extracting iOS bundle..."
    docker cp "$CONTAINER_ID:/main.jsbundle" "./ios/AllAboutOlaf/main.jsbundle"
    docker cp "$CONTAINER_ID:/main.jsbundle.map" "./ios/AllAboutOlaf/main.jsbundle.map"
    docker cp "$CONTAINER_ID:/assets/." "./ios/assets/" 2>/dev/null || echo "No assets found"
    echo "✓ iOS bundle extracted to ios/AllAboutOlaf/"
else
    echo "Extracting Android bundle..."
    mkdir -p "./android/generated"
    docker cp "$CONTAINER_ID:/generated/." "./android/generated/"
    echo "✓ Android bundle extracted to android/generated/"
fi

# Clean up
docker rm "$CONTAINER_ID" > /dev/null

echo "✓ Done! Bundle ready for use."
