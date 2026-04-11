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

# Sentry sentinels — only check if ios/Pods exists (i.e., we're in a post-pod-install context)
if [ -d "ios/Pods" ]; then
  # 0003-sentry-thread-cache.patch: removed 'const' from std::vector
  check_sentinel \
    "ios/Pods/Sentry/Sources/Sentry/include/SentryThreadMetadataCache.hpp" \
    "std::vector<ThreadHandleMetadataPair>" \
    "0003-sentry-thread-cache.patch" || FAILED=1

  # 0004-sentry-ucontext.patch: added ucontext64 include
  check_sentinel \
    "ios/Pods/Sentry/Sources/SentryCrash/Recording/Tools/SentryCrashMachineContext.c" \
    "_ucontext64" \
    "0004-sentry-ucontext.patch" || FAILED=1

  # 0005-sentry-terminate.patch: added <exception> include
  check_sentinel \
    "ios/Pods/Sentry/Sources/SentryCrash/Recording/Monitors/SentryCrashMonitor_CPPException.cpp" \
    "#include <exception>" \
    "0005-sentry-terminate.patch" || FAILED=1
else
  echo "  ⊘ Skipping Sentry patch sentinels (ios/Pods not present)"
fi

if [ "$FAILED" -ne 0 ]; then
  echo "ERROR: one or more patch sentinels failed. See above." >&2
  exit 1
fi

echo "All patch sentinels verified."
