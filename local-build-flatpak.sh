#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

BUILDER_NAME="${BUILDX_BUILDER_NAME:-winboat-flatpak}"
BAKE_TARGET="${1:-flatpak}"

if ! command -v docker >/dev/null 2>&1; then
    echo "docker is required to build the Flatpak locally" >&2
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "docker is not running or is not accessible by the current user" >&2
    exit 1
fi

if ! docker buildx version >/dev/null 2>&1; then
    echo "docker buildx is required to build the Flatpak locally" >&2
    exit 1
fi

rm -f yarn.lock package-lock.json
bun ci --yarn && bunx synp --source-file ./yarn.lock

if ! docker buildx inspect "${BUILDER_NAME}" >/dev/null 2>&1; then
    docker buildx create \
        --name "${BUILDER_NAME}" \
        --driver docker-container \
        --buildkitd-flags "--allow-insecure-entitlement=security.insecure" \
        --use
else
    docker buildx use "${BUILDER_NAME}"
fi

docker buildx inspect --bootstrap "${BUILDER_NAME}" >/dev/null
docker buildx bake --builder "${BUILDER_NAME}" --allow security.insecure "${BAKE_TARGET}"
