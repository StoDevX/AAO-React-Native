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

# 0003-fmt-disable-consteval.patch: forces FMT_USE_CONSTEVAL=0 in fmt's base.h so
# Xcode 26's stricter Clang doesn't reject FMT_STRING() calls inside consteval
# contexts.
#
# From React Native 0.85 the fmt pod is usually absent: with RCT_USE_RN_DEP=1
# (the default) React Native consumes prebuilt ReactNativeDependencies from
# Maven rather than compiling fmt from source, so there is nothing to patch and
# nothing to break. The pod reappears if RCT_USE_RN_DEP=0, and on hosts without
# pods installed (Linux CI, non-iOS workflows) it was never there.
#
# Say which case we are in rather than skipping silently — a check that can
# vanish without comment is how a dead patch goes unnoticed.
if [ -f "ios/Pods/fmt/include/fmt/base.h" ]; then
  check_sentinel \
    "ios/Pods/fmt/include/fmt/base.h" \
    "Xcode 26 Clang rejects FMT_STRING in consteval" \
    "0003-fmt-disable-consteval.patch" || FAILED=1
else
  echo "  – 0003-fmt-disable-consteval.patch (skipped: no fmt pod; prebuilt ReactNativeDependencies or pods not installed)"
fi

# 0004-change-icon-legacy-module.patch: strips the RCT_NEW_ARCH_ENABLED branch so
# ChangeIcon stays a plain RCTBridgeModule. With the branch present the class
# advertises RCTTurboModule, legacy interop skips it, nothing registers it, and
# app-icon switching silently no-ops under the New Architecture.
if grep -q "RCT_NEW_ARCH_ENABLED" \
    "node_modules/react-native-change-icon/ios/ChangeIcon.h"; then
  echo "ERROR: sentinel check for 0004-change-icon-legacy-module.patch failed — the RCT_NEW_ARCH_ENABLED branch is still present" >&2
  FAILED=1
else
  echo "  ✓ 0004-change-icon-legacy-module.patch"
fi

# 0005-ios-utilities-drop-legacy-rootcontentview.patch: removes the reference to
# RCTRootContentView, which React Native 0.85 compiles out under the New
# Architecture (`#ifndef RCT_REMOVE_LEGACY_ARCH`). Without this the app fails to
# link with an undefined _OBJC_CLASS_$_RCTRootContentView.
if grep -q "RCTRootContentView" \
    "node_modules/react-native-ios-utilities/ios/Sources/Extensions+Helpers/RCTView+Helpers.swift"; then
  echo "ERROR: sentinel check for 0005-ios-utilities-drop-legacy-rootcontentview.patch failed — the RCTRootContentView reference is still present" >&2
  FAILED=1
else
  echo "  ✓ 0005-ios-utilities-drop-legacy-rootcontentview.patch"
fi

if [ "$FAILED" -ne 0 ]; then
  echo "ERROR: one or more patch sentinels failed. See above." >&2
  exit 1
fi

echo "All patch sentinels verified."
