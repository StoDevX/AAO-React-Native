#!/bin/bash
set -ex
echo "Running ci_pre_xcodebuild.sh"

# Xcode Cloud sets CI_BUILD_NUMBER automatically (monotonically increasing per workflow).
# agvtool requires running from the directory containing the .xcodeproj, and
# VERSIONING_SYSTEM = "apple-generic" must be set in the project (it is).
cd "$(dirname "$0")/.."

if [[ -z "${CI_BUILD_NUMBER:-}" ]]; then
	echo "CI_BUILD_NUMBER is not set. This script must run in Xcode Cloud or with CI_BUILD_NUMBER provided." >&2
	exit 1
fi

agvtool new-version -all "$CI_BUILD_NUMBER"

echo "Build number set to $CI_BUILD_NUMBER"
