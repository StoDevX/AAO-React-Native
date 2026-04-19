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

# 0002-rn-abortsignal.patch: removes RN's custom AbortSignal/AbortController
# declarations so @types/node's DOM-spec-compatible types can be used (required
# for @tanstack/react-query + ky signal compatibility).
if grep -q "class AbortSignal implements EventTarget" \
    "node_modules/react-native/src/types/globals.d.ts"; then
  echo "ERROR: sentinel check for 0002-rn-abortsignal.patch failed — RN's custom AbortSignal class is still present" >&2
  FAILED=1
else
  echo "  ✓ 0002-rn-abortsignal.patch"
fi

# 0003-fmt-disable-consteval.patch: forces FMT_USE_CONSTEVAL=0 in fmt 11.0.2's
# base.h so Xcode 26's stricter Clang doesn't reject FMT_STRING() calls inside
# consteval contexts. Skip the check on hosts where pods aren't installed (e.g.
# Linux CI / non-iOS workflows).
if [ -f "ios/Pods/fmt/include/fmt/base.h" ]; then
  check_sentinel \
    "ios/Pods/fmt/include/fmt/base.h" \
    "Xcode 26 Clang rejects FMT_STRING in consteval" \
    "0003-fmt-disable-consteval.patch" || FAILED=1
fi

if [ "$FAILED" -ne 0 ]; then
  echo "ERROR: one or more patch sentinels failed. See above." >&2
  exit 1
fi

echo "All patch sentinels verified."
