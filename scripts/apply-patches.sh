#!/bin/bash
set -e

cd "$(dirname "$0")/.."

for patch in contrib/*.patch; do
  echo "Applying patch: $patch"
  patch -p0 -Nfsi "$patch" || true
done
