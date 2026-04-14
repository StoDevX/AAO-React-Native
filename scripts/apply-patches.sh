#!/bin/bash
set -e

cd "$(dirname "$0")/.."

for patch in contrib/*.patch; do
  echo "Applying patch: $patch"
  patch -p0 -Nfsi "$patch" || true
done

# Sentinel checks: verify each patch actually landed.
# If any sentinel is missing, the patch silently failed and the build will be subtly broken.
echo "Verifying patch sentinels..."

check_sentinel() {
  local file="$1"
  local pattern="$2"
  local patch_name="$3"
  if ! grep -q "$pattern" "$file"; then
    echo "ERROR: sentinel check for $patch_name failed — expected pattern not found in '$file'" >&2
    return 1
  fi
  echo "  ✓ $patch_name"
}

FAILED=0

# 0001-rn.patch: PropsWithChildren in react-theme-provider typings
check_sentinel \
  "node_modules/@callstack/react-theme-provider/typings/index.d.ts" \
  "PropsWithChildren" \
  "0001-rn.patch" || FAILED=1

if [ "$FAILED" -ne 0 ]; then
  echo "ERROR: one or more patch sentinels failed. See above." >&2
  exit 1
fi

echo "All patch sentinels verified."
