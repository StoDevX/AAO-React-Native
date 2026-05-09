#!/bin/bash
set -ex
echo "Running ci_pre_xcodebuild.sh"

# Xcode Cloud sets CI_BUILD_NUMBER automatically (monotonically increasing per workflow).
# agvtool requires running from the directory containing the .xcodeproj, and
# VERSIONING_SYSTEM = "apple-generic" must be set in the project (it is).
cd "$(dirname "$0")/.."

agvtool new-version -all "$CI_BUILD_NUMBER"

echo "Build number set to $CI_BUILD_NUMBER"
